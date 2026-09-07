-- Minimal roster table: needed to answer anything class/spec-shaped (e.g. the
-- guild's "who's still missing tier gloves" or "filter casters only" views)
-- since RCLootCouncil's own export reports class/spec per character.
CREATE TABLE IF NOT EXISTS players (
  name       TEXT PRIMARY KEY,     -- character name, matches loot_awards.winner
  class      TEXT,                 -- e.g. "Paladin"
  spec       TEXT,                 -- e.g. "Retribution"
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
