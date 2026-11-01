# Changelog

Each release's entry is its release notes (`docs/RELEASES.md`).

## Unreleased

For authors:

- The giveaway check now finds an answer glued to punctuation in a line or clue, such
  as `(rollingUpdate)` (#8).
- Editing a unit's sources voids its checks, like every other content edit (#9).
- A code board whose `verify` has nothing to run is reported, instead of going
  unverified without a word (#10).
- `verify.mjs --stale` with nothing to run leaves the record alone, so its date stays the
  date of a real run.
- Unit sources corrected after their first check: the resources table cites the kubectl
  overview's resource-types table, and the Deployment reference uses its current address.

## v0.1.0 — 2026-11-01 — Kubernetes recall boards and hands-on tasks

**The first release: a Kubernetes pack for the CKAD, with boards you fill in and tasks you do by hand, to find out whether recall and scheduled practice work together.**

For learners:

- A first pack, Kubernetes, for the CKAD (curriculum v1.37), with three lessons: resources
  with their short names and API versions, a Deployment manifest field by field, and
  imperative kubectl.
- Each board has an Overview of everything to learn, a Quiz where you fill it in by
  dragging slips or by pressing a slip and then its place, and a Known view of what you
  have earned. The manifest is shown whole, with each field a gap in place.
- Six hands-on tasks from ckad-prep, done on your own practice cluster: start the clock,
  do the task, and say how it went. That decides when it comes back.
- Review deals what is due: board answers first, then tasks.
- Home shows which Kubernetes and curriculum versions the pack holds for.
- Progress is saved in your browser.

For authors:

- Packs are validated in the gates, every item needs two independent content checks, and
  every runnable answer is run against a disposable kind cluster by `scripts/verify.mjs`,
  whose record the gates require to be current.
- `node scripts/coverage.mjs kubernetes` shows which CKAD competencies are covered: 12 of 24.

Not in this release: typed answers, a second subject (Azure comes in v0.2.0), CKA,
installers and any web deployment.

Content has been checked by two AI models (Claude Opus 5.5 and Sonnet 5.5) against the
Kubernetes documentation and the CNCF curriculum, and every runnable answer has run on
Kubernetes 1.37.0. The owner has passed the CKAD, and the hands-on tasks come from the
owner's own ckad-prep scenarios.
