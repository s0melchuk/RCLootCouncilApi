import { Env, json } from "./_utils";

interface PagesContext {
  request: Request;
  env: Env;
}

interface RosterRow {
  name: string;
  class: string | null;
  spec: string | null;
}
interface TotalsRow {
  winner: string;
  item_count: number;
  last_award_at: string | null;
}
interface BreakdownRow {
  winner: string;
  response: string | null;
  difficulty: string | null;
  count: number;
}
interface SlotRow {
  winner: string;
  slot: string;
}

// GET /api/stats -> the same per-player summary as GET /api/stats/:player,
// for every player who has a roster entry and/or at least one award.
// Four set-based queries regardless of roster size, merged in memory --
// deliberately not N calls to /api/stats/:player.
export async function onRequestGet(ctx: PagesContext): Promise<Response> {
  const { env } = ctx;

  const [roster, totals, breakdown, slots] = await Promise.all([
    env.DB.prepare(`SELECT name, class, spec FROM players`).all<RosterRow>(),
    env.DB.prepare(
      `SELECT winner, COUNT(*) AS item_count, MAX(awarded_at) AS last_award_at
       FROM loot_awards GROUP BY winner`
    ).all<TotalsRow>(),
    env.DB.prepare(
      `SELECT winner, response, difficulty, COUNT(*) AS count
       FROM loot_awards GROUP BY winner, response, difficulty`
    ).all<BreakdownRow>(),
    env.DB.prepare(
      `SELECT DISTINCT winner, slot FROM loot_awards WHERE slot IS NOT NULL`
    ).all<SlotRow>(),
  ]);

  const rosterByName = new Map(roster.results.map((r) => [r.name, r]));
  const totalsByName = new Map(totals.results.map((r) => [r.winner, r]));
  const breakdownByName = new Map<string, { response: string | null; difficulty: string | null; count: number }[]>();
  for (const row of breakdown.results) {
    const list = breakdownByName.get(row.winner) ?? [];
    list.push({ response: row.response, difficulty: row.difficulty, count: row.count });
    breakdownByName.set(row.winner, list);
  }
  const slotsByName = new Map<string, string[]>();
  for (const row of slots.results) {
    const list = slotsByName.get(row.winner) ?? [];
    list.push(row.slot);
    slotsByName.set(row.winner, list);
  }

  // Union of roster names and anyone who has awards but no roster entry yet
  // (e.g. a typo'd or not-yet-added name) -- neither source is dropped.
  const names = new Set([...rosterByName.keys(), ...totalsByName.keys()]);

  const results = [...names].sort().map((name) => {
    const profile = rosterByName.get(name);
    const total = totalsByName.get(name);
    return {
      player: name,
      class: profile?.class ?? null,
      spec: profile?.spec ?? null,
      item_count: total?.item_count ?? 0,
      last_award_at: total?.last_award_at ?? null,
      breakdown: breakdownByName.get(name) ?? [],
      slots_received: slotsByName.get(name) ?? [],
    };
  });

  return json({ results });
}
