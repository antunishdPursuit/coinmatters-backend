const { test } = require("node:test");
const assert = require("node:assert/strict");
const { request } = require("./helpers.js");

test("responses don't name the framework", async () => {
  const res = await request("/products");
  assert.equal(res.headers.get("x-powered-by"), null);
});

test("CORS allows only the frontend's origin", async () => {
  const allowed = await request("/products", { headers: { Origin: process.env.ORIGIN_URL } });
  assert.equal(allowed.headers.get("access-control-allow-origin"), process.env.ORIGIN_URL);
  assert.equal(allowed.headers.get("access-control-allow-credentials"), "true");

  // Another site is told only the frontend's origin, so its browser
  // refuses to hand it the response.
  const other = await request("/products", { headers: { Origin: "https://evil.example" } });
  assert.equal(other.headers.get("access-control-allow-origin"), process.env.ORIGIN_URL);
  assert.notEqual(other.headers.get("access-control-allow-origin"), "*");
});
