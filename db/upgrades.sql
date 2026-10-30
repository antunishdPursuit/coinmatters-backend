-- Brings tables made by an older schema.sql up to the current one.
-- db:setup runs it after schema.sql on every run, so each statement must
-- be safe to repeat. It fails, and setup changes nothing, if existing rows
-- break a new rule.

-- Every list belongs to a user.
ALTER TABLE lists ALTER COLUMN user_id SET NOT NULL;
