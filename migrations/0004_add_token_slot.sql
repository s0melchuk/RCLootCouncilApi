-- Tier tokens (e.g. Vanquisher's Mark of Sanctification) can be redeemed for
-- one of a small fixed set of armor slots, decided after the roll. `slot`
-- stays "Token" for the award itself; this records which slot it became,
-- once known, so Slot coverage can count it toward that armor slot too.
ALTER TABLE loot_awards ADD COLUMN token_slot TEXT;
