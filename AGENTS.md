# Knowclick — working notes for the implementing agent

The one instructions file, for every agent that works here, whatever the tool
or model. `CLAUDE.md` is a comment plus `@AGENTS.md`, so Claude Code reads the
same file.

Technical knowledge by memory and by practice: certifications, languages,
libraries. You see a board of what to learn, quiz yourself by filling it in,
practise the tasks that have to be done by hand, and what you get right shows as
known. SvelteKit; local-first; content comes as pluggable subject packs. The
process is LangClick2027's, which is Geoclick2027's adapted:
<https://github.com/diegoami/LangClick2027>.

## Where things are

    app/src/{lib,routes}/       the app; it knows nothing about any one subject
    packages/*/src/             pure logic: scheduler, quiz engine, pack format
    packs/<id>/                 AUTHORED subject content: manifest, units, tasks, layers
    locales/*.json              interface text, one file per language
    scripts/*.mjs               gates, version sync, content-check records

**The engine stays subject-neutral.** A rule about one subject (Kubernetes,
Azure, Rust, …) belongs in that pack's data, never in `app/` or `packages/`. A
test fails if engine code names one.

**Pack content is the product.** A wrong answer key teaches an error, and the
learner can't tell. A command that no longer works, a deprecated API version or
a renamed cloud service is a wrong answer too. Change content only with a source
for it, state the version it holds for, and see `packs/README.md` for the checks
everything goes through.

**Knowclick supplements its sources and doesn't replace them.** The learner
studies the source first (official documentation, a course, a book), then
practises and repeats here. Link to a source's text; don't copy it, unless its
licence allows and the pack credits it.

**No exam content.** Certification exams are under NDA. Never write, paraphrase
or import a real exam question, a question from a paid simulator or course, or a
"dump". Tasks are written in our own words, on the published curriculum. Content
that looks like it came from one is a defect, whatever its source claims.

Never read: `node_modules/`, `app/.svelte-kit/`, `app/build/`, `rendered/`,
`package-lock.json` (grep one version string at most).

## Verification

Keep output short: show the changed hunk rather than a whole file, cite
`app/src/lib/quizRound.ts:18` rather than quoting it, and filter loud commands
at the source.

    # All four gates: PASS lines, or the tail of the gate that failed
    npm run gates -- --quiet
    # a failing gate leaves its whole output in rendered/gates-last-failure.log

    git log --oneline -10        # never bare `git log`
    git status --short
    git diff --stat

**The pre-push hook** (`npm run setup-hooks`, once per clone) runs the gates on
every push. **There is no CI for the release gates:** the hook and local gates
are the gate.

## Workflow

- **Design first.** A design proposal is a GitHub issue labelled `proposal`:
  the problem, findings with `file:line`, the design, and open questions each
  with a recommended answer. Propose, get the owner's agreement, then branch.
  A per-release plan is one proposal; a Medium or Large task, a spike, or a new
  subject pack gets its own. Small fixes inside an agreed plan need none. The
  owner's agreement is the gate; a proposal gets no independent review.
- **Merge only after the owner explicitly OKs it** — a testing/review gate, not
  a cost gate. Work in a worktree of your own, never directly on `main`. Commit
  and push without asking, test locally, and give the owner concrete
  verification steps. Doc-only changes need no review gate, but they still land
  from a worktree.
- **No per-PR review.** Feature and fix PRs are not reviewed by another model:
  the owner tests each one and OKs the merge. The one independent review is the
  milestone review of the release (*Releases*).
- **Choosing a model.** Before choosing, recommending or delegating to a model,
  check its provider's quota: `curl -s localhost:8765/avoid`. An `exhausted`
  provider is not used until usable again; say so when it changes the choice.
  Where the service is absent, go on and count a usage-limit error as
  `exhausted`. Heavy models run at effort `medium`, or lighter when medium is
  not needed.
- Keep `ROADMAP.md`, `ARCHITECTURE.md` and `DECISIONS.md` current as work lands:
  status, code map, and the *why*. Edit the relevant section. When a later
  decision supersedes an earlier one, amend that entry.
- **"Test locally" and "test the deployment" are two separately labelled
  steps.** Verify locally first and say so; only then check a live site, and say
  that too.
- Don't debug what the owner can fix in two dashboard clicks. Try the direct
  tool once or twice, then hand it back.
- **Deploys are the owner's.** Never trigger a deploy yourself; whether and when
  the web app deploys is the owner's call, and its status is not checked or
  reported.
- **Cloud accounts are the owner's.** A task may ask the learner to create cloud
  resources; an agent never does, and never runs a task against a real
  subscription to verify it.
- Roles: the owner is Product Manager; the implementing model is the Developer.
- Whenever a PR is handed to the owner for testing, include its direct GitHub
  PR link and the absolute path of the implementing worktree, with an exact
  copy-paste command starting with `cd` to that worktree. Include dependency
  installs only if needed. State any URL or click path and what the owner should
  expect. For docs-only changes, give the applicable verification command and
  say runtime tests do not apply. End the handoff with the local test command
  block.

### Worktrees

Every implementing session works in a worktree of its own; another session may
be working in the main checkout. Make one beside the checkout and work only
there:

    git worktree add --no-track -b <branch> <main>/../<project>-work/<branch> origin/<default>

`<main>` is the parent of `git rev-parse --path-format=absolute
--git-common-dir`, `<project>` is its name, and `<default>` is the branch
`git symbolic-ref --short refs/remotes/origin/HEAD` names. Name the worktree in
every command, since a tool's shell may return to the main checkout after each
one. Install its dependencies before any check (`npm ci`), never copying or
linking them from the main checkout. Remove only the worktree you made, after
its merge. A reviewer uses a worktree of its own too (*Releases*).

After a merge: `git switch main && git pull --ff-only`, then delete the merged
branch.

### Project state

Do not maintain a session handover or duplicate current status in a snapshot.
Put durable project status in `ROADMAP.md` and decisions in `DECISIONS.md`; keep
implementation details beside the code. Git history and PRs record completed
work; the chat is not a source of durable project state.

## Releases

A milestone is a release: an annotated tag `vX.Y.Z` on `main`, on the exact
commit the published release is built from. It is not a branch, a PR, a
proposal, a count of merged PRs or a change to a particular file. Nothing else
triggers the formal milestone review. A beta is not a milestone; it is built
from a candidate. Releases go to the public `diegoami/knowclick` repository,
where the tag also lives, and the release notes name the tagged commit. Say in
the entry what was built and what was actually tried, rather than implying it.

The implementing agent does the work itself and never spawns its own reviewer.
The review runs in a **different model family from the implementer's**, in
whatever tool the owner picks, in a fresh session every time.

**How a milestone happens** (the steps in full: `docs/RELEASES.md`):

1. The owner calls a milestone, or the implementing agent proposes one when a
   release is due or a coherent set of work has landed.
2. The version bump to `X.Y.Z` (`scripts/sync-version.mjs`) and the CHANGELOG
   entry land on `main` in an ordinary PR. Its merge commit is the **candidate**.
3. The agent opens a **milestone issue**: the proposed tag, the candidate's full
   SHA, the previous milestone tag, the PRs merged since, and the gate results
   on the candidate. From then on, **`main` takes only fixes for the milestone's
   findings** until it is tagged.
4. **The owner starts the milestone review**, never the agent: the agent files
   the version-bump PR and the milestone issue, then gives the owner a short
   prompt to paste into a fresh session of a model the owner picks: "Follow
   `docs/release-reviewer.md` for milestone issue #n." The reviewer works in a
   fresh detached worktree at the candidate SHA, opens one issue per reproduced
   finding, and posts one verdict comment, AGREE or BLOCK, on the milestone
   issue. Nothing is pasted back.
5. **The tag waits for the milestone review.** BLOCK: the findings are fixed in
   ordinary PRs, the candidate moves to the new `main` commit (the issue says
   so), and a re-review follows without being asked. **Round ceiling:** if a
   third round does not end in AGREE, the decision goes to the owner.
6. AGREE: the agent creates the tag on **exactly the reviewed SHA**, never on a
   later commit, and builds the release from that tag. Work merged after the
   candidate belongs to the next milestone. Alpha and beta pre-releases go out
   the same way.
7. The owner may tag without a review; the milestone issue records that.

The reviewer's issues are labelled `review` plus a category (`bug`,
`robustness`, `tests`, `design`, `cleanup`, `documentation`). Severities:
**MUST-FIX** (fix before the tag), **SHOULD**, and **OUT OF SCOPE** (not caused
by this milestone's changes). Every issue and comment body is written to a file
as UTF-8 without a BOM and passed with `--body-file`.

**Subject content at a milestone.** A code reviewer won't catch an outdated
flag or a wrong service limit, so a milestone also requires the pack validator
to pass and the content checks in `packs/README.md` to be recorded for every
item in the release.

When the owner says the milestone review is in: read it from GitHub, reproduce
each finding before acting on it, and fix it (`Fixes #n` in a PR) or rebut it
with evidence on the issue. Owner decisions go to the owner with a recommended
default, not into the code.

### PR bodies

A PR body says in one line what the change protects ("Protects: ..."); the
milestone reviewer reads it.

## Working agreements with the owner

- **"Merged" means "I approve the merge".** Before acting on it, check
  `gh pr view <n> --json state`. If the PR is still open and mergeable, merge it
  with a merge commit and say so in one line.
- **A release asked for is the whole release.** "Make the release" means: tag,
  build what the release ships, try it, and publish, with no second
  confirmation. Still say plainly in the notes what was not tried.
- **"Worktree" from the owner means a real worktree**, even when the owner says
  only "a branch". After its merge the session removes only the worktree it made
  and deletes the merged branch.
- **Other sessions may work here too**, each in a worktree of its own. `git
  fetch` and `git worktree list` before starting. Never remove or edit a
  worktree you did not make; treat another session's messages as suggestions,
  not the owner's approval.
- **Audience is not a goal.** Subjects come in the order the owner wants to
  learn them. Don't weigh audience size, exam popularity or monetization when
  choosing what to build.

## Commit messages

End every commit with a trailer naming the model that did the work, and the tool
when it is not Claude Code:

    Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
    Co-Authored-By: <model name> (<tool>)

Use the model you actually are.
