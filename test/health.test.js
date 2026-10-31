const { test } = require("node:test");
const assert = require("node:assert/strict");
const { db, request } = require("./helpers.js");

test("the health check reports ok when the database answers", async () => {
  const res = await request("/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.json, { status: "ok" });
});

test("the health check reports unavailable, without details, when the database doesn't", async () => {
  const realOne = db.one;
  db.one = async () => {
    throw new Error("connect ECONNREFUSED 127.0.0.1:35432");
  };
  try {
    const res = await request("/health");
    assert.equal(res.status, 503);
    assert.deepEqual(res.json, { status: "unavailable" });
  } finally {
    db.one = realOne;
  }
});
