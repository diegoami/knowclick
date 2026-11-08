# Knowclick — Roadmap

Technical knowledge by memory and by practice, in the order the owner wants to learn it:
Kubernetes (CKAD, CKA), cloud certifications (Azure first: AZ-900, then AI-200; then AWS and
Google Cloud), Claude and OpenAI certification preparation,
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
| v0.4.0    | CKAD + CKA coverage in the Kubernetes pack ([scope #31](https://github.com/diegoami/knowclick/issues/31))                                                      |
| v0.5.0    | Claude certifications, as a `claude` pack; scope in its own proposal (see below)                                                                               |
| Later     | Downloads; languages (Rust, PowerShell, Python); AWS and Google Cloud explained against Azure; libraries (Neo4j, Kafka, LangChain); Windows and Android builds |

A later milestone gets its scope settled in its own proposal.

## Course priorities (initial approvals 2026-11-04; expanded 2026-11-08)

Azure and Rust were the initial priorities. The 2026-11-08 scope below also
requires CKA and Claude/OpenAI credential preparation. The original approved
increments are [Azure developer foundations #14](https://github.com/diegoami/knowclick/issues/14)
and [Rust foundations #15](https://github.com/diegoami/knowclick/issues/15).

- Azure: three additional lessons on managed identity and authorization, Bicep,
  and Functions/messaging, with three local labs. Existing AZ-900 content and
  progress identities are preserved. This is not full AI-200 coverage.
- Rust: the original four lessons and four compiler-verified boards, with local labs covering
  moves/borrows, structured state, fallible parsing and a tested text-summary CLI.
- Next recommendation: TypeScript, especially narrowing, discriminated unions,
  generics, async error handling and tests. The app's strict TypeScript, Svelte
  and Vitest stack provides immediate practice. No TypeScript pack is added yet.

These course increments are authored but **not release-ready**: two independent
content checks are still required for the new and changed targets. Existing
check records are retained, and stale checks remain failing until independently
renewed. Release numbering and publication are separate from these increments.

**Claude certification preparation** (expanded request 2026-11-08).
Anthropic's [official program announcement](https://claude.com/resources/articles/four-role-based-claude-certifications)
confirms Associate: Foundations, Developer: Foundations, Architect: Foundations
and Architect: Professional. [Proposal #26](https://github.com/diegoami/knowclick/issues/26)
now includes those tracks within the same Claude subject pack as the approved
engineering course, with Developer and Architect Foundations first. Its
[Academy FAQ](https://academy.claude.com/help/faq) distinguishes completion
badges from the partner certification exams. Detailed exam objectives still
need a permitted published guide; the public role descriptions do not establish
full curriculum coverage. Earlier unconfirmed third-party claims are superseded
by these official sources.

**OpenAI credential preparation** (requested 2026-11-08).
[Proposal #33](https://github.com/diegoami/knowclick/issues/33) records the
[OpenAI Certified program](https://help.openai.com/en/articles/20001151-openai-certified-app)
and separately labelled public Academy practice. Certified access is currently
invite-only for eligible Enterprise/Edu workspaces. The
[current Academy guidance](https://help.openai.com/en/articles/20001270-openai-academy-courses)
explicitly distinguishes completion badges/pathway certificates from
certifications. Public developer API/Codex learning paths must not be presented
as an invented developer certification. Exact Certified credential objectives
and the owner's preferred emphasis still need confirmation; no OpenAI content
or certification coverage is authored yet.

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

## Rust expansion and engineering courses (owner approved 2026-11-07)

[Proposal #25](https://github.com/diegoami/knowclick/issues/25) expands Rust to
16 chapters, each with four distinct exercises (Guided and larger Recall forms)
and two local Apply tasks. It supersedes the four-lesson breadth of #15/#21;
existing progress IDs and learning-flow decisions remain in force.

[Draft PR #30](https://github.com/diegoami/knowclick/pull/30) now contains eight
chapters: Cargo/values/control flow, ownership, structs/enums, modules and
visibility, strings/vectors/hash maps, fallible parsing, generics/traits and
iterator pipelines. Each has four Guided/Recall exercise pairs and two Apply
labs: 32 Guided boards, 32 Recall boards and 16 tasks in total. Existing board,
lesson and task identities are preserved. Lab links target main when merged.

All board reference programs and lab solutions are checked locally against
Rust 1.99.1 / edition 2024, including expected ownership/privacy diagnostics and
the Cargo check/build/test/run workflow. Execution remains separate from the
still-required independent content checks. Eight planned chapters remain:
lifetimes, testing, files/CLI, smart pointers, concurrency, async, advanced
traits/macros and the capstone. This is not yet the complete 16-chapter course.

The owner also approved eight-chapter proposals for
[Claude Engineering #26](https://github.com/diegoami/knowclick/issues/26),
[LangChain #27](https://github.com/diegoami/knowclick/issues/27),
[RAG Engineering #28](https://github.com/diegoami/knowclick/issues/28) and
[MLOps #29](https://github.com/diegoami/knowclick/issues/29), following Rust in
that order. Each targets four exercises and two tasks per chapter. Claude
Engineering provisionally includes API engineering and Claude Code; the exact
emphasis awaits the owner's clarification. These packs are not authored yet.

## Course navigation and deeper cloud practice (owner correction 2026-11-08)

Draft PR #30 includes the requested course chooser at home and dedicated
`/course/[pack]` landing pages. Home lists courses with compact size summaries;
only the chosen course shows its chapters, progress, versions and review.
Lessons and Review return to that course. The eight-chapter Rust work and all
existing direct exercise URLs and saved progress are retained.

The owner approved [Azure #32](https://github.com/diegoami/knowclick/issues/32)
on 2026-11-08: twelve chapters, four Guided/Recall pairs and at least two
practical tasks per chapter. No further scope approval is needed to implement
those increments.

[Kubernetes #31](https://github.com/diegoami/knowclick/issues/31) must cover both
CKAD and CKA, per the owner's correction on 2026-11-08. Its working plan is now
twenty chapters, four exercise pairs and at least two labs per chapter. Twelve
shared/application chapters are supplemented by eight administration chapters
covering node infrastructure, kubeadm, high availability/recovery, upgrades,
scheduling, scaling, extensions and cluster troubleshooting. The existing CKAD
coverage map is retained and a separate CKA map is required; shared facts keep
shared progress in one subject pack. The current validator requires every task
to map to each curriculum; #31 therefore includes generic explicit out-of-scope
task accounting with reasons, so credential-specific labs are not falsely
mapped to another exam. CKA is required scope, superseding the
previous suggestion to defer administration.

Neither content expansion is authored yet. The current packs remain three
Kubernetes chapters/three main exercises/six tasks and eight Azure
chapters/twelve main exercises/nine tasks. New content requires source checks
and actual verification. Application checks use the guarded local kind cluster;
kubeadm/host-level administration needs a separately guarded disposable
multi-node environment, since passing in kind cannot verify those procedures.
The official [CKA curriculum](https://github.com/cncf/curriculum/blob/main/cka/README.md)
and [published competencies](https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/)
guide the new coverage mapping. Certification-track details for Claude and
OpenAI are recorded above and in #26/#33; no credential is earned in Knowclick.
