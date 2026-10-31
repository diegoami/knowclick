# Changelog

Each release's entry is its release notes (`docs/RELEASES.md`).

## Unreleased

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
- `node scripts/coverage.mjs kubernetes` shows which CKAD competencies are covered.
