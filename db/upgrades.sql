-- Brings tables made by an older schema.sql up to the current one.
-- db:setup runs it after schema.sql on every run, so each statement must
-- be safe to repeat. It fails, and setup changes nothing, if existing rows
-- break a new rule.

-- Every list belongs to a user.
ALTER TABLE lists ALTER COLUMN user_id SET NOT NULL;

-- A list's creation time is a real timestamp that the server sets. Old
-- rows stored it as ISO text, which converts directly; missing ones get
-- the time of the upgrade. Text without a time zone is read as UTC,
-- whatever the server's own zone is.
SET LOCAL TIME ZONE 'UTC';
ALTER TABLE lists ALTER COLUMN date_created TYPE TIMESTAMPTZ USING date_created::TIMESTAMPTZ;
UPDATE lists SET date_created = now() WHERE date_created IS NULL;
ALTER TABLE lists ALTER COLUMN date_created SET DEFAULT now();
ALTER TABLE lists ALTER COLUMN date_created SET NOT NULL;
