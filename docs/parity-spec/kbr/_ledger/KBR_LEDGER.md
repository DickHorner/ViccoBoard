# KURT Feature Ledger (from Plan.md)

**Version:** 1.0.0  
**Date:** 2026-02-07  
**Source:** Plan.md §6.9–§6.22 (and beyond)

---

## 1. Executive Summary

This ledger tracks all KURT (Klassenarbeiten Unterricht Rückmeldung Tests) features from Plan.md to ensure complete implementation.

**Status:** Initial baseline established  
**KURT Scope:** All exam/correction/feedback/export features

---

## 2. Feature Checklist Extraction

### §6.9 KURT — Prüfungen anlegen (Strukturen)

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.9.1 | Prüfungen mit Unteraufgaben und komplexen Bausteinen (Darstellungsleistung, Schreibaufgabe, Kriterien, Unterkriterien, Wahlaufgaben, Kommentare, Prüfungsteile, Bonuspunkte) | P0 | ⏳ TODO |
| 6.9.2 | Einfacher vs. komplexer Aufgabenmodus: Einfach (Standard) | P0 | ⏳ TODO |
| 6.9.3 | Komplex: unbegrenzte Aufgabenanzahl auf drei Ebenen, Aufgabennoten, Kommentare & Tipps auch für Unteraufgaben | P1 | ⏳ TODO |
| 6.9.4 | Pro Aufgabe: Anzahl Unteraufgaben definierbar | P0 | ⏳ TODO |
| 6.9.5 | Kriterien pro Aufgabe/Unteraufgabe definieren und formatieren (z. B. Fett) | P1 | ⏳ TODO |
| 6.9.6 | Pro Aufgabe festlegen, ob Aufgabenkommentare oder Fördertipps vergeben werden sollen | P1 | ⏳ TODO |
| 6.9.7 | Prüfungsteile definieren; Teilpunkte/Teilnoten automatisch; optional mitdruckbar | P1 | ⏳ TODO |

### §6.10 KURT — Benotung/Notenschlüssel

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.10.1 | Verschiedene Notenschlüssel schnell einsetzbar; flexible Benotungsoptionen | P0 | ⏳ TODO |
| 6.10.2 | Nach der Korrektur Notenschlüssel/Optionen ohne Datenverlust anpassbar | P0 | ⏳ TODO |
| 6.10.3 | Notengrenzen per Prozentwerten anpassbar, auch nachträglich; zurücksetzbar | P0 | ⏳ TODO |
| 6.10.4 | Punktegrenzen automatisch aus Prozentangaben berechnen | P0 | ⏳ TODO |
| 6.10.5 | Noten-Presets auswählen + prüfungsindividuell anpassen | P1 | ⏳ TODO |
| 6.10.6 | Finetuning (z. B. Rundungslogik) | P1 | ⏳ TODO |
| 6.10.7 | Optional: Fehlerpunkte → Aufgabennote | P2 | ⏳ TODO |

### §6.11 KURT — Korrigieren (Flows & Modi)

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.11.1 | Kompakte Korrekturmaske: Auto-Gesamtpunkte/Note, minimierte Verrechnungsfehler | P0 | ⏳ TODO |
| 6.11.2 | Anzeige: Punkte bis zur nächsten Notenstufe | P1 | ⏳ TODO |
| 6.11.3 | Tab-Navigation in Punktefelder | P1 | ⏳ TODO |
| 6.11.4 | Aufgabenweise korrigieren (Tabellenmodus + AWK) | P0 | ⏳ TODO |
| 6.11.5 | Aufgabenkommentare erfassen; mitdruckbar; nach Abgabe verfügbar | P0 | ⏳ TODO |
| 6.11.6 | Teilpunkte/Teilnoten je Prüfungsteil automatisch; optional druckbar | P1 | ⏳ TODO |
| 6.11.7 | Wahlaufgaben abbilden (z. B. 3a/3b) | P1 | ⏳ TODO |
| 6.11.8 | Kommentarboxen pro Aufgabenebene zuschaltbar | P1 | ⏳ TODO |
| 6.11.9 | Alternative Bepunktungsart (++,+,0,-,–) | P2 | ⏳ TODO |
| 6.11.10 | Im komplexen Modus: drei Aufgabenebenen in UI/Logik | P1 | ⏳ TODO |
| 6.11.11 | Schnelles Wechseln zwischen Prüflingen | P1 | ⏳ TODO |

### §6.12 KURT — Fördertipps (DB, Zuweisung, QR, Auswertung)

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.12.1 | Fördertipps aufgabenbezogen oder allgemein; persönliche Datenbank | P0 | ⏳ TODO |
| 6.12.2 | Nach Korrektur: Überblick wem/wann/wo Tipps; Auswertung Handlungs-/Übungsbedarf (Klasse/Individuum) | P1 | ⏳ TODO |
| 6.12.3 | Pro Fördermöglichkeit: Titel, Kurzbeschreibung, optionale Kategorien | P0 | ⏳ TODO |
| 6.12.4 | Übungshinweise/Links hinterlegen; bis zu 3 Links | P0 | ⏳ TODO |
| 6.12.5 | QR-Codes per Knopfdruck erzeugen | P1 | ⏳ TODO |
| 6.12.6 | In Korrekturmaske: suchen/auswählen/hinzufügen (auch unteraufgabenbezogen) | P0 | ⏳ TODO |
| 6.12.7 | Fördertipps gewichten/priorisieren; Gewichtung erscheint auf Rückmeldebogen | P1 | ⏳ TODO |
| 6.12.8 | Dropdown-Vorschau: Name, Beschreibungsvorschau, Anzahl vergebener Tipps, Kategorie; häufige Tipps oben | P1 | ⏳ TODO |
| 6.12.9 | Fördertipps pro Aufgabenebene nutzbar oder für Ebenen/Aufgaben deaktivierbar | P1 | ⏳ TODO |

### §6.13 KURT — Auswertung & nachträgliche Anpassung

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.13.1 | Schwierigkeit: welche Aufgaben/Unteraufgaben/Kriterien schwierig; Streuungen; Bewertungskorridore | P1 | ⏳ TODO |
| 6.13.2 | Punkteänderungsassistent: Aufgabengewichtungen anpassen, Punkteverhältnisse erhalten | P1 | ⏳ TODO |
| 6.13.3 | Notenschlüssel nachträglich anpassen; Noten ändern automatisch | P0 | ⏳ TODO |
| 6.13.4 | Ergebnis-/Auswertungstabellen sortierbar: Korrekturreihenfolge, Name, Punkte, Aufgabenpunkte; Sortierung nach (Unter-)Aufgabe | P1 | ⏳ TODO |

### §6.14 KURT — Langzeit-Überblick & Notizen

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.14.1 | Schuljahres-Überblick zur Entwicklung von Kompetenzbereichen | P1 | ⏳ TODO |
| 6.14.2 | Interne Notizen für Entwicklungen/Förderschwerpunkte | P1 | ⏳ TODO |
| 6.14.3 | Pro Prüfling Überblick: Aufgaben-/Endkommentare & Fördertipps | P1 | ⏳ TODO |

### §6.15 KURT — Rückmeldung/Kommentare

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.15.1 | Aufgabenbezogene oder allgemeine Kommentare als individuelle Rückmeldung | P0 | ⏳ TODO |
| 6.15.2 | Kommentare bleiben nach Rückgabe verfügbar | P0 | ⏳ TODO |
| 6.15.3 | Kommentare anderer SuS derselben Prüfung einsehen und wiederverwenden | P1 | ⏳ TODO |

### §6.16 KURT — Export & Druck (PDF)

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.16.1 | PDF-Rückmeldebögen inkl. Teilpunkte, Kommentare, Fördertipps, Unterschrift, Schullogo | P0 | ⏳ TODO |
| 6.16.2 | Mit einem Klick alle PDFs erzeugen | P1 | ⏳ TODO |
| 6.16.3 | Drucklayouts: vier Layouts | P1 | ⏳ TODO |
| 6.16.4 | Headerbereich über Druckpresets anpassbar; Druck aktueller Prüfling oder alle | P1 | ⏳ TODO |
| 6.16.5 | Kriterien formatiert drucken; pro Aufgabe Prozent anzeigen; Kommentare/Fördertipps kursiv | P1 | ⏳ TODO |
| 6.16.6 | Punktabzüge anzeigen oder deaktivieren | P2 | ⏳ TODO |
| 6.16.7 | Unterschrift: Bilddatei, per Hand malen, oder leer | P1 | ⏳ TODO |

### §6.17 KURT — Besondere Schülerleistungen markieren

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.17.1 | Während Korrektur markieren; Bild und/oder Wortlaut dokumentieren | P2 | ⏳ TODO |
| 6.17.2 | Übersicht nach Aufgabe & Kategorie | P2 | ⏳ TODO |
| 6.17.3 | Namen ausblendbar (Anonymisierung) | P2 | ⏳ TODO |

### §6.18 KURT — E-Mail-Versand

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.18.1 | Ergebnisse per E-Mail an Schüler und/oder Eltern | P1 | ⏳ TODO |
| 6.18.2 | E-Mail enthält Noten- und Aufgabenergebnisse; Platzhalter automatisch korrekt befüllen | P1 | ⏳ TODO |

### §6.19 KURT — Gruppenweise korrigieren & Splitscreen

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.19.1 | Gruppenkorrektur im Splitscreenmodus (Referate/mündlich) | P2 | ⏳ TODO |
| 6.19.2 | Vollbildmodus; bis zu vier Prüflinge gleichzeitig | P2 | ⏳ TODO |
| 6.19.3 | Thema für Referate/mündliche Prüfungen festlegen | P2 | ⏳ TODO |

### §6.20 KURT — Zusammenarbeit/Kompatibilität

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.20.1 | Lerngruppen aus WebUntis importieren | P2 | ⏳ TODO |
| 6.20.2 | Prüfungsnoten in Notenapps kopieren; Notenspiegel kopieren | P2 | ⏳ TODO |
| 6.20.3 | Fördermöglichkeiten oder Prüfungsentwürfe mit anderen Nutzern teilen | P2 | ⏳ TODO |
| 6.20.4 | Notenspalte kopieren (Excel/Notenprogramme) | P2 | ⏳ TODO |

### §6.21 KURT — Unterstützte Bewertungsformate

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.21.1 | Abdeckung der genannten Formate: Mappen, Portfolios, Referate, Tests, Facharbeiten, mündliche Prüfungen etc. | P1 | ⏳ TODO |

### §6.22 KURT — Oberstufenklausuren & Erwartungshorizont-Workflow

| Checkbox ID | Feature | Priority | Status |
|-------------|---------|----------|--------|
| 6.22.1 | Aufgabenaspekte/Unterkriterien feiner beschreibbar | P1 | ⏳ TODO |
| 6.22.2 | Kriterien/Aufgabenaspekte formatierbar | P1 | ⏳ TODO |
| 6.22.3 | Copy & Paste aus Word: Formatierungen bleiben erhalten (best effort) | P2 | ⏳ TODO |
| 6.22.4 | Alternative Blanko-EWH-Workflow (exportierbar/unterstützt) | P2 | ⏳ TODO |
| 6.22.5 | 0–15 Punkte, Wahlaufgaben mit Teilkriterien, Bonuscharakter, Prüfung in Teile, Zwischennoten je Teil (optional ausblendbar) | P1 | ⏳ TODO |

---

## 3. Total Checkbox Count

- **§6.9:** 7 checkboxes
- **§6.10:** 7 checkboxes
- **§6.11:** 11 checkboxes
- **§6.12:** 9 checkboxes
- **§6.13:** 4 checkboxes
- **§6.14:** 3 checkboxes
- **§6.15:** 3 checkboxes
- **§6.16:** 7 checkboxes
- **§6.17:** 3 checkboxes
- **§6.18:** 2 checkboxes
- **§6.19:** 3 checkboxes
- **§6.20:** 4 checkboxes
- **§6.21:** 1 checkbox
- **§6.22:** 5 checkboxes

**Total KURT Checkboxes:** 69

---

## 4. Mapping to ISSUES_TRACKER.md Phases

### Phase 5 (P5-1, P5-2, P5-3)
- **P5-1:** Exam Data Layer (Repos, Migrations, Tests) → Maps to §6.9.1-6.9.4
- **P5-2:** Simple Exam Builder UI → Maps to §6.9.2
- **P5-3:** Complex Exam Builder UI (3 levels, Wahlaufgaben, Bonus) → Maps to §6.9.3, 6.9.5-6.9.7

### Phase 6 (P6-1, P6-2, P6-3, P6-4)
- **P6-1:** CorrectionEntry Repo + UseCases → Maps to §6.11.1
- **P6-2:** Compact Correction UI (Tab Nav, Points to next grade, realtime grade) → Maps to §6.11.1-6.11.3
- **P6-3:** Alternative Grading (++/+/0/-/--) → Maps to §6.11.9
- **P6-4:** Comments + Table Mode + Task-wise correction (AWK) → Maps to §6.11.4-6.11.5, 6.11.8

### Beyond P6 (New Issues Needed)
- **P7:** Gradekey Engine (§6.10.1-6.10.7)
- **P8:** Fördertipps DB + UI (§6.12.1-6.12.9)
- **P9:** Auswertung + Punkteänderungsassistent (§6.13.1-6.13.4)
- **P10:** Langzeit + Notizen (§6.14.1-6.14.3)
- **P11:** Kommentar Reuse (§6.15.1-6.15.3)
- **P12:** PDF Export (4 Layouts, Presets, Signatur) (§6.16.1-6.16.7)
- **P13:** E-Mail Templates (§6.18.1-6.18.2)
- **P14:** Highlighted Works (§6.17.1-6.17.3)
- **P15:** Group Correction + Splitscreen (§6.19.1-6.19.3)
- **P16:** Sharing + Integrations (§6.20.1-6.20.4)
- **P17:** Assessment Format Support (§6.21.1)
- **P18:** Oberstufe EWH Workflow (§6.22.1-6.22.5)

---

## 5. Link to KURT_MATRIX.csv

See `KURT_MATRIX.csv` for row-by-row tracking of each checkbox with implementation status and test coverage.

---

## 6. Link to KURT_ASSERTIONS.md

See `KURT_ASSERTIONS.md` for definition of "done" for each checkbox type.

---

**END OF KURT_LEDGER.md**
