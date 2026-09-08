# RCLootCouncil API

[![CI](https://github.com/s0melchuk/RCLootCouncilApi/actions/workflows/ci.yml/badge.svg)](https://github.com/s0melchuk/RCLootCouncilApi/actions/workflows/ci.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

Tracks RCLootCouncil loot results: a static frontend for browsing, an API for
querying, and an ingest endpoint a (future) native chat-log-scanning app can
push data to.

Live at: https://rclootcouncil-api.pages.dev

Interactive API docs (Swagger UI): https://rclootcouncil-api.pages.dev/docs.html
— raw spec at [`/openapi.yaml`](public/openapi.yaml).

## Stack

- **Hosting**: Cloudflare Pages (static `public/` + file-based `functions/` API routes)
- **Database**: Cloudflare D1 (SQLite) — free tier, no inactivity pause/deletion
- **Auth**: shared API key (`INGEST_API_KEY`) required on `POST /api/loot`

## Layout

```
public/            static frontend (index.html, style.css, app.js)
public/openapi.yaml  OpenAPI 3.0 spec, served statically and rendered by public/docs.html
functions/api/     API routes (Pages Functions, file-based routing)
migrations/        D1 SQL migrations
wrangler.toml      Pages + D1 binding config
```

## API

Full request/response shapes: [`/docs.html`](public/docs.html) (Swagger UI) or
[`/openapi.yaml`](public/openapi.yaml) directly. Quick reference:

- `GET /api/loot?raid=&player=&item=&from=&to=&difficulty=&slot=&sort=&order=&limit=&offset=` —
  list/filter awards. `player` and `item` match as a substring (case-sensitive
  `LIKE`); the rest match exactly. `sort` is one of `awarded_at` (default),
  `raid`, `boss`, `item_name`, `winner`, `response`, `difficulty`, `slot`,
  `votes`; `order` is `asc` or `desc` (default `desc`). Response includes
  `total` (count matching the filters, ignoring `limit`/`offset`) for
  building page controls.
- `GET /api/stats/:player` — class/spec (if known), item count, MS/OS-by-difficulty
  breakdown, slots already received, and recent awards for one player
- `GET /api/players` — full roster (name, class, spec)
- `POST /api/loot` — insert one record, or `{ "records": [...] }` for bulk.
  Requires header `X-API-Key: <INGEST_API_KEY>`.
- `PATCH /api/loot/:id` — update any subset of fields on one award (`null`
  clears an optional field). Requires `X-API-Key`.
- `DELETE /api/loot/:id` — delete one award. Requires `X-API-Key`.
- `POST /api/players` — upsert one roster entry, or `{ "players": [...] }` for bulk.
  Requires header `X-API-Key: <INGEST_API_KEY>`.
- `DELETE /api/players/:name` — remove one roster entry. Requires `X-API-Key`.

Loot record shape:
```json
{
  "awarded_at": "2026-09-06T21:14:00Z",
  "raid": "Molten Core",
  "boss": "Ragnaros",
  "item_id": 17182,
  "item_name": "Sulfuras, Hand of Ragnaros",
  "winner": "Thrallpull",
  "response": "MS",
  "difficulty": "NM",
  "slot": "Weapon",
  "votes": 5,
  "note": null,
  "raw_source": "<original chat log line, optional>"
}
```

Player (roster) record shape:
```json
{
  "name": "Thrallpull",
  "class": "Shaman",
  "spec": "Enhancement"
}
```

## Local dev

```bash
npm install
cp .dev.vars.example .dev.vars   # then edit the key
npm run db:create                # first time only — paste the printed database_id into wrangler.toml
npm run db:migrate:local
npm run dev
```

## Deploying (first-time setup, walked through together)

1. Create a Cloudflare account (free) and authenticate `wrangler`.
2. `npm run db:create` against the **remote** account, put the real `database_id` in `wrangler.toml`.
3. `npm run db:migrate:remote` to create the schema on the live D1 database.
4. `wrangler pages secret put INGEST_API_KEY` to set the real ingest key (never commit it).
5. `npm run deploy` to publish the Pages project.
6. Point the native scanner app at `https://<project>.pages.dev/api/loot` with the `X-API-Key` header.

None of this needs a credit card, and Cloudflare doesn't pause or delete idle
Pages/D1 resources the way some other free tiers do.

## Continuous deployment

Every push to `main` that passes `typecheck` automatically:
1. Applies any new D1 migrations to the live database (`wrangler d1 migrations apply --remote`)
2. Deploys `public/` + `functions/` to Cloudflare Pages

This runs in [`.github/workflows/ci.yml`](.github/workflows/ci.yml) via
[`cloudflare/wrangler-action`](https://github.com/cloudflare/wrangler-action),
authenticated with two repo secrets:

- `CLOUDFLARE_API_TOKEN` — scoped token with Pages (Edit) and D1 (Edit) permissions
- `CLOUDFLARE_ACCOUNT_ID` — from the Cloudflare dashboard sidebar

Manual deploys (`npm run deploy` / `npm run db:migrate:remote`) still work
too, e.g. for local testing before pushing.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup and PR guidelines.

## Security

Found a vulnerability? See [SECURITY.md](SECURITY.md) for how to report it privately.

## License

[GPL-3.0](LICENSE)
