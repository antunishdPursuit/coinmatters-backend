const { test } = require("node:test");
const assert = require("node:assert/strict");
const { request, newSession } = require("./helpers.js");

// Fails if any value in a response looks like a bcrypt hash or any key is
// named "password".
function assertNoPassword(value) {
  const text = JSON.stringify(value);
  assert.doesNotMatch(text, /"password"/);
  assert.doesNotMatch(text, /\$2[aby]\$\d{2}\$/);
}

test("the session token and /user carry no password hash", async () => {
  const session = await newSession();
  const payload = JSON.parse(
    Buffer.from(session.cookie.split("=")[1].split(".")[1], "base64url").toString()
  );
  assertNoPassword(payload);
  assert.deepEqual(Object.keys(payload).sort(), ["email", "exp", "iat", "user_id", "username"]);

  const me = await request("/user", { cookie: session.cookie });
  assert.equal(me.status, 200);
  assertNoPassword(me.json);
});

test("a user's lists response carries no password hash", async () => {
  const session = await newSession();
  const res = await request(`/lists/user/${session.user_id}`, { cookie: session.cookie });
  assert.equal(res.status, 200);
  assert.equal(res.json.user.username, session.username);
  assertNoPassword(res.json);
});
