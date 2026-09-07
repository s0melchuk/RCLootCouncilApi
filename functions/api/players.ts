import { badRequest, Env, isValidPlayer, json, PlayerInput, unauthorized } from "./_utils";

interface PagesContext {
  request: Request;
  env: Env;
}

// GET /api/players -> full roster (name, class, spec)
export async function onRequestGet(ctx: PagesContext): Promise<Response> {
  const { env } = ctx;
  const { results } = await env.DB.prepare(
    `SELECT name, class, spec, updated_at FROM players ORDER BY name`
  ).all();
  return json({ results });
}

// POST /api/players
// Body: a single roster entry, or { "players": [...] } for bulk. Upserts by name.
// Requires header: X-API-Key: <INGEST_API_KEY>
export async function onRequestPost(ctx: PagesContext): Promise<Response> {
  const { request, env } = ctx;

  const key = request.headers.get("X-API-Key");
  if (!env.INGEST_API_KEY || key !== env.INGEST_API_KEY) {
    return unauthorized();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("body must be valid JSON");
  }

  const records: unknown[] = Array.isArray((body as { players?: unknown[] })?.players)
    ? (body as { players: unknown[] }).players
    : [body];

  const validRecords: PlayerInput[] = [];
  for (const r of records) {
    if (!isValidPlayer(r)) {
      return badRequest("each entry requires a non-empty string field: name");
    }
    validRecords.push(r);
  }

  const stmt = env.DB.prepare(
    `INSERT INTO players (name, class, spec, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(name) DO UPDATE SET
       class = excluded.class,
       spec = excluded.spec,
       updated_at = excluded.updated_at`
  );

  const batch = validRecords.map((r) => stmt.bind(r.name, r.class ?? null, r.spec ?? null));

  await env.DB.batch(batch);

  return json({ upserted: validRecords.length }, 201);
}
