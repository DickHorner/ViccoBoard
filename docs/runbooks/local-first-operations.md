# Local-First Operations Runbook

## Purpose

This runbook covers the critical operational flows for `ViccoBoard` as a local-first iPadOS Safari-compatible application.

## Critical Workflows

### 1. Cold Start

- Load the app with an empty browser data store.
- Confirm local storage initialization completes without blocking the UI.
- Confirm the main teacher flows open without requiring network access.

### 2. Offline Verification

- Open the app once while online.
- Disable network access in the browser or device settings.
- Reload the app.
- Verify that core flows still work: classes, students, attendance, grading, timer, and exam editing.

### 3. Backup Export

- Export a backup from the settings or storage workflow.
- Save the exported file through the browser download flow.
- Record the export date and the app version in release notes or change notes for risky storage changes.

### 4. Backup Restore

- Start from a clean browser profile or cleared site data.
- Import a previously exported backup.
- Verify classes, students, attendance entries, and exam data are restored.
- Verify a second reload still shows the restored data.

### 5. QR-Based Support Tips

- Create or open a support tip with at least one link.
- Generate the QR code.
- Verify the QR asset is generated locally and does not require a remote QR service.
- Verify the generated QR still appears when the app is offline.

## iPadOS Safari Notes

- Do not rely on File System Access APIs such as `showOpenFilePicker` or `showSaveFilePicker`.
- Use browser download and file input flows for export and import.
- Re-test backup export/import after clearing Safari site data because storage eviction is a realistic failure mode on iPadOS.

## Failure Recovery

### Storage Initialization Failure

- Capture the exact error shown in the UI or console.
- Verify whether the issue reproduces after a hard reload.
- Verify whether the issue reproduces in a clean browser profile.
- If the issue is migration-related, attach the failing migration version to the change note before further rollout.

### Suspected Data Loss

- Stop further writes in the current browser session.
- Export any still-accessible backup immediately.
- Reproduce using a copy of the affected data where possible.
- Validate restore using the most recent known-good backup.

## Verification Checklist for Risky Changes

- `npm test`
- `npm run build:ipad`
- Cold-start check completed
- Offline reload check completed
- Backup export/import roundtrip completed for storage-affecting changes
