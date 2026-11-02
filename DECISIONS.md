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
