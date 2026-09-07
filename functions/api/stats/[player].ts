import { Env, json } from "../_utils";

interface PagesContext {
  request: Request;
  env: Env;
  params: { player: string };
}

// GET /api/stats/:player -> item count + last award for one player
export async function onRequestGet(ctx: PagesContext): Promise<Response> {
  const { env, params } = ctx;
  const player = decodeURIComponent(params.player);

  const totals = await env.DB.prepare(
    `SELECT COUNT(*) AS item_count, MAX(awarded_at) AS last_award_at
     FROM loot_awards WHERE winner = ?`
  )
    .bind(player)
    .first();

  const recent = await env.DB.prepare(
    `SELECT * FROM loot_awards WHERE winner = ? ORDER BY awarded_at DESC LIMIT 10`
  )
    .bind(player)
    .all();

  return json({ player, ...totals, recent: recent.results });
}
