# Knowclick — Architecture

A client-only web app, in the shape of
[LangClick2027](https://github.com/diegoami/LangClick2027) and
[Geoclick2027](https://github.com/diegoami/Geoclick2027): one web core, with no backend
and no accounts; progress stays on the device. Code copied from Langclick names its
origin commit (591043e).

## Layout

| Path                   | What it is                                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `packs/<id>/`          | Authored content: manifest, units, tasks, layers, coverage, checks and the verify record. See `packs/README.md`            |
| `locales/`             | Interface text, one file per language, outside the engine                                                                  |
| `packages/pack-format` | The pack types, the validator, localizing a unit, code-board parsing, content checks, coverage and verify jobs. Pure       |
| `packages/quiz-engine` | What a drop means: a round's cells, their status, the score. Pure, unchanged from Langclick                                |
| `packages/srs`         | The scheduler, unchanged from Langclick and Geoclick: an earned level and a due date per card. Pure                        |
| `app/src/lib`          | The screens and their state                                                                                                |
| `app/src/routes`       | Home, `/lesson/[pack]/[lesson]`, `/review/[pack]`, and `/unit/[pack]/[unit]` with `overview` and `quiz`                    |
| `scripts/`             | Gates, version sync, `pack-check.mjs` (checker records), `verify.mjs` (runs answers in a sandbox), `coverage.mjs` (report) |

## How a learner moves through it

Study, recall, practise, then repetition. A lesson page links to what to study and lets
you mark it studied, which locks nothing. Its boards come next, then its tasks, done by
hand on your own practice cluster and graded _again_, _hard_ or _good_ in a `TaskCard`.
`ReviewView` then deals what is due across every started board, one board at a time
using `QuizView`'s `only`, followed by the tasks that are due again.

## How a unit plays

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
progress lives in `quizRound.ts`, in memory only.

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
