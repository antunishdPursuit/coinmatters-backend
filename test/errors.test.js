const { test } = require("node:test");
const assert = require("node:assert/strict");
const { db, request, newSession } = require("./helpers.js");

// No response may carry a raw Postgres error.
function assertNoDatabaseError(res) {
  assert.doesNotMatch(res.text, /severity|"code":"\w{5}"|routine/);
}

test("ids that are not whole numbers get 400", async () => {
  const { user_id, cookie } = await newSession();
  for (const path of ["/products/abc", "/products/1%27", "/retailer/abc", "/lists/user/abc", "/products/99999999999"]) {
    const res = await request(path, { cookie });
    assert.equal(res.status, 400, path);
    assertNoDatabaseError(res);
  }
  const res = await request(`/lists/user/${user_id}/abc`, { method: "DELETE", cookie });
  assert.equal(res.status, 400);
});

test("missing records get 404", async () => {
  const { user_id, cookie } = await newSession();
  for (const path of ["/products/999999", "/retailer/999999"]) {
    const res = await request(path, { cookie });
    assert.equal(res.status, 404, path);
    assertNoDatabaseError(res);
  }
  const update = await request(`/lists/user/${user_id}/999999`, { method: "PUT", cookie, body: { list_name: "x" } });
  assert.equal(update.status, 404);
  const remove = await request(`/lists/user/${user_id}/999999`, { method: "DELETE", cookie });
  assert.equal(remove.status, 404);
});

test("a database failure gets a plain 500", async () => {
  const realAny = db.any;
  db.any = async () => {
    throw Object.assign(new Error("connection lost"), { code: "08006", severity: "FATAL" });
  };
  try {
    const res = await request("/products");
    assert.equal(res.status, 500);
    assert.deepEqual(res.json, { error: "Internal server error" });
  } finally {
    db.any = realAny;
  }
});

test("broken JSON gets 400", async () => {
  const res = await request("/login", { method: "POST", body: "{oops" });
  assert.equal(res.status, 400);
  assert.deepEqual(res.json, { error: "Invalid request" });
});

test("unknown paths get 404 for every method", async () => {
  for (const method of ["GET", "POST", "PUT", "DELETE"]) {
    const res = await request("/nope/deeper", { method });
    assert.equal(res.status, 404, method);
  }
});
