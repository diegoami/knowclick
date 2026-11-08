# Knowclick — Architecture

A client-only web app, in the shape of
[LangClick2027](https://github.com/diegoami/LangClick2027) and
[Geoclick2027](https://github.com/diegoami/Geoclick2027): one web core, with no backend
and no accounts; progress stays on the device. Code copied from Langclick names its
origin commit (591043e).

## Layout

| Path                   | What it is                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `packs/<id>/`          | Authored content: manifest, units, tasks, layers, coverage, checks and the verify record. See `packs/README.md`                     |
| `locales/`             | Interface text, one file per language, outside the engine                                                                           |
| `packages/pack-format` | The pack types, the validator, localizing a unit, code-board parsing, content checks, coverage and verify jobs. Pure                |
| `packages/quiz-engine` | What a drop means: a round's cells, their status, the score. Pure, unchanged from Langclick                                         |
| `packages/srs`         | The scheduler, unchanged from Langclick and Geoclick: an earned level and a due date per card. Pure                                 |
| `app/src/lib`          | The screens and their state                                                                                                         |
| `app/src/routes`       | Course chooser, `/course/[pack]`, `/lesson/[pack]/[lesson]`, `/review/[pack]`, and `/unit/[pack]/[unit]` with `overview` and `quiz` |
| `scripts/`             | Gates, version sync, `pack-check.mjs` (checker records), `verify.mjs` (runs answers in a sandbox), `coverage.mjs` (report)          |

## How a learner moves through it

Home is a course chooser: one card per pack with chapter, exercise and task
counts. It reads manifests and localized course text, without loading every
board or every pack's progress. `/course/[pack]` loads the selected course and
its progress and shows only its sections, chapters, sources/version information
and due-review action. Lessons and Review return to their course; unit screens
return to their lesson. Existing deep links and progress keys are retained.

Study, recall, practise, then repetition. A lesson page links to what to study and lets
you mark it studied, which locks nothing. Its boards come next, then its tasks, done by
hand on your own practice cluster and graded _again_, _hard_ or _good_ in a `TaskCard`.
`ReviewView` then deals what is due across every started board, one board at a time
using `QuizView`'s `only`, followed by the tasks that are due again.

## How a unit plays

Quiz and review routes share Guided/Recall/Apply through `PracticeLevelSwitch`
and `practiceLevel.svelte.ts`. Guided uses `QuizView`; Recall uses `TypeQuizView`
without answer-bearing code context; Apply presents the lesson's tasks with
explicit self-assessment. Independent progress counts and recommendation logic
use skill-specific cards, not a merged mastery score.

An optional `recallUnit` references a larger authored challenge in the same pack.
The loader attaches its localized representation to the primary unit. Missing,
self-referencing or nested variants are rejected. The variant receives normal
content checks and executable verification. Its own item IDs are used by Recall
and review. Assisted cards persist alongside existing skills and are excluded
from mastery and recommendations.

`Board.svelte` draws a unit's layout: a table, a grid, a list of lines, or one block of
code with its gaps inline. Each cell carries `data-cell-id`. It knows nothing about what
a cell shows; three screens fill that in through a snippet:

- `OverviewView` shows every answer, and the unit's sources.
- `KnownView` shows only what `progress.svelte.ts` says has been earned, more strongly at
  each level.
- `QuizView` shows answers as they resolve, and owns the tray and the pointer. The tray
  groups identical slips with a count, and a `dealAll` unit always offers every slip.
- `TypeQuizView` is the other way to answer: one open place is asked at a time, in
  `boardOrder`, and `attemptTyped` compares what was typed. `AnswerModeSwitch` chooses
  between the two on the Quiz and Review pages, and `answerMode.svelte.ts` remembers the
  choice per browser.

**A round.** `createQuizSession` makes one item per cell, and the hand holds slips named by
the id of the cell they were dealt for. Every drop goes through `attemptMatch`, which
compares **text, not ids**, so a `v1` slip fills any `v1` cell. A wrong drop reveals the
slip's own cell and lowers its level; there is one attempt per slip per round. A round in
progress lives in `quizRound.ts`, in validated browser storage with a memory fallback.
Placed answers, the choice order, typed drafts and completed rounds survive
navigation and reloads. A new round starts only on the explicit restart action
or when the exercise facts/structure no longer match its saved signature.
Learned cards are separate and are never cleared by restarting.

**Progress.** Board answers and task grades both go through `rate` from `packages/srs` and
are saved at once by `progressRepository.ts`, keyed by pack, item and skill: a dragged
answer is a `recognise` card, a typed one a `produce` card, and a task a `practise` card.
A cell's level is the stronger of its two answer cards, and Review asks the cards of the
chosen mode.

## Languages

`locale.svelte.ts` picks the interface language from the browser when a locale file
exists for it, and English otherwise. Packs follow the same choice through `layerFor`: a
pack's text lives in one layer per language, so facts (answers, code, versions) are
written once. Only English exists in v0.1.0.

## Packs

The Rust pack adds language learning through the existing format; no screen or
engine changes are needed. Azure developer foundations extend its existing
manifest. Original local task prompts and reference solutions live in
`docs/courses/`. `scripts/verify-local-code.mjs` compiles Rust/Bicep board code in
a disposable temporary directory; Rust programs run their assertions and the
Bicep output is checked as a template. It never deploys or downloads dependencies.
The Rust course has eight chapters with four main units per lesson, each
referencing its own larger Recall unit. Existing main-unit and item identities are retained.
`docs/courses/rust-depth-labs.md` adds the second local task for each chapter.
`docs/courses/rust-core-labs.md` supplies labs for values/control flow, modules,
collections and generics. `scripts/verify-rust-labs.mjs` compiles reference
blocks directly from all three Rust lab documents, runs their tests, checks
expected E0382/E0616 diagnostics and exercises CLI stdin/stdout. Small
`verify-rust` JSON comments annotate expected failures and I/O cases. A
`"cargo": "bin"` annotation additionally creates a temporary dependency-free
Cargo project and runs check, build, test and run offline. No copied solution
fixture is maintained.

Verification requires `rustc` and `bicep` on PATH. The Azure CLI guard and existing
CLI verification entries are preserved.

The Azure cloud chapter keeps its original concept grid and responsibility
table, with scenario-based Recall grids covering the same 55 permanent facts.
Two additional Guided/Recall pairs cover service-model decisions and scaling
controls. `docs/courses/azure-cloud-labs.md` contains the local design rubric
and optional Python policy fixture; it does not call a cloud API or model all
Azure Monitor behavior. Conceptual answer keys are checked against their linked
sources; executing the fixture does not independently approve those facts.

Everything is read through `PackSource` in `packs.ts`: today the local `packs/` folder,
later downloads behind the same interface. Check records, the verify record and coverage
stay out of what the app bundles.

## What keeps it honest

- `packs.test.ts` runs the validator, the coverage check, the recorded content checks and
  the recorded verification over every pack in `packs/`, so a new pack is covered by being
  there.
- `scripts/verify.mjs` runs every runnable answer against a sandbox the pack's guard
  vouches for, and writes the record the gate reads. It is not a gate itself, so the gates
  need no cluster.
- `engineNeutral.test.ts` fails if engine code names a subject: every pack's `keywords`,
  and the subjects already planned.
- `locales.test.ts` keeps interface languages in step.
- `QuizView.svelte.test.ts` plays rounds, tasks and reviews in real Chromium against real
  pack data.

## GitHub Pages

`npm run build:pages` creates a disposable route overlay, retaining authored
loaders and imports while removing server-rendering options incompatible with
hash routing. The Pages-only Vite configuration uses the repository base path
and `index.html` entry. Authored routes and the normal build remain unchanged.
The workflow publishes only `app/build/`; content and progress remain local-first.

## Authored extra answer choices

`Unit.distractors` supplies plausible wrong choices; localization preserves them
and content-check targets bind their exact values. The pack validator rejects
empty, duplicated and actually correct choices. `QuizView` merges them into the
existing tray and shuffles once per round. They do not enter the quiz session or
progress store as items. A wrong extra choice is evaluated against its selected
gap via the existing typed-answer logic. Real answer slips retain their existing
matching, grouped counts and refill policy. Extra options remain to the end.

Direct links to an authored recall variant resolve their parent lesson from the
loaded course, preserving the lesson breadcrumb and practical tasks. A pack may
contain only code boards; standalone-clue regression checks therefore include
code layouts as well as grid and line layouts.
