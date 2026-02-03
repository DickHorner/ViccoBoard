# UI Framework Decision (P2-1)

**Date:** February 3, 2026
**Decision:** Vue 3 + Vite (TypeScript) for Teacher UI

## Why Vue
- Existing scaffold in `apps/teacher-ui` reduces start time
- Strong TypeScript support and small runtime
- Works well with IndexedDB/Dexie and offline-first patterns
- WebKit/Safari-first compatibility aligns with iPadOS target
- Keeps build output static (no server required)

## Scope of This Decision
- Applies to the initial Teacher UI implementation (Phase 2)
- Business logic remains framework-agnostic (modules + packages)
- Future native app ports can reuse the domain layer

## Acceptance Criteria (P2-1)
- Framework chosen and justified
- Initial project structure exists
- Dependencies installed and buildable
- `npm run dev` starts a dev server

## Validation
- Project scaffold confirmed in `apps/teacher-ui`
- Build verified via `npm run build` in `apps/teacher-ui`
