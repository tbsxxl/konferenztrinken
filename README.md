# Konferenztrinken 🍺⚽

Das Trinkspiel zur Bundesliga-Konferenz am Samstag um 15:30 Uhr – als kleine Website mit:

- **Regeln**
- **Spieltag**: die 15:30-Spiele mit Live-Stand und Aufstellungen
- **Auslosung**: Teams zufällig auf die Mitspieler verteilen
- **Zähler**: Schlucke pro Person und Spieler-Picks. Fällt der Name, Pick antippen. Wird ein Spieler ausgewechselt, springt der Pick automatisch auf den eingewechselten Spieler.

Kein Build-Schritt. Die Seite liegt in `public/`. `src/worker.js` liefert sie aus und reicht die Abfragen an die Datenquellen (ESPN für Spiele/Aufstellungen/Wechsel, OpenLigaDB für die Spieltagsnummer) durch, damit es im Browser keine CORS-Probleme gibt. Fallen die Daten aus, lässt sich alles von Hand eintragen.

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
