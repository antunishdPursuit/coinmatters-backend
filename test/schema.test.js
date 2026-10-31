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

test("deleting a user deletes their lists", async () => {
  const link = await db.oneOrNone(
    "SELECT confdeltype FROM pg_constraint WHERE conname = 'lists_user_id_fkey' AND conrelid = 'lists'::regclass"
  );
  assert.ok(link, "lists_user_id_fkey is missing");
  assert.equal(link.confdeltype, "c");
});

test("a list's creation time is a required timestamp the database fills in", async () => {
  const date = await column("lists", "date_created");
  assert.equal(date.data_type, "timestamp with time zone");
  assert.equal(date.is_nullable, "NO");
  assert.equal(date.column_default, "now()");
});

test("every product has a name, a store and a price in dollars and cents", async () => {
  const price = await column("products", "price");
  assert.equal(price.data_type, "numeric");
  assert.equal(price.numeric_precision, 10);
  assert.equal(price.numeric_scale, 2);
  assert.equal(price.is_nullable, "NO");
  assert.equal((await column("products", "product_name")).is_nullable, "NO");
  assert.equal((await column("products", "retailer_id")).is_nullable, "NO");
});

test("the unused products_list table is gone", async () => {
  const { exists } = await db.one("SELECT to_regclass('public.products_list') IS NOT NULL AS exists");
  assert.equal(exists, false);
});
