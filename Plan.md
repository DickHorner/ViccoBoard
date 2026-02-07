# Plan.md — Unified Teacher Suite (SportZens + KURT)

## 1) Zielbild & harte Constraints
Wir bauen eine **einzige** App, die den **vollen Funktionsumfang** von:
- **SportZens** (Organisation, Bewertung, Live-Unterrichtstools, WOW, Security/Local-first) und
- **KURT** (Prüfungen strukturieren, Korrigieren, Auswerten, Rückmeldebögen, Versand/Sharing, Langzeit-Übersicht)

in einem konsistenten System vereint.

**Harte Vorgaben:**
1. **Keine Funktion und keine Option wird ausgelassen** (siehe Feature-Checkliste in Abschnitt 6).
2. **Modularer Ansatz:** neue Domänen/Fächer/Tools müssen als Module/Plugins ergänzbar sein, ohne Core-Änderungen (Core = Interfaces, Policies, Shared UI).
3. **Ohne Installation & komplett lokal lauffähig (Default):** Die App läuft als **statische Web-App im Browser** (HTTP/HTTPS), ohne App-Store, ohne Electron, ohne Browser-Extension, ohne lokale Server-Installation. Alle Kernfunktionen funktionieren offline.
4. **LocalDB = IndexedDB (Default):** verschlüsselte Speicherung im Browser (inkl. Migrationen), jederzeitiger Export/Backup/Restore.
5. **Online/Integrationen nur optional:** iServ/Notion/Sync sind **Feature-Flags** und standardmäßig **aus**. Die App muss ohne diese Integrationen vollständig nutzbar sein.
6. **Sicherheitsmodell:** App-Sperre (PIN/Passwort), Lock-Policy/Timeout, sichere Schlüsselableitung, saubere Backups/Restore (kein Datenverlust durch Updates).


### 1.1 Zielplattform: iPad (10. Gen) / iPadOS Safari (WebKit)
Diese App wird **primär** für iPadOS (Safari/WebKit) gebaut. Das beeinflusst insbesondere lokale Persistenz, Datei-Flows und Bedienung.

**Nicht verhandelbar (Design- & Implementationsregeln):**
- **WebKit-first:** iPadOS-Browser sind WebKit. Keine Annahmen über „Chrome-only“-APIs.
- **Lokale Persistenz ist nicht garantiert „für immer“:** Unter iPadOS kann lokaler script-basierter Speicher (u. a. IndexedDB/Cache) nach **mehrtägiger Inaktivität** der Website gelöscht werden. Deshalb sind **Export/Backup/Restore + Backup-Reminder + Daten-Gesundheitsstatus** Kern-UX, nicht Optional-Feature.
- **Kein File-System-Write aus dem Browser:** Safari unterstützt die **File System Access API** nicht. Export/Import daher ausschließlich über:
  - **Download** (ZIP/JSON/PDF/CSV) + Teilen über iPadOS (Files-App/Share-Sheet),
  - **Import via Datei-Auswahl** (`<input type="file">`), ohne „Save As“-Dialoge aus JS.
- **Touch & Split View:** Touch-Targets ≥ 44 px, keine Hover-only Interaktionen, Layouts für ½/⅓ Split View, Portrait/Landscape, optionale Keyboard-Shortcuts.
- **Offline:** App-Shell darf gecacht werden (Service Worker), aber die App bleibt **ohne Installation** nutzbar; „Zum Home-Bildschirm“ ist optional und wird nicht vorausgesetzt.


---


## 2) Produktstruktur (Module / Bounded Contexts)

### 2.1 Core-Plattform (für alles)
- **Core-UI Shell**: Navigation, Deep-Links, globaler Such-/Filterlayer.
- **iPad UX Layer**: Touch-first Komponenten (Tabellen, Formulare), Split-View-taugliche Layouts, Keyboard-Shortcuts (optional), Performance durch Virtualisierung.
- **Identity & Security**: App-Sperre (PIN/Passwort), Passwort ändern, Datenbank-Passwort, Session-Timeout, Biometrie (optional), Berechtigungen.
- **Storage**: verschlüsselte lokale DB (**IndexedDB**), versionierte Migrationen, Attachments (Fotos/Signaturen/Bilder) – ohne Backend-Pflicht.
- **Backup/Restore**: Export/Import kompletter Datenbestand + selektive Exporte (z. B. nur Prüfungsentwürfe). **Pflicht:** sichtbarer Backup-Status + Reminder (iPadOS-Persistenz-Risiko).
- **Import/Export Hub**: CSV/PDF/„Share Packages“ (für Austausch ohne Cloud). (iPadOS: Export immer als Download/Share, Import über Datei-Auswahl; keine File-System-Write APIs).
- **Templates**: Tabellen-/CSV-Vorlagen, Druckpresets, E-Mail-Templates.
- **Analytics Engine**: aggregierte Statistiken (SportZens-Statistik + KURT-Auswertung), ohne personenbezogene Daten nach außen.
- **Plugin Registry**: Registrierung von Tools (Timer, Scoreboard…), Assessment-Typen, Exportern und Integrationen.

### 2.2 Domänenmodule
**Sport-Unterricht (SportZens):**
- Klassen, Schüler, Stunden, Anwesenheiten
- Notenschemata & Notenkategorien (Kriterien, Zeit, Cooper) + Verbalbeurteilungen
- Tabellen (inkl. „einfache Tabellen“), CSV-Import/Export, Schüler-Import
- Test-/Mess-Workflows: Shuttle-Run, Cooper, Mittelstrecke, Sportabzeichen, Bundesjugendspiele
- Live-Tools: Teams, Turnierplanung, Scoreboard, Timer, Taktikboard, Würfeln (+ Logging)
- Feedback (mehrere Methoden, am Lehrertablet) + Statistiken
- WOW: Workouts erstellen, Web-Eingabe durch Schüler, Fortschritt abrufen, Schüler-Übersichten

**Prüfungen/Korrektur (KURT):**
- Prüfungen anlegen (einfach/komplex, 3 Ebenen, Wahlaufgaben, Kriterienformatierung, Prüfungsteile, Bonuspunkte)
- Notenschlüssel/Benotungsoptionen inkl. Prozentgrenzen, Presets, Rundung, Fehlerpunkte→Aufgabennote
- Korrekturflows: kompakte Maske, Tab-Navigation, aufgabenweise (Tabellenmodus/AWK), Kommentarboxen, ++/+…-Bepunktung, schneller Prüflingswechsel
- Fördertipps-Datenbank: Zuweisung (auch unteraufgabenbezogen), Suche, Gewichtung, bis 3 Links, QR-Codes, Auswertung
- Auswertung & Anpassung: Schwierigkeit, Punkteänderungsassistent (Gewichtungen), Sortierungen, nachträglicher Notenschlüssel
- Langzeit-Überblick/Notizen pro Schüler, Kommentar-Reuse, besondere Leistungen markieren, PDF-Export/Layouts, E-Mail-Versand, Splitscreen-Gruppenkorrektur, Integrationen/Teilen

---

## 3) Architekturprinzipien (damit Erweiterung nicht weh tut)

### 3.1 Clean Architecture + DDD (Domain Driven Design)
- **Domain**: reine Logik (Grading, Tabellen-Auswertung, Korrekturregeln, Team-Algorithmen).
- **Application**: Use-Cases (z. B. „Shuttle-Run durchführen“, „Prüfung anlegen“, „Rückmeldebögen erzeugen“).
- **Adapters**: DB-Repositories, PDF-Renderer, CSV-Parser, Mail-Provider, WebUntis-Importer.
- **UI**: Screens, ViewModels, Validierung, Offline-Status.

### 3.2 Plugin/Capability-System
Jede „Feature-Familie“ wird über registrierbare Plugins abgebildet:
- `AssessmentType` (z. B. Sport-Kriteriennote, Zeitnote, Cooper-Test, Sportabzeichen; KURT-Aufgabenstruktur).
- `ToolPlugin` (Timer, Scoreboard, Taktikboard, Würfeln…)
- `Exporter` (PDF-Rückmeldebogen, PDF-Tabellen, CSV-Export, Share-Package)
- `Integration` (WebUntis-Import, Notenapp-Clipboard, Teilen mit anderen Nutzern)

**Regel:** Core kennt nur Interfaces, nie konkrete Implementierungen.

### 3.3 Local-first, Sync nur als Modul
- **Standardbetrieb:** alles offline, Daten bleiben lokal (IndexedDB).
- **WOW ohne Server:** „Schüler-Webeingabe“ wird im Default-Modus über **QR/Link (URL-Hash) + Rückgabe per QR/Code** umgesetzt, sodass kein Backend nötig ist.
- **Sync/Online (später, optional):** wird als **separates Integration-Plugin** implementiert (z. B. iServ/Notion). Default bleibt: keine Abhängigkeit.

### 3.4 Runtime/Deployment ohne Installation
- Build erzeugt **statische Assets** (`dist/`), die auf jedem beliebigen Webserver laufen (Schulserver/iServ-Web/USB-Intranet/Hosting).
- **Keine Runtime-Server-Komponente**: Im Betrieb darf kein Node/Python/Docker nötig sein.
- Offline-First: App muss bei deaktiviertem Netzwerk weiterhin bedienbar bleiben (Ausnahmen nur bei explizit aktivierten Integrationen).
- Optional: PWA/Service Worker **nur** als Komfort (Caching), niemals als Voraussetzung.

### 3.5 Persistenz- & Exportstrategie (LocalDB)
- **IndexedDB** als Primärspeicher; jede Domäne nutzt Repositories (kein Direktzugriff aus UI).
- **Migrations**: strikt versioniert; Upgrades dürfen keine Daten löschen.
- **Backup/Restore**: vollständiger Export/Import (z. B. verschlüsseltes Archiv) + selektive Exporte (CSV/PDF/Share-Package).
- **E-Mail-Versand lokal:** Generiere E-Mail-Inhalt/Anhänge und öffne Mail-Client (`mailto:`) oder exportiere als `.eml`/PDF – kein SMTP-Server erforderlich.

---


## 4) Datenmodell (konzeptionell)

### 4.1 Kern-Entitäten
- **TeacherAccount** (lokal): Security-Settings (PIN, Passwortänderung, DB-Passwort, Lock-Policy).
- **ClassGroup**: Name, Schuljahr, Bundesland/Ferienkalender-Ref, Notenschema (Sport), optional Fächerprofil.
- **Student**: Stammdaten inkl. Geburtsjahr, Geschlecht (für Import), Foto; Kontaktinfos (für KURT-Mailversand optional).
- **Lesson**: Datum, Stundenteile-Doku, Shortcuts/Verknüpfungen, Zufallsschüler-Auswahl-Seed/History.
- **AttendanceRecord**: Status (anwesend/fehlend/passiv/etc.), Begründung optional; Export-Flags.

### 4.2 Assessment-Entitäten (SportZens)
- **GradeScheme (Sport)**: pro Klasse.
- **GradeCategory (Sport)**: Typ (Kriterien/Zeit/Cooper/Sportabzeichen/BJS/…); Parameter (z. B. bis 8 Kriterien + Gewichtung; Best/Worst Note; Sportart Laufen/Schwimmen).
- **PerformanceEntry**: Messwert(e) + berechnete Note + Meta (Zeitstempel, Gerät, Kommentar).
- **TableDefinition**: „einfache Tabelle“ vs „Tabelle“, Mapping-Regeln, Alters-/Geschlechtsdimension.
- **ShuttleRunConfig**: separate Config (CSV-importiert) inkl. Spalte `LevelBahn`.
- **Tournament / Match / ScoreboardState**
- **TeamAssignment** (inkl. Algorithmus-Parameter)
- **FeedbackSession** (Methoden-Plugin)
- **DiceLogEntry** (Würfeln: Bereich + Ergebnis + Timestamp)
- **TacticsBoardSnapshot** (Sportart, Markierungen, Version)

### 4.3 Exam-Entitäten (KURT)
- **Exam**: Struktur, Modus (einfach/komplex), Notenschlüssel-Config, Druckpresets.
- **ExamPart**: Prüfungsteile (Teilpunkte/Teilnoten, optional druckbar).
- **TaskNode**: 1–3 Ebenen, beliebige Anzahl (komplex), Unteraufgaben, Wahlaufgaben, Bonuspunkte.
- **Criterion**: formatierter Text (Fett/…); optional Unterkriterien/Aufgabenaspekte (EWH-Workflow).
- **Candidate**: i. d. R. Student oder externe Prüflingsliste.
- **CorrectionEntry**: Punkte/Teilpunkte, ++/+… Alternative, Kommentarboxen, Fördertipps-Zuweisung.
- **SupportTip (Fördermöglichkeit)**: Titel, Kurzbeschreibung, Kategorien, bis zu 3 Links, QR-Gen, Häufigkeitszähler, Priorität/Gewichtung.
- **HighlightedWork**: markierte besondere Leistungen (Bild und/oder Wortlaut), Kategorie, Anonymisierungsflag.
- **MailTemplate**: Platzhalter für Noten-/Aufgabenergebnisse.

---

## 5) UI-Informationsarchitektur (Navigation)
- **Dashboard**: Klassen (Sport), Prüfungen (KURT), Schnellzugriff auf letzte Stunde / letzte Korrektur.
- **Klasse**:
  - Übersicht, Schülerliste, Stundenliste, Notenschema, Notenkategorien, Tabellen, WOW, Tools, Statistiken.
- **Schülerprofil**:
  - Sport: Entwicklung, Fehlzeiten, WOW-Übersicht.
  - KURT: Prüfungen, Kommentare, Fördertipps, Langzeitnotizen.
- **Prüfung**:
  - Setup (Struktur), Korrektur (2 Modi), Auswertung, Export/Druck, Versand, Sharing.
- **Einstellungen**:
  - Security (PIN/Passwort/DB-Passwort), Backups, Sprache, Einrichtungshilfe, Shuttle-Run-Konfig.

---

## 6) Vollständige Feature-Checkliste (Pflichtenheft)
> Diese Checkliste ist der **Single Source of Truth** für „nichts vergessen“. Jede Checkbox bekommt in der Umsetzung einen Issue/PR-Link.

### 6.1 Core: Security, Storage, Settings
- [ ] **Verschlüsselte lokale Speicherung** (Daten bleiben lokal).
- [ ] **App-Sperre** (PIN/Passwort).
- [ ] **Passwort ändern** (App-intern).
- [ ] **PIN setzen/ändern**.
- [ ] **Datenbank-Passwort** verwalten.
- [ ] **Backups verwalten** (Export/Import).
- [ ] **Einstellungen**: Shuttle-Run-Konfiguration importieren/verwenden, Sprache, Einrichtungshilfe.

### 6.2 SportZens — Kernverwaltung (Klassen/Schüler/Stunden/Fehlzeiten)
- [ ] **Klasse anlegen**.
- [ ] **Notenschema pro Klasse wählen**.
- [ ] **Stunden automatisch anlegen** (Ferien berücksichtigt).
- [ ] **Schnelle Navigation** in Unterfunktionen.
- [ ] Schüler: **Stammdaten inkl. Geburtsjahr**.
- [ ] Schüler: **Foto/Bild hinterlegen**.
- [ ] Schüler: **Noten-/Leistungsentwicklung**.
- [ ] Schüler: **Fehlzeiten/Anwesenheiten überwachen**.
- [ ] Schüler: **WOW-Übersicht pro Schüler**.
- [ ] Fehlzeiten: **digital dokumentieren** (verschiedene Formen).
- [ ] Fehlzeiten: **prozentuale Anwesenheit**.
- [ ] Fehlzeiten: **Export**.
- [ ] Stunden: **Stundenübersicht** (Schuljahr/Ferien).
- [ ] Stunden: **Anwesenheiten je Stunde** verwalten.
- [ ] Stunden: **Stundenteile dokumentieren**.
- [ ] Stunden: **Direktsprünge** zu Tools/Funktionen.
- [ ] Stunden: **Zufälligen Schüler auswählen**.

### 6.3 SportZens — Benotung & Bewertungssystem
- [ ] **Notenschemata**: pro Klasse auswählbar.
- [ ] **Notenkategorien: Noten nach Kriterien**:
  - [ ] bis zu **8 Kriterien** definieren
  - [ ] **Gewichtung** je Kriterium
  - [ ] Bewertung per **Schieberegler**
  - [ ] **Selbsteinschätzung** (direkt oder via WOW)
- [ ] **Notenkategorien: Noten auf Zeit**:
  - [ ] beste/schlechteste Note festlegen
  - [ ] lineare Einordnung aller Zeiten
  - [ ] Grenzwerte nachträglich anpassbar
- [ ] **Notenkategorien: Cooper-Test**:
  - [ ] Runden zählen
  - [ ] Sofort-Auswertung bei hinterlegter Tabelle
- [ ] **Verbalbeurteilungen** (eigener Funktionspunkt; Detail-Spezifikation TBD, aber Feature muss existieren).

### 6.4 SportZens — Tabellen & CSV (Import/Export)
- [ ] Unterscheidung **„einfache Tabellen“ vs „Tabellen“**.
- [ ] **Lokale Tabellen auswählen & anpassen**.
- [ ] **Tabellen-Vorlagen herunterladen/anpassen/importieren** (CSV).
- [ ] **Geburtsjahr pro Schüler** (für automatisierte Auswertung erforderlich/empfohlen).
- [ ] Workflow: Vorlage → Excel anpassen (Spaltenreihenfolge bleibt) → CSV speichern → importieren.
- [ ] Android-Import-Hinweis/Pfad-Hilfe (als UX-Hilfe in App).
- [ ] **Schüler-Import per CSV** inkl. Geschlecht & Geburtsjahr.

### 6.5 SportZens — Test- & Mess-Workflows
- [ ] **Shuttle-Run**:
  - [ ] Start–Stop–Fertig; Stopp je Schüler beim Aufhören
  - [ ] Auswertung automatisiert mit Tabelle (Vorlage/lokal)
  - [ ] Audio-Signale aus App
  - [ ] eigene Konfiguration via CSV **über Einstellungen** (nicht als Tabelle)
- [ ] **Cooper-Test ohne Papier**:
  - [ ] Runden erfassen; automatische Auswertung/Noten bei Tabelle
  - [ ] Sportart Laufen/Schwimmen festlegbar
  - [ ] Tabelle downloaden/selbst erstellen, importieren
- [ ] **Mittelstrecke**:
  - [ ] Timer läuft; individuelle Stopps pro Schüler im Ziel (Mehrfach-Stopp)
- [ ] **Sportabzeichen**:
  - [ ] eigene Notenkategorie
  - [ ] Geburtsjahr relevant (altersabhängig)
  - [ ] Tabelle hinterlegbar (Notenautomatik)
  - [ ] Leistungen erfassen + direkte Bewertung anzeigen
  - [ ] PDF-Export einer Übersicht
- [ ] **Bundesjugendspiele**:
  - [ ] Leistungen erfassen und auswerten
  - [ ] optionale Tabelle → automatische Einbindung als Note

### 6.6 SportZens — Live-Unterrichtstools
- [ ] **Teams einteilen** (digital, schnell, fair).
- [ ] **Turnierplanung** (planen & durchführen).
- [ ] **Scoreboard** (Spielstände erfassen).
- [ ] **Timer** (Zeiten stoppen).
- [ ] **Taktikboard**: Top-Down-Ansicht + sportartspezifische Annotation/Markierungen.
- [ ] **Würfeln**: Zahlenbereich wählen + Ergebnisse loggen.

### 6.7 SportZens — Feedback & Statistiken
- [ ] **Feedback**: mehrere Methoden, direkt am Lehrertablet.
- [ ] **Statistiken**: Überblick über geleistete Arbeit/Nutzung.

### 6.8 SportZens — WOW
- [ ] Workouts erstellen & bereitstellen.
- [ ] Schüler tragen Ergebnisse **über Browser** ein (ohne Registrierung/ohne App).
- [ ] Lehrkraft ruft Ergebnisse/Fortschritt ab.
- [ ] WOW-Übersichten in App (auch pro Schüler).

### 6.9 KURT — Prüfungen anlegen (Strukturen)
- [ ] Prüfungen mit Unteraufgaben und komplexen Bausteinen (Darstellungsleistung, Schreibaufgabe, Kriterien, Unterkriterien, Wahlaufgaben, Kommentare, Prüfungsteile, Bonuspunkte).
- [ ] **Einfacher vs. komplexer Aufgabenmodus**:
  - [ ] Einfach (Standard)
  - [ ] Komplex: unbegrenzte Aufgabenanzahl auf **drei Ebenen**, Aufgabennoten, Kommentare & Tipps auch für Unteraufgaben.
- [ ] Pro Aufgabe: Anzahl Unteraufgaben definierbar.
- [ ] Kriterien pro Aufgabe/Unteraufgabe definieren und **formatieren** (z. B. Fett).
- [ ] Pro Aufgabe festlegen, ob Aufgabenkommentare oder Fördertipps vergeben werden sollen.
- [ ] **Prüfungsteile** definieren; Teilpunkte/Teilnoten automatisch; optional mitdruckbar.

### 6.10 KURT — Benotung/Notenschlüssel
- [ ] Verschiedene Notenschlüssel schnell einsetzbar; flexible Benotungsoptionen.
- [ ] Nach der Korrektur Notenschlüssel/Optionen ohne Datenverlust anpassbar.
- [ ] Notengrenzen per Prozentwerten anpassbar, auch nachträglich; zurücksetzbar.
- [ ] Punktegrenzen automatisch aus Prozentangaben berechnen.
- [ ] Noten-Presets auswählen + prüfungsindividuell anpassen.
- [ ] Finetuning (z. B. Rundungslogik).
- [ ] Optional: „Fehlerpunkte → Aufgabennote“.

### 6.11 KURT — Korrigieren (Flows & Modi)
- [ ] Kompakte Korrekturmaske: Auto-Gesamtpunkte/Note, minimierte Verrechnungsfehler.
- [ ] Anzeige: Punkte bis zur nächsten Notenstufe.
- [ ] Tab-Navigation in Punktefelder.
- [ ] Aufgabenweise korrigieren (Tabellenmodus + AWK).
- [ ] Aufgabenkommentare erfassen; mitdruckbar; nach Abgabe verfügbar.
- [ ] Teilpunkte/Teilnoten je Prüfungsteil automatisch; optional druckbar.
- [ ] Wahlaufgaben abbilden (z. B. 3a/3b).
- [ ] Kommentarboxen pro Aufgabenebene zuschaltbar.
- [ ] Alternative Bepunktungsart **(++,+,0,-,–)**.
- [ ] Im komplexen Modus: drei Aufgabenebenen in UI/Logik.
- [ ] Schnelles Wechseln zwischen Prüflingen.

### 6.12 KURT — Fördertipps (DB, Zuweisung, QR, Auswertung)
- [ ] Fördertipps aufgabenbezogen oder allgemein; persönliche Datenbank.
- [ ] Nach Korrektur: Überblick wem/wann/wo Tipps; Auswertung Handlungs-/Übungsbedarf (Klasse/Individuum).
- [ ] Pro Fördermöglichkeit: Titel, Kurzbeschreibung, optionale Kategorien.
- [ ] Übungshinweise/Links hinterlegen; bis zu **3 Links**.
- [ ] QR-Codes per Knopfdruck erzeugen.
- [ ] In Korrekturmaske: suchen/auswählen/hinzufügen (auch unteraufgabenbezogen).
- [ ] Fördertipps gewichten/priorisieren; Gewichtung erscheint auf Rückmeldebogen.
- [ ] Dropdown-Vorschau: Name, Beschreibungsvorschau, Anzahl vergebener Tipps, Kategorie; häufige Tipps oben.
- [ ] Fördertipps pro Aufgabenebene nutzbar oder für Ebenen/Aufgaben deaktivierbar.

### 6.13 KURT — Auswertung & nachträgliche Anpassung
- [ ] Schwierigkeit: welche Aufgaben/Unteraufgaben/Kriterien schwierig; Streuungen; Bewertungskorridore.
- [ ] Punkteänderungsassistent: Aufgabengewichtungen anpassen, Punkteverhältnisse erhalten.
- [ ] Notenschlüssel nachträglich anpassen; Noten ändern automatisch.
- [ ] Ergebnis-/Auswertungstabellen sortierbar: Korrekturreihenfolge, Name, Punkte, Aufgabenpunkte; Sortierung nach (Unter-)Aufgabe.

### 6.14 KURT — Langzeit-Überblick & Notizen
- [ ] Schuljahres-Überblick zur Entwicklung von Kompetenzbereichen.
- [ ] Interne Notizen für Entwicklungen/Förderschwerpunkte.
- [ ] Pro Prüfling Überblick: Aufgaben-/Endkommentare & Fördertipps.

### 6.15 KURT — Rückmeldung/Kommentare
- [ ] Aufgabenbezogene oder allgemeine Kommentare als individuelle Rückmeldung.
- [ ] Kommentare bleiben nach Rückgabe verfügbar.
- [ ] Kommentare anderer SuS derselben Prüfung einsehen und wiederverwenden.

### 6.16 KURT — Export & Druck (PDF)
- [ ] PDF-Rückmeldebögen inkl. Teilpunkte, Kommentare, Fördertipps, Unterschrift, Schullogo.
- [ ] Mit einem Klick alle PDFs erzeugen.
- [ ] Drucklayouts: **vier** Layouts.
- [ ] Headerbereich über Druckpresets anpassbar; Druck aktueller Prüfling oder alle.
- [ ] Kriterien formatiert drucken; pro Aufgabe Prozent anzeigen; Kommentare/Fördertipps kursiv.
- [ ] Punktabzüge anzeigen oder deaktivieren.
- [ ] Unterschrift: Bilddatei, per Hand malen, oder leer.

### 6.17 KURT — Besondere Schülerleistungen markieren
- [ ] Während Korrektur markieren; Bild und/oder Wortlaut dokumentieren.
- [ ] Übersicht nach Aufgabe & Kategorie.
- [ ] Namen ausblendbar (Anonymisierung).

### 6.18 KURT — E-Mail-Versand
- [ ] Ergebnisse per E-Mail an Schüler und/oder Eltern.
- [ ] E-Mail enthält Noten- und Aufgabenergebnisse; Platzhalter automatisch korrekt befüllen.

### 6.19 KURT — Gruppenweise korrigieren & Splitscreen
- [ ] Gruppenkorrektur im Splitscreenmodus (Referate/mündlich).
- [ ] Vollbildmodus; bis zu vier Prüflinge gleichzeitig.
- [ ] Thema für Referate/mündliche Prüfungen festlegen.

### 6.20 KURT — Zusammenarbeit/Kompatibilität
- [ ] Lerngruppen aus WebUntis importieren.
- [ ] Prüfungsnoten in Notenapps kopieren; Notenspiegel kopieren.
- [ ] Fördermöglichkeiten oder Prüfungsentwürfe mit anderen Nutzern teilen.
- [ ] Notenspalte kopieren (Excel/Notenprogramme).

### 6.21 KURT — Unterstützte Bewertungsformate
- [ ] Abdeckung der genannten Formate: Mappen, Portfolios, Referate, Tests, Facharbeiten, mündliche Prüfungen etc.

### 6.22 KURT — Oberstufenklausuren & Erwartungshorizont-Workflow
- [ ] Aufgabenaspekte/Unterkriterien feiner beschreibbar.
- [ ] Kriterien/Aufgabenaspekte formatierbar.
- [ ] Copy & Paste aus Word: Formatierungen bleiben erhalten (best effort).
- [ ] Alternative Blanko-EWH-Workflow (exportierbar/unterstützt).
- [ ] 0–15 Punkte, Wahlaufgaben mit Teilkriterien, Bonuscharakter, Prüfung in Teile, Zwischennoten je Teil (optional ausblendbar).

---

## 7) Implementierungsfahrplan (für Codex/Copilot)

### Schritt 1 — Repo-Scaffold & Grenzen festnageln
- Monorepo (z. B. `apps/` + `packages/`), oder single-app mit `modules/`.
- `packages/core` (Domain, Interfaces, Storage Abstractions, Crypto Abstractions).
- `modules/sport` und `modules/exams` strikt getrennt.
- `packages/plugins` (Registry + Contracts).

### Schritt 2 — Storage/Security als erstes (weil alles davon abhängt)
- Verschlüsselte DB + Migrations.
- App-Lock (PIN/Passwort), Password-change, DB-Passwort.
- Backup/Restore-End-to-End.

### Schritt 3 — SportZens Core (Klassen/Schüler/Stunden/Fehlzeiten)
- UI + Domain-Model + Export.

### Schritt 4 — Sport Tools + Assessments + Tabellen
- Assessment Engine (Kriterien/Zeit/Cooper) + Tabellen-Auswertung.
- Shuttle-Run/Cooper/Mittelstrecke/Sportabzeichen/BJS.
- Tools: Teams, Turnier, Scoreboard, Timer, Taktikboard, Würfeln.

### Schritt 5 — KURT Core (Exam Builder + Correction)
- Exam-Model (einfach/komplex) + UI.
- Correction UI (kompakt + AWK/Tabellenmodus).
- Notenschlüssel-Engine (Prozentgrenzen, Presets, Rundung, nachträglich).

### Schritt 6 — KURT Extras (Fördertipps, Auswertung, Export, Versand)
- Fördertipps-DB + QR + Gewichtung.
- Auswertungen + Punkteänderungsassistent.
- PDF-Renderer (4 Layouts, Presets, Logo, Signatur-Optionen).
- E-Mail-Modul (Templates + Platzhalter).

### Schritt 7 — Integrationen & WOW
- WebUntis-Import (mindestens Datei-Import; optional API).
- Sharing von Prüfungsentwürfen/Fördertipps (als Share-Package).
- WOW: Minimaler Webservice + Schüler-Webformular + Token-Links.

---

## 8) Definition of Done (Qualitätsgates)
- Jede Checkbox aus Abschnitt 6 ist implementiert, testbar und in der UI erreichbar.
- Für jeden `AssessmentType` existieren:
  - Validierung + Beispiel-Datensätze (synthetisch) + Regressionstests.
- Export/Import ist idempotent (Import→Export→Import ohne Datenverlust, soweit Format es zulässt).
- Security: Daten sind im Dateisystem nicht im Klartext lesbar; App-Lock greift zuverlässig.

---

## 9) Offene Spezifikationspunkte (ohne Raten)
Damit wir nichts erfinden, aber trotzdem 100% implementieren können, brauchen diese Punkte später noch Detail-Input (als Mini-Spez in separaten Dateien):
1. **Verbalbeurteilungen**: Felder/Skalen/Exportformat (SportZens nennt es als Funktionspunkt, Details fehlen).
2. **Turnierplanung/Scoreboard**: genaue Turnierformate, Regeln, Spielplan-Algorithmen (SportZens nennt den Funktionspunkt, Details sind knapp).
3. **WebUntis-Import**: gewünschter Importweg (CSV-Export vs API) und Feld-Mapping.
4. **E-Mail-Versand**: Welche Platzhalter genau? (KURT sagt „Platzhalter automatisch korrekt befüllt“, ohne Liste).5. **[CRITICAL] Storage Architecture Migration (Phase 4)**: teacher-ui currently uses custom Dexie (IndexedDB) instance directly, violating modular boundaries. Must be refactored to:
   - Use `@viccoboard/storage` package's `IndexedDBStorage` instead of custom Dexie
   - Access domain repositories through proper bridges (see `modules/sport/src/repositories/` and `modules/students/src/repositories/`)
   - Remove all inline repository logic from `apps/teacher-ui/src/composables/useDatabase.ts`
   - Ensure UI has NO direct DB access; all data flows through module boundaries
   - Migration strategy for existing Dexie data → IndexedDBStorage schema
   - See: `agents.md` Rule 11 (centralized student management), Rule 2 (modularität)
