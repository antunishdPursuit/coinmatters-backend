const { test } = require("node:test");
const assert = require("node:assert/strict");
const { db } = require("./helpers.js");

// db:setup brings existing rows up to the rules that login and
// registration follow.
test("every stored email is lowercase, as login expects", async () => {
  const { count } = await db.one("SELECT count(*)::int AS count FROM users WHERE email <> lower(trim(email))");
  assert.equal(count, 0);
});
