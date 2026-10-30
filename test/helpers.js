// Shared setup for the API tests. Each test file starts the app on a free
// port and creates its own users, which are removed again when it finishes.
const { after, before } = require("node:test");
const app = require("../app.js");
const db = require("../db/dbConfig.js");

const TEST_PASSWORD = "test-password-123";
const createdEmails = [];
let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (createdEmails.length) {
    await db.none("DELETE FROM users WHERE email IN ($1:csv)", [createdEmails]);
  }
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await db.$pool.end();
});

// Sends a request to the test server. A JSON body is sent with a JSON
// content type unless the caller sets its own headers.
async function request(path, { method = "GET", body, cookie, headers = {} } = {}) {
  const init = { method, headers: { ...headers } };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
    init.headers["Content-Type"] ??= "application/json";
  }
  if (cookie) init.headers.Cookie = cookie;
  const res = await fetch(baseUrl + path, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = undefined;
  }
  return { status: res.status, headers: res.headers, text, json };
}

// Registers a new user with a unique name and email.
async function registerUser() {
  const id = `${Date.now()}${Math.floor(Math.random() * 1e6)}`;
  const user = { username: `test_${id}`, email: `test_${id}@example.com`, password: TEST_PASSWORD };
  createdEmails.push(user.email);
  const res = await request("/register", { method: "POST", body: user });
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${res.text}`);
  return user;
}

// Logs a user in and returns the session cookie ("dataToken=...").
async function logIn(user) {
  const res = await request("/login", {
    method: "POST",
    body: { email: user.email, password: user.password },
  });
  if (res.status !== 200) throw new Error(`login failed: ${res.status} ${res.text}`);
  return res.headers.get("set-cookie").split(";")[0];
}

// Registers and logs in a new user, returning the user's public fields
// and session cookie.
async function newSession() {
  const user = await registerUser();
  const cookie = await logIn(user);
  const me = await request("/user", { cookie });
  return { ...user, ...me.json.authorizedData, cookie };
}

module.exports = { db, request, registerUser, logIn, newSession, TEST_PASSWORD };
