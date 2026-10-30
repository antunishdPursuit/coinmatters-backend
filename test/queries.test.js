const { test } = require("node:test");
const assert = require("node:assert/strict");
const { request, newSession } = require("./helpers.js");

test("one product can be read by its id", async () => {
  const [first] = (await request("/products")).json;
  const res = await request(`/products/${first.product_id}`);
  assert.equal(res.status, 200);
  assert.equal(res.json.product_id, first.product_id);
  assert.equal(res.json.product_name, first.product_name);
});

test("a list can be renamed and its items and note changed", async () => {
  const session = await newSession();
  const created = await request(`/lists/${session.user_id}`, {
    method: "POST",
    cookie: session.cookie,
    body: { list_name: "Groceries", products: ["milk"], note: "", date_created: "2026-10-30" },
  });
  assert.equal(created.status, 200);

  const updated = await request(`/lists/user/${session.user_id}/${created.json.list_id}`, {
    method: "PUT",
    cookie: session.cookie,
    body: { list_name: "Weekly shop", products: ["milk", "eggs"], note: "Saturday" },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.json.list_id, created.json.list_id);
  assert.equal(updated.json.user_id, session.user_id);
  assert.equal(updated.json.list_name, "Weekly shop");
  assert.deepEqual(updated.json.products, ["milk", "eggs"]);
  assert.equal(updated.json.note, "Saturday");
});
