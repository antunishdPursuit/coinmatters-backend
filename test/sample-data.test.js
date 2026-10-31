const { test } = require("node:test");
const assert = require("node:assert/strict");
const { db } = require("./helpers.js");

// db:setup brings existing rows up to the rules that login and
// registration follow.
test("every stored email is lowercase, as login expects", async () => {
  const { count } = await db.one("SELECT count(*)::int AS count FROM users WHERE email <> lower(trim(email))");
  assert.equal(count, 0);
});

test("every stored username follows the registration rules", async () => {
  const { count } = await db.one("SELECT count(*)::int AS count FROM users WHERE username !~ '^[A-Za-z0-9_.-]{3,30}$'");
  assert.equal(count, 0);
});

test("every product image is a valid https link or an embedded image", async () => {
  const products = await db.any("SELECT product_id, thumbnail FROM products WHERE thumbnail IS NOT NULL");
  for (const { product_id, thumbnail } of products) {
    if (thumbnail.startsWith("data:image/")) continue;
    const link = new URL(thumbnail);
    assert.equal(link.protocol, "https:", `product ${product_id}`);
    assert.match(link.hostname, /\./, `product ${product_id}: ${thumbnail.slice(0, 40)}`);
  }
});
