const { test } = require("node:test");
const assert = require("node:assert/strict");
const { url, request, registerUser, TEST_PASSWORD } = require("./helpers.js");

// Reads one attribute (e.g. "Max-Age") from a Set-Cookie header.
const attr = (header, name) =>
  header.split(";").map((p) => p.trim()).find((p) => p.toLowerCase().startsWith(name.toLowerCase()));

test("the login cookie is HttpOnly, Secure, SameSite=Lax and lasts as long as its token", async () => {
  const user = await registerUser();
  const res = await request("/login", { method: "POST", body: { email: user.email, password: TEST_PASSWORD } });
  assert.equal(res.status, 200);
  const header = res.headers.get("set-cookie");
  assert.ok(attr(header, "HttpOnly"));
  assert.ok(attr(header, "Secure"));
  assert.equal(attr(header, "SameSite"), "SameSite=Lax");
  assert.equal(attr(header, "Path"), "Path=/");

  const maxAge = Number(attr(header, "Max-Age").split("=")[1]);
  const token = header.split(";")[0].split("=")[1];
  const { iat, exp } = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString());
  assert.equal(maxAge, exp - iat);
});

test("logout clears the cookie with the same attributes, once", async () => {
  const res = await request("/logout", { method: "POST", body: {} });
  assert.equal(res.status, 200);
  const cookies = res.headers.getSetCookie();
  assert.equal(cookies.length, 1);
  const header = cookies[0];
  assert.match(header, /^dataToken=;/);
  assert.match(header, /Expires=Thu, 01 Jan 1970/);
  assert.equal(attr(header, "SameSite"), "SameSite=Lax");
  assert.equal(attr(header, "Path"), "Path=/");
});

test("requests that change data must be JSON", async () => {
  const user = await registerUser();
  const form = `email=${encodeURIComponent(user.email)}&password=${TEST_PASSWORD}`;
  for (const type of ["application/x-www-form-urlencoded", "text/plain", "multipart/form-data; boundary=x"]) {
    const res = await request("/login", { method: "POST", body: form, headers: { "Content-Type": type } });
    assert.equal(res.status, 415, type);
    assert.equal(res.headers.get("set-cookie"), null);
  }
  // No content type at all is refused too.
  const bare = await fetch(url("/logout"), { method: "POST" });
  assert.equal(bare.status, 415);
});

test("a DELETE with no body passes without a content type, one with a body doesn't", async () => {
  // The path doesn't exist, so passing the check shows up as 404.
  assert.equal((await fetch(url("/nope"), { method: "DELETE" })).status, 404);
  const withBody = await fetch(url("/nope"), { method: "DELETE", body: "x=1", headers: { "Content-Type": "text/plain" } });
  assert.equal(withBody.status, 415);
});
