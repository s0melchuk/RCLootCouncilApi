CREATE TABLE IF NOT EXISTS loot_awards (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  awarded_at  TEXT NOT NULL,        -- ISO 8601 timestamp of the award
  raid        TEXT,                 -- e.g. "Molten Core"
  boss        TEXT,                 -- e.g. "Ragnaros"
  item_id     INTEGER,              -- WoW item id, if known
  item_name   TEXT NOT NULL,
  winner      TEXT NOT NULL,        -- character name
  response    TEXT,                 -- e.g. "MS", "OS", "Transmog", "BIS"
  votes       INTEGER,
  note        TEXT,                 -- free-text officer note
  raw_source  TEXT,                 -- original log line / import blob, for debugging & reparsing
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_loot_awards_winner ON loot_awards (winner);
CREATE INDEX IF NOT EXISTS idx_loot_awards_raid ON loot_awards (raid);
CREATE INDEX IF NOT EXISTS idx_loot_awards_awarded_at ON loot_awards (awarded_at);
