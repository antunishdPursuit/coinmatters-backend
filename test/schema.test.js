const { test } = require("node:test");
const assert = require("node:assert/strict");
const { db } = require("./helpers.js");

// The type, nullability and default of one column, as Postgres reports it.
const column = (table, name) =>
  db.oneOrNone(
    `SELECT data_type, is_nullable, column_default, numeric_precision, numeric_scale
       FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, name]
  );

test("every list has an owner, and lists are indexed by owner", async () => {
  assert.equal((await column("lists", "user_id")).is_nullable, "NO");
  const index = await db.oneOrNone(
    "SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'lists' AND indexname = 'lists_user_id_idx'"
  );
  assert.ok(index, "lists_user_id_idx is missing");
  assert.match(index.indexdef, /\(user_id\)/);
});

test("a list's creation time is a required timestamp the database fills in", async () => {
  const date = await column("lists", "date_created");
  assert.equal(date.data_type, "timestamp with time zone");
  assert.equal(date.is_nullable, "NO");
  assert.equal(date.column_default, "now()");
});
