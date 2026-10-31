// Gemeinsame Klirr-Bausteine: Rückgängig-Hinweis und der „Klirr-Moment“ (zwei Glas-Kreise stoßen an).
(function () {
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  // Klirr-Moment: die zwei Kreise aus dem Logo stoßen zusammen, die Schnittmenge leuchtet, Perlen steigen.
  // Ohne Bewegung (Bewegung reduzieren) leuchtet nur kurz die Schnittmenge auf.
  let busy = false;
  function moment() {
    if (busy) return;
    busy = true;
    const o = document.createElement('div');
    o.className = 'kl-moment' + (reduced() ? ' is-still' : '');
    o.setAttribute('aria-hidden', 'true');
    o.innerHTML = `<svg viewBox="0 0 200 160"><defs><clipPath id="klc"><circle class="a" cx="80" cy="92" r="46"/></clipPath>
      <linearGradient id="klg" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset="1" stop-color="#fff" stop-opacity=".14"/></linearGradient></defs>
      <circle class="a" cx="80" cy="92" r="46" fill="url(#klg)" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>
      <g class="b"><circle cx="120" cy="66" r="30" fill="url(#klg)" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/></g>
      <g class="lens"><circle cx="120" cy="66" r="30" fill="#ffb340" clip-path="url(#klc)"/></g>
      <circle class="p1" cx="146" cy="40" r="7" fill="#ffb340"/><circle class="p2" cx="160" cy="26" r="3.5" fill="#ffb340"/></svg>`;
    document.body.append(o);
    setTimeout(() => { o.remove(); busy = false; }, reduced() ? 700 : 1100);
  }

  window.Klirr = { undoToast, moment };
})();
