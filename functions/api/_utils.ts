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

// Tier tokens can be redeemed for one of exactly these armor slots -- unlike
// `slot` (free text), this has a real small enum worth enforcing.
export const TOKEN_SLOTS = ["Chest", "Hands", "Head", "Legs", "Shoulder"] as const;
export type TokenSlot = (typeof TOKEN_SLOTS)[number];

/** Case-insensitive match against TOKEN_SLOTS, returning the canonical casing. */
export function normalizeTokenSlot(value: string): TokenSlot | null {
  return TOKEN_SLOTS.find((s) => s.toLowerCase() === value.toLowerCase()) ?? null;
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
  token_slot?: string;  // one of TOKEN_SLOTS, once a token's been redeemed
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
  token_slot: "string",
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
  const fields: Partial<LootAwardInput> = {};
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
      fields[field] = null as never;
      continue;
    }
    if (typeof value !== expectedType) {
      return { ok: false, error: `${key} must be a ${expectedType}${LOOT_REQUIRED_FIELDS.has(field) ? "" : " (or null)"}` };
    }
    if (field === "token_slot") {
      const normalized = normalizeTokenSlot(value as string);
      if (!normalized) {
        return { ok: false, error: `token_slot must be one of: ${TOKEN_SLOTS.join(", ")}` };
      }
      fields.token_slot = normalized;
      continue;
    }
    fields[field] = value as never;
  }
  return { ok: true, fields };
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
