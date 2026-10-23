# Konferenztrinken 🍺⚽

Das Trinkspiel zur Bundesliga-Konferenz am Samstag um 15:30 Uhr – als kleine Website mit Regeln, Team-Auslosung und Schluck-Zähler.

Reines HTML/CSS/JS, kein Build-Schritt. Alles liegt in `public/`.

## Lokal ansehen

```bash
npx wrangler dev        # oder einfach public/index.html im Browser öffnen
```

## Auf Cloudflare hosten

**Variante A – Git-Integration (empfohlen, deployt bei jedem Push automatisch)**

1. Im Cloudflare-Dashboard: *Workers & Pages* → *Create* → *Import a repository*.
2. GitHub verbinden und dieses Repository auswählen.
3. Build command leer lassen, *Deploy command*: `npx wrangler deploy`.
4. Speichern – die Seite läuft danach unter `konferenztrinken.<dein-account>.workers.dev`.

**Variante B – einmalig per CLI**

```bash
npx wrangler login
npx wrangler deploy
```

## Hinweis

Trinkt verantwortungsvoll. Kleine Schlucke, Wasser zwischendurch, und alkoholfreies Bier zählt genauso.
