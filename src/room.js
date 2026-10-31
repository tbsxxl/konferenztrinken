// Mehrspieler-Raum für „Der Dümmste fliegt“ (Cloudflare Durable Object).
// Das Handy des Quizmasters rechnet das Spiel und schickt den Spielstand; der Raum
// verteilt ihn an alle und leitet Beitritte und Stimmen der Mitspieler an den Quizmaster.
import { DurableObject } from 'cloudflare:workers';

const IDLE_MS = 12 * 3600e3;   // Raum nach 12 Stunden ohne Aktivität löschen
const MAX_MSG = 64 * 1024;

export class Room extends DurableObject {
  async fetch(request) {
    const url = new URL(request.url);

    // Raum anlegen: Schlüssel für den Quizmaster merken.
    if (url.pathname.endsWith('/create')) {
      if (await this.ctx.storage.get('hostKey')) return new Response('Code vergeben', { status: 409 });
      const hostKey = crypto.randomUUID();
      await this.ctx.storage.put('hostKey', hostKey);
      await this.ctx.storage.delete('state');
      await this.touch();
      return Response.json({ hostKey });
    }

    if (request.headers.get('Upgrade') !== 'websocket') return new Response('WebSocket erwartet', { status: 426 });
    if (!(await this.ctx.storage.get('hostKey'))) return new Response('Raum nicht gefunden', { status: 404 });

    const { 0: client, 1: server } = new WebSocketPair();
    this.ctx.acceptWebSocket(server, ['guest']);
    const state = await this.ctx.storage.get('state');
    if (state) server.send(JSON.stringify({ t: 'state', state }));
    await this.touch();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== 'string' || raw.length > MAX_MSG) return;
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    await this.touch();

    // Quizmaster meldet sich mit seinem Schlüssel an.
    if (msg.t === 'host') {
      if (msg.hostKey && msg.hostKey === (await this.ctx.storage.get('hostKey'))) {
        ws.serializeAttachment({ host: true });
        ws.send(JSON.stringify({ t: 'host-ok' }));
      }
      return;
    }
    const isHost = ws.deserializeAttachment()?.host === true;

    // Neuer Spielstand vom Quizmaster: speichern und an alle verteilen.
    if (msg.t === 'state' && isHost) {
      await this.ctx.storage.put('state', msg.state);
      const out = JSON.stringify({ t: 'state', state: msg.state });
      for (const s of this.ctx.getWebSockets()) if (s !== ws) try { s.send(out); } catch {}
      return;
    }

    // Beitritt oder Stimme eines Mitspielers: an den Quizmaster weiterreichen.
    if (msg.t === 'join' || msg.t === 'vote') {
      const name = String(msg.name || '').trim().slice(0, 24);
      if (!name) return;
      const fwd = JSON.stringify({ t: msg.t, name, id: String(msg.id || '').slice(0, 40), target: msg.target ? String(msg.target).slice(0, 24) : undefined });
      for (const s of this.ctx.getWebSockets()) if (s.deserializeAttachment()?.host) try { s.send(fwd); } catch {}
    }
  }

  async webSocketClose(ws, code) {
    try { ws.close(code, 'bye'); } catch {}
  }

  async touch() {
    await this.ctx.storage.setAlarm(Date.now() + IDLE_MS);
  }

  async alarm() {
    for (const s of this.ctx.getWebSockets()) try { s.close(1000, 'Raum abgelaufen'); } catch {}
    await this.ctx.storage.deleteAll();
  }
}
