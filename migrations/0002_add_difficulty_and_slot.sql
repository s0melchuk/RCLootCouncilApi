-- Difficulty (e.g. "NM"/"HC") and equipment slot are reported by RCLootCouncil
-- for every award and are needed to reproduce the guild's existing per-player
-- breakdowns (MS/OS split by difficulty, "already has this slot" coverage).
ALTER TABLE loot_awards ADD COLUMN difficulty TEXT; -- e.g. "NM", "HC"
ALTER TABLE loot_awards ADD COLUMN slot TEXT;        -- e.g. "Head", "Trinket"

CREATE INDEX IF NOT EXISTS idx_loot_awards_difficulty ON loot_awards (difficulty);
CREATE INDEX IF NOT EXISTS idx_loot_awards_slot ON loot_awards (slot);
