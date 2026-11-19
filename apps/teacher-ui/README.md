# ViccoBoard Teacher UI (Vue 3)

This app is the Vue 3 + Vite front-end for ViccoBoard's teacher experience.

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Notes
- Target platform: iPadOS Safari (WebKit)
- Offline-first by default; IndexedDB storage via shared packages

## Lokaler Glide-Editor (optional)

[Glide](https://github.com/SrivarsanK/Glide) kann Vue-Ansichten im laufenden Vite-Entwicklungsserver visuell bearbeiten und Änderungen direkt in `.vue`-Quelldateien speichern. Das ist **kein** Bestandteil der produktiven App, des Standard-Entwicklungsstarts oder der lokalen iPad-Datei.

Einrichtung auf Deinem Entwicklungsrechner, **vom ViccoBoard-Repository-Root aus** (Node.js 22 und npm 10 wie in CI):

```bash
npm ci
npm install --no-save --no-package-lock --workspace=teacher-ui @srivarsank/glide@1.1.2
npm run dev:glide
```

Öffne die **vom Dev-Server ausgegebene** Glide-Adresse, typischerweise `http://127.0.0.1:5173/__glide/`. Der Glide-Modus verwendet den festen Port 5173 und beendet sich bei Portbelegung, statt unbemerkt eine andere App zu bearbeiten. Für den normalen Entwicklungsstart weiterhin `npm run dev:ui` verwenden.

Der `--no-save --no-package-lock`-Installationsschritt hält die experimentelle Editor-Abhängigkeit aus den gemeinsam versionierten Paketdateien heraus; nach einem erneuten `npm ci` muss Glide lokal erneut installiert werden. Glide ist auf dem **öffentlichen npm-Registry** verfügbar; eine GitHub-Packages-Anmeldung oder ein Personal Access Token ist dafür nicht erforderlich. Ohne lokale Installation schlägt `dev:glide` erwartungsgemäß fehl. Das separate `vite.glide.config.ts` ergänzt nur beim opt-in-Start den bestehenden Vue-/Tailwind-Vite-Stack um `glideSourceStamping()`.

**Sicher arbeiten:** Nutze einen eigenen Git-Branch und ein frisches Browserprofil **ohne echte Schülerdaten**. Glide hat Schreibzugriff auf lokale Quelldateien; überprüfe nach jeder Bearbeitung `git diff`, erhalte OpenVue-Standardkomponenten und verhindere ungewollte Inline-Stile. Die generierte Komponentenliste und Positionsdatei werden von `.gitignore` ausgeschlossen. Der Editor ist ausschließlich für den lokalen Entwicklungsbetrieb vorgesehen; keine LAN-Freigabe aktivieren.

**Grenzen:** Für Vue unterstützt Glide das Ändern von statischen Klassen, Inline-Stilen und Text. Strukturelle Bearbeitungen (Einfügen, Löschen, Verschieben/Gruppieren von Vue-Elementen) werden laut Glide-Dokumentation derzeit nicht unterstützt; dynamische Bindungen können absichtlich nicht bearbeitbar sein. Die tatsächliche Kompatibilität mit ViccoBoards Vite-8-/OpenVue-Setup muss am lokalen Rechner geprüft werden. Bei Problemen bitte die komplette Fehlermeldung und die verwendete Node-/Glide-Version festhalten. Vor jeder Übernahme Änderungen mit `npm run typecheck`, `npm run test` und `npm run build:all` prüfen.
