# Correction Session Contract

- Session ID: `{{session.id}}`
- Chat Reference: `{{session.chatRef}}`
- Title: `{{session.title}}`
- Exam Reference: `{{session.examRef}}`
- Rule Pack: `{{rulePack.manifest.id}}@{{rulePack.manifest.version}}`

## Chat References

{{render.chatRefs}}

## Parts

{{render.parts}}

## Task Tree

{{render.taskTree}}

## Scoring Units

{{render.scoringUnits}}

## Rules

{{render.rules}}

## Export Target Format (Binding)

- Export targets for `Zwischenexport` and `Ende Korrektur` must be JSON only.
- The JSON output must conform to the loaded `import-bundle.schema.json` (resolved from the active rule-pack metadata field `importBundleSchema`).
- Required top-level fields for export are defined by the import schema (including `contract`, `chatRef`, and `importedTaskScores`).
- Do not emit substitute formats (e.g. YAML/CSV/Markdown tables/free text) for export commands.
