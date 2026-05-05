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

> Criteria listed under `expectedHorizon` per scoring unit are the binding assessment basis (Erwartungshorizont). When present, use them as the authoritative evaluation standard for that task.

{{render.scoringUnits}}

## Rules

{{render.rules}}
