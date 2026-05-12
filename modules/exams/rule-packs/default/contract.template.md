# Correction Session Contract

- Session ID: `{{session.id}}`
- Session Chat Reference: `{{session.chatRef}}`
- Title: `{{session.title}}`
- Exam Reference: `{{session.examRef}}`
- Rule Pack: `{{rulePack.manifest.id}}@{{rulePack.manifest.version}}`

## Chat Reference Roles

- `Session Chat Reference` identifies this correction session/contract.
- Leistung chatRefs identify individual submitted Leistungen and are listed under `Chat References`.
- The import bundle top-level `chatRef` must always be a Leistung chatRef from the `Chat References` list, for example `chat-0001`.
- Never use the `Session Chat Reference` as the import bundle top-level `chatRef`.

## Matching Rule

- Each submitted Leistung must be explicitly associated with exactly one Leistung `chatRef`.
- The Leistung `chatRef` must be provided together with the submitted Leistung or immediately before it.
- Upload order is not semantic and must never be used for matching.
- Do not match by candidate order, file position, file name, personal name, candidate ID, or student ID.
- If a submitted Leistung has no unambiguous Leistung `chatRef`, it must not be evaluated until the Leistung `chatRef` is provided.
- Returned correction data must be matched back only by Leistung `chatRef`.

## Expected Return Format

- `Zwischenexport` and `Ende Korrektur` must return raw JSON only when a valid import-bundle export can be produced.
- The returned JSON must conform to the loaded import bundle schema.
- No YAML, CSV, Markdown table, prose summary, or substitute export format is allowed when emitting JSON.
- If a valid import-bundle JSON export cannot be produced, output exactly one short plain-text line stating the missing prerequisite, and nothing else.

## Chat References

{{render.chatRefs}}

## Parts

{{render.parts}}

## Task Tree

{{render.taskTree}}

## Scoring Units

> Criteria listed under `expectedHorizon` per scoring unit are the binding assessment basis (Erwartungshorizont). When present, use them as the authoritative evaluation standard for that task.

{{render.scoringUnits}}

## Rules

{{render.rules}}
