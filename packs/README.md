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
back. A `cloud` task is never run against a real account by the app or by an agent.

## Coverage

`coverage/<exam>.json` holds an exam's published domains, their weights and
competencies, in the curriculum's own words, and maps each competency to the units and
tasks that practise it. Weights add up to 100, every task is mapped somewhere, and
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

## Licence

Each pack names its licence in its manifest. Packs here are [CC BY-SA 4.0](LICENSE).
The Kubernetes documentation they link to is CC BY 4.0. Each unit lists its sources, and
the app shows them on the unit's Overview.
