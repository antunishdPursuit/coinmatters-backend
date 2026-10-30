const { test } = require("node:test");
const assert = require("node:assert/strict");
const { db } = require("./helpers.js");

const separateAccount =
  process.env.PG_ADMIN_USER && process.env.PG_ADMIN_USER !== process.env.PG_USER;

// 42501: Postgres insufficient_privilege
const refused = (promise) => assert.rejects(promise, (error) => error.code === "42501");

test("the app's database account has only the access it needs", { skip: !separateAccount && "PG_ADMIN_USER is not set" }, async () => {
  const role = await db.one(
    "SELECT rolsuper, rolcreatedb, rolcreaterole, rolreplication, rolbypassrls FROM pg_roles WHERE rolname = current_user"
  );
  assert.deepEqual(role, {
    rolsuper: false, rolcreatedb: false, rolcreaterole: false, rolreplication: false, rolbypassrls: false,
  });
  // It inherits nothing from other roles.
  const { memberships } = await db.one(
    "SELECT count(*)::int AS memberships FROM pg_auth_members WHERE member = (SELECT oid FROM pg_roles WHERE rolname = current_user)"
  );
  assert.equal(memberships, 0);

  // What the app uses still works.
  await db.any("SELECT product_id FROM products LIMIT 1");
  await db.any("SELECT retailer_id FROM retailers LIMIT 1");
  await db.any("SELECT user_id FROM users LIMIT 1");
  await db.any("SELECT list_id FROM lists LIMIT 1");

  // Everything else is refused. The WHERE false changes nothing even if
  // the permission check were to pass.
  await refused(db.none("DELETE FROM users WHERE false"));
  await refused(db.none("UPDATE users SET password = password WHERE false"));
  await refused(db.none("UPDATE products SET price = price WHERE false"));
  await refused(db.none("DELETE FROM retailers WHERE false"));
  await refused(db.none("INSERT INTO products (product_name) SELECT 'x' WHERE false"));
  await refused(db.none("INSERT INTO retailers (retailer_name, website) SELECT 'x', 'x' WHERE false"));
  // nextval checks access only when it runs, so this one really runs.
  await refused(db.one("SELECT nextval('products_product_id_seq')"));
  await refused(db.none("CREATE TABLE app_should_not_create (id int)"));
  await refused(db.none("ALTER TABLE users ADD COLUMN app_should_not_add int"));
  await refused(db.none("DROP TABLE lists"));
});
