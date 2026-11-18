# Plan.md — Unified Teacher Suite (Sport + KBR)

## 1) Zielbild & harte Constraints
Wir bauen eine **einzige** App, die den **vollen Funktionsumfang** von:
- **Sport** (Organisation, Bewertung, Live-Unterrichtstools, WOW, Security/Local-first) und
- **KBR** (Prüfungen strukturieren, Korrigieren, Auswerten, Rückmeldebögen, Versand/Sharing, Langzeit-Übersicht)

in einem konsistenten System vereint.

**Harte Vorgaben:**
1. **Keine Funktion und keine Option wird ausgelassen** (siehe Feature-Checkliste in Abschnitt 6).
2. **Modularer Ansatz:** neue Domänen/Fächer/Tools müssen als Module/Plugins ergänzbar sein, ohne Core-Änderungen (Core = Interfaces, Policies, Shared UI).
3. **Ohne Installation & komplett lokal lauffähig (Default):** Die App läuft als **statische Web-App im Browser** (HTTP/HTTPS), ohne App-Store, ohne Electron, ohne Browser-Extension, ohne lokale Server-Installation. Alle Kernfunktionen funktionieren offline.
4. **LocalDB = IndexedDB (Default):** verschlüsselte Speicherung im Browser (inkl. Migrationen), jederzeitiger Export/Backup/Restore.
5. **Online/Integrationen nur optional:** iServ/Notion/Sync sind **Feature-Flags** und standardmäßig **aus**. Die App muss ohne diese Integrationen vollständig nutzbar sein.
6. **Sicherheitsmodell:** App-Sperre (PIN/Passwort), Lock-Policy/Timeout, sichere Schlüsselableitung, saubere Backups/Restore (kein Datenverlust durch Updates).
7. **Konfigurierbarkeit statt Hartkodierung:** Kriterien und Statusoptionen müssen in den relevanten Bereichen (z. B. Anwesenheit) als benutzerdefinierbare Kataloge pflegbar sein (hinzufügen/umbenennen/deaktivieren/sortieren), ohne Codeänderung.

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
- **Analytics Engine**: aggregierte Statistiken (Sport-Statistik + KBR-Auswertung), ohne personenbezogene Daten nach außen.
- **Plugin Registry**: Registrierung von Tools (Timer, Scoreboard…), Assessment-Typen, Exportern und Integrationen.

### 2.2 Domänenmodule
**Sport-Unterricht (Sport):**
- Klassen, Schüler, Stunden, Anwesenheiten
- Notenschemata & Notenkategorien (Kriterien, Zeit, Cooper) + Verbalbeurteilungen
- Tabellen (inkl. „einfache Tabellen“), CSV-Import/Export, Schüler-Import
- Test-/Mess-Workflows: Shuttle-Run, Cooper, Mittelstrecke, Sportabzeichen, Bundesjugendspiele
- Live-Tools: Teams, Turnierplanung, Scoreboard, Timer, Taktikboard, Würfeln (+ Logging)
- Feedback (mehrere Methoden, am Lehrertablet) + Statistiken
- WOW: Workouts erstellen, Web-Eingabe durch Schüler, Fortschritt abrufen, Schüler-Übersichten

**Prüfungen/Korrektur (KBR):**
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
- `AssessmentType` (z. B. Sport-Kriteriennote, Zeitnote, Cooper-Test, Sportabzeichen; KBR-Aufgabenstruktur).
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
- **Student**: Stammdaten inkl. Geburtsjahr, Geschlecht (für Import), Foto; Kontaktinfos (für KBR-Mailversand optional).
- **Lesson**: Datum, Stundenteile-Doku, Shortcuts/Verknüpfungen, Zufallsschüler-Auswahl-Seed/History.
- **AttendanceRecord**: Status (anwesend/fehlend/passiv/etc.), Begründung optional; Export-Flags.
- **StatusCatalog / CriteriaCatalog**: benutzerdefinierbare Status- und Kriterienkataloge pro Kontext (z. B. Anwesenheit, Mitarbeit), inkl. Sortierung, Aktiv-Flag, Anzeige-Metadaten.

### 4.2 Assessment-Entitäten (Sport)
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

### 4.3 Exam-Entitäten (KBR)
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

## 5) UI-Informationsarchitektur – Aufgaben und Arbeitskontexte (UX-03)

> **Produktentwurf, noch keine implementierte Navigation.** Code-Bestandsaufnahme vom 18.11.2026 auf `main` @ `24f115505fd4f3b47432f5808c922e6bad54dc5a`. Implementierte Routen und Verträge bleiben allein im [Router](apps/teacher-ui/src/router/index.ts), in der [Navigation](apps/teacher-ui/src/navigation.ts) und den jeweiligen Domain-Modulen verbindlich. `HANDBOOK.md` regelt die Entwicklung, nicht die Produktgestaltung.
>
> Der aktuelle Router registriert 58 Routen. Die älteren Diagramme in `docs/ui/navigation.graph.json` / `navigation.mmd` / `routes.mmd` bilden nur einen älteren Ausschnitt ab (u. a. 28 Screens und absolute Windows-Dateipfade); sie sind **nicht** die Grundlage für die folgende Ist-Analyse. Die Anzahl der Parent-Routen ist **keine** Messung tatsächlicher Klickwege.

### 5.1 UX-Ziel und nicht verhandelbare Grenzen

- Ausgangspunkt ist die **Aufgabe der Lehrkraft**, nicht der Fachmodulname, die technische Route oder die bisherige Klickstrecke.
- Häufige Ziele sollen möglichst direkt erreichbar sein; drei Navigationsebenen sind ein **Prüfanlass**, keine harte Grenze. Entscheidend sind Verständlichkeit, erfolgreich abgeschlossene Aufgaben, Kontextwechsel, Fehlwege und Wartezeiten. Sicherheitsbestätigungen und erforderliche Fachentscheidungen sind keine vermeidbaren Klicks.
- Die zuletzt bewusst gewählte **Klasse, Stunde, Person, Prüfung und gegebenenfalls Bewertungskategorie** bleibt zwischen dazugehörigen Tätigkeiten erhalten, soweit die vorhandenen Contracts die Zuordnung erlauben. Auswahl bei fehlendem oder unpassendem Kontext bleibt erforderlich.
- Die Hauptnavigation erschließt Arbeitsbereiche; **Queraktionen gehören an das jeweilige Objekt**: von der Stunde zur Anwesenheit, von der Klasse zur Schülerliste, von der Prüfung zur Korrektur, Auswertung und Rückmeldung.
- Das System zeigt den nächsten **möglichen und fachlich zulässigen** Schritt an, ohne ungeprüfte Absichten zu erraten oder automatisch Daten zu verändern. Unsaved-Changes- und Fehlerfälle dürfen nicht übergangen werden.
- Gemeinsame Bedienelemente verwenden bevorzugt das bereits konfigurierte **OpenVue im Styled Mode (Nora)**. Eigenes CSS bleibt auf notwendige Layout- und Fachinteraktionen begrenzt; ein Framework-Wechsel allein ist keine UX-Verbesserung.
- Keine Funktion aus `6)` entfällt. Alle Daten- und Fachgrenzen bleiben bestehen: `Student` und `StudentRepository` zentral; Sport-/KBR-Referenzen nur über vorhandene IDs, Bridges und Use-Cases. **Prüflings-IDs sind nicht automatisch Schüler-IDs**; Zuordnungen nie erraten. Kein Cloud-, Server- oder Telemetriezwang.
- iPadOS/Safari (auch Offline-HTML, Portrait/Landscape und ½/⅓ Split View), Desktop und Laptop sind gleichwertige Oberflächen. Touchziele ≥ 44 px, Tastatur/Fokus/Screenreader und transparente Lade-/Speicherzustände sind verbindlich. Für Geschwindigkeit: unmittelbare Interaktionsrückmeldung, kontextspezifisches Prefetching und gestufte Inhalte; tatsächliche Verbesserungen **messen**, nicht behaupten.

### 5.2 Primärnavigation – zu prüfende Informationsarchitektur

Die bestehende Icon-Sidebar bleibt zunächst bestehen. Folgende **Bezeichnungen und Gruppen sind Hypothesen zur Erprobung**, nicht bereits beschlossene Routen oder implementierte Menüpunkte:

| Bereich | Hauptfrage | Direkte Objekte/Aktionen |
|---|---|---|
| **Heute** | Was steht als Nächstes an? | Nächste Stunde, Anwesenheit, zuletzt bearbeitete Klasse/Prüfung; kein reines Statistik-Dashboard. |
| **Unterricht** | Welche Stunde oder Unterrichtssequenz? | Stundenplan, Stundenliste, Sequenzplanung, Stundenarbeitsbereich. |
| **Klassen** | Mit welcher Lerngruppe arbeite ich? | Schüler, Stunden, Anwesenheit, Sport-Bewertung, Planung, Gruppen-/Klassenoptionen. |
| **Schüler** | Was muss ich zu einer Person wissen oder pflegen? | Stammdaten, Anwesenheit, Leistung, Sport und KBR, Notizen, Import. |
| **Prüfungen** | Mit welcher KBR-Prüfung arbeite ich? | Prüfung auswählen/erstellen; Struktur, Korrektur, Auswertung, Druckbogen und Rückmeldung **am selben Objekt**. |
| **Werkzeuge** | Welches Unterrichtswerkzeug brauche ich jetzt? | Timer, Multistop, Teams, Scoreboard, Taktik, Feedback, Video und weitere vorhandene Sporttools – mit Kontext, wenn vorhanden. |
| **Einstellungen** | Was muss ich systemweit konfigurieren? | Backup/Wiederherstellung, Schuljahreswechsel, Kataloge und Fachkonfiguration; möglichst abgesetzt vom Tagesgeschäft. |

**Offen zu validieren:** Braucht Sport-Bewertung einen eigenen dauerhaften Hauptzugang oder ist sie aus Klasse/Unterricht zuverlässig leichter erreichbar? Soll die Schülerübersicht immer sichtbar sein oder über eine globale Suche ergänzt werden? Kein Umbau der Sidebar allein auf Basis dieses Entwurfs.

### 5.3 Ist-Aufgabenkarte – aus aktuellen Vue-Ansichten und Routen abgeleitet

Die nachfolgenden Wege sind **statisch belegte UI-Verbindungen bzw. Auswahlen**, keine beobachteten Nutzungsabläufe. Wo „erneut auswählen“ steht, ist die entsprechende Auswahlmaske im Code belegt; ob Nutzer:innen sie im konkreten Fall tatsächlich erneut bedienen müssen, wird separat getestet.

| Aufgabe | Vorhandener Weg / belegte Reibung | Zielhypothese / nächste Queraktion |
|---|---|---|
| **T01** Anstehende Stunde öffnen | [Dashboard](apps/teacher-ui/src/views/Dashboard.vue) und [Stundenplan](apps/teacher-ui/src/views/ScheduleOverview.vue) verlinken bereits direkt zum [Stundenarbeitsbereich](apps/teacher-ui/src/views/LessonWorkspace.vue). | „Jetzt fortsetzen“ an prominenter Stelle; Stunde bleibt Kontext für weitere Aktionen. |
| **T02** Anwesenheit erfassen | [LessonWorkspace](apps/teacher-ui/src/views/LessonWorkspace.vue) übergibt `classId` und `lessonId` an [AttendanceEntry](apps/teacher-ui/src/views/AttendanceEntry.vue); die Erfassung besitzt daneben eigene Klasse-/Fachauswahl. | Aus der Stunde direkt zum passenden Kurs und Termin; bei freiem Einstieg nur fehlende Angaben erfragen. |
| **T03** Stunden anlegen/ändern | [ScheduleOverview](apps/teacher-ui/src/views/ScheduleOverview.vue) führt zur [LessonList](apps/teacher-ui/src/views/LessonList.vue) mit Erstellen/Bearbeiten; auch [PlanningOverview](apps/teacher-ui/src/views/PlanningOverview.vue) kann Stunden im Plan erzeugen. | Neue Stunde im gewählten Zeit-/Klassenkontext anlegen, anschließend direkt öffnen. |
| **T04** Sequenz planen | [PlanningOverview](apps/teacher-ui/src/views/PlanningOverview.vue) startet mit eigener Klassen-/Fachauswahl und lädt Klassenplanung. | Von Klasse oder Stunde mit vorbereiteter Auswahl zur Sequenzplanung. |
| **T05** Klasse anlegen/bearbeiten | [Dashboard](apps/teacher-ui/src/views/Dashboard.vue) stellt Erstellen bereit; [ClassesOverview](apps/teacher-ui/src/views/ClassesOverview.vue) verweist zum Anlegen auf die Startseite; [ClassDetail](apps/teacher-ui/src/views/ClassDetail.vue) kann bearbeiten. | Anlegen und Bearbeiten direkt in der Klassenübersicht und im Klassenkontext. |
| **T06** Klassen-/Schülerdaten verwalten | [ClassDetail](apps/teacher-ui/src/views/ClassDetail.vue) verlinkt Schülerprofile und bietet Schüler hinzufügen; [StudentList](apps/teacher-ui/src/views/StudentList.vue) bietet globale Suche, Import und Sammelaktionen. | Von der Klasse zur gefilterten Schülerliste, von der Person mit erkennbarem Rückweg zur Klasse. |
| **T07** Schülerentwicklung ansehen | [StudentProfile](apps/teacher-ui/src/views/StudentProfile.vue) aggregiert Sport, Anwesenheit, KBR und Notizen. | Kontextbezogene Aktionen direkt an den Abschnitten; keine unnötigen Zwischenhubs. |
| **T08** Sport-Leistung bewerten | [ClassDetail](apps/teacher-ui/src/utils/class-detail-summary.ts) führt bei „Bewertung & Tests“ zur globalen [GradingOverview](apps/teacher-ui/src/views/GradingOverview.vue), die ihrerseits eine Klasse auswählen lässt; erst dann zur Bewertungskategorie. | Klasse aus dem Ursprung übernehmen; Kategorie und Bewertungsmaske ohne Rückweg über den Sport-Hub. |
| **T09** Sportprüfung durchführen | [SportHub](apps/teacher-ui/src/views/SportHub.vue) führt zur [SportExam](apps/teacher-ui/src/views/SportExam.vue) mit Klasse, Kategorie, Datum, Erfassung und Speichern. | Aus Klasse/Stunde direkt in die passende Prüfung; fachlich erforderliche Auswahl erhalten. |
| **T10** Sporttools starten/fortsetzen | [SportHub](apps/teacher-ui/src/views/SportHub.vue) bietet zahlreiche gleichrangige Tools; [LessonWorkspace](apps/teacher-ui/src/views/LessonWorkspace.vue) liefert bereits kontextbezogene Tool-Links und zuletzt verwendete Sessions. | Aus aktiver Stunde zuletzt genutztes oder passendes Tool direkt starten; globale Werkzeugübersicht bleibt als Ausweichweg. |
| **T11** KBR-Prüfung erstellen | [KBRHub](apps/teacher-ui/src/views/KBRHub.vue) und [ExamsOverview](apps/teacher-ui/src/views/ExamsOverview.vue) öffnen den [KBRExamBuilder](apps/teacher-ui/src/views/KBRExamBuilder.vue); nach erfolgreichem Speichern navigiert er zu `/exams`. | Nach Speichern **bei der konkreten Prüfung bleiben** und „Korrigieren“, „Druckbogen“ oder „Zur Liste“ anbieten. |
| **T12** KBR-Prüfung korrigieren | [KBRHub](apps/teacher-ui/src/views/KBRHub.vue) bietet `/exams?workflow=correct`; [ExamsOverview](apps/teacher-ui/src/views/ExamsOverview.vue) verlangt dann die konkrete Prüfung; [CorrectionCompactUI_v2](apps/teacher-ui/src/views/CorrectionCompactUI_v2.vue) wählt Prüfling und Korrekturmodus. | Prüfung einmal wählen; von ihrem Arbeitskontext direkt in den letzten **belegten** Korrekturzustand. |
| **T13** KBR-Druckbogen gestalten | [KBRHub](apps/teacher-ui/src/views/KBRHub.vue) führt über `?workflow=design` zur Prüfungsauswahl; [KBRSheetDesigner](apps/teacher-ui/src/views/KBRSheetDesigner.vue) bietet zurück zur **Prüfungsauswahl**. | Aus der konkreten Prüfung gestalten und zu **derselben Prüfung** zurückkehren, ohne andere Auswahl. |
| **T14** KBR-Rückmeldung/Analyse | [ExamsOverview](apps/teacher-ui/src/views/ExamsOverview.vue) und [KBRHub](apps/teacher-ui/src/views/KBRHub.vue) öffnen Analyse/Export; aus der [Korrektur](apps/teacher-ui/src/views/CorrectionCompactUI_v2.vue) kann die Vorschau mit `candidateId` geöffnet werden. | Struktur, Korrektur, Analyse und Rückmeldung als Aktionen desselben Prüfungskontexts; Prüfling nicht ungeprüft wechseln. |
| **T15** Fördertipps pflegen | [CorrectionCompactUI_v2](apps/teacher-ui/src/views/CorrectionCompactUI_v2.vue) verlinkt [SupportTipLibrary](apps/teacher-ui/src/views/SupportTipLibrary.vue) bereits mit `returnTo`. | Vorhandenes Rückkehrmuster auf andere fachliche Querverbindungen übertragen; Eingaben vor Wechsel sichern. |
| **T16** Schuljahr wechseln | [SettingsOverview](apps/teacher-ui/src/views/SettingsOverview.vue) führt zu [SchoolYearOverview](apps/teacher-ui/src/views/SchoolYearOverview.vue): Vorschau, Backup-Bestätigung und Schuljahr-Eingabe. | Wenige klare Schritte, **keine** Entfernung von Vorschau, Backup-Hinweis oder Bestätigung aus vermeintlicher Klickersparnis. |
| **T17** Lokale Daten sichern | [SettingsOverview](apps/teacher-ui/src/views/SettingsOverview.vue) führt zu [BackupRestoreView](apps/teacher-ui/src/views/BackupRestoreView.vue) für verschlüsselten Export/Restore. | Von riskanten Vorgängen direkt zur Sicherung, aber Export und Wiederherstellung klar getrennt lassen. |
| **T18** Bewertungs- und Normtabellen | [SportHub](apps/teacher-ui/src/views/SportHub.vue) verlinkt [SportTablesView](apps/teacher-ui/src/views/SportTablesView.vue); [GradingOverview](apps/teacher-ui/src/views/GradingOverview.vue) öffnet außerdem die separate [TableManagement](apps/teacher-ui/src/views/TableManagement.vue) – beide heißen sinngemäß Tabellenverwaltung. | Fachliche Unterschiede zuerst prüfen, dann verständliche Begriffe und gegebenenfalls direkte Kontextlinks; **keine** stillschweigende Zusammenlegung von Datenformaten. |

Weitere registrierte Sport-Varianten (Kriterien, Zeiten, Cooper, Shuttle-Run, Mittelstrecke, BJS, Sportabzeichen, Messwerte, verbale Bewertung), Live-Tools (u. a. Kamera/Video, Team- und Turnierverwaltung), KBR-Editoren, Settings und Statistiken bleiben im Produktumfang. Ihre spezialisierten **fachlichen Ein- und Ausgaben** müssen beim Redesign gesondert geprüft werden; ihre heutigen Darstellungs- und Navigationsformen sind dagegen **nicht** schützenswert. Die [Router-Konfiguration](apps/teacher-ui/src/router/index.ts) ist das aktuelle vollständige Routenverzeichnis, keine zusätzliche manuelle Routenliste pflegen.

### 5.4 Zielabläufe und Kontextmodell zur Erprobung

**Arbeitskontexte, nicht neue persistente Datenmodelle:**

- **Klasse:** gewählte Klassen-ID; direkte Aktionen Schüler, Stunden, Anwesenheit, Sportbewertung, Planung. Eine Verlinkung darf IDs nur übergeben, wenn das Ziel sie tatsächlich versteht und validiert.
- **Stunde:** Stunden-ID, zugehörige Klassen-ID und Fach; „Anwesenheit“, „Unterrichtswerkzeug“, „Schüler ziehen“, „Stundendetails“. Fach-/Klassenwechsel ist sichtbar und überschreibt nicht unbeabsichtigt offene Eingaben.
- **Schülerprofil:** zentrale Schüler-ID; Fachübersicht, Anwesenheit, Leistung, Notizen. KBR-Prüflinge nur bei tatsächlich bestehender und validierter Zuordnung querverlinken.
- **KBR-Prüfung:** Prüfungs-ID und vorhandener Status; „Aufgaben“, „Korrigieren“, „Auswertung“, „Druckbogen“, „Rückmeldung“. Diese Stationen sind **frei anwählbare Aktionen**, kein erzwungener Wizard. Prüfling und Korrekturstatus bleiben eigene Validierungs- und Speicherkontexte.
- **Werkzeug:** im freien Einstieg ohne Klasse startbar, soweit das konkrete Tool dies heute unterstützt; aus einer Stunde Kontext durchreichen, sofern der Tool-Contract es akzeptiert.

**Pilot KBR-Prüfung (UX-04, vor Implementierung durch Aufgaben-Test prüfen):**

1. Einstieg „Prüfungen“ → bestehende Prüfung auswählen oder neue erstellen (bestehende Prüfungs-IDs, Vorlagen und Kandidatenformate unverändert).
2. Prüfung öffnet ihren **dauerhaft erkennbaren Arbeitskontext**: Titel, Zuordnung, Status und fachlich erlaubte Aktionen sichtbar. Es gibt **keinen** Zwang, für „Korrigieren“, „Analyse“ oder „Druckbogen“ erneut in die Gesamtliste zurückzukehren.
3. Speichern der Prüfungsstruktur bleibt bei derselben Prüfung und bietet den nächsten möglichen Arbeitsschritt an; Fehler sind sichtbar. Unvollständige oder nicht gespeicherte Daten dürfen nicht still verworfen werden.
4. Korrektur öffnet die vorhandene Korrekturfunktion; Prüflingswechsel, aufgabenweiser Modus, Punkte/Notenschlüssel, Kommentare und Fördertipps bleiben fachlich korrekt. Übergang zur Rückmeldung erhält Prüfung und gegebenenfalls Prüfling.
5. Auswertung, Druckbogengestaltung und Export erhalten Rückwege zur **aktiven Prüfung** statt zur erneuten Auswahl. Alte URLs/Deep-Links einschließlich `?workflow=...` dürfen beim Übergang nicht unbeabsichtigt brechen.

### 5.5 Bewertung des Entwurfs statt pauschaler Klickvorgaben

| Szenario mit synthetischen Daten | Zu prüfende Folge | Kritische Gegenprobe |
|---|---|---|
| **S1** Heute → Anwesenheit der nächsten Stunde | Klasse und Termin korrekt vorgewählt, speichern, zurück zur Stunde | Ohne aktuelle Stunde ist eine freie Auswahl möglich. |
| **S2** Klasse → Sportnote für ein Kind erfassen | Klasse bleibt erhalten; Kategorie wählen, erfassen, speichern | Falsche Klasse/Kategorie erzeugt keine unbemerkte Änderung. |
| **S3** KBR-Prüfung erstellen → Korrektur beginnen | Speichern, gleiche Prüfung, Korrektur starten | Ungespeicherte Änderungen und fehlende Prüflinge werden klar behandelt. |
| **S4** Korrektur → Druckbogenvorschau → dieselbe Prüfung | Prüfungs-/Prüflingskontext und Rückweg nachvollziehbar | Export nur mit zulässigem Korrektur-/Abschlussstand. |
| **S5** Klasse → Schülerprofil → fachübergreifende Informationen | Wechsel ohne Startseitenumweg, eindeutige Identität | KBR-Kandidat wird nie aufgrund bloßer Namensgleichheit als Schüler verknüpft. |
| **S6** Schuljahr umstellen → lokales Backup | Sicherung, Vorschau und explizite Bestätigung verständlich | Keine Umgehung des Schutzvorgangs zur Verringerung von Klicks. |
| **S7** Timer/Tool aus aktiver Stunde, anschließend anderer Kontext | Tool schnell erreichbar, nur vorhandene Kontextparameter übernommen | Freier Start und Abbruch ohne Datenverlust bleiben möglich. |

**Messung zuerst als Baseline, dann erneut mit Pilot:** erfolgreiche Aufgaben, notwendige Aktionen, Rückwege, verlorene/erneut gewählte Kontexte, Fehler, subjektive Orientierung und First-Paint-/Content-Ready-Werte (vorhanden: [navigation-performance.ts](apps/teacher-ui/src/utils/navigation-performance.ts)). Keine erfundenen Millisekunden- oder Klickbudgets. Zusätzlich Tastatur-/Touch-/Screenreader-Prüfung, echter Desktop- und iPad-Safari-Test einschließlich Offline-HTML und Split View. Keine realen Schülerdaten; keine verpflichtende externe Telemetrie.

### 5.6 Reihenfolge der überprüfbaren UX-Arbeitspakete

1. **UX-03 – Aufgabenkarte und IA-Hypothese:** Ist-Quellen, Zielkontexte und S1–S7 dokumentieren; **kein Produktcode**. Diesen Abschnitt nach fachlichem Review anpassen.
2. **UX-04 – KBR-Prüfung als Pilot:** Aufgaben S3/S4 entlang vorhandener Exam-/Correction-Contracts neu gestalten; alte Deep-Links erhalten. Zunächst einen repräsentativen Flow, dann testen.
3. **UX-05 – Klasse/Stunde/Anwesenheit:** S1/S2/S5; Klasse und Stunde nur über bestehende Bridges weiterreichen, keine Direktzugriffe aus Views.
4. **UX-06 – Sportbewertung/Tools:** S2/S7; Eingabedichte, schnelle Bedienung und Live-Interaktion gesondert erproben. Fachlogik nicht neu erfinden.
5. **UX-07 – restliche Ansichten und Operations:** ähnliche Komponenten systematisch vereinheitlichen, Sicherheit/Backup/Jahreswechsel und Offline-Prozesse prüfen, doppelte Navigation entfernen.

**Abnahmeregel für jede spätere UI-Migration:** Aufgabe fachlich vollständig, reale Navigationswechsel nachweisbar, unmittelbares Feedback und Datenintegrität gesichert, Keyboard/Touch/Offline verifiziert oder explizit offen. Die erste Pilotlösung wird **nicht** ungeprüft auf alle Ansichten kopiert.
---

## 6) Vollständige Feature-Checkliste (Pflichtenheft)
> Diese Checkliste ist der **Single Source of Truth** für „nichts vergessen“. Jede Checkbox bekommt in der Umsetzung einen Issue/PR-Link.
>
> **Audit-Stand: 19.8.2026 (`main` @ `b373c89`).** `[x]` bedeutet: auf `main` als nutzbarer Workflow belegt. `[ ]` bedeutet: mindestens ein Plan-Aspekt fehlt oder ist nicht ausreichend verdrahtet; das zugehörige offene Issue steht direkt am Punkt.

### 6.1 Core: Security, Storage, Settings
- [ ] **Verschlüsselte lokale Speicherung** (Daten bleiben lokal). — #316
- [ ] **App-Sperre** (PIN/Passwort). — #316
- [ ] **Passwort ändern** (App-intern). — #316
- [ ] **PIN setzen/ändern**. — #316
- [ ] **Datenbank-Passwort** verwalten. — #316
- [x] **Backups verwalten** (Export/Import).
- [ ] **Einstellungen**: Shuttle-Run-Konfiguration importieren/verwenden, Sprache, Einrichtungshilfe. — #317

### 6.2 Sport — Kernverwaltung (Klassen/Schüler/Stunden/Fehlzeiten)
- [x] **Klasse anlegen**.
- [x] **Notenschema pro Klasse wählen**.
- [ ] **Stunden automatisch anlegen** (Ferien berücksichtigt). — #318
- [x] **Schnelle Navigation** in Unterfunktionen.
- [x] Schüler: **Stammdaten inkl. Geburtsjahr**.
- [ ] Schüler: **Foto/Bild hinterlegen**. — #318
- [x] Schüler: **Noten-/Leistungsentwicklung**.
- [x] Schüler: **Fehlzeiten/Anwesenheiten überwachen**.
- [ ] Schüler: **WOW-Übersicht pro Schüler**. — #322
- [x] Fehlzeiten: **digital dokumentieren** (verschiedene Formen).
- [x] Fehlzeiten: **Statuskatalog konfigurierbar** (eigene Statusoptionen hinzufügen, umbenennen, deaktivieren, sortieren).
- [ ] Fehlzeiten: **Status-Metadaten** (z. B. Kürzel/Farbe) wirken konsistent in Eingabe, Statistik und Export. — #318
- [x] Fehlzeiten: **prozentuale Anwesenheit**.
- [ ] Fehlzeiten: **Export**. — #318
- [x] Stunden: **Stundenübersicht** (Schuljahr/Ferien).
- [x] Stunden: **Anwesenheiten je Stunde** verwalten.
- [x] Stunden: **Stundenteile dokumentieren**.
- [x] Stunden: **Direktsprünge** zu Tools/Funktionen.
- [ ] Stunden: **Zufälligen Schüler auswählen**. — #318

### 6.3 Sport — Benotung & Bewertungssystem
- [x] **Notenschemata**: pro Klasse auswählbar.
- [ ] **Notenkategorien: Noten nach Kriterien**: — #319
  - [x] bis zu **8 Kriterien** definieren
  - [x] **Gewichtung** je Kriterium
  - [x] Bewertung per **Schieberegler**
  - [ ] **Selbsteinschätzung** (direkt oder via WOW) — #319
- [x] **Notenkategorien: Noten auf Zeit**:
  - [x] beste/schlechteste Note festlegen
  - [x] lineare Einordnung aller Zeiten
  - [x] Grenzwerte nachträglich anpassbar
- [x] **Notenkategorien: Cooper-Test**:
  - [x] Runden zählen
  - [x] Sofort-Auswertung bei hinterlegter Tabelle
- [x] **Verbalbeurteilungen** (eigener Funktionspunkt; Detail-Spezifikation TBD, aber Feature muss existieren). — #319
- [x] **Kriterienkataloge bereichsübergreifend**: eigene Kriterien in verschiedenen Bereichen definierbar (u. a. Anwesenheit/Verhalten/Mitarbeit), inkl. Wiederverwendung pro Klasse.

### 6.4 Sport — Tabellen & CSV (Import/Export)
- [x] Unterscheidung **„einfache Tabellen“ vs „Tabellen“**.
- [x] **Lokale Tabellen auswählen & anpassen**.
- [x] **Tabellen-Vorlagen herunterladen/anpassen/importieren** (CSV). — #320
- [x] **Geburtsjahr pro Schüler** (für automatisierte Auswertung erforderlich/empfohlen).
- [x] Workflow: Vorlage → Excel anpassen (Spaltenreihenfolge bleibt) → CSV speichern → importieren. — #320
- [x] Android-Import-Hinweis/Pfad-Hilfe (als UX-Hilfe in App). — #320
- [x] **Schüler-Import per CSV** inkl. Geschlecht & Geburtsjahr.

### 6.5 Sport — Test- & Mess-Workflows
- [x] **Shuttle-Run**:
  - [x] Start–Stop–Fertig; Stopp je Schüler beim Aufhören
  - [x] Auswertung automatisiert mit Tabelle (Vorlage/lokal)
  - [x] Audio-Signale aus App
  - [x] eigene Konfiguration via CSV **über Einstellungen** (nicht als Tabelle)
- [x] **Cooper-Test ohne Papier**: — #320
  - [x] Runden erfassen; automatische Auswertung/Noten bei Tabelle
  - [x] Sportart Laufen/Schwimmen festlegbar
  - [x] Tabelle downloaden/selbst erstellen, importieren — #320
- [x] **Mittelstrecke**:
  - [x] Timer läuft; individuelle Stopps pro Schüler im Ziel (Mehrfach-Stopp)
- [x] **Sportabzeichen**:
  - [x] eigene Notenkategorie
  - [x] Geburtsjahr relevant (altersabhängig)
  - [x] Tabelle hinterlegbar (Notenautomatik)
  - [x] Leistungen erfassen + direkte Bewertung anzeigen
  - [x] PDF-Export einer Übersicht
- [ ] **Bundesjugendspiele**: — #321
  - [ ] Leistungen erfassen und auswerten — #321
  - [ ] optionale Tabelle → automatische Einbindung als Note — #321

### 6.6 Sport — Live-Unterrichtstools
- [x] **Teams einteilen** (digital, schnell, fair).
- [x] **Turnierplanung** (planen & durchführen).
- [x] **Scoreboard** (Spielstände erfassen).
- [x] **Timer** (Zeiten stoppen). ✅ P4-4 COMPLETE
- [x] **Taktikboard**: Top-Down-Ansicht + Sportartspezifische Annotation/Markierungen.
- [x] **Würfeln**: Zahlenbereich wählen + Ergebnisse loggen.

### 6.6-Video Sport — Video Delay für Live-Bewegungsbeobachtung
Ref: GitHub Issue #182 [Sport] Video Delay mit Live-Feed, Delay-Puffer und Annotationen umsetzen

- [x] Eigener Tool-Einstieg für Video Delay. – `apps/teacher-ui/src/views/VideoDelay.vue`, Route `/tools/video-delay`
- [x] Einstiegskarte im Sport-Hub. – `apps/teacher-ui/src/views/SportHub.vue`
- [x] Live-Kamera-Feed via getUserMedia (Safari/iPad-kompatibel). – `VideoDelay.vue`
- [x] Side-by-Side Ansicht: Live-Feed + verzögertes Bild. – `VideoDelay.vue`
- [x] Konfigurierbarer Delay (0–10 Sekunden, Slider). – `VideoDelay.vue`
- [x] Frame-Puffer mit ImageBitmap (Safari 15+). – `VideoDelay.vue`
- [x] FPS-Auswahl (15/24/30 fps). – `VideoDelay.vue`
- [x] Auflösung-Auswahl (SD 640×360, HD 1280×720). – `VideoDelay.vue`
- [x] Annotations-Overlay auf verzögertem Bild (Canvas). – `VideoDelay.vue`
- [x] Annotations-Werkzeuge: Stift, Pfeil, Kreis, Linie. – `VideoDelay.vue`
- [x] Farb-Auswahl für Annotationen (5 Farben). – `VideoDelay.vue`
- [x] Touch-Support für Annotations (iPad). – `VideoDelay.vue`
- [x] Annotationen löschen. – `VideoDelay.vue`
- [x] Klare Abgrenzung zu Slow Motion (Live-orientiert statt Clip-basiert). – separate Route + separates View
- [x] i18n-Einträge (de/en) unter `DELAY`. – `apps/teacher-ui/src/i18n/locales/de.json`, `en.json`

### 6.6a Sport — Slow Motion Analyse & Biomechanik
Ref: GitHub Issue [Sport] Slow Motion Analyse mit manueller/semi-automatischer Biomechanik umsetzen (DickHorner/ViccoBoard#187-Epic)

#### Phase 1: Slow Motion Analyse
- [x] Eigener Tool-Einstieg für Slow-Motion-Analyse. – `apps/teacher-ui/src/views/SlowMotionAnalysis.vue`, Route `/tools/slow-motion`
- [x] Einstiegskarte im Sport-Hub. – `apps/teacher-ui/src/views/SportHub.vue`
- [x] Video kann über `<input type="file">` geladen werden (Safari/iPad-kompatibel, kein File System Access API). – `SlowMotionAnalysis.vue`
- [x] Verlangsamte Wiedergabe (0.1×, 0.25×, 0.5×, 1×). – `SlowMotionAnalysis.vue`
- [x] Frame-by-Frame-Navigation (1-Frame-Schritte). – `SlowMotionAnalysis.vue`
- [x] Scrubber + Einzelbildnavigation. – `SlowMotionAnalysis.vue`
- [x] Lokal gespeicherte Analysesitzungen (ToolSession, toolType = 'slow-motion'). – `modules/sport/src/use-cases/save-slow-motion-session.use-case.ts`
- [x] Klare Abgrenzung zu Video Delay (eigener Einstieg, Clip-orientiert statt Live-Feed). – separate Route + separates View
- [x] Domain-Datentypen `BodyPoint`, `BiomechanicsMarker`, `BiomechanicsKeyframe`, `SlowMotionSessionMetadata`. – `packages/core/src/interfaces/sport.types.ts`

#### Phase 2: Biomechanik (manuell/semi-automatisch)
- [x] Manuelle Marker für Körperpunkte (Schulter, Hüfte, Knie, Sprunggelenk, Ellenbogen, …). – `SlowMotionAnalysis.vue`
- [x] Canvas-Overlay: Marker per Klick/Touch auf Video-Frame setzen. – `SlowMotionAnalysis.vue`
- [x] Winkelberechnung zwischen Markerketten (Arm L/R, Bein L/R, Rumpf L/R). – `SlowMotionAnalysis.vue` (calculatedAngles)
- [x] Hilfslinien (Referenzlinien) zeichnen und löschen. – `SlowMotionAnalysis.vue`
- [x] Keyframes statt Marker in jedem einzelnen Frame. – `SlowMotionAnalysis.vue`
- [x] Lineare Interpolation zwischen Keyframes zur semi-automatischen Nachführung. – `SlowMotionAnalysis.vue` (currentFrameMarkers computed)
- [x] Speicherung der Analyse pro Sitzung (Name, Schüler, Übung, Datum, Keyframes, Notizen). – `save-slow-motion-session.use-case.ts`
- [x] i18n-Einträge (de/en). – `apps/teacher-ui/src/i18n/locales/de.json`, `en.json`

### 6.7 Sport — Feedback & Statistiken
- [x] **Feedback**: mehrere Methoden, direkt am Lehrertablet.
- [x] **Statistiken**: Überblick über geleistete Arbeit/Nutzung.

### 6.8 Sport — WOW
- [ ] Workouts erstellen & bereitstellen. — #322
- [ ] Schüler tragen Ergebnisse **über Browser** ein (ohne Registrierung/ohne App). — #322
- [ ] Lehrkraft ruft Ergebnisse/Fortschritt ab. — #322
- [ ] WOW-Übersichten in App (auch pro Schüler). — #322

### 6.8a Sport — Spieldatenbank (lokale Übungs- und Spielesuche)
- [x] Datenmodell `GameEntry` (Kategorie, Schwierigkeit, Phase, Dauer, Altersgruppe, Material, Ziel, Beschreibung, Variation, Hinweise). – `packages/core/src/interfaces/sport.types.ts`
- [x] Lokaler Seed-Datenbestand (30 Spiele/Übungen). – `apps/teacher-ui/src/data/game-seed-data.ts`
- [x] `GameEntryRepository` zur IndexedDB-Persistenz. – `modules/sport/src/repositories/game-entry.repository.ts`
- [x] IndexedDB-Migration (Version 19). – `packages/storage/src/migrations/indexeddb/019_game_database_schema.ts`
- [x] Ansicht `GameDatabaseView.vue` mit Suchfeld, Kategorie-Filter-Chips, Phase-/Schwierigkeits-/Sortier-Filter, Kartenansicht und aufklappbarer Detailansicht. – `apps/teacher-ui/src/views/GameDatabaseView.vue`
- [x] Route `/subjects/sport/games`. – `apps/teacher-ui/src/router/index.ts`
- [x] Einstiegskarte im Sport-Hub. – `apps/teacher-ui/src/views/SportHub.vue`
- [x] i18n-Einträge (de/en). – `apps/teacher-ui/src/i18n/locales/de.json`, `en.json`
- [x] Offline-first (IndexedDB, kein Backend nötig).
- Ref: GitHub Issue [Sport] Spieldatenbank als lokale Übungs- und Spielesuche umsetzen

### 6.8b Sport — Zielkamera & Langstreckenlauf-Zeitnahme
- [x] `SaveFinishCameraSessionUseCase` zur Persistenz von Zielkamera-Sitzungen. – `modules/sport/src/use-cases/save-finish-camera-session.use-case.ts`
- [x] Export aus `modules/sport`. – `modules/sport/src/index.ts`
- [x] Eintrag im Sport-Bridge. – `apps/teacher-ui/src/composables/useSportBridge.ts`
- [x] Ansicht `FinishCamera.vue` mit Kamera-Feed, virtueller Ziellinie (Klick/Touch), Stoppuhr, Bewegungserkennung, Ereignisliste, Schülerzuordnung und Export. – `apps/teacher-ui/src/views/FinishCamera.vue`
- [x] Route `/tools/finish-camera`. – `apps/teacher-ui/src/router/index.ts`
- [x] Einstiegskarte im Sport-Hub. – `apps/teacher-ui/src/views/SportHub.vue`
- [x] i18n-Einträge (de/en) unter `FINISH_CAMERA`. – `apps/teacher-ui/src/i18n/locales/de.json`, `en.json`
- [x] Übergabe an Mittelstrecke-Bewertung via Router-Query (`finishCameraSessionId`).
- [x] Lokal + iPad-/Safari-kompatibel (Canvas, MediaDevices, kein File System Access API).
- Ref: GitHub Issue #184 [Sport] Zielkamera fuer Langstreckenlauf mit Zeitmarken und assistierter Zuordnung umsetzen

### 6.9 KBR — Prüfungen anlegen (Strukturen)
- [ ] Prüfungen mit Unteraufgaben und komplexen Bausteinen (Darstellungsleistung, Schreibaufgabe, Kriterien, Unterkriterien, Wahlaufgaben, Kommentare, Prüfungsteile, Bonuspunkte). — #323 #335
- [x] **Einfacher vs. komplexer Aufgabenmodus**:
  - [x] Einfach (Standard)
  - [ ] Komplex: unbegrenzte Aufgabenanzahl auf **drei Ebenen**, Aufgabennoten, Kommentare & Tipps auch für Unteraufgaben. — #323 #335
- [x] Pro Aufgabe: Anzahl Unteraufgaben definierbar.
- [ ] Kriterien pro Aufgabe/Unteraufgabe definieren und **formatieren** (z. B. Fett). — #323
- [ ] Pro Aufgabe festlegen, ob Aufgabenkommentare oder Fördertipps vergeben werden sollen. — #323
- [ ] **Prüfungsteile** definieren; Teilpunkte/Teilnoten automatisch; optional mitdruckbar. — #335

### 6.10 KBR — Benotung/Notenschlüssel
- [x] Verschiedene Notenschlüssel schnell einsetzbar; flexible Benotungsoptionen.
- [x] Nach der Korrektur Notenschlüssel/Optionen ohne Datenverlust anpassbar. — #324
- [x] Notengrenzen per Prozentwerten anpassbar, auch nachträglich; zurücksetzbar. — #324
- [x] Punktegrenzen automatisch aus Prozentangaben berechnen.
- [x] Noten-Presets auswählen + prüfungsindividuell anpassen.
- [x] Finetuning (z. B. Rundungslogik).
- [x] Optional: „Fehlerpunkte → Aufgabennote“. — #324

### 6.11 KBR — Korrigieren (Flows & Modi)
- [x] Kompakte Korrekturmaske: Auto-Gesamtpunkte/Note, minimierte Verrechnungsfehler.
- [x] Anzeige: Punkte bis zur nächsten Notenstufe.
- [x] Tab-Navigation in Punktefelder.
- [ ] Aufgabenweise korrigieren (Tabellenmodus + AWK). — #20
- [x] Aufgabenkommentare erfassen; mitdruckbar; nach Abgabe verfügbar.
- [ ] Teilpunkte/Teilnoten je Prüfungsteil automatisch; optional druckbar. — #335
- [ ] Wahlaufgaben abbilden (z. B. 3a/3b). — #335
- [ ] Kommentarboxen pro Aufgabenebene zuschaltbar. — #20 #323
- [x] Alternative Bepunktungsart **(++,+,0,-,–)**.
- [ ] Im komplexen Modus: drei Aufgabenebenen in UI/Logik. — #335
- [x] Schnelles Wechseln zwischen Prüflingen.

### 6.12 KBR — Fördertipps (DB, Zuweisung, QR, Auswertung)
- [ ] Fördertipps aufgabenbezogen oder allgemein; persönliche Datenbank. — #325
- [ ] Nach Korrektur: Überblick wem/wann/wo Tipps; Auswertung Handlungs-/Übungsbedarf (Klasse/Individuum). — #325
- [ ] Pro Fördermöglichkeit: Titel, Kurzbeschreibung, optionale Kategorien. — #325
- [ ] Übungshinweise/Links hinterlegen; bis zu **3 Links**. — #325
- [ ] QR-Codes per Knopfdruck erzeugen. — #325
- [ ] In Korrekturmaske: suchen/auswählen/hinzufügen (auch unteraufgabenbezogen). — #325
- [ ] Fördertipps gewichten/priorisieren; Gewichtung erscheint auf Rückmeldebogen. — #325
- [ ] Dropdown-Vorschau: Name, Beschreibungsvorschau, Anzahl vergebener Tipps, Kategorie; häufige Tipps oben. — #325
- [ ] Fördertipps pro Aufgabenebene nutzbar oder für Ebenen/Aufgaben deaktivierbar. — #325

### 6.13 KBR — Auswertung & nachträgliche Anpassung
- [x] Schwierigkeit: welche Aufgaben/Unteraufgaben/Kriterien schwierig; Streuungen; Bewertungskorridore.
- [ ] Punkteänderungsassistent: Aufgabengewichtungen anpassen, Punkteverhältnisse erhalten. — #326
- [x] Notenschlüssel nachträglich anpassen; Noten ändern automatisch. — #324
- [ ] Ergebnis-/Auswertungstabellen sortierbar: Korrekturreihenfolge, Name, Punkte, Aufgabenpunkte; Sortierung nach (Unter-)Aufgabe. — #326

### 6.14 KBR — Langzeit-Überblick & Notizen
- [ ] Schuljahres-Überblick zur Entwicklung von Kompetenzbereichen. — #327
- [ ] Interne Notizen für Entwicklungen/Förderschwerpunkte. — #327
- [ ] Pro Prüfling Überblick: Aufgaben-/Endkommentare & Fördertipps. — #327

### 6.15 KBR — Rückmeldung/Kommentare
- [x] Aufgabenbezogene oder allgemeine Kommentare als individuelle Rückmeldung.
- [x] Kommentare bleiben nach Rückgabe verfügbar.
- [ ] Kommentare anderer SuS derselben Prüfung einsehen und wiederverwenden. — #20

### 6.16 KBR — Export & Druck (PDF)
- [ ] PDF-Rückmeldebögen inkl. Teilpunkte, Kommentare, Fördertipps, Unterschrift, Schullogo. — #328
- [ ] Mit einem Klick alle PDFs erzeugen. — #296
- [ ] Drucklayouts: **vier** Layouts. — #328
- [x] Headerbereich über Druckpresets anpassbar; Druck aktueller Prüfling oder alle.
- [ ] Kriterien formatiert drucken; pro Aufgabe Prozent anzeigen; Kommentare/Fördertipps kursiv. — #328
- [ ] Punktabzüge anzeigen oder deaktivieren. — #328
- [ ] Unterschrift: Bilddatei, per Hand malen, oder leer. — #328

### 6.17 KBR — Besondere Schülerleistungen markieren
- [ ] Während Korrektur markieren; Bild und/oder Wortlaut dokumentieren. — #329
- [ ] Übersicht nach Aufgabe & Kategorie. — #329
- [ ] Namen ausblendbar (Anonymisierung). — #329

### 6.18 KBR — E-Mail-Versand
- [ ] Ergebnisse per E-Mail an Schüler und/oder Eltern. — #330
- [ ] E-Mail enthält Noten- und Aufgabenergebnisse; Platzhalter automatisch korrekt befüllen. — #330

### 6.19 KBR — Gruppenweise korrigieren & Splitscreen
- [ ] Gruppenkorrektur im Splitscreenmodus (Referate/mündlich). — #331
- [ ] Vollbildmodus; bis zu vier Prüflinge gleichzeitig. — #331
- [ ] Thema für Referate/mündliche Prüfungen festlegen. — #331

### 6.20 KBR — Zusammenarbeit/Kompatibilität
- [ ] Lerngruppen aus WebUntis importieren. — #332
- [ ] Prüfungsnoten in Notenapps kopieren; Notenspiegel kopieren. — #332
- [ ] Fördermöglichkeiten oder Prüfungsentwürfe mit anderen Nutzern teilen. — #332
- [ ] Notenspalte kopieren (Excel/Notenprogramme). — #332

### 6.21 KBR — Unterstützte Bewertungsformate
- [ ] Abdeckung der genannten Formate: Mappen, Portfolios, Referate, Tests, Facharbeiten, mündliche Prüfungen etc. — #333

### 6.22 KBR — Oberstufenklausuren & Erwartungshorizont-Workflow
- [ ] Aufgabenaspekte/Unterkriterien feiner beschreibbar. — #334
- [ ] Kriterien/Aufgabenaspekte formatierbar. — #323 #334
- [ ] Copy & Paste aus Word: Formatierungen bleiben erhalten (best effort). — #334
- [ ] Alternative Blanko-EWH-Workflow (exportierbar/unterstützt). — #334
- [ ] 0–15 Punkte, Wahlaufgaben mit Teilkriterien, Bonuscharakter, Prüfung in Teile, Zwischennoten je Teil (optional ausblendbar). — #334

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

### Schritt 3 — Sport Core (Klassen/Schüler/Stunden/Fehlzeiten)
- UI + Domain-Model + Export.
- Konfigurierbare Statuskataloge für Anwesenheit (add/rename/disable/reorder) als Pflichtbestandteil.

### Schritt 4 — Sport Tools + Assessments + Tabellen
- Assessment Engine (Kriterien/Zeit/Cooper) + Tabellen-Auswertung.
- Konfigurierbare Kriterienkataloge bereichsübergreifend (wiederverwendbar pro Klasse/Kontext).
- Shuttle-Run/Cooper/Mittelstrecke/Sportabzeichen/BJS.
- Tools: Teams, Turnier, Scoreboard, Timer, Taktikboard, Würfeln.

### Schritt 5 — KBR Core (Exam Builder + Correction)
- Exam-Model (einfach/komplex) + UI.
- Correction UI (kompakt + AWK/Tabellenmodus).
- Notenschlüssel-Engine (Prozentgrenzen, Presets, Rundung, nachträglich).

### Schritt 6 — KBR Extras (Fördertipps, Auswertung, Export, Versand)
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
1. **Verbalbeurteilungen**: Felder/Skalen/Exportformat (Sport nennt es als Funktionspunkt, Details fehlen).
2. **Turnierplanung/Scoreboard**: genaue Turnierformate, Regeln, Spielplan-Algorithmen (Sport nennt den Funktionspunkt, Details sind knapp).
3. **WebUntis-Import**: gewünschter Importweg (CSV-Export vs API) und Feld-Mapping.
4. **E-Mail-Versand**: Welche Platzhalter genau? (KBR sagt „Platzhalter automatisch korrekt befüllt“, ohne Liste).
5. **[CRITICAL] Storage Architecture Migration (Phase 4)**: teacher-ui currently uses custom Dexie (IndexedDB) instance directly, violating modular boundaries. Must be refactored to:
   - Use `@viccoboard/storage` package's `IndexedDBStorage` instead of custom Dexie
   - Access domain repositories through proper bridges (see `modules/sport/src/repositories/` and `modules/students/src/repositories/`)
   - Remove all inline repository logic from `apps/teacher-ui/src/composables/useDatabase.ts`
   - Ensure UI has NO direct DB access; all data flows through module boundaries
   - Migration strategy for existing Dexie data → IndexedDBStorage schema
   - See: `agents.md` Rule 11 (centralized student management), Rule 2 (modularität)
