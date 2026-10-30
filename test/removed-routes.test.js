const { test } = require("node:test");
const assert = require("node:assert/strict");
const { request, newSession } = require("./helpers.js");

// These routes let anyone read, change or delete other people's data and
// were never used by the frontend, so they no longer exist.
test("removed routes answer 404, even for a logged-in user", async () => {
  const { cookie } = await newSession();
  const removed = [
    ["GET", "/users"],
    ["GET", "/users/1"],
    ["PUT", "/users/1"],
    ["DELETE", "/users/1"],
    ["GET", "/lists"],
    ["POST", "/lists/user/1"],
    ["GET", "/lists/1/products"],
    ["POST", "/products"],
    ["PUT", "/products/1"],
    ["DELETE", "/products/1"],
    ["PUT", "/retailer/1"],
    ["DELETE", "/retailer/1"],
  ];
  for (const [method, path] of removed) {
    const body = method === "GET" || method === "DELETE" ? undefined : {};
    const res = await request(path, { method, body, cookie });
    assert.equal(res.status, 404, `${method} ${path}`);
  }
});

test("the catalog can still be read", async () => {
  const products = await request("/products");
  assert.equal(products.status, 200);
  assert.ok(products.json.length > 0);
  const retailers = await request("/retailer");
  assert.equal(retailers.status, 200);
  assert.ok(retailers.json.length > 0);
});
