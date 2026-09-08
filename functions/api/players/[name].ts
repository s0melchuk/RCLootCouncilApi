import { Env, json, notFound, unauthorized } from "../_utils";

interface PagesContext {
  request: Request;
  env: Env;
  params: { name: string };
}

// DELETE /api/players/:name
// Requires header: X-API-Key: <INGEST_API_KEY>
export async function onRequestDelete(ctx: PagesContext): Promise<Response> {
  const { request, env, params } = ctx;

  const key = request.headers.get("X-API-Key");
  if (!env.INGEST_API_KEY || key !== env.INGEST_API_KEY) {
    return unauthorized();
  }

  const name = decodeURIComponent(params.name);
  const result = await env.DB.prepare(`DELETE FROM players WHERE name = ?`).bind(name).run();
  if (result.meta.changes === 0) {
    return notFound();
  }

  return json({ deleted: name });
}
