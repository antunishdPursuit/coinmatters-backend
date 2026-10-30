// Low limits for this file only; each test file runs in its own process.
process.env.LOGIN_LIMIT = "3";
process.env.REGISTER_LIMIT = "2";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { request, registerUser, TEST_PASSWORD } = require("./helpers.js");

// The two users this file may register, shared by both tests.
let firstUser;

test("registering is limited per address", async () => {
  firstUser = await registerUser();
  await registerUser();
  const third = await request("/register", {
    method: "POST",
    body: { username: `test_limit_${Date.now()}`, email: `test_limit_${Date.now()}@example.com`, password: TEST_PASSWORD },
  });
  assert.equal(third.status, 429);
  assert.equal(typeof third.json.error, "string");
});

test("only failed logins count toward the login limit", async () => {
  const good = { email: firstUser.email, password: TEST_PASSWORD };
  for (let i = 0; i < 5; i++) {
    assert.equal((await request("/login", { method: "POST", body: good })).status, 200, `good login ${i}`);
  }
  const wrong = { email: firstUser.email, password: "wrong-password" };
  for (let i = 0; i < 3; i++) {
    assert.equal((await request("/login", { method: "POST", body: wrong })).status, 401, `failed login ${i}`);
  }
  assert.equal((await request("/login", { method: "POST", body: wrong })).status, 429);
  assert.equal((await request("/login", { method: "POST", body: good })).status, 429);
});
