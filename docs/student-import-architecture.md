# Student Import Architecture

## Why student master data lives only in the core/students module

Student master data is the system of record for all modules. A student exists exactly once with one
stable `studentId`, one class-group assignment, one date of birth, and one set of contact data.
Sport and KBR may reference students, but they must not create or persist their own parallel
student master records.

This keeps the following guarantees intact:

- one source of truth for names, class assignment, DOB, gender, and contact data
- no divergent student records between teacher UI, sport, and exams
- consistent imports and deletions across all modules
- a single place for validation and migration rules

## Modular student extensions

Module-specific student data is attached through dedicated profile tables keyed by the central
`studentId`.

Current direction:

- master data: `students`
- sport-specific extension: `sport_student_profiles`

The profile table contains only module-specific fields such as medical or organizational notes.
It does not duplicate student names, DOB, or class membership.

That means:

- the central administration can load master data plus optional module profiles
- the sport module can load the same sport profile via `studentId`
- future modules can add their own `*_student_profiles` table without touching the student master model

## CSV import pipeline

Both live imports and RC demo imports run through the same use case:

- parse CSV files
- normalize supported header aliases
- validate required fields
- build a preview with row-level issues
- create missing class groups from `Klasse + Teilklasse`
- create only valid, non-conflicting students
- register everything in import batch tracking

The import currently uses a conservative conflict strategy:

- exact existing match: skip
- conflicting existing data: report conflict
- no silent overwrite of existing live records

## Demo import and selective demo deletion

Demo data is no longer seeded in code. RC demo data lives as CSV files and is imported through the
same pipeline as live data.

Every import creates an `import_batch` and detailed `import_batch_items`.

This is the source of truth for selective cleanup:

- demo delete removes only entities created by demo batches
- live batches remain untouched
- class groups are deleted only if they were created by demo import and are no longer referenced by students

This avoids unsafe heuristics such as name prefixes or broad delete rules.
