# Knowclick — Release Process

How work reaches `main` and becomes a versioned, tagged release. Adapted from
LangClick2027's process, itself adapted from Geoclick2027's. The log itself:
[`CHANGELOG.md`](../CHANGELOG.md).

## The shape of it

```
  task branch ──merge (owner OK)──► main
  release prep PR (X.Y.Z + CHANGELOG) ──merge (owner OK)──► main = candidate ──► milestone issue
  candidate ──► review (AGREE | BLOCK → fix PRs → candidate moves → re-review)
            ──► beta from the candidate (optional) ──► owner's checks
            ──► tag vX.Y.Z on exactly the reviewed SHA ──► publish
```

`main` is the integration branch. Task branches merge into it one at a time, as
each is approved. A release is a **tag on `main`** plus the `CHANGELOG.md` entry
that explains it.

## The milestone

1. **Release prep.** Once everything for the release is merged, an ordinary PR
   carries `node scripts/sync-version.mjs X.Y.Z` and the `CHANGELOG.md` entry,
   headed `## vX.Y.Z — <date> — <theme>`. Gates; the owner merges. That merge
   commit on `main` is the **candidate**.
2. **Milestone issue.** Open `Milestone vX.Y.Z` with the proposed tag, the
   candidate's full SHA, the previous tag (or "none: first release"), the PRs
   merged since, the gate results on a clean checkout of the candidate, the
   content checks recorded for the release (`packs/README.md`), what changed,
   the claims to verify with `file:line`, and the known owner decisions. Until
   the tag, `main` takes only fixes for this milestone's findings.
3. **Review.** The owner starts it in a fresh session of a model family that
   implemented none of the release: "Follow `docs/release-reviewer.md` for
   milestone issue #n." It posts AGREE or BLOCK on the milestone issue. **The tag
   waits.** On BLOCK the fixes land as ordinary PRs, the candidate moves to the
   new `main` commit, and a re-review starts unasked; a third round without
   AGREE goes to the owner. The owner may also tag without a review, and the
   issue records that.
4. **Beta, if one is wanted** (it can run alongside the review). On a throwaway
   commit on top of the candidate, carrying only `sync-version.mjs
X.Y.Z-beta.N`, tag `vX.Y.Z-beta.N`; it is never merged, and the tag keeps it.
   The code is the candidate's, so the owner tests what the reviewer reviews. If
   the candidate moves, the next beta is `beta.N+1` on the new candidate.
5. **On AGREE:** `git tag -a vX.Y.Z <reviewed sha> -m "vX.Y.Z — <theme>"` —
   exactly the SHA the verdict names, never a later commit; push the tag; publish
   ("Publishing" below). Work merged after the candidate waits for the next
   milestone. Close the milestone issue with the tag and the release link.

## Versioning

**Root `package.json` is the single source of truth.** `scripts/sync-version.mjs`
propagates it to the other manifests and the lockfile. Task branches never touch
version numbers.

```bash
node scripts/sync-version.mjs --check   # fail if any manifest disagrees
node scripts/sync-version.mjs 0.1.0     # set root + propagate
```

Pre-releases are `X.Y.Z-alpha.N` (a preview of unmerged work, from a throwaway
commit on the task branch) and `X.Y.Z-beta.N` (from a throwaway commit on the
candidate). Neither is merged, and the tag keeps them. Both are published as
GitHub pre-releases, so they are never marked Latest.

## Publishing

The notes **are** the version's `CHANGELOG.md` entry, written by hand: a bolded
lead sentence saying what the release is, then bullets in learner-facing terms
first, then what was deliberately not done and what was not tried. They name the
tagged commit.

**Until installers exist** a release has no build artefacts:

```bash
gh release create vX.Y.Z --verify-tag --title "vX.Y.Z — <theme>" --notes-file <entry>
```

Add `--prerelease` for an alpha or beta. Web deployment stays the owner's call
and is separate from a release. When a milestone adds Windows and Android builds,
this section takes Geoclick's packaging steps, with a signing key of this project's
own from its first APK.

## Hotfixes

If something ships broken: fix it on a `hotfix/x.y.z` branch from `main`, run the
gates, get the owner's OK, merge, then ship the next patch as its own milestone.

## Doc maintenance at release time

Docs are updated as part of the work, not afterwards. At release time, only check
that `ROADMAP.md`'s status and `ARCHITECTURE.md` still describe what shipped. If
a task skipped its doc obligation, say so rather than papering over it.
