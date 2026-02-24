# ViccoBoard ↔ Sport APK: Parity-Report (Sport) – 7.2.2026

Grundlage: extrahierter Parity-Spec aus der APK (UI-Strings/Übersetzungen + Form-Schemas) sowie ein Snapshot der aktuellen ViccoBoard-Codebasis.

## Parity-Spec Artefakte (aus APK)

- i18n Keys (flattened): **1343** (DE/EN)

- JSON-Schemas: **9** (category.schema.json, class.schema.json, grade.schema.json, gradeWeighting.schema.json, newDayData.schema.json, student.schema.json, table.schema.json, userData.schema.json, wow.schema.json)

- Route-Segmente (aus APK `assets/public/main.*.js` via `path:"..."`-Extraktion): **111**


## Status in ViccoBoard (Kurzbefund)

Teacher-UI hat bereits Dexie/IndexedDB-Tabellen für Klassen/Schüler/Anwesenheit/Assessments/Kategorien/PerformanceEntries sowie Exam/Corrections.

Eine i18n-Infrastruktur ist (in der aktuellen Suche) nicht erkennbar.


## Schema-Parität (APK-Schemas ↔ ViccoBoard)


### category.schema.json → GradeCategory (apps/teacher-ui DB + core Sport types)

- APK-Felder: categories, class_id, color, created_at, deleted, id, is_dirty, main_category_id, max_value, min_value, name, settings, stats, teacher_id, type, updated_at, weight, year

- ViccoBoard-DB-Felder (gefunden): classGroupId, configuration, createdAt, description, id, name, type, updatedAt, weight

- **Fehlt in ViccoBoard (gegenüber APK):** categories, class_id, color, created_at, deleted, is_dirty, main_category_id, max_value, min_value, settings, stats, teacher_id, updated_at, year

- **Zusätzlich in ViccoBoard (nicht in APK):** classGroupId, configuration, createdAt, description, updatedAt


### class.schema.json → ClassGroup (apps/teacher-ui DB + core.types)

- APK-Felder: color, created_at, grade_category_count, grade_scheme, id, is_dirty, name, school_year, settings, sort, stats, student_count, teacher_id, updated_at, version

- ViccoBoard-DB-Felder (gefunden): createdAt, id, name, schoolYear, updatedAt

- **Fehlt in ViccoBoard (gegenüber APK):** color, created_at, grade_category_count, grade_scheme, is_dirty, school_year, settings, sort, stats, student_count, teacher_id, updated_at, version

- **Zusätzlich in ViccoBoard (nicht in APK):** createdAt, schoolYear, updatedAt


### grade.schema.json → PerformanceEntry / Grade (apps/teacher-ui DB)

- APK-Felder: category_id, class_id, created_at, criterias, deleted, grade, id, is_dirty, main_category_id, name, student_id, teacher_id, total_points, type, updated_at, weight, year

- ViccoBoard-DB-Felder (gefunden): calculatedGrade, categoryId, comment, id, measurements, metadata, studentId, timestamp

- **Fehlt in ViccoBoard (gegenüber APK):** category_id, class_id, created_at, criterias, deleted, grade, is_dirty, main_category_id, name, student_id, teacher_id, total_points, type, updated_at, weight, year

- **Zusätzlich in ViccoBoard (nicht in APK):** calculatedGrade, categoryId, comment, measurements, metadata, studentId, timestamp


### gradeWeighting.schema.json → Gewichtungs-/Notenschema (aktuell nur teilweise in GradeCategory.configuration?)

- APK-Felder: attendance, grades, remarks, wow

- **Kein direktes Persistenz-Pendant gefunden.** Vermutlich neu zu modellieren.

- **Fehlt (alle APK-Felder):** attendance, grades, remarks, wow


### newDayData.schema.json → Tagesdaten/„Neuer Tag“-Flow (kein Pendant in teacher-ui DB sichtbar)

- APK-Felder: additionalExercises, date, exercises, notes

- **Kein direktes Persistenz-Pendant gefunden.** Vermutlich neu zu modellieren.

- **Fehlt (alle APK-Felder):** additionalExercises, date, exercises, notes


### student.schema.json → Student (apps/teacher-ui DB + core.types)

- APK-Felder: class_id, first_name, gender, id, is_dirty, last_name, public_code, settings, stats, teacher_id, version

- ViccoBoard-DB-Felder (gefunden): classId, createdAt, dateOfBirth, email, firstName, id, lastName, photo, updatedAt

- **Fehlt in ViccoBoard (gegenüber APK):** class_id, first_name, gender, is_dirty, last_name, public_code, settings, stats, teacher_id, version

- **Zusätzlich in ViccoBoard (nicht in APK):** classId, createdAt, dateOfBirth, email, firstName, lastName, photo, updatedAt


### table.schema.json → Sportabzeichen-/BJS-Tabellen (kein eigenes Persistenzmodell in teacher-ui DB sichtbar)

- APK-Felder: color, created_at, grade_scheme, grade_scheme_direction, id, is_dirty, name, school, teacher_id, updated_at, version, visibility

- **Kein direktes Persistenz-Pendant gefunden.** Vermutlich neu zu modellieren.

- **Fehlt (alle APK-Felder):** color, created_at, grade_scheme, grade_scheme_direction, id, is_dirty, name, school, teacher_id, updated_at, version, visibility


### userData.schema.json → User/Teacher-Einstellungen (SecuritySettings/TeacherAccount?)

- APK-Felder: addons, email, first_name, id, invoices, last_name, role, settings

- **Kein direktes Persistenz-Pendant gefunden.** Vermutlich neu zu modellieren.

- **Fehlt (alle APK-Felder):** addons, email, first_name, id, invoices, last_name, role, settings


### wow.schema.json → WOW Workouts (kein Persistenzmodell in teacher-ui DB sichtbar)

- APK-Felder: name, wowtimer, wowtyp

- **Kein direktes Persistenz-Pendant gefunden.** Vermutlich neu zu modellieren.

- **Fehlt (alle APK-Felder):** name, wowtimer, wowtyp


## i18n-Parität

Da im Repo kein konsistentes i18n-Setup auffindbar ist (kein Locale-Verzeichnis / kein Übersetzungs-Loader), sind die **1343** APK-Keys momentan vor allem als Parity-Spec nutzbar (Datenbasis), aber noch nicht als laufende Übersetzungen in der App verdrahtet.


## Konkreter Implementierungsplan (Parity first)

1) Parity-Spec in den Repo kopieren: `docs/parity-spec/sport-apk/`.

2) i18n minimal einführen (Teacher-UI): Loader + `t(key)`; danach Screens Schritt für Schritt auf Keys umstellen.

3) Schema-Adapter: Sport-Felder 1:1 speichern (auch `version`, `is_dirty`, `teacher_id` usw.). Empfehlung: `rawSPORT`-Subobjekt oder separate Tabellen.

4) Fehlende Tabellen ergänzen: `tables` (Sportabzeichen/BJS), `wow`, `userData`, `newDayData`, `gradeWeighting`.

5) Automatischer Parity-Check im Repo: Script, das i18n-Key-Coverage und Schema-Feld-Coverage prüft.
