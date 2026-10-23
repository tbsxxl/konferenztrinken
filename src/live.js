// Läuft jede Minute per Cron: prüft die Spiele, für die jemand Push-Nachrichten will,
// und schickt neue Ereignisse (Tor, Torschütze, Rot, Halbzeit, Abpfiff) raus.
import { getVapid, sendPush } from './push.js';

const SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard';
const berlinDate = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin' });
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const lastName = (name) => norm(name).replace(/[^a-z0-9 -]/g, '').split(' ').filter(Boolean).at(-1) || '';

// Alle Ereignisse eines Spiels mit festen Schlüsseln; neue Schlüssel = neue Nachricht.
export function gameEvents(ev) {
  const comp = ev.competitions?.[0] || {};
  const side = (where) => (comp.competitors || []).find((c) => c.homeAway === where) || {};
  const home = side('home'), away = side('away');
  const teamById = {};
  for (const c of comp.competitors || []) teamById[c.team?.id ?? c.id] = c.team?.displayName || '';
  const status = comp.status || ev.status || {};
  const state = status.type?.state || 'pre';
  const base = {
    id: ev.id,
    home: home.team?.displayName || '?',
    away: away.team?.displayName || '?',
    hs: parseInt(home.score, 10) || 0,
    as: parseInt(away.score, 10) || 0,
  };
  const out = [];
  if (state === 'pre') return out;
  for (const [s, team, opp] of [['home', base.home, base.away], ['away', base.away, base.home]]) {
    for (let n = 1; n <= base[s === 'home' ? 'hs' : 'as']; n++) out.push({ key: `goal:${s}:${n}`, kind: 'goal', team, opp });
  }
  for (const d of comp.details || []) {
    const text = d.type?.text || '';
    const a = d.athletesInvolved?.[0] || {};
    const player = a.displayName || a.fullName || '';
    if (!player) continue;
    const minute = d.clock?.displayValue || '';
    const m = parseInt(minute, 10) || 0;
    if (d.redCard || /red card/i.test(text)) {
      out.push({ key: `red:${lastName(player)}:${m}`, kind: 'red', player, minute, team: teamById[d.team?.id] || '' });
    } else if ((d.scoringPlay || /goal|penalty - scored/i.test(text)) && !d.ownGoal && !d.shootout && !/own goal|disallowed|missed|saved/i.test(text)) {
      out.push({ key: `scorer:${lastName(player)}:${m}`, kind: 'scorer', player, minute, team: teamById[d.team?.id] || '' });
    }
  }
  const detail = status.type?.shortDetail || '';
  if (status.type?.name === 'STATUS_HALFTIME' || /^(HT|Halftime)$/i.test(detail)) out.push({ key: 'ht', kind: 'ht' });
  if (state === 'post') out.push({ key: 'ft', kind: 'ft' });
  return out.map((e) => ({ ...base, ...e }));
}

export async function pollAndPush(env, now = new Date()) {
  const kv = env.PUSH;
  let subs = (await kv.get('subs', 'json')) || [];
  if (!subs.length) return { sent: 0 };

  // Abos ohne aktuelle Spiele aufräumen (älter als gestern).
  const yesterday = berlinDate.format(new Date(now.getTime() - 86400e3));
  const before = subs.length;
  subs = subs.filter((s) => s.games.some((g) => g.date >= yesterday));
  let subsChanged = subs.length !== before;

  const watched = new Map();
  for (const s of subs) for (const g of s.games) if (g.date >= yesterday) watched.set(g.id, g.date);
  const seen = (await kv.get('seen', 'json')) || {};
  let seenChanged = false;

  const dates = [...new Set(watched.values())];
  const events = [];
  for (const date of dates) {
    const res = await fetch(`${SCOREBOARD}?dates=${date.replaceAll('-', '')}`, { headers: { accept: 'application/json' } });
    if (!res.ok) continue;
    const data = await res.json();
    for (const ev of data.events || []) if (watched.has(ev.id)) events.push(ev);
  }

  const outbox = new Map(); // Spiel-ID -> neue Ereignisse
  for (const ev of events) {
    const list = gameEvents(ev);
    if (!seen[ev.id]) {
      // Erstes Mal gesehen: Stand übernehmen, nichts Altes nachschicken.
      seen[ev.id] = { date: watched.get(ev.id), keys: list.map((e) => e.key) };
      seenChanged = true;
      continue;
    }
    const fresh = list.filter((e) => !seen[ev.id].keys.includes(e.key));
    if (!fresh.length) continue;
    seen[ev.id].keys.push(...fresh.map((e) => e.key));
    seenChanged = true;
    outbox.set(ev.id, fresh);
  }

  let sent = 0;
  if (outbox.size) {
    const vapid = await getVapid(kv);
    const gone = new Set();
    await Promise.all(subs.map(async (s) => {
      for (const g of s.games) {
        const fresh = outbox.get(g.id);
        if (!fresh) continue;
        try {
          const status = await sendPush(vapid, s.subscription, { id: g.id, events: fresh });
          if (status === 404 || status === 410) gone.add(s.subscription.endpoint);
          else if (status < 300) sent++;
        } catch {}
      }
    }));
    if (gone.size) { subs = subs.filter((s) => !gone.has(s.subscription.endpoint)); subsChanged = true; }
  }

  for (const id of Object.keys(seen)) if (seen[id].date < yesterday) { delete seen[id]; seenChanged = true; }
  if (seenChanged) await kv.put('seen', JSON.stringify(seen));
  if (subsChanged) await kv.put('subs', JSON.stringify(subs));
  return { sent };
}
