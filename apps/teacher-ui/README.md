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

Einrichtung und Start unter **Windows 11 und Linux** – jeweils vom Repository-Root
(Node.js 22 und npm 10 wie in CI):

```bash
npm ci
npm run dev:glide
```

Öffne anschließend **http://127.0.0.1:7777/**. Der Befehl startet zwei lokale
Entwicklungsprozesse: den Vite-Server mit Glide-Quellpositionsmarkierung auf
`127.0.0.1:5173` und den separaten Glide-Editor auf Port 7777. Beende beide mit
`Ctrl+C`. Sind die benötigten Ports belegt, muss der fremde Prozess zuerst beendet werden;
Glide darf nicht unbeabsichtigt eine andere App bearbeiten.

Die Version `@srivarsank/glide@1.1.2` ist als **exakte Entwicklungsabhängigkeit**
des `teacher-ui`-Workspaces fixiert und wird mit dem gemeinsamen
`package-lock.json` installiert. Eine zweite `npm install --no-save`-Aktion
ist nicht mehr nötig. Das Paket stammt aus dem öffentlichen npm-Registry;
ein GitHub-PAT oder eine GitHub-Packages-Konfiguration ist dafür nicht erforderlich.

Für die reguläre Entwicklung weiterhin `npm run dev:ui` verwenden. Dieser
Standardstart verwendet `vite.config.ts` ohne Glide-Plugin. Ebenso bleibt
die lokale iPad-/Produktionsausgabe ohne Glide-Editor oder Laufzeitserver. Das
separate `vite.glide.config.ts` wird ausschließlich für `dev:glide` geladen.

**Sicher arbeiten:** Nutze einen eigenen Git-Branch und ein frisches Browserprofil **ohne echte Schülerdaten**. Glide hat Schreibzugriff auf lokale Quelldateien; überprüfe nach jeder Bearbeitung `git diff`, erhalte OpenVue-Standardkomponenten und verhindere ungewollte Inline-Stile. Die generierte Komponentenliste und Positionsdatei werden von `.gitignore` ausgeschlossen. Der Editor ist ausschließlich für den lokalen Entwicklungsbetrieb vorgesehen; keine LAN-Freigabe aktivieren.

**Grenzen:** Für Vue unterstützt Glide das Ändern von statischen Klassen, Inline-Stilen und Text. Strukturelle Bearbeitungen (Einfügen, Löschen, Verschieben/Gruppieren von Vue-Elementen) werden laut Glide-Dokumentation derzeit nicht unterstützt; dynamische Bindungen können absichtlich nicht bearbeitbar sein. Die tatsächliche Kompatibilität mit ViccoBoards Vite-8-/OpenVue-Setup muss am lokalen Rechner geprüft werden. Bei Problemen bitte die komplette Fehlermeldung und die verwendete Node-/Glide-Version festhalten. Vor jeder Übernahme Änderungen mit `npm run typecheck`, `npm run test` und `npm run build:all` prüfen.
