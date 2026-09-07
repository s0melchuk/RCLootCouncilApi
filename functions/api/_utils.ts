export interface Env {
  DB: D1Database;
  INGEST_API_KEY: string;
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export function badRequest(message: string): Response {
  return json({ error: message }, 400);
}

export function unauthorized(): Response {
  return json({ error: "unauthorized" }, 401);
}

/** Loose shape a single loot record must have to be accepted. */
export interface LootAwardInput {
  awarded_at: string;
  raid?: string;
  boss?: string;
  item_id?: number;
  item_name: string;
  winner: string;
  response?: string;
  votes?: number;
  note?: string;
  raw_source?: string;
}

export function isValidLootAward(x: unknown): x is LootAwardInput {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return typeof r.awarded_at === "string" && typeof r.item_name === "string" && typeof r.winner === "string";
}
