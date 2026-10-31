# Knowclick

Technical knowledge by memory and by practice: certifications such as CKAD, CKA
and Azure, languages such as Rust and PowerShell, libraries such as Neo4j, Kafka
and LangChain. A board shows what you are expected to know, you quiz yourself by
filling it in, you practise the tasks that have to be done by hand, and what you
get right shows as known. Content comes as pluggable subject packs. A sibling of
[LangClick2027](https://github.com/diegoami/LangClick2027) and
[Geoclick2027](https://github.com/diegoami/Geoclick2027). Created by Diego
Amicabile.

Early development; nothing is released yet. The first milestone is planned in the
[v0.1.0 proposal](https://github.com/diegoami/knowclick/issues/1).

## Quick start

```bash
git clone git@github.com:diegoami/knowclick.git
cd knowclick
npm install
npm run setup-hooks              # once per clone: pre-push runs the quality gates
npx playwright install chromium  # once per machine: component tests run in it
npm run dev
```

Open <http://localhost:5195>. Progress is kept in your browser.

`npm run gates` runs the four quality gates (typecheck, tests, lint, build), and
the pre-push hook runs them too. There is no CI: skip the hook for a single push
with `git push --no-verify`.

## Licence

Code: [MIT](LICENSE). Subject packs: [CC BY-SA 4.0](packs/LICENSE).

## More docs

- [ARCHITECTURE.md](ARCHITECTURE.md) — how it is built
- [ROADMAP.md](ROADMAP.md) — what's built, what's next
- [DECISIONS.md](DECISIONS.md) — the *why*
- [packs/README.md](packs/README.md) — how to write a subject pack
- [AGENTS.md](AGENTS.md) and [docs/RELEASES.md](docs/RELEASES.md) — how the
  project is run
