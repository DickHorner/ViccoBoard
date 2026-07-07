# ViccoBoard Agent Entry Point

Dieses Dokument ist nur der Einstieg für AI-gestützte Arbeit in ViccoBoard. Die Engineering-Policy liegt ausschließlich in [`HANDBOOK.md`](./HANDBOOK.md).

## Read order

1. [`HANDBOOK.md`](./HANDBOOK.md) für Arbeitsweise, Scope-Disziplin, Nachweisregeln und Definition of Done.
2. [`Plan.md`](./Plan.md) für Produktumfang und Feature-Checkboxen.
3. [`docs/planning/ISSUES_TRACKER.md`](./docs/planning/ISSUES_TRACKER.md) für aktive Arbeitspakete.
4. [`docs/status/STATUS.md`](./docs/status/STATUS.md) für aktuellen Repo- und Produktstatus.
5. [`DEVELOPMENT.md`](./DEVELOPMENT.md) für lokale Kommandos, Struktur und Architekturgrenzen.
6. [`docs/agents/sport_parity_v2.md`](./docs/agents/sport_parity_v2.md) nur bei Sport-Parity-Arbeit.

## Non-negotiable repo constraints

- ViccoBoard bleibt web-only, local-first und iPadOS/Safari-tauglich.
- Keine Runtime-Server als Standardbetrieb.
- Keine stillen Feature-Streichungen; unklare Produktspezifikation wird in `Plan.md` als TBD dokumentiert.
- Änderungen bleiben in der Architekturfolge `apps -> modules -> packages`.
- UI nutzt Bridges und Use-Cases; keine direkten Speicherpfade aus Views/Stores/Composables.
- `Student`/`StudentRepository` bleiben zentral in `modules/students` und den geteilten Contracts.
- Neue Logik braucht Tests oder wird ausdrücklich als nicht verifiziert markiert.

## Working mode

Arbeite nach dem Handbook-Workflow: Context, Idiom, Slice, Shape, Patch, Delete, Prove, Report, Stop.

Vor jeder Änderung werden zwei bis drei ähnliche Stellen im Repo geprüft und im Abschlussbericht genannt. Der Patch bleibt klein, reversibel und repo-nativ.

## PR evidence

Jede PR nennt:

- konkrete Repo-Präzedenz,
- betroffene `Plan.md`-Checkboxen oder Issue-IDs,
- geänderte Dateien und warum genau dort,
- ausgeführte Checks mit Ergebnis,
- nicht geprüfte Punkte ohne Beschönigung,
- bewusste Nicht-Ziele.

## Product scope vs. engineering policy

`Plan.md` ist die Produkt-Quelle. `HANDBOOK.md` ist die Engineering-Quelle. Agenten dürfen daraus keine dritte Regelquelle erzeugen.
