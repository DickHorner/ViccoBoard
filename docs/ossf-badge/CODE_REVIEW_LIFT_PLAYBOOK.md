# Code-Review Score Lift Playbook

This playbook focuses on raising OpenSSF Scorecard's `Code-Review` check from `0` while keeping a practical workflow.

## 1) Current baseline (snapshot 2026-02-26)

- Scorecard result: `Code-Review = 0`
- Reason: `Found 0/6 approved changesets`
- Human contributors detected: `1`

`Code-Review` improves only when recent changesets are reviewed (or implicitly reviewed) by a non-author human.

## 2) What can move the score

1. Route human-authored changes through pull requests.
2. Ensure PRs are approved by a non-author human reviewer before merge.
3. Keep this pattern long enough for unreviewed changes to age out of Scorecard's recent-commit window.

## 3) Solo-safe operating mode (until reviewer capacity exists)

If you are temporarily the only human maintainer:

- Use PRs anyway (branch -> PR -> merge) to build clean review history.
- Avoid direct pushes to `main` except emergency hotfixes.
- Document each emergency bypass in the PR or commit message to keep an audit trail.

This mode does not immediately lift `Code-Review`, but it reduces future cleanup once a second reviewer joins.

## 4) Fastest realistic lift path

1. Add at least one trusted human collaborator with write access.
2. Keep `required_approving_review_count` at `1`.
3. Merge via reviewed PRs only.
4. Re-check status:

```bash
npm run scorecard:zeros
```

## 5) Branch ruleset checkpoints (GitHub)

For the default branch ruleset, keep these goals:

- Pull requests required for changes
- At least 1 approving review
- Stale reviews dismissed on push
- Required status checks enabled
- Avoid routine admin bypass for normal feature work

## 6) Tracking cadence

- Run `npm run scorecard:zeros` weekly.
- Note the `Code-Review` reason text and recent ratio.
- Continue until Scorecard no longer reports `0/x approved changesets`.
