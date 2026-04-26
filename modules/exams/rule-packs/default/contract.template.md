# Correction Session Contract

- Session ID: `{{session.id}}`
- Chat Reference: `{{session.chatRef}}`
- Title: `{{session.title}}`
- Exam Reference: `{{session.examRef}}`
- Rule Pack: `{{rulePack.manifest.id}}@{{rulePack.manifest.version}}`

## Matching Rule

- Each submitted Leistung must be explicitly associated with exactly one `chatRef`.
- The `chatRef` must be provided together with the submitted Leistung or immediately before it.
- Upload order is not semantic and must never be used for matching.
- Do not match by candidate order, file position, file name, personal name, candidate ID, or student ID.
- If a submitted Leistung has no unambiguous `chatRef`, it must not be evaluated until the `chatRef` is provided.
- Returned correction data must be matched back only by `chatRef`.

## Expected Return Format

- `Zwischenexport` and `Ende Korrektur` must return raw JSON only.
- The returned JSON must conform to the loaded import bundle schema.
- No YAML, CSV, Markdown table, prose summary, or substitute export format is allowed.

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
