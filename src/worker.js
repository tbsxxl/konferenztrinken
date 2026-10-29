// Liefert die statische Seite aus, reicht ein paar Fußball-API-Abfragen durch (kein CORS-Problem im Browser)
// und verschickt Push-Nachrichten: Abos unter /api/push/…, Prüfung der Spiele jede Minute per Cron.
import { getVapid, isPushEndpoint } from './push.js';
import { pollAndPush } from './live.js';

const UPSTREAM = {
  scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard',
  summary: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/summary',
  spieltag: 'https://api.openligadb.de/getcurrentgroup/bl1',
  spiele: 'https://api.openligadb.de/getmatchdata/bl1',
};
const ALLOWED_PARAMS = ['dates', 'event'];
const MAX_SUBS = 300;
// Bildquellen, deren Vereinslogos durchgereicht werden dürfen (ESPN, OpenLigaDB-Wappen).
const LOGO_HOSTS = [/(^|\.)espncdn\.com$/, /^upload\.wikimedia\.org$/, /^i\.imgur\.com$/, /(^|\.)openligadb\.de$/];

// Logos über den eigenen Server laden, damit Besucher nicht direkt mit ESPN & Co. verbunden werden.
async function handleLogo(url) {
  let target;
  try { target = new URL(url.searchParams.get('u') || ''); } catch { return new Response('Bad request', { status: 400 }); }
  if (target.protocol !== 'https:' || !LOGO_HOSTS.some((re) => re.test(target.hostname))) return new Response('Forbidden', { status: 403 });
  const upstream = await fetch(target, { cf: { cacheTtl: 7 * 86400, cacheEverything: true } });
  const type = upstream.headers.get('content-type') || '';
  if (!upstream.ok || !type.startsWith('image/')) return new Response('Not found', { status: 404 });
  return new Response(upstream.body, { headers: { 'content-type': type, 'cache-control': 'public, max-age=604800' } });
}

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });

async function handlePush(request, env, action) {
  if (!env.PUSH) return json({ error: 'Push ist auf dem Server nicht eingerichtet (KV-Bindung PUSH fehlt).' }, 503);
  if (action === 'key') return json({ key: (await getVapid(env.PUSH)).pub });
  if (request.method !== 'POST') return json({ error: 'POST erwartet' }, 405);

  const body = await request.json().catch(() => null);
  const subscription = body?.subscription;
  const endpoint = subscription?.endpoint || body?.endpoint;
  if (!isPushEndpoint(endpoint)) return json({ error: 'Ungültiges Abo' }, 400);

  let subs = (await env.PUSH.get('subs', 'json')) || [];
  subs = subs.filter((s) => s.subscription.endpoint !== endpoint);
  if (action === 'subscribe') {
    if (!subscription?.keys?.p256dh || !subscription?.keys?.auth) return json({ error: 'Ungültiges Abo' }, 400);
    const games = (Array.isArray(body.games) ? body.games : [])
      .filter((g) => /^\d+$/.test(g?.id) && /^\d{4}-\d{2}-\d{2}$/.test(g?.date))
      .slice(0, 20)
      .map((g) => ({ id: g.id, date: g.date }));
    subs.push({ subscription: { endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } }, games });
    if (subs.length > MAX_SUBS) subs = subs.slice(-MAX_SUBS);
  }
  await env.PUSH.put('subs', JSON.stringify(subs));
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/logo') return handleLogo(url);
    const push = url.pathname.match(/^\/api\/push\/(key|subscribe|unsubscribe)$/);
    if (push) return handlePush(request, env, push[1]);

    const match = url.pathname.match(/^\/api\/(\w+)$/);
    if (!match) return env.ASSETS.fetch(request);

    const base = UPSTREAM[match[1]];
    if (!base) return new Response('Not found', { status: 404 });

    const target = new URL(base);
    for (const key of ALLOWED_PARAMS) {
      const value = url.searchParams.get(key);
      if (value && /^[\w-]+$/.test(value)) target.searchParams.set(key, value);
    }

    const upstream = await fetch(target, {
      headers: { accept: 'application/json', 'user-agent': 'konferenztrinken' },
      cf: { cacheTtl: 30, cacheEverything: true },
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'content-type': upstream.headers.get('content-type') || 'application/json',
        'cache-control': 'public, max-age=30',
      },
    });
  },

  async scheduled(event, env, ctx) {
    if (env.PUSH) ctx.waitUntil(pollAndPush(env));
  },
};
