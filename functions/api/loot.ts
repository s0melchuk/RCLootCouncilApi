import {
  badRequest,
  Env,
  isValidLootAward,
  json,
  LootAwardInput,
  normalizeTokenSlot,
  TOKEN_SLOTS,
  unauthorized,
} from "./_utils";

interface PagesContext {
  request: Request;
  env: Env;
}

// Whitelisted so `sort` can never be interpolated into SQL as arbitrary input.
const SORTABLE_COLUMNS = new Set([
  "awarded_at",
  "raid",
  "boss",
  "item_name",
  "winner",
  "response",
  "difficulty",
  "slot",
  "votes",
]);

// GET /api/loot?raid=&player=&item=&from=&to=&difficulty=&slot=&sort=&order=&limit=&offset=
export async function onRequestGet(ctx: PagesContext): Promise<Response> {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const { searchParams } = url;

  const conditions: string[] = [];
  const params: unknown[] = [];

  const raid = searchParams.get("raid");
  if (raid) {
    conditions.push("raid = ?");
    params.push(raid);
  }
  const player = searchParams.get("player");
  if (player) {
    conditions.push("winner LIKE ?");
    params.push(`%${player}%`);
  }
  const item = searchParams.get("item");
  if (item) {
    conditions.push("item_name LIKE ?");
    params.push(`%${item}%`);
  }
  const from = searchParams.get("from");
  if (from) {
    conditions.push("awarded_at >= ?");
    params.push(from);
  }
  const to = searchParams.get("to");
  if (to) {
    conditions.push("awarded_at <= ?");
    params.push(to);
  }
  const difficulty = searchParams.get("difficulty");
  if (difficulty) {
    conditions.push("difficulty = ?");
    params.push(difficulty);
  }
  const slot = searchParams.get("slot");
  if (slot) {
    conditions.push("slot = ?");
    params.push(slot);
  }

  const sort = searchParams.get("sort") ?? "awarded_at";
  if (!SORTABLE_COLUMNS.has(sort)) {
    return badRequest(`sort must be one of: ${[...SORTABLE_COLUMNS].join(", ")}`);
  }
  const order = (searchParams.get("order") ?? "desc").toLowerCase();
  if (order !== "asc" && order !== "desc") {
    return badRequest("order must be 'asc' or 'desc'");
  }

  const limit = Math.min(Number(searchParams.get("limit") ?? 100) || 100, 500);
  const offset = Number(searchParams.get("offset") ?? 0) || 0;

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const countStmt = env.DB.prepare(
    `SELECT COUNT(*) AS total FROM loot_awards ${where}`
  ).bind(...params);
  const countRow = await countStmt.first<{ total: number }>();

  // `id` as a secondary key keeps paging stable when the sort column ties
  // (e.g. many awards sharing the same awarded_at second).
  const stmt = env.DB.prepare(
    `SELECT * FROM loot_awards ${where} ORDER BY ${sort} ${order}, id ${order} LIMIT ? OFFSET ?`
  ).bind(...params, limit, offset);

  const { results } = await stmt.all();
  return json({ results, total: countRow?.total ?? 0, limit, offset, sort, order });
}

// POST /api/loot
// Body: a single loot record, or { records: LootAwardInput[] } for bulk import.
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

  const records: unknown[] = Array.isArray((body as { records?: unknown[] })?.records)
    ? (body as { records: unknown[] }).records
    : [body];

  const validRecords: (Omit<LootAwardInput, "token_slot"> & { token_slot: string | null })[] = [];
  for (const r of records) {
    if (!isValidLootAward(r)) {
      return badRequest(
        "each record requires string fields: awarded_at, item_name, winner"
      );
    }
    let tokenSlot: string | null = null;
    if (r.token_slot) {
      tokenSlot = normalizeTokenSlot(r.token_slot);
      if (!tokenSlot) {
        return badRequest(`token_slot must be one of: ${TOKEN_SLOTS.join(", ")}`);
      }
    }
    validRecords.push({ ...r, token_slot: tokenSlot });
  }

  const stmt = env.DB.prepare(
    `INSERT INTO loot_awards
       (awarded_at, raid, boss, item_id, item_name, winner, response, difficulty, slot, token_slot, votes, note, raw_source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const batch = validRecords.map((r) =>
    stmt.bind(
      r.awarded_at,
      r.raid ?? null,
      r.boss ?? null,
      r.item_id ?? null,
      r.item_name,
      r.winner,
      r.response ?? null,
      r.difficulty ?? null,
      r.slot ?? null,
      r.token_slot,
      r.votes ?? null,
      r.note ?? null,
      r.raw_source ?? null
    )
  );

  await env.DB.batch(batch);

  return json({ inserted: validRecords.length }, 201);
}
