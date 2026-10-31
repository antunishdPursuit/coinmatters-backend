const { test } = require("node:test");
const assert = require("node:assert/strict");
const { request, newSession } = require("./helpers.js");

test("prices are numbers, so they compare by value", async () => {
  const products = (await request("/products")).json;
  const priced = products.filter((p) => p.price !== null);
  assert.ok(priced.length > 0);
  for (const p of priced) assert.equal(typeof p.price, "number", p.product_name);
  const one = await request(`/products/${priced[0].product_id}`);
  assert.equal(typeof one.json.price, "number");
});

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
    body: { list_name: "Groceries", products: ["milk"], note: "" },
  });
  assert.equal(created.status, 201);

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
  // Editing a list keeps its creation time.
  assert.equal(updated.json.date_created, created.json.date_created);
});

test("the server records when a list was created and ignores a sent date", async () => {
  const session = await newSession();
  const before = Date.now();
  const created = await request(`/lists/${session.user_id}`, {
    method: "POST",
    cookie: session.cookie,
    body: { list_name: "Groceries", products: [], note: "", date_created: "1999-01-01" },
  });
  assert.equal(created.status, 201);
  // Sent as an ISO timestamp the browser can read with new Date(...).
  assert.match(created.json.date_created, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  const createdAt = new Date(created.json.date_created).getTime();
  assert.ok(Math.abs(createdAt - before) < 60_000, `created at ${created.json.date_created}`);
});
