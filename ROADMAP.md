# Knowclick — Roadmap

Technical knowledge by memory and by practice, in the order the owner wants to learn it:
Kubernetes (CKAD, CKA), cloud certifications (Azure first: AZ-900, then AI-200; then AWS and
Google Cloud), Claude certifications,
languages (Rust, PowerShell, advanced Python), libraries (Neo4j, Kafka, LangChain), and
whatever else needs exercising. Audience size is not a goal.

## Status

**[v0.1.0](https://github.com/diegoami/knowclick/releases/tag/v0.1.0) is released**: the
Kubernetes pack with three boards and six tasks. **v0.2.0 is in progress**
([proposal #3](https://github.com/diegoami/knowclick/issues/3), agreed): the Azure pack for
AZ-900, typed answers on every board, and coverage weights as ranges.

## Milestones

| Milestone | Delivers                                                                                                                                                       |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v0.1.0    | Kubernetes (CKAD): a table, a manifest and a lines board, six hands-on tasks, Review, verification                                                             |
| v0.2.0    | Azure (AZ-900), typed answers, coverage weight ranges ([proposal #3](https://github.com/diegoami/knowclick/issues/3))                                          |
| v0.3.0    | AI-200, AZ-204's successor, in the Azure pack, with Python, AKS and Bicep verification                                                                         |
| v0.4.0    | CKA coverage in the Kubernetes pack                                                                                                                            |
| v0.5.0    | Claude certifications, as a `claude` pack; scope in its own proposal (see below)                                                                               |
| Later     | Downloads; languages (Rust, PowerShell, Python); AWS and Google Cloud explained against Azure; libraries (Neo4j, Kafka, LangChain); Windows and Android builds |

A later milestone gets its scope settled in its own proposal.

## Current course priorities (owner approved 2026-11-04)

Azure and Rust take priority over the later milestones above. The approved
increments are [Azure developer foundations #14](https://github.com/diegoami/knowclick/issues/14)
and [Rust foundations #15](https://github.com/diegoami/knowclick/issues/15).

- Azure: three additional lessons on managed identity and authorization, Bicep,
  and Functions/messaging, with three local labs. Existing AZ-900 content and
  progress identities are preserved. This is not full AI-200 coverage.
- Rust: four lessons and four compiler-verified boards, with local labs covering
  moves/borrows, structured state, fallible parsing and a tested text-summary CLI.
- Next recommendation: TypeScript, especially narrowing, discriminated unions,
  generics, async error handling and tests. The app's strict TypeScript, Svelte
  and Vitest stack provides immediate practice. No TypeScript pack is added yet.

These course increments are authored but **not release-ready**: two independent
content checks are still required for the new and changed targets. Existing
check records are retained, and stale checks remain failing until independently
renewed. Release numbering and publication are separate from these increments.

**Claude certifications** (asked for on 2026-11-02). Anthropic launched the Claude
Certified Architect, Foundations in March 2026, and third-party guides list four
credentials by July (Associate, Developer, Architect Foundations, Architect Professional),
taken through Pearson VUE. Some sources say registration needs an organization in the
Claude Partner Network. None of this is confirmed against Anthropic's own pages yet; the
proposal does that first, with the exam guides, before any content is written.

## Cross-course practice levels (owner approved 2026-11-04)

[Proposal #17](https://github.com/diegoami/knowclick/issues/17): Guided choices,
unassisted Recall, and practical Apply across every existing course. Rust's enum
lesson demonstrates complete-arm recall beyond its guided keyword gaps. Assisted
practice is tracked separately; existing progress is preserved. Apply uses
lesson tasks with explicit self-assessment and local checks. Lessons without
authored tasks explain that limitation instead of claiming a harder exercise.

## Corrected exercise difficulty (owner clarified 2026-11-04)

[Proposal #19](https://github.com/diegoami/knowclick/issues/19) implements both
more meaningful gaps and more candidate answers within the same exercise. Rust's
enum board has 10 gaps and 16 distinct choices. Small Rust/Bicep code boards are
expanded, and authored wrong options also support the existing command/manifest
boards. This corrects the broader interpretation in #17. Content checks for
new or changed choices and clues still require genuine independent reviewers.

## Rust exercise coverage (owner approved 2026-11-04)

[Proposal #21](https://github.com/diegoami/knowclick/issues/21) completes the same
more-gaps/more-choices treatment across the existing Rust course. Ownership,
Enums, Errors and Iterators each have ten meaningful gaps and 16–18 distinct
candidate answers. The full-arm recall variant covers four states with its own
wrong-arm choices. Ownership practises shared borrowing followed by exclusive
mutation, errors distinguish absent input from invalid input, and iteration
checks that the borrowed collection remains usable. This updates all existing
Rust exercises; it does not claim an exhaustive language curriculum.

## Preserve the original quiz learning flow (2026-11-04)

[Fix #23](https://github.com/diegoami/knowclick/issues/23): keep placed answers,
choice order and completed rounds when leaving/returning, including reloads.
Typed drafts persist, navigation is not assistance, and only an explicit restart
replaces the current round. Earned progress remains separate and intact.
