// Service Worker: zeigt Push-Nachrichten an und rechnet dabei aus der gespeicherten Runde aus,
// wer trinkt, exen muss oder verteilen darf. Die Buchung selbst macht die Seite beim nächsten Öffnen.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

function idbGet(key) {
  return new Promise((resolve) => {
    const req = indexedDB.open('kt', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('kv');
    req.onerror = () => resolve(undefined);
    req.onsuccess = () => {
      const tx = req.result.transaction('kv', 'readonly');
      const get = tx.objectStore('kv').get(key);
      get.onsuccess = () => resolve(get.result);
      get.onerror = () => resolve(undefined);
    };
  });
}

// Gleiche Vereinserkennung wie auf der Seite ("FC Cologne" = "1. FC Köln").
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const GENERIC = new Set(['fc', 'sv', 'vfb', 'vfl', 'tsg', 'fsv', 'sc', 'rb', 'sg', 'bsc', 'borussia', 'bayer', 'eintracht', 'hertha', 'union', 'st', '1', '04', '05', '07', '09', '1846', '1899', '1900', '1910', 'munich', 'munchen']);
const ALIAS = { cologne: 'koln', hamburger: 'hamburg', nuremberg: 'nurnberg', monchengladbach: 'gladbach', hanover: 'hannover' };
const clubKey = (name) => norm(name).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((t) => t && !GENERIC.has(t)).map((t) => ALIAS[t] || t).at(-1) || norm(name);
const lastName = (name) => norm(name).replace(/[^a-z0-9 -]/g, '').split(' ').filter(Boolean).at(-1) || '';

function describe(msg, round) {
  const players = round?.players || [];
  const values = { teamGoal: 3, conceded: 2, halftime: 1, draw: 1, ...(round?.values || {}) };
  const owners = (team) => players.filter((p) => (p.teams || []).some((t) => clubKey(t) === clubKey(team)));
  const pickers = (name) => players.filter((p) => (p.picks || []).some((k) =>
    [k.orig, ...(k.history || []), k.name].some((n) => norm(n) === norm(name) || lastName(n) === lastName(name))));
  const names = (list) => list.map((p) => p.name).join(', ');
  // "Anna trinkt", aber "Anna, Ben trinken"
  const say = (list, one, many, rest) => `${names(list)} ${list.length > 1 ? many : one} ${rest}`;
  const score = (e) => `${e.home} ${e.hs}:${e.as} ${e.away}`;

  let title = '';
  const lines = [];
  for (const e of msg.events || []) {
    if (e.kind === 'goal') {
      title ||= `⚽ Tor für ${e.team}`;
      lines.push(score(e));
      if (owners(e.team).length) lines.push(say(owners(e.team), 'verteilt', 'verteilen', values.teamGoal));
      if (owners(e.opp).length) lines.push(say(owners(e.opp), 'trinkt', 'trinken', values.conceded));
    } else if (e.kind === 'scorer') {
      title ||= `🎯 ${e.player} trifft ${e.minute}`;
      if (title.startsWith('⚽')) lines.unshift(`🎯 ${e.player} ${e.minute}`);
      if (pickers(e.player).length) lines.push(say(pickers(e.player), 'verteilt', 'verteilen je', 'ein Ex'));
    } else if (e.kind === 'red') {
      title ||= `🟥 Rot für ${e.player} ${e.minute}`;
      const hit = [...new Set([...pickers(e.player), ...owners(e.team)])];
      if (hit.length) lines.push(say(hit, 'muss', 'müssen', 'exen 🍺'));
    } else if (e.kind === 'ht') {
      title ||= `⏸️ Halbzeit: ${score(e)}`;
      const behind = e.hs === e.as ? null : e.hs < e.as ? e.home : e.away;
      if (behind && owners(behind).length) lines.push(say(owners(behind), 'trinkt', 'trinken', values.halftime));
    } else if (e.kind === 'ft') {
      title ||= `🏁 Abpfiff: ${score(e)}`;
      if (e.hs === e.as) {
        const both = [...owners(e.home), ...owners(e.away)];
        if (both.length) lines.push(say(both, 'trinkt', 'trinken', values.draw));
      } else {
        const [win, lose] = e.hs > e.as ? [e.home, e.away] : [e.away, e.home];
        if (owners(lose).length) lines.push(say(owners(lose), 'muss', 'müssen', 'exen 🍺'));
        if (owners(win).length) lines.push(say(owners(win), 'verteilt', 'verteilen je', 'ein Ex'));
      }
    }
  }
  return { title: title || 'Konferenztrinken', body: [...new Set(lines)].join('\n') || 'Neues aus der Konferenz' };
}

self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let msg = {};
    try { msg = event.data ? event.data.json() : {}; } catch {}
    const { title, body } = describe(msg, await idbGet('round'));
    await self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `kt-${msg.id || 'x'}-${Date.now()}`,
      data: { url: '/' },
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) if ('focus' in c) return c.focus();
    return self.clients.openWindow('/');
  })());
});
