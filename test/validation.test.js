const { test } = require("node:test");
const assert = require("node:assert/strict");
const { request, registerUser, newSession, TEST_PASSWORD } = require("./helpers.js");

test("register rejects bad input with 400", async () => {
  const good = { username: "valid_name", email: "valid@example.com", password: TEST_PASSWORD };
  const bad = [
    undefined,
    {},
    { ...good, username: "ab" },
    { ...good, username: "has spaces" },
    { ...good, username: "../admin" },
    { ...good, username: 123 },
    { ...good, email: "not-an-email" },
    { ...good, email: ["a@b.co"] },
    { ...good, password: "short" },
    { ...good, password: "x".repeat(73) },
    { ...good, password: 12345678 },
  ];
  for (const body of bad) {
    const res = await request("/register", { method: "POST", body: body ?? "" });
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.equal(typeof res.json.error, "string");
  }
});

test("registering a taken username or email gets 409", async () => {
  const user = await registerUser();
  const sameEmail = await request("/register", {
    method: "POST",
    body: { username: `${user.username}_2`, email: user.email.toUpperCase(), password: TEST_PASSWORD },
  });
  assert.equal(sameEmail.status, 409);
  const sameName = await request("/register", {
    method: "POST",
    body: { username: user.username, email: `other_${user.email}`, password: TEST_PASSWORD },
  });
  assert.equal(sameName.status, 409);
});

test("login rejects malformed input with 400 and wrong details with 401", async () => {
  const user = await registerUser();
  for (const body of [{}, { email: user.email }, { email: user.email, password: 5 }, { email: ["x"], password: "x" }]) {
    assert.equal((await request("/login", { method: "POST", body })).status, 400, JSON.stringify(body));
  }
  assert.equal((await request("/login", { method: "POST", body: { email: user.email, password: "wrong-password" } })).status, 401);
  assert.equal((await request("/login", { method: "POST", body: { email: "nobody@example.com", password: "whatever1" } })).status, 401);
  // Email case and surrounding spaces don't matter.
  const loose = await request("/login", { method: "POST", body: { email: `  ${user.email.toUpperCase()} `, password: TEST_PASSWORD } });
  assert.equal(loose.status, 200);
});

test("lists reject bad input with 400", async () => {
  const { user_id, cookie } = await newSession();
  const good = { list_name: "Groceries", products: ["milk"], note: "" };
  const bad = [
    {},
    { ...good, list_name: "" },
    { ...good, list_name: "x".repeat(256) },
    { ...good, products: "milk" },
    { ...good, products: [1, 2] },
    { ...good, note: "x".repeat(256) },
  ];
  for (const body of bad) {
    const res = await request(`/lists/${user_id}`, { method: "POST", cookie, body });
    assert.equal(res.status, 400, JSON.stringify(body));
  }
  const created = await request(`/lists/${user_id}`, { method: "POST", cookie, body: good });
  assert.equal(created.status, 200);
  const update = await request(`/lists/user/${user_id}/${created.json.list_id}`, { method: "PUT", cookie, body: { list_name: "" } });
  assert.equal(update.status, 400);
});
