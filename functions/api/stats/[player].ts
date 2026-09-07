import { Env, json } from "../_utils";

interface PagesContext {
  request: Request;
  env: Env;
  params: { player: string };
}

// GET /api/stats/:player -> item count + breakdown + slot coverage + recent awards for one player
export async function onRequestGet(ctx: PagesContext): Promise<Response> {
  const { env, params } = ctx;
  const player = decodeURIComponent(params.player);

  const profile = await env.DB.prepare(
    `SELECT class, spec FROM players WHERE name = ?`
  )
    .bind(player)
    .first();

  const totals = await env.DB.prepare(
    `SELECT COUNT(*) AS item_count, MAX(awarded_at) AS last_award_at
     FROM loot_awards WHERE winner = ?`
  )
    .bind(player)
    .first();

  // Mirrors the guild's RESULTS-sheet breakdown: response x difficulty counts.
  const breakdown = await env.DB.prepare(
    `SELECT response, difficulty, COUNT(*) AS count
     FROM loot_awards WHERE winner = ?
     GROUP BY response, difficulty`
  )
    .bind(player)
    .all();

  // Mirrors the guild's "already received this slot" flags.
  const slots = await env.DB.prepare(
    `SELECT DISTINCT slot FROM loot_awards WHERE winner = ? AND slot IS NOT NULL`
  )
    .bind(player)
    .all();

  const recent = await env.DB.prepare(
    `SELECT * FROM loot_awards WHERE winner = ? ORDER BY awarded_at DESC LIMIT 10`
  )
    .bind(player)
    .all();

  return json({
    player,
    class: (profile as { class?: string } | null)?.class ?? null,
    spec: (profile as { spec?: string } | null)?.spec ?? null,
    ...totals,
    breakdown: breakdown.results,
    slots_received: (slots.results as { slot: string }[]).map((r) => r.slot),
    recent: recent.results,
  });
}
