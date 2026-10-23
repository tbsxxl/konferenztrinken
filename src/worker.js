// Liefert die statische Seite aus und reicht ein paar Fußball-API-Abfragen durch,
// damit der Browser keine CORS-Probleme bekommt.
const UPSTREAM = {
  scoreboard: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/scoreboard',
  summary: 'https://site.api.espn.com/apis/site/v2/sports/soccer/ger.1/summary',
  spieltag: 'https://api.openligadb.de/getcurrentgroup/bl1',
  spiele: 'https://api.openligadb.de/getmatchdata/bl1',
};
const ALLOWED_PARAMS = ['dates', 'event'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
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
};
