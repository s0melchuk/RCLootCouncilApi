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

export function notFound(): Response {
  return json({ error: "not found" }, 404);
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
  difficulty?: string; // e.g. "NM", "HC"
  slot?: string;        // e.g. "Head", "Trinket"
  votes?: number;
  note?: string;
  raw_source?: string;
}

export function isValidLootAward(x: unknown): x is LootAwardInput {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return typeof r.awarded_at === "string" && typeof r.item_name === "string" && typeof r.winner === "string";
}

// column -> expected JS type, for validating PATCH /api/loot/:id bodies.
const LOOT_FIELD_TYPES: Record<keyof LootAwardInput, "string" | "number"> = {
  awarded_at: "string",
  raid: "string",
  boss: "string",
  item_id: "number",
  item_name: "string",
  winner: "string",
  response: "string",
  difficulty: "string",
  slot: "string",
  votes: "number",
  note: "string",
  raw_source: "string",
};

// awarded_at/item_name/winner are NOT NULL in the schema; every other column
// may be explicitly cleared with null.
const LOOT_REQUIRED_FIELDS = new Set<keyof LootAwardInput>(["awarded_at", "item_name", "winner"]);

/**
 * Validates a PATCH body: must be a non-empty object where every key is a
 * known loot_awards column and every present value has the right type (or
 * is null, to clear a nullable field).
 */
export function parseLootPatch(
  x: unknown
): { ok: true; fields: Partial<LootAwardInput> } | { ok: false; error: string } {
  if (typeof x !== "object" || x === null || Array.isArray(x)) {
    return { ok: false, error: "body must be a JSON object" };
  }
  const entries = Object.entries(x as Record<string, unknown>);
  if (entries.length === 0) {
    return { ok: false, error: "body must include at least one field to update" };
  }
  for (const [key, value] of entries) {
    const field = key as keyof LootAwardInput;
    const expectedType = LOOT_FIELD_TYPES[field];
    if (!expectedType) {
      return { ok: false, error: `unknown field: ${key}` };
    }
    if (value === null) {
      if (LOOT_REQUIRED_FIELDS.has(field)) {
        return { ok: false, error: `${key} cannot be null` };
      }
      continue;
    }
    if (typeof value !== expectedType) {
      return { ok: false, error: `${key} must be a ${expectedType}${LOOT_REQUIRED_FIELDS.has(field) ? "" : " (or null)"}` };
    }
  }
  return { ok: true, fields: x as Partial<LootAwardInput> };
}

/** Loose shape a single roster entry must have to be accepted. */
export interface PlayerInput {
  name: string;
  class?: string;
  spec?: string;
}

export function isValidPlayer(x: unknown): x is PlayerInput {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return typeof r.name === "string" && r.name.length > 0;
}
