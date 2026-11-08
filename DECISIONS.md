# Knowclick — Decisions

The _why_ behind product and design choices. When a later decision supersedes an
earlier one, amend the entry. Langclick's decisions that carry over unchanged (a cell
accepts a slip by text; a drop off the board is not an answer; identical slips collapse;
review shows the board; checkers fill in verdicts and copy nothing) are in
[its DECISIONS.md](https://github.com/diegoami/LangClick2027/blob/main/DECISIONS.md) and
are not repeated here.

## Study, recall, practise (2026-10-31, #1)

The CKAD is done in a terminal, under time pressure. A board tests whether you remember
a flag or a field, which is necessary but not enough. So a lesson ends with tasks done by
hand on a practice cluster, and the learner says how each went. The same scheduler as the
boards brings them back: _again_ the same day, _hard_ sooner, _good_ later. Self-grading
is honest enough because the learner is the only one who gains by it.

## The app holds a task's place, not its text (2026-10-31, #1)

A task's prompt, setup and solution stay at the source, ckad-prep for now, so a scenario is
maintained in one place. The pack keeps the id, the time to aim for, what it needs and the
link, and one sentence of our own describing it.

## A pack is a subject, not an exam (2026-10-31, #1)

CKAD and CKA share kubectl and most resources. One `kubernetes` pack, with a coverage file
per exam, lets shared facts share progress, as Langclick has one course with different
explanations.

## A manifest is a board (2026-10-31, #1)

A grammar table works as Langclick's map because every form has its place. A manifest is
the same: a field means something only where it sits. So a `code` board shows the whole
block and every gap is a cell, rather than asking for fields one at a time. Its gaps are
named in the code by cell id, `{{gap:<id>}}`, because a line can hold more than one gap
and a marker like `___` can't say which. Commands, which have one gap each, keep
Langclick's `___` in a `lines` layout; the name `sentences` didn't fit code.

## Every pack says what it holds for (2026-10-31, #1)

Technical content goes stale: flags are removed, APIs are deprecated, services renamed.
`holdsFor` and `checkedOn` are required, shown on Home, and part of what checkers pass, so
a version change voids the checks that depended on it.

## Verify by running, in a sandbox the pack vouches for (2026-10-31, #1)

Two AI checks can share a blind spot, as Langclick found with "h, as in hat". A command
that runs is better evidence than two readers. `verify.mjs` fills in every answer and runs
it, and the gate requires its record to be current. It runs only after the pack's guard
confirms a disposable sandbox (the `kind-knowclick` context for Kubernetes), because the
commands are data and must never reach a real cluster.

Proposal #1 named `kubeconform` for the manifest. Server-side dry run with strict field
validation (`kubectl apply --dry-run=server --validate=strict`) checks the same schema
against the real 1.37 API server, with one tool fewer, so it is used instead.

## Engine-neutral by the packs' own keywords (2026-10-31, #1)

Langclick's language-neutral test used a fixed list, and its review #16 found languages
that list missed. Here each pack declares its `keywords`, and the test reads them, so a new
pack is covered by being there. The subjects already planned are listed as well.

## English only, and no comparison overlays yet (2026-10-31, #1)

Langclick's layers carry two choices: the language explained in, and the language
compared with. Knowclick keeps one layer per language and drops the comparison overlays
for now. "AWS explained against Azure" is the same idea and will come back as an overlay
when there is a second cloud pack to compare with (v0.6.0).

## The local port is 5195 (2026-10-31, #1)

Proposal #1 recommended 5194, but Langclick's browser tests use 5194 for their API. The dev
server is on 5195 and Knowclick's browser tests on 5196, so all of them can run at once.

## Code is MIT, packs are CC BY-SA 4.0 (2026-10-31, #1)

As in Langclick. The Kubernetes and Microsoft Learn documentation are CC BY 4.0, which a
share-alike pack can build on.

## Typing is a second skill, not a harder drag (2026-11-02, #3)

The CKAD is typed under time pressure, and producing an answer is different knowledge
from recognising it on a slip. So a typed answer is saved as a `produce` card, apart from
the `recognise` card dragging earns. Known shows the stronger of the two, because typing
is optional and a cell you can recognise is learned. Each mode reviews only its own
cards, so a miss in one doesn't bring the cell back in the other.

Typing asks one open place at a time, in board order, so the board stays the map: you see
where each answer goes. Case is ignored only on units that set `caseInsensitive`, for
names such as ExpressRoute; in a flag or a field, case is the answer.

## Published weight ranges are kept as ranges (2026-11-02, #3)

Microsoft publishes AZ-900's weights as 25–30%, 35–40% and 30–35%. Picking a number
inside each range would be inventing data, so a coverage weight can be `[min, max]`, and
the validator only asks that the ranges can make 100.

## AI-200 in place of AZ-204 (2026-11-02, #3)

Microsoft retired AZ-204 on 2026-07-31. AI-200, Developing AI Cloud Solutions on Azure, is
the developer exam now. It also overlaps the Kubernetes pack (AKS, containers) and the
planned LangChain pack (vector search, RAG). It comes in its own milestone, in the same
`azure` pack.

## Azure content follows Microsoft's current pages, not memory (2026-11-02, #3)

Two tables changed on the way. Microsoft revised its shared-responsibility matrix on
2026-08-24, so its rows are now customer data, configurations, identities, client devices
and so on, and client devices are shared under SaaS. The redundancy page no longer states
how many copies each option keeps, so the redundancy board asks what the page does state:
whether the data is spread across zones, copied to a secondary region, and durable when a
datacenter or the primary region is lost.

## Azure tasks are Microsoft's guided projects, in the learner's own account (2026-11-02, #3)

Proposal #3 expected Learn exercises with a free sandbox. The AZ-900 series now ends with
eight guided projects, written for it, that run in the learner's own Azure account and end
by deleting what they created. Six are linked as tasks. The task label says what they
need, "your own cloud account", and an agent never runs them.

## The Azure CLI is verified logged out (2026-11-02, #3)

`az <command> --help` proves a command and its flag exist in the installed CLI without
reaching Azure. The flag must start a line of the help, so a flag that is only mentioned,
or is a prefix of another, doesn't pass. The pack's guard refuses to run while `az` is
logged in, so a verify run can't touch a subscription.

## Azure and Rust first; local developer practice (2026-11-04, #14, #15)

The owner approved Azure developer foundations and a first Rust pack ahead of
other planned subjects. Azure's additional lessons are practical foundations,
not a claim of complete AI-200 coverage. New Azure labs are local: a least-privilege
design, Bicep compilation and a repeat-safe Python handler. They supplement the
existing learner-run cloud projects without requiring an account.

Rust uses edition 2024 with rustc 1.99.1 and the standard library. The existing
pack format supports complete code verification through stdin, so the engine
needs no extension. A small command-line helper compiles in temporary directories
and cleans them afterwards. Lab solutions include expected compiler failures,
unit tests and real CLI I/O. TypeScript is recommended next because it is the
app's own language, but it is not part of this increment.

Author execution and content review are separate evidence. No independent check
is invented or signed by the author under a second name. Missing independent
checks intentionally keep the content gate red and the work unmergeable.

## Support decreases across all courses (2026-11-04, #17)

The owner approved Guided, Recall and Apply as the general approach. Learning
objectives determine the gaps: recognize small syntax choices, reconstruct
larger expressions, then solve a practical problem. The existing static app
supports local compiler-tested tasks and self-assessment, not browser-side
execution of arbitrary submitted programs.

Existing recognise/produce/practise cards keep their identities. Hints and revealed solutions use a separate assisted skill. The original
policy also classified resumed rounds as assisted and hid solved answers until
completion; **superseded by #23** below to restore the expected learning flow. A wrong unassisted answer still resets its own recall progress.
Recommendations are optional and require repeated clean success.

A unit may reference a separate larger recall unit with new item IDs. This keeps
recognizing a keyword distinct from reconstructing a full expression, without
hard-coding a subject in the engine. Code reference answers compare tokens so
formatting changes do not create false mistakes. Apply accepts the learner's
implementation through its documented tests and honest self-assessment.

## Exercise difficulty means more gaps and plausible choices (2026-11-04, #19)

The owner clarified that both more gaps and more answer choices were intended
for the original code exercise. The earlier Guided/Recall/Apply implementation
was broader than that request. This correction changes the code boards
themselves: the enum example has ten meaningful gaps, eight distinct real
answers and eight additional choices. Other small code boards are expanded and
all courses can author extra choices without subject rules in the engine.

Wrong choices are explicit pack data, never guessed from unrelated subjects.
They stay visible until the round ends and are indistinguishable in appearance
from real choices. Choosing one penalizes the target gap and cannot create a
fake progress card. Filled-program checks remain separate from independent
review of newly authored gaps, clues and distractors.

## Every existing Rust board gets substantial practice (2026-11-04, #21; expanded by #25)

The owner asked to apply the clarified gap/choice approach to all Rust exercises.
Each main board now has ten gaps; no unrelated tokens are hidden just to inflate
that count. Ownership becomes a complete borrowing/mutation program; errors add
Option handling alongside Result; iterators also test the entry function and
continued use of the original collection. The existing enum board retains its
10-gap correction, while its larger-arm variant extends exhaustive matching to
four states. All completed examples compile and execute assertions locally.
Existing fact IDs are preserved; new facts get new IDs.

All Rust boards can now be code boards, so the pack regression checks standalone
clues on code as well as grid/line cells. This also avoids a vacuous assertion
when a pack has no grid/line board. Independent content checks remain separate
and outstanding; no automated execution is presented as independent review.

## A quiz stays filled until an explicit restart (2026-11-04, #23)

The owner reported that going to Known and back erased placed answers. This was
reproduced on the published hash-routed app: an in-memory round did not survive
navigation. The original Geoclick flow retains a sitting across lookups; here
snapshots must survive browser navigation/reloads as well.

Quiz snapshots are validated and stored separately per pack, unit and mode.
They retain completed rounds, the tray order, selected recall question and
unfinished typed text. Only an explicit restart replaces a round, except when
exercise content changes and the saved signature no longer matches. Earned
learning cards are not reset. Malformed snapshots are ignored and unavailable
storage falls back to memory. Review queues do not overwrite ordinary quizzes.

Placed recall answers remain visible. Navigation alone no longer turns a round
into assisted practice; explicit hints/reveals retain their existing assistance
tracking. This supersedes the corresponding visibility/resumption policy in #17.

## Rust depth and breadth; engineering courses next (2026-11-07, expanded 2026-11-08, #25–#29)

The owner approved 16 Rust chapters with four distinct exercise objectives and
two practical tasks per chapter. First deepen the existing four chapters rather
than count additional missing tokens as new exercises. Guided and Recall are
forms of one exercise: new Recall variants ask for complete expressions with
standalone clues specifying reference syntax. Apply accepts other valid
implementations through requirements and local checks. Existing unit, task and
item IDs are retained; larger-expression recall receives separate IDs.

The initial four-chapter scope in #15/#21 is superseded by #25's 16-chapter
course target. Draft PR #30 now covers eight chapters with 32 Guided/Recall
pairs and 16 labs. New chapters fill the prerequisite gaps in values/control
flow, modules, collections and generics; their order follows the Rust Book's
progression while preserving existing lesson IDs. Eight advanced and practical
chapters remain to complete the approved scope. Compile every board and run assertions;
compile lab solutions from their documentation, including negative diagnostics,
unit tests and CLI I/O. Cargo command practice is verified with a real temporary
project using the installed toolchain and no external dependencies, rather than
assuming that successful rustc compilation proves the Cargo workflow. These are
author verification, never independent content approval. Missing independent checks keep release readiness blocked.

Claude Engineering, LangChain, RAG Engineering and MLOps follow in that order,
with separate subject packs. Prefer deterministic local Python examples and
fixtures where providers would otherwise require paid calls. Fixture tests must
not claim live API compatibility or measured model answer quality. Versions and
specific references are pinned before authoring. New packs remain planned.

## Select a course before its chapters (2026-11-08, owner correction)

The owner clarified the intended navigation while testing the expanded course:
the landing page selects a course and every course has its own landing page.
Treat this as a correction within the approved course-expansion work. Home
therefore shows compact course cards, not all chapters from every pack.
Selected-course progress, chapter lists, source/version details and review stay
at `/course/[pack]`. Loading a chooser does not require reading every board or
loading unrelated progress. Lesson and review back links return to the selected
course, while an exercise returns to its parent lesson. Existing saved rounds
and progress IDs are unaffected.

The owner also requested deeper Kubernetes and Azure practice. Concrete
12-chapter expansions are proposed separately as #31 and #32, each with four
exercise pairs and at least two practical tasks per chapter. Their content
scope awaits agreement; the navigation correction does not imply those packs
have already been expanded.
