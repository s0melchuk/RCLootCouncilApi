import { badRequest, Env, json, notFound, parseLootPatch, unauthorized } from "../_utils";

interface PagesContext {
  request: Request;
  env: Env;
  params: { id: string };
}

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// PATCH /api/loot/:id
// Body: any subset of loot_awards columns to update.
// Requires header: X-API-Key: <INGEST_API_KEY>
export async function onRequestPatch(ctx: PagesContext): Promise<Response> {
  const { request, env, params } = ctx;

  const key = request.headers.get("X-API-Key");
  if (!env.INGEST_API_KEY || key !== env.INGEST_API_KEY) {
    return unauthorized();
  }

  const id = parseId(params.id);
  if (id === null) {
    return badRequest("id must be a positive integer");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("body must be valid JSON");
  }

  const parsed = parseLootPatch(body);
  if (!parsed.ok) {
    return badRequest(parsed.error);
  }

  const columns = Object.keys(parsed.fields);
  const setClause = columns.map((col) => `${col} = ?`).join(", ");
  const values = columns.map((col) => parsed.fields[col as keyof typeof parsed.fields] ?? null);

  const result = await env.DB.prepare(`UPDATE loot_awards SET ${setClause} WHERE id = ?`)
    .bind(...values, id)
    .run();

  if (result.meta.changes === 0) {
    return notFound();
  }

  const updated = await env.DB.prepare(`SELECT * FROM loot_awards WHERE id = ?`).bind(id).first();
  return json(updated);
}

// DELETE /api/loot/:id
// Requires header: X-API-Key: <INGEST_API_KEY>
export async function onRequestDelete(ctx: PagesContext): Promise<Response> {
  const { request, env, params } = ctx;

  const key = request.headers.get("X-API-Key");
  if (!env.INGEST_API_KEY || key !== env.INGEST_API_KEY) {
    return unauthorized();
  }

  const id = parseId(params.id);
  if (id === null) {
    return badRequest("id must be a positive integer");
  }

  const result = await env.DB.prepare(`DELETE FROM loot_awards WHERE id = ?`).bind(id).run();
  if (result.meta.changes === 0) {
    return notFound();
  }

  return json({ deleted: id });
}
