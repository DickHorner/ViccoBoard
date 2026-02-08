# agents.md — Agent-Setup für Codex/GitHub Copilot

Ziel: Codex/GitHub Copilot soll dieses Repo so bearbeiten können, dass **alle Funktionen und Optionen** aus SportZens und KURT umgesetzt werden, ohne „Feature-Schwund“.

**Pflichtlektüre für jeden Agenten, vor jeder Änderung:** `Plan.md` (insb. Abschnitt 6 „Vollständige Feature-Checkliste“) **und** `docs/agents/SPORTZENS_PARITY_v2.md` (verbindliche Parity-Ausführungsanweisung).

---

## 1) Globale Arbeitsregeln (Guardrails)
1. **Keine Features streichen, keine Optionen „vereinfachen“.** Wenn Spezifikation fehlt: in `Plan.md` Abschnitt 9 aufnehmen (TBD), aber nie still weglassen.
2. **Modularität erzwingen:** Änderungen müssen in ein passendes Modul/Plugin; Core nur erweitern, wenn ein neues Interface/Policy nötig ist.
3. **Ohne Installation / komplett lokal (Default) ist ein Hard-Constraint:** Im Betrieb dürfen keine Server-Prozesse nötig sein (kein Node-Server, kein Docker, kein Electron). Output muss als statische Assets deploybar sein. **Zielplattform ist iPadOS Safari (WebKit):** keine File System Access API; Export/Import via Download + Datei-Auswahl; Touch/Split-View berücksichtigen.
4. **Local-first respektieren:** Offline ist Default. WOW muss ohne Backend via QR/Link+QR-Rückgabe funktionieren. E-Mail nur lokal (`mailto:`/Export), keine SMTP-Pflicht.
5. **Integrationen sind optional:** iServ/Notion/Sync nur hinter Feature-Flags und standardmäßig aus.
6. **Traceability:** Jede PR referenziert mindestens eine Checkbox-ID aus `Plan.md` Abschnitt 6.
7. **Tests sind Teil der Feature-Definition:** Neue Logik ohne Unit-/Integrationstest gilt als „nicht fertig“.
8. **Keine erfundenen Datenformate:** Import/Export-Formate nur aus Spezifikation ableiten; sonst `TBD` + Validator/Fehlermeldung für fehlende Felder.
9. **Privacy by default:** Keine Telemetrie/Tracki
10. **Safari-Kompatibilität ist Pflicht:** Keine Nutzung von nicht unterstützten APIs (z. B. `showOpenFilePicker`/`showSaveFilePicker`, File System Access API). Wenn eine neue Browser-API eingesetzt wird, muss die iPadOS-Unterstützung dokumentiert sein.
ng ohne expliziten Plan-Abschnitt + Opt-in.
11. **Zentralisierte Schülerverwaltung:** `Student`/`StudentRepository` liegen in `packages/core` bzw. `modules/students`. Keine parallelen Student-Stores/Repos in Apps oder `packages/storage`. UI greift nur über das Students-Modul/Bridge zu.
12. **`SPORTZENS_PARITY_v2.md` ist verbindlich:** Bei allen Parity-/Umsetzungsarbeiten ist `docs/agents/SPORTZENS_PARITY_v2.md` als Pflicht-Instruktionsdatei zu lesen und einzuhalten (inkl. Gates, Scope und Ledger-Disziplin).

---


## 2) Empfohlene Repo-Struktur (stack-agnostisch)
- `packages/core/` — Domain-Modelle, Use-Cases, Interfaces, Migrationen, Crypto-Abstraktionen
- `packages/plugins/` — Plugin-Registry + Contracts (`AssessmentType`, `ToolPlugin`, `Exporter`, `Integration`)
- `modules/students/` — Zentrale Schülerverwaltung (Quelle der Wahrheit)
- `modules/sport/` — SportZens-Domäne (Klassen/Stunden/Tools/WOW)
- `modules/exams/` — KURT-Domäne (Prüfungen/Korrektur/Fördertipps)
- `modules/export/` — PDF/CSV/Share-Packages/E-Mail
- `modules/integrations/` — WebUntis, Clipboard-Exports, Sharing
- `apps/teacher/` — UI-Shell
- `apps/wow-web/` — WOW-Schüler-Web-UI + minimaler Service

---

## 3) Rollen (Multi-Agent-Aufteilung)
> Jeder Agent arbeitet nur in seinem Verantwortungsbereich und eröffnet PRs klein (1–3 Checkboxen).

### Agent A — Product/Requirements „Spec Keeper“
**Mission:** Verhindert Feature-Lücken.
- Hält `Plan.md` Abschnitt 6 als Wahrheit.
- Jedes neue Subfeature bekommt (falls nötig) eine neue Checkbox (ohne bestehendes zu löschen).
- Pflege von `Plan.md` Abschnitt 9 (TBDs) für unklare Punkte.

**Definition of Done:**
- Für jede umgesetzte Checkbox: Link auf PR + kurze Akzeptanzkriterien in PR-Beschreibung.

### Agent B — Architektur/Interfaces „Boundary Cop“
**Mission:** Modularität/Erweiterbarkeit erzwingen.
- Definiert Contracts: `AssessmentType`, `ToolPlugin`, `Exporter`, `Integration`.
- Zieht harte Grenzen zwischen `core`, `sport`, `exams`.
- Entscheidet: „Was ist Plugin vs. Core?“

**Do:** Neue Funktionalität zuerst als Interface entwerfen, dann implementieren.

**Don’t:** Keine Business-Logik in UI oder DB-Layer.

### Agent C — Security & Storage
**Mission:** Local-first + Sicherheit.
- Verschlüsselte lokale Speicherung + App-Sperre (PIN/Passwort).
- Passwort ändern, PIN setzen/ändern, Datenbank-Passwort, Backup/Restore.
- Attachment-Speicher (Fotos/Signaturen) und sichere Löschpfade.

**Definition of Done:**
- Daten sind im Dateisystem nicht im Klartext lesbar.
- Backup → Restore reproduziert Datenbestand.

### Agent D — SportZens Domäne
**Mission:** Alle SportZens-Features umsetzen (Orga, Bewertung, Tests, Tools, Feedback, Statistiken, WOW).
- Klassen/Schüler/Stunden/Fehlzeiten/Export.
- Notenkategorien (Kriterien/Zeit/Cooper) + Verbalbeurteilungen.
- Tabellen/CSV + Schüler-Import.
- Shuttle-Run inkl. Config-Import via Einstellungen.
- Mittelstrecke, Sportabzeichen (inkl. PDF-Übersicht), Bundesjugendspiele.
- Tools: Teams/Turnier/Scoreboard/Timer/Taktikboard/Würfeln (Logging).
- Feedback (mehrere Methoden) & Statistiken.
- WOW (Workouts, Browser-Eingabe, Fortschritt abrufen, pro Schüler).

**Don’t:** Keine WOW-Online-Abhängigkeit für Kernfunktionen.

### Agent E — KURT Domäne (Exams)
**Mission:** Alle KURT-Kernfeatures (Prüfungsstruktur, Notenschlüssel, Korrekturmodi).
- Prüfung anlegen: einfach/komplex, 3 Ebenen, Wahlaufgaben, Bonuspunkte, Prüfungsteile, Kriterienformatierung.
- Notenschlüssel: Prozentgrenzen, Presets, Rundung, nachträglich, Fehlerpunkte → Aufgabennote.
- Korrektur: kompakte Maske, Tab-Navigation, AWK/Tabellenmodus, Kommentare, Teilnoten, Alternative Bepunktung.

### Agent F — KURT Fördertipps & Diagnostik
**Mission:** Fördertipps-DB + Auswertung + Langzeit.
- Fördertipps-DB inkl. bis zu 3 Links, QR, Gewichtung, Suche, Dropdown-Infos.
- Auswertung/Anpassung (Schwierigkeit, Punkteänderungsassistent, Sortierungen).
- Langzeit-Überblick & Notizen.
- Kommentar-Reuse.
- Besondere Leistungen markieren + Anonymisierung.

### Agent G — Export/Print/E-Mail
**Mission:** Alles, was „rausgeht“.
- PDF-Rückmeldebögen: 4 Layouts, Presets, Logo, Signatur (Bild/zeichnen/leer), Punktabzüge Toggle.
- Batch-Export aller PDFs.
- E-Mail-Versand inkl. Platzhalter-Füllung.
- Sportabzeichen-PDF-Übersicht.

### Agent H — Integrationen & Sharing
**Mission:** Austausch mit Außenwelt ohne Datenverlust.
- WebUntis-Import.
- Notenapp-Clipboard (Noten kopieren, Notenspiegel).
- Teilen von Fördermöglichkeiten/Prüfungsentwürfen zwischen Nutzern.
- „Notenspalte kopieren“ Export.

### Agent I — QA/Regression „Paranoia mit Stil“
**Mission:** Verhindert, dass Refactors heimlich Features töten.
- Baut eine Test-Matrix aus den Checkboxen.
- Fügt Golden-Tests für PDF/CSV hinzu.
- Fügt UI-Flow-Tests für die wichtigsten Workflows hinzu (Sportstunde, Shuttle-Run, Korrektur, PDF, Mail, WOW).

---

## 4) PR-Protokoll (damit Copilot nicht im Chaos badet)
**PR-Titel:** `[Modul] Kurzbeschreibung (Checkbox-IDs)`

**PR-Beschreibung (Template):**
- Betroffene Checkboxen: `Plan.md §6.x …`
- Was wurde umgesetzt:
- Was ist bewusst nicht umgesetzt (nur erlaubt, wenn in `Plan.md §9 TBD` dokumentiert):
- Testabdeckung (Unit/Integration):
- Migrationen / Breaking Changes:
- **Manuelle Checks (Pflicht):**
  - **Offline-Check:** App öffnen → Netzwerk im Browser deaktivieren → Kernflow durchklicken (keine Hard-Fails).
  - **Cold-Start:** „Site Data“ löschen → Reload → Migration/Init ohne Fehler.
  - **Export/Import:** mind. 1 Export erzeugen und wieder importieren (nur für PRs, die Persistenz berühren).
  - **iPadOS Safari Pflicht-Check:** Auf iPad (oder Simulator) anlegen → Reload → offline testen → Export erzeugen → Import zurückspielen (mind. für PRs, die UI/Storage/Export berühren).
  - **Split View:** ½ Bildschirm prüfen (Sidebar/Tabellen/Formulare bleiben bedienbar).

**Commit-Stil:** klein, logisch getrennt (keine 2.000-Zeilen-Wundertüte).

### 4.1) AI Agent Review-Richtlinien

Für AI Agents, die Pull Request Reviews durchführen:

**Vollständige Richtlinien:** [`.github/AI_PR_REVIEW_GUIDELINES.md`](.github/AI_PR_REVIEW_GUIDELINES.md)  
**Kurzreferenz:** [`.github/AI_CODE_REVIEW_QUICK_REFERENCE.md`](.github/AI_CODE_REVIEW_QUICK_REFERENCE.md)  
**PR-Template:** [`.github/PULL_REQUEST_TEMPLATE.md`](.github/PULL_REQUEST_TEMPLATE.md)

**Kernprinzipien:**
- ✅ **IMMER** Inline-Kommentare mit GitHub Suggestion-Syntax verwenden
- ✅ Konstruktives Feedback mit Begründung (WHY, nicht nur WHAT)
- ✅ Prüfe Safari/Offline/Modularität-Constraints
- ✅ Keine Features aus `Plan.md` entfernt
- ✅ Severity-Marker: 🚨 Kritisch, ⚠️ Wichtig, 💡 Vorschlag

---


## 5) Prompt-Vorlagen (Copy/Paste) für Codex/Copilot

### 5.1 Architektur-Agent (B)
- Lies `Plan.md` §2–4 und entwerfe die Plugin-Interfaces.
- Implementiere nur Contracts + minimalen Registry-Wiring.
- Keine UI, keine DB-Implementierung.
- Liefere: Interface-Dateien + kurze Doku + Beispiel-Plugin.

### 5.2 Sport-Agent (D)
- Lies `Plan.md` §6.2–6.8.
- Implementiere genau die Checkboxen `{...}`.
- Halte alle Berechnungen (Noten, Tabellen) in Domain-Use-Cases.
- Liefere: UI-Screens + Domain-Tests + 1 Demo-Datensatz.

### 5.3 KURT-Core-Agent (E)
- Lies `Plan.md` §6.9–6.11.
- Implementiere den Exam-Builder (einfach/komplex) + Korrekturmodi.
- Liefere: Import/Export neutral (noch keine PDF), aber stabile Datenmodelle + Tests.

### 5.4 Export-Agent (G)
- Lies `Plan.md` §6.16–6.18 (+ Sportabzeichen PDF).
- Implementiere PDF-Renderer mit 4 Layouts und Presets.
- Implementiere E-Mail-Templates mit Platzhaltern; fehlende Platzhalter-Liste als `TBD` melden, aber Renderer so bauen, dass unbekannte Platzhalter sauber fehlschlagen.

### 5.5 QA-Agent (I)
- Lies `Plan.md` §6 komplett.
- Baue eine Testliste, die jede Checkbox abdeckt.
- Schreibe Regression-Tests gegen die wichtigsten Berechnungen (Notenschlüssel, lineare Zeitnote, Tabellen-Auswertung, Punkteänderungsassistent).

---

## 6) Erweiterbarkeit „ohne Bauchweh“
- Neue Sportarten/Tests = neues `AssessmentType` + optional neue `TableDefinition`.
- Neue Exportformate = neuer `Exporter`.
- Neue Live-Tools = neuer `ToolPlugin`.
- Neue Integrationen = neuer `Integration` mit klarer Permission/Online-Policy.
