const { test } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { request, newSession } = require("./helpers.js");

const listBody = { list_name: "Groceries", products: ["milk"], note: "", date_created: "2026-10-30" };

test("/user and /check-login need a valid session", async () => {
  for (const path of ["/user", "/check-login"]) {
    assert.equal((await request(path)).status, 401, `${path} without cookie`);
    assert.equal((await request(path, { cookie: "dataToken=not-a-token" })).status, 401, `${path} with junk`);
  }
  // A token signed with another secret is rejected.
  const forged = jwt.sign({ user_id: 1, username: "x", email: "x@example.com" }, "wrong-secret");
  assert.equal((await request("/user", { cookie: `dataToken=${forged}` })).status, 401);
  // So is an unsigned token.
  const unsigned = jwt.sign({ user_id: 1 }, null, { algorithm: "none" });
  assert.equal((await request("/user", { cookie: `dataToken=${unsigned}` })).status, 401);
});

test("/check-login and /user accept a valid session", async () => {
  const { cookie, username } = await newSession();
  assert.equal((await request("/check-login", { cookie })).status, 200);
  const me = await request("/user", { cookie });
  assert.equal(me.status, 200);
  assert.equal(me.json.authorizedData.username, username);
});

test("every lists route needs a session", async () => {
  const { user_id } = await newSession();
  const routes = [
    ["GET", `/lists/user/${user_id}`],
    ["POST", `/lists/${user_id}`],
    ["PUT", `/lists/user/${user_id}/1`],
    ["DELETE", `/lists/user/${user_id}/1`],
  ];
  for (const [method, path] of routes) {
    const body = method === "POST" || method === "PUT" ? listBody : undefined;
    const res = await request(path, { method, body });
    assert.equal(res.status, 401, `${method} ${path}`);
  }
});

test("a user cannot read, add to, change or delete another user's lists", async () => {
  const owner = await newSession();
  const other = await newSession();
  const created = await request(`/lists/${owner.user_id}`, { method: "POST", cookie: owner.cookie, body: listBody });
  assert.equal(created.status, 200);
  const listId = created.json.list_id;

  // Using the owner's user_id in the path is refused outright.
  assert.equal((await request(`/lists/user/${owner.user_id}`, { cookie: other.cookie })).status, 403);
  assert.equal((await request(`/lists/${owner.user_id}`, { method: "POST", cookie: other.cookie, body: listBody })).status, 403);
  assert.equal((await request(`/lists/user/${owner.user_id}/${listId}`, { method: "PUT", cookie: other.cookie, body: listBody })).status, 403);
  assert.equal((await request(`/lists/user/${owner.user_id}/${listId}`, { method: "DELETE", cookie: other.cookie })).status, 403);

  // Using their own user_id with the owner's list id finds nothing.
  assert.equal((await request(`/lists/user/${other.user_id}/${listId}`, { method: "PUT", cookie: other.cookie, body: listBody })).status, 404);
  assert.equal((await request(`/lists/user/${other.user_id}/${listId}`, { method: "DELETE", cookie: other.cookie })).status, 404);

  // The owner's list is untouched and still theirs.
  const mine = await request(`/lists/user/${owner.user_id}`, { cookie: owner.cookie });
  assert.equal(mine.status, 200);
  assert.deepEqual(mine.json.lists.map((l) => l.list_id), [listId]);
  assert.equal(mine.json.lists[0].list_name, "Groceries");
});

test("a list is always created for the logged-in user", async () => {
  const session = await newSession();
  const res = await request(`/lists/${session.user_id}`, {
    method: "POST",
    cookie: session.cookie,
    body: { ...listBody, user_id: session.user_id + 1 },
  });
  assert.equal(res.status, 200);
  assert.equal(res.json.user_id, session.user_id);
});

test("the owner can delete their list", async () => {
  const session = await newSession();
  const created = await request(`/lists/${session.user_id}`, { method: "POST", cookie: session.cookie, body: listBody });
  const path = `/lists/user/${session.user_id}/${created.json.list_id}`;
  assert.equal((await request(path, { method: "DELETE", cookie: session.cookie })).status, 200);
  assert.equal((await request(path, { method: "DELETE", cookie: session.cookie })).status, 404);
});
