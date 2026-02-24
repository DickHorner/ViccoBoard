# Sport APK → ViccoBoard Parity-Spec (UI-Strings + Form-Schemas)

Diese Parity-Spec ist **aus dem APK-Bundle** (`com.owlytic.Sport.apk`) extrahiert. Ziel: ViccoBoard soll am Ende **feature-identisch** sein, ohne dass UI-Details (Labels, Fehlermeldungen, Microcopy) verloren gehen.

## Inhalt

- `i18n/`
  - `Sport.de.json` – Original (de) aus dem APK
  - `Sport.en.json` – (en) aus dem APK, **repariert** (siehe Hinweis unten)
  - `i18n-leaf-strings.tsv` – flache Key→Text Tabelle (de/en), inkl. Missing-Status
  - `missing-in-en.txt` + `i18n-diff-report.json` – Diff/Report

- `forms/`
  - `apk-object-shapes.catalog.json` – Katalog von Objekt-Shapes, die im APK als `this.<name> = {...}` gefunden wurden
  - `*.schema.json` – JSON-Schemas (Draft 2020-12) für die wichtigsten Shapes (class, student, category, grade, table, …)

## Wichtiger Hinweis zum Englisch-File

Im APK ist `assets/public/assets/i18n/en.json` **offenbar am Dateiende abgeschnitten** (fehlende letzte schließende Klammer).  
Für `Sport.en.json` wurde **nur** ein fehlendes `}` ergänzt, damit es wieder parsebar ist.  
Daher gilt: “Keys fehlen in EN” kann **entweder** echte Lücke **oder** APK-Trunkierung sein.

## Wie Du das in ViccoBoard ablegst

Empfehlung im Repo:
`docs/parity-spec/sport-apk/`

Dann:
- `i18n/` als Referenzquelle für spätere Migration auf echtes i18n (Vue i18n o.ä.)
- `forms/*.schema.json` als “UI-Vertrag” für Form-Implementierungen (required fields, erwartete Struktur)

## Grenzen dieser Extraktion (ehrlich)

Das APK ist ein kompiliertes/minifiziertes Web-Bundle ohne Source-Maps.  
Das bedeutet:
- Die **Strings** sind zuverlässig (weil direkt als JSON im Bundle vorhanden).
- Die **Form-Schemas** sind aus realen Objekt-Literalen im Bundle rekonstruiert (sehr brauchbar für Feldlisten & Datenshapes),
  aber Validierungslogik/UX-Details (z.B. dynamische Pflichtfelder) können zusätzlich im Code stecken und müssen beim Parity-Test verifiziert werden.

## Extraction-Metadaten

- APK: `com.owlytic.Sport.apk`
- Extraktion: 7.2.2026
