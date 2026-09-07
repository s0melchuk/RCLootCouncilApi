# Contributing

This is a small personal/guild-utility project, but issues and PRs are
welcome.

## Setup

```bash
npm install
cp .dev.vars.example .dev.vars   # edit the placeholder key
npm run db:migrate:local
npm run dev
```

## Before opening a PR

- Run `npx tsc --noEmit` and make sure it's clean.
- Don't commit real secrets — `.dev.vars`, real `INGEST_API_KEY` values, or
  actual guild/player data belong nowhere in the repo. See [SECURITY.md](SECURITY.md).
- If you change the schema, add a new file under `migrations/` rather than
  editing an existing one (D1 migrations are append-only).
- Keep the frontend dependency-free (plain HTML/CSS/JS) unless there's a
  strong reason to add a build step.

## Reporting bugs / requesting features

Use the issue templates — they'll prompt for what's needed to act on it.
