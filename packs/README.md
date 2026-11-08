# Subject packs

A pack is a folder here. Nothing else registers it: the app finds every
`packs/*/pack.json`. Everything is plain JSON, with no code and no HTML. The format is
LangClick2027's, adapted for technical subjects.

    packs/<id>/pack.json                 the manifest: versions, lessons, keywords, verify sandbox
    packs/<id>/units/<unit>.json         a board: its answers and layout
    packs/<id>/tasks.json                hands-on tasks, done outside the app
    packs/<id>/layers/<language>/        text in that language: course.json, tasks.json, units/
    packs/<id>/coverage/<exam>.json      a published curriculum, mapped to units and tasks
    packs/<id>/checks/<checker>.json     independent content checks
    packs/<id>/verified.json             the last run of scripts/verify.mjs

The types are in `packages/pack-format/src/index.ts`.

**A pack is a subject, not an exam.** CKAD and CKA share kubectl and most resources, so
they are one `kubernetes` pack with a coverage file each, and shared items share progress.

**Rules about one subject go in its pack, never in the engine.** `keywords` lists the
names of the subject (the pack id among them), and a test fails if engine code contains
any of them.

## Versions

`holdsFor` says what the content is true for: a tool's version, a curriculum's version.
`checkedOn` is when it was last checked against them. Both are required, and a change to
`holdsFor` voids its checks, so moving a pack to a new version means checking it again.

## Lessons

### More gaps and more choices

The owner clarified the intended difficulty: expand the same exercise with more
meaningful gaps and offer more candidate answers than gaps. The Rust enum board
now has ten gaps and sixteen distinct choices. Repeated correct answers are
shown once with the required count; extra wrong choices remain until completion.

A unit may set `distractors` to an array of plausible, wrong answer texts. Choose
alternatives from the same topic and syntactic category. They must be nonempty,
unique, and different from every correct answer (including case-insensitive
comparisons where enabled). Do not force extra options into inherently binary
questions, invent nonsensical categories, or hide arbitrary names that have no
determinable answer. Existing item IDs remain stable when adding new gaps.

All real options stay available under the unit's existing dealing policy;
`dealAll` offers every real answer together. Extra choices are shuffled among
real choices without different styling. A wrong extra choice reveals and
penalizes the selected gap, never a fake progress item. It is not removed from
the tray after a mistake. Authored choices are included in independent content
checks; executable verification still checks the filled program, not decoys.

Rust's original four main boards each have ten gaps and 16–18 distinct choices.
The expanded course adds main boards with eight to ten objective-driven gaps
and plausible extra choices; all main exercises have larger Recall variants.
The original four-state complete-arm challenge is retained. Preserve
facts that recur across variants with their existing item identities; use new
IDs when an exercise introduces a new fact. Verify each filled program, including
all branches and the continued usability of borrowed values.

### Guided, Recall and Apply

Use the same progression in every course. Choose gaps from one learning
objective rather than removing random tokens or merely adding more holes.

- **Guided:** small authored gaps with choices. The surrounding structure is
  support; answers earn recognition progress only.
- **Recall:** no choices. Surrounding code and line scaffolds are hidden.
  Placed answers stay visible when leaving and returning to the quiz.
  Every code cell should have a localized clue naming the
  objective. State enough requirements to determine the reference answer.
- **Apply:** the lesson's authored practical tasks. Include requirements, local
  checks and a solution the learner opens after trying. Results are explicitly
  self-assessed; the app does not compile submitted programs in the browser.
  Lessons without practical tasks show an unavailable-content explanation.

For larger recall gaps, a lesson unit may name a second unit with `recallUnit`.
This is a normal unit file with permanent item IDs, sources, localized text,
verification and independent checks, but is not repeated in the lesson's
`units`. The reference must exist in the same pack; self-references and nested
variants are rejected. Recall, including review and recommendations, uses it.
For example, keyword gaps can become complete match arms. Use a new item ID for
an entire expression: it measures a different skill from remembering a keyword.

`answerFormat: "code"` compares reference code as tokens, accepting formatting
changes while preserving literals, case and token boundaries. This checks
reference-form recall, not arbitrary program equivalence. Open-ended
implementations belong in Apply and are checked with the stated compiler/tests.

Hints and explicitly revealed answers earn assisted-practice cards, separate
from unassisted recall. An unassisted mistake still resets the recall item;
subsequent answers in that round are assisted. Restart begins a fresh attempt.
Navigating away and returning is not itself assistance. Saved rounds, including
completed rounds, remain until the learner explicitly restarts; restarting does
not erase earned progress. Recommendations require three clean successes on every item at a level and never
lock choices. Existing recognition, recall and practice cards keep their IDs.

`pack.json` lists the lessons in teaching order, under `sections`. A lesson has, in this
order: `study` (links to official docs, courses or books, to read first), `units` (boards
here) and `tasks` (practice by hand). Knowclick supplements its sources: link to them,
don't copy them.

**No exam content.** Never write, paraphrase or import a real exam question, a question
from a paid simulator or course, or a dump. Write in your own words, on the published
curriculum.

## Boards

- A `table` has rows and columns and one cell at each crossing, except the crossings
  listed in `gaps` (a resource with no short name).
- A `grid` is tiles in order. `size` says how many, and every cell needs a clue that fits
  only its own answer.
- `lines` is one line of code per cell, each a `line` with one gap written `___`, and a
  clue in the layer that says what the line does. The words around the gap and the clue
  together must fix the answer, and neither may contain it.
- `code` is one block of code, a list of lines, with every cell a gap in it written
  `{{gap:<cell id>}}`. Each cell appears exactly once. Use it where the place of a field is
  what is learned, as in a manifest. A gap is named by its place for screen readers, since
  its id is often its answer.

`text` is the answer, as compared and shown. A cell accepts a slip when their `text` is
equal, so an answer that fills several cells (`v1`) needs nothing special.

A unit with `caseInsensitive` compares typed answers without case. Set it on units whose
answers are names (ExpressRoute, availability zone), never where case is the answer, as in
flags, fields and code. Slips are dragged, so it changes nothing there.

A unit with `dealAll` always offers every slip. Use it when the answers only mean
something against each other, as the fields of one manifest do. Other units deal ten at
a time.

`item` is what progress is kept against. Use the same `item` for the same fact in another
unit, and it shares its progress there: a Deployment's apiVersion is the same item on the
resources table and in the manifest. **Item ids are permanent.** Never reuse one for
something else.

## Tasks

A task is practice done outside the app, in a terminal, on a practice cluster or in a
cloud sandbox (`where`). The pack holds its `id`, `item`, the `minutes` to aim for and
its `source`; the prompt, setup and solution stay at the source. The layer gives it a
`title` and a `brief`: one sentence, in our own words, of what it practises. The learner
grades each run _again_, _hard_ or _good_, and the same scheduler as the boards brings it
back. A `cloud` task runs in the learner's own account and is never run against a real
account by the app or by an agent. Prefer tasks that end by deleting what they create.

## Coverage

`coverage/<exam>.json` holds an exam's published domains, their weights and
competencies, in the curriculum's own words, and maps each competency to the units and
tasks that practise it. A weight is a number or, where the exam publishes a range, `[min,
max]`. Weights must be able to add up to 100, every task is mapped somewhere, and
`node scripts/coverage.mjs <pack>` prints what is covered and what isn't.

## Checks before anything ships

`app/src/lib/packs.test.ts` runs these in the gates, for every pack:

1. **The validator** (`validatePack`, `validateCoverage`): boards complete, code gaps and
   cells matching one to one, lines with one gap that don't give the answer away, tasks
   listed once and described, versions stated, links only to `http` and `https`.
2. **Two independent checks** (`validateChecks`): every piece of content, including the
   code around the gaps, the versions claimed, the study links, each unit's sources and
   the coverage, must be
   passed by two different checkers. `node scripts/pack-check.mjs <pack> <checker>` writes
   a checker's record with the exact content in `seen`, so a checker fills in verdicts and
   copies nothing. Editing anything voids its checks.
3. **A recorded verification** (`validateVerified`): every answer that can be run has been
   run as it now stands, and passed. See below.

A checker works from the content and outside sources, at the versions in `holdsFor`,
without being told the author's reasoning.

## Verification

A check that runs content is better than one that reads it. A unit's `verify` says how to
run its answers, with placeholders: `{text}` the answer, `{line}` the filled line, `{code}`
the filled code, `{row}` and `{col}` the cell's place. A table can give each column its own
step, and a cell can override its unit's. `expect` is a pattern the output must match; the
values filled into it are matched literally.

`node scripts/verify.mjs <pack>` runs them and writes `verified.json`. It first runs the
manifest's `verify.guard`, and refuses to go on unless it succeeds and matches: for the
Kubernetes pack, the current kubectl context must be `kind-knowclick`, a disposable kind
cluster. Then it runs `setup`, every job, and `teardown`. The gates read the record and
need no cluster. An edited answer, line or step voids its entry until the script runs
again (`--stale` runs only those).

For the Kubernetes pack:

```bash
kind create cluster --name knowclick --image kindest/node:v1.37.0   # once; needs kind v0.33+
kubectl config use-context kind-knowclick
node scripts/verify.mjs kubernetes
```

For the Azure pack, the Azure CLI must be installed and **logged out**: the guard runs
`az account show` and refuses unless it fails. Each `az` line is checked with
`az <command> --help`, which needs no account.

```bash
node scripts/verify.mjs azure
```

## Local developer and language verification

Rust boards use rustc 1.99.1 with edition 2024; the Azure developer code board
uses Bicep 0.48.1. Put `rustc` and `bicep` on PATH, then run from the repository root:

```bash
node scripts/verify.mjs rust
node scripts/verify-rust-labs.mjs
node --test scripts/verify-local-code.test.mjs
```

The helper compiles in fresh temporary directories, executes Rust assertions,
checks the emitted Bicep template, and removes its temporary files. No login or
deployment is performed. `node scripts/verify.mjs azure --stale` still requires
the Azure CLI and its logged-out guard; it also requires Bicep for the new board.
Original local task prompts and solutions are in `docs/courses/`. The Rust
course has eight chapters with four Guided exercises per chapter, each with an
authored larger Recall variant, and two labs per chapter. The lab verifier
requires rustc 1.99.1, compiles the documentation’s reference blocks in temporary
directories, runs tests and checks annotated compiler failures and CLI output.
`verify-rust` JSON comments specify `error` or `stdin`/`stdout` expectations.
A `"cargo": "bin"` annotation additionally runs Cargo init, check, build, test
and run offline in the temporary directory; the annotated snippet becomes
src/main.rs. The machine needs Cargo and the matching rustc 1.99.1 toolchain.
No external crates or account credentials are needed.

The new Azure and Rust content still needs two independent content checks.
Runnable verification does not replace them; stale or missing checks must keep
the content gate failing. To prepare a check record, an independent checker uses
`node scripts/pack-check.mjs <pack> <checker>` and evaluates every pending target
against the cited sources, without the author's rationale.

## Licence

Each pack names its licence in its manifest. Packs here are [CC BY-SA 4.0](LICENSE).
The Kubernetes documentation they link to is CC BY 4.0. Each unit lists its sources, and
the app shows them on the unit's Overview.
