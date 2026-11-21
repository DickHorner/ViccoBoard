# ViccoBoard – gemeinsame Vue-Oberfläche

Dieser Workspace enthält den historisch benannten Pfad `apps/teacher-ui`, ist aber der einzige Vue-Einstiegspunkt für die gesamte ViccoBoard-Anwendung mit Schülerverwaltung, Sport und KBR.

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

# Terminal 2: Editor starten, während Terminal 1 weiterläuft
npx @srivarsank/glide 5173
```

Öffne **`http://localhost:7777/`** als Editor. Die normale ViccoBoard-Vorschau ist unter `http://localhost:5173/` erreichbar. Der Glide-Vite-Modus verwendet Port 5173 mit `--strictPort`, damit nicht versehentlich eine andere Anwendung bearbeitet wird. Der normale Startbefehl für ViccoBoard bleibt **`npm run dev`**.

Das separate `vite.glide.config.ts` ergänzt nur beim optionalen Start die bestehende Vue-/Tailwind-Vite-Konfiguration um `glideSourceStamping()`; das Plugin stellt in Version 1.1.2 **keinen eigenen Editor auf Port 5173** bereit. Glide ist auf der öffentlichen npm-Registry verfügbar, ohne GitHub-Packages-Anmeldung.

**Sicher arbeiten:** Nutze einen eigenen Git-Branch und ein frisches Browserprofil **ohne echte Schülerdaten**. Glide hat Schreibzugriff auf lokale Quelldateien; überprüfe nach jeder Bearbeitung `git diff`, erhalte OpenVue-Standardkomponenten und verhindere ungewollte Inline-Stile. Die generierte Komponentenliste und Positionsdatei werden von `.gitignore` ausgeschlossen. Der Editor ist ausschließlich für den lokalen Entwicklungsbetrieb vorgesehen; keine LAN-Freigabe aktivieren.

**Grenzen:** Für Vue unterstützt Glide das Ändern von statischen Klassen, Inline-Stilen und Text. Strukturelle Bearbeitungen (Einfügen, Löschen, Verschieben/Gruppieren von Vue-Elementen) werden laut Glide-Dokumentation derzeit nicht unterstützt; dynamische Bindungen können absichtlich nicht bearbeitbar sein. Die tatsächliche Kompatibilität mit ViccoBoards Vite-8-/OpenVue-Setup muss am lokalen Rechner geprüft werden. Bei Problemen bitte die komplette Fehlermeldung und die verwendete Node-/Glide-Version festhalten. Vor jeder Übernahme Änderungen mit `npm run typecheck`, `npm run test` und `npm run build:all` prüfen.
