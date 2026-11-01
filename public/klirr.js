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
    const backOut = (t) => { const c = 1.9; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; };
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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindDrink); else bindDrink();

  window.Klirr = { undoToast, moment, note, drink };
})();
