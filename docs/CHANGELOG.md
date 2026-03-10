# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added

- Added a Motherlode activation profile for `risky_change_notes`, `architecture_boundaries`, `trust_boundary_validation`, and `sensitive_logging`.
- Added repo-local Motherlode checks for boundary enforcement, trust-boundary validation, and sensitive logging.
- Added a local-first operations runbook covering cold start, offline verification, backup/restore, and QR generation.

### Changed

- Switched support-tip QR generation from an external QR service URL to a locally generated SVG data URL so QR creation remains offline-friendly and privacy-preserving.
