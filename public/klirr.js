// Gemeinsame Klirr-Bausteine: Rückgängig-Hinweis und der „Klirr-Moment“ (zwei Glas-Kreise stoßen an).
(function () {
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Styles einmal nachladen, damit auch übernommene Spiele (Tic Tac Toe, Wizard, Flip 7) sie haben.
  if (!document.querySelector('link[href="/klirr-fx.css"]')) {
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/klirr-fx.css'; document.head.append(l);
  }

  // Kurzer Hinweis unten mit „Rückgängig“ (5 s), z. B. nach dem Entfernen eines Mitspielers.
  let undoTimer = null;
  function undoToast(text, onUndo) {
    let t = document.getElementById('klUndo');
    if (!t) {
      t = document.createElement('div');
      t.id = 'klUndo';
      t.className = 'kl-undo';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.append(t);
    }
    const label = document.createElement('span');
    label.textContent = text;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Rückgängig';
    btn.onclick = () => { hide(); onUndo(); };
    t.replaceChildren(label, btn);
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add('is-open'));
    clearTimeout(undoTimer);
    undoTimer = setTimeout(hide, 5000);
    function hide() { t.classList.remove('is-open'); clearTimeout(undoTimer); setTimeout(() => { if (!t.classList.contains('is-open')) t.hidden = true; }, 300); }
  }

  // Klirr-Moment: zwei Glaslinsen gleiten aufeinander zu. Gefärbt ist genau ihre Schnittmenge –
  // sie entsteht in dem Moment, in dem sich die Linsen berühren, und wächst mit der Überlappung.
  // Ohne Bewegung (Bewegung reduzieren) erscheint nur kurz das fertige Logo.
  let busy = false;
  // Flache Glaslinse: gleichmäßig durchscheinend, ohne Rand, ohne Glanz
  const lensSvg = (id, r) => `<circle r="${r}" fill="#fff" fill-opacity=".24"/>`;
  function moment() {
    if (busy) return;
    busy = true;
    const still = reduced();
    const A = [80, 92, 46], B = [120, 66, 30];     // Endlage wie im Logo
    const o = document.createElement('div');
    o.className = 'kl-moment' + (still ? ' is-still' : '');
    o.setAttribute('aria-hidden', 'true');
    o.innerHTML = `<svg viewBox="0 0 200 160"><defs>
      <clipPath id="klc"><circle id="klcA" r="${A[2]}"/></clipPath></defs>
      <g id="klA">${lensSvg('klm', A[2])}</g>
      <g id="klB">${lensSvg('klm', B[2])}</g>
      <g class="lens" clip-path="url(#klc)"><circle id="klL" r="${B[2]}" fill="#ffb340"/></g>
      <circle class="p1" cx="146" cy="40" r="7" fill="#ffb340"/><circle class="p2" cx="160" cy="26" r="3.5" fill="#ffb340"/></svg>`;
    document.body.append(o);
    const $q = (id) => o.querySelector('#' + id);
    const place = (k) => {   // k = 0: weit auseinander, 1: Endlage
      const ax = A[0] - 70 * (1 - k), ay = A[1] + 45 * (1 - k), bx = B[0] + 70 * (1 - k), by = B[1] - 45 * (1 - k);
      $q('klA').setAttribute('transform', `translate(${ax} ${ay})`);
      $q('klB').setAttribute('transform', `translate(${bx} ${by})`);
      $q('klcA').setAttribute('cx', ax); $q('klcA').setAttribute('cy', ay);
      $q('klL').setAttribute('cx', bx); $q('klL').setAttribute('cy', by);
    };
    const dur = still ? 700 : 1150;
    const backOut = (t) => 1 - (1 - t) ** 4; // ruhiges Abbremsen, ohne Überschwingen
    const t0 = performance.now();
    const svg = o.querySelector('svg');
    const frame = (now) => {
      const t = Math.min(1, (now - t0) / dur);
      place(still ? 1 : backOut(Math.min(1, t / 0.42)));
      svg.style.opacity = still ? (t < 0.25 ? t / 0.25 : t > 0.75 ? (1 - t) / 0.25 : 1) : (t < 0.12 ? t / 0.12 : t > 0.8 ? (1 - t) / 0.2 : 1);
      if (t < 1) requestAnimationFrame(frame); else { o.remove(); busy = false; }
    };
    place(still ? 1 : 0);
    requestAnimationFrame(frame);
  }

  // Kurzer Hinweis ohne Knopf (z. B. „Tobi trinkt 2“), oben, damit er die Spiel-Hinweise unten nicht verdeckt.
  let noteTimer = null;
  function note(text) {
    let n = document.getElementById('klNote');
    if (!n) { n = document.createElement('div'); n.id = 'klNote'; n.className = 'kl-note'; n.setAttribute('role', 'status'); n.setAttribute('aria-live', 'polite'); document.body.append(n); }
    n.textContent = text;
    n.classList.add('is-open');
    clearTimeout(noteTimer);
    noteTimer = setTimeout(() => n.classList.remove('is-open'), 4500);
  }

  // Ein Trinkmodus für alle Spiele außer Konferenztrinken (das ist immer ein Trinkspiel).
  // Hauptschalter ist das Logo im Hub; die Schalter in den Spiel-Menüs steuern denselben Wert.
  // Schalter: <input type="checkbox" data-klirr-drink>; <html data-drink="on|off"> für CSS. Standard: aus.
  const KEY = 'klirr-drink:all';
  function drink() { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } }
  function setDrink(game, on) { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch {} document.documentElement.dataset.drink = on ? 'on' : 'off'; }
  function bindDrink() {
    document.querySelectorAll('input[data-klirr-drink]').forEach((input) => {
      const game = input.dataset.klirrDrink;
      input.checked = drink(game);
      document.documentElement.dataset.drink = input.checked ? 'on' : 'off';
      input.addEventListener('change', () => { setDrink(game, input.checked); document.dispatchEvent(new CustomEvent('klirr-drink', { detail: { game, on: input.checked } })); });
    });
  }
  document.documentElement.dataset.drink = drink() ? 'on' : 'off';
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindDrink); else bindDrink();

  // ---------- Symbole (eigene Linien-Symbole im Stil von SF Symbols, statt Emojis) ----------
  const ICONS = {
    talk: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3.5V16h0A2.5 2.5 0 0 1 4 13.5z"/><path d="M8.5 10h.01M12 10h.01M15.5 10h.01" stroke-width="2.6"/>',
    draw: '<path d="M4 20l1-4.2L15.6 5.2a2 2 0 0 1 2.8 0l.4.4a2 2 0 0 1 0 2.8L8.2 19z"/><path d="M13.5 7.3l3.2 3.2"/>',
    act: '<circle cx="12" cy="4.6" r="2.1"/><path d="M12 7.5v6.5M12 14l-3.4 6M12 14l3.4 6M5.5 10.5l6.5-2.2 6.5-2.6"/>',
    crown: '<path d="M3.5 8l4.3 3.8L12 5l4.2 6.8L20.5 8l-1.8 10.5H5.3z"/>',
    drink: '<path d="M6 4h12l-1.6 15a1.8 1.8 0 0 1-1.8 1.6H9.4a1.8 1.8 0 0 1-1.8-1.6z"/><path d="M6.6 9h10.8"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    more: '<circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
  };
  function icon(name, cls = '') {
    const w = document.createElement('span');
    w.className = 'kl-ico ' + cls;
    w.setAttribute('aria-hidden', 'true');
    w.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
    return w;
  }

  // ---------- Aktionsblatt (wie iOS: Aktionen unten, „Abbrechen“ separat) ----------
  function actionSheet(items, title) {
    document.querySelector('.kl-sheet-bg')?.remove();
    const bg = document.createElement('div');
    bg.className = 'kl-sheet-bg';
    const sheet = document.createElement('div');
    sheet.className = 'kl-sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    const group = document.createElement('div');
    group.className = 'kl-sheet-group';
    if (title) { const t = document.createElement('div'); t.className = 'kl-sheet-title'; t.textContent = title; group.append(t); }
    const close = () => { bg.classList.remove('is-open'); setTimeout(() => bg.remove(), 250); };
    for (const it of items) {
      const b = document.createElement(it.href ? 'a' : 'button');
      b.className = 'kl-sheet-btn' + (it.danger ? ' danger' : '');
      b.textContent = it.label;
      if (it.href) b.href = it.href; else { b.type = 'button'; b.onclick = () => { close(); setTimeout(it.onClick, 0); }; }
      group.append(b);
    }
    const cancel = document.createElement('button');
    cancel.type = 'button'; cancel.className = 'kl-sheet-btn cancel'; cancel.textContent = 'Abbrechen'; cancel.onclick = close;
    sheet.append(group, cancel);
    bg.append(sheet);
    bg.addEventListener('click', (e) => { if (e.target === bg) close(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); } });
    document.body.append(bg);
    requestAnimationFrame(() => bg.classList.add('is-open'));
    cancel.focus();
  }

  // •••-Knopf im Spielkopf: sammelt die (sichtbaren) Knöpfe einer bisherigen Leiste als Aktionen.
  function moreMenu(header, source, extra = []) {
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'kl-more'; btn.setAttribute('aria-label', 'Mehr');
    btn.append(icon('more'));
    btn.onclick = () => {
      const items = [];
      if (source && !source.hidden) for (const b of source.querySelectorAll('button')) {
        if (b.hidden || b.disabled) continue;
        items.push({ label: b.textContent.trim(), danger: /beenden|abbrechen/i.test(b.textContent), onClick: () => b.click() });
      }
      items.push(...extra);
      actionSheet(items);
    };
    header.append(btn);
    if (source) source.classList.add('kl-hidden-bar');
    return btn;
  }

  window.Klirr = { undoToast, moment, note, drink, icon, actionSheet, moreMenu };
})();
