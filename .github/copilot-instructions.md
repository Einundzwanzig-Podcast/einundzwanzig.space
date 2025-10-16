Ziel: Kurze, handlungsorientierte Hinweise, damit ein AI-Copilot sofort produktiv an diesem Node.js/Pug-basierten Static-Site-Generator arbeiten kann.

- Architektur-Überblick
  - Static-Site-Build: Node.js-Skripte in `tasks/` erzeugen JSON- und HTML-Artefakte.
  - Eingabe: `content/*.json`, Pug-Templates in `src/` und statische Assets in `static/`.
  - Zwischenausgaben: `generated/*.json` (z.B. `episodes.json`, `site-data.json`).
  - Ausgabe: `dist/` enthält die fertige Website (kopiert aus `static/` + gerenderte Pug-Seiten + gebaute Assets).
  - Zentrale Hilfsfunktionen in `helpers.js` (z.B. `write`, `writeJSON`, `assetUrl`, `slugify`, `markdown`). `pug.config.js` importiert diese Helpers in die Pug-Umgebung.

- Wichtige Tasks / Reihenfolge
  - `tasks/fetch_feed.js` — lädt den Podcast-Feed, parsed Episoden, generiert `generated/episodes.json` und `dist/feed`-Artefakte (auch Kapitel, Personen-Metadaten).
  - `tasks/fetch_episodes.js` — lädt mp3s und Bilder anhand von `generated/episodes.json` (verwendet `EPISODES_DIR`).
  - `tasks/generate_site_data.js` — lädt externe APIs (z.B. mempool.observer, Meetups) und schreibt `generated/site-data.json`.
  - `tasks/generate_pages.js` — rendert Pug-Templates (`src/*.pug`) mit `generated/*` und schreibt HTML nach `dist/`.
  - `tasks/generate_sitemap.js` — baut `dist/sitemap.xml` aus `dist/**/*.html`.

- Wichtige npm-Skripte (häufig gebraucht)
  - Lokales Setup: `npm install`
  - Dev-Workflow (Watcher + BrowserSync): `npm start` (führt `init` aus, startet parallel watcher-Tasks)
  - Komplett bauen: `npm run build` (`init` + `build:*`)
  - Produktions-Build (minify + rev + sitemap): `npm run prod`
  - Nur Seiten neu rendern (unterstützt ein optionales argv für `changedFile`):
    ```bash
    node tasks/generate_pages.js src/member.pug
    ```
  - Alle Episoden herunterladen: `EPISODES_DIR=./episodes npm run episodes`

- Konventionen & Eigenheiten (wichtig für Änderungen)
  - Tasks verwenden `sync-request` (synchrone HTTP-Aufrufe). Änderungen an Netzwerkcode sollten robust gegen Timeouts/Fehler sein; viele Tasks haben lokale Fallbacks (`content/*.json`).
  - `helpers.js` kapselt URL-/Asset-Logik. Verwende `assetUrl` / `assetPath` statt händischem Pfadbau, damit `HOST`/`NODE_ENV` korrekt angewendet wird.
  - Kategorie- und Teilnehmernormierung geschieht in `tasks/fetch_feed.js` (z.B. Mapping `Der-Weg` → `Der Weg`, Alias-Auflösung via `participantsWithAliases`). Änderungen an Kategorien müssen dort gespiegelt werden.
  - `generated/` ist build-artifact; verändere primär `content/` und `tasks/` – nicht `generated/` dauerhaft.
  - Pug-Mixins in `src/includes/mixins.pug` werden pro Projekt häufig wiederverwendet (z.B. `+episodeItem`, `+episodePlayer`).

- Integrationen & externe Abhängigkeiten
  - Podcast-Feed: `content/meta.json` enthält `masterFeedUrl`/`publicFeedUrl` — `tasks/fetch_feed.js` referenziert diese.
  - Mempool-API: `https://mempool.observer/api/recentBlocks` in `generate_site_data.js` (block height in site-data).
  - Meetup-Portal: `https://portal.einundzwanzig.space/...` (Falling back to `content/meetups-do-not-edit.json`).
  - Nostr: `tasks/generate_nostr.js` nutzt `@nostr-dev-kit/ndk` (erzeugt mapping/relays für `content/participants.json`).

- Fehlerszenarien & Debug-Hinweise
  - Viele Tasks loggen Fehler und fallen auf lokale JSONs zurück; bei Netzwerkfehlern zuerst `npm run build:data` manuell testen.
  - Für Debugging: setze `NODE_ENV=development` (dev host/asset-Pfade) oder `CI=true` um `fetch_feed.js` in den Debug-Modus zu versetzen.
  - Sitemap/URLs: `tasks/generate_sitemap.js` nutzt `DEPLOY_PRIME_URL`/`URL` env vars — beim lokalen Test ggf. setzen.

- Schnellbeispiele, die AI-Agenten oft ausführen sollten
  - Rendern & lokaler Server (ganzer Dev-Loop):
    ```bash
    npm install
    npm start
    ```
  - Schnell Seiten neu bauen nach Template-Änderung:
    ```bash
    node tasks/generate_pages.js src/includes/mixins.pug
    ```
