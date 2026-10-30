// Shared setup for the API tests. Each test file starts the app on a free
// port and creates its own users, which are removed again when it finishes.
const { after, before } = require("node:test");

// The tests register and log in many users from one address, so raise the
// rate limits unless a test file has set its own.
process.env.LOGIN_LIMIT ??= "1000";
process.env.REGISTER_LIMIT ??= "1000";

const app = require("../app.js");
const db = require("../db/dbConfig.js");

// The app's own account can't delete users, so clean up as the owner.
const adminDb = db.$config.pgp({
  ...db.$cn,
  user: process.env.PG_ADMIN_USER || process.env.PG_USER,
  password: process.env.PG_ADMIN_PASSWORD || process.env.PG_PASSWORD,
});

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
    await adminDb.none("DELETE FROM users WHERE email IN ($1:csv)", [createdEmails]);
  }
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
  await db.$pool.end();
  await adminDb.$pool.end();
});

// Sends a request to the test server. Requests other than GET are sent
// with a JSON content type unless the caller sets their own.
async function request(path, { method = "GET", body, cookie, headers = {} } = {}) {
  const init = { method, headers: { ...headers } };
  if (body !== undefined) {
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  // Like the frontend, send every request that changes data as JSON.
  if (method !== "GET") init.headers["Content-Type"] ??= "application/json";
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

// The full URL of a path on the test server, for raw fetch calls.
const url = (path) => baseUrl + path;

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

module.exports = { db, url, request, registerUser, logIn, newSession, TEST_PASSWORD };
