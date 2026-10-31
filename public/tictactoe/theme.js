// Klirr folgt der iPhone-Einstellung (Hell/Dunkel/Automatisch) – vor dem ersten Rendern setzen.
(function () {
  try { if (matchMedia("(prefers-color-scheme: dark)").matches) document.documentElement.dataset.theme = "dark"; } catch (e) {}
})();
