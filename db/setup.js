// Sets up the database: `npm run db:setup`. Safe to run more than once.
//   1. Creates any missing tables (schema.sql).
//   2. If there are no users yet, loads the sample data (seed.sql). Then
//      replaces any plaintext password (the sample data has them) with a
//      bcrypt hash, stores every email in lowercase, as login expects, and
//      replaces spaces in usernames, which appear in page addresses.
//   3. Moves each id counter past the highest id in its table, since the
//      sample data sets some ids itself.
//   4. Creates the app's own database account (PG_USER) with only the
//      access the app needs, or updates its password and access.
// It connects as the database owner (PG_ADMIN_USER). The database itself
// must already exist.
require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const pgp = require("pg-promise")();

const admin = {
  user: process.env.PG_ADMIN_USER || process.env.PG_USER,
  password: process.env.PG_ADMIN_PASSWORD || process.env.PG_PASSWORD,
};
const appUser = process.env.PG_USER;

const db = pgp({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  ...admin,
});

// Reads a SQL file, leaving out psql-only lines such as "\c database".
const readSql = (name) =>
  fs.readFileSync(path.join(__dirname, name), "utf8")
    .split(/\r?\n/)
    .filter((line) => !line.startsWith("\\"))
    .join("\n");

// Each table's id column, whose counter must stay ahead of existing rows.
const ID_COLUMNS = [
  ["users", "user_id"],
  ["lists", "list_id"],
  ["retailers", "retailer_id"],
  ["products", "product_id"],
];

// What the app's account may do. Anything not listed is refused, such as
// deleting users, changing products or altering tables.
const APP_GRANTS = [
  "GRANT SELECT, INSERT ON users TO $1:name",
  "GRANT SELECT, INSERT, UPDATE, DELETE ON lists TO $1:name",
  "GRANT SELECT ON retailers, products TO $1:name",
  "GRANT USAGE ON SEQUENCE users_user_id_seq, lists_list_id_seq TO $1:name",
];

async function setUpAppAccount(t) {
  if (!appUser || appUser === admin.user) {
    console.log("PG_ADMIN_USER is not set, so the app connects as the owner. Set it to give the app a limited account.");
    return;
  }
  // Postgres reads an empty password as "no password", which would lock
  // the app out while setup still reported success.
  if (!process.env.PG_PASSWORD) {
    throw new Error("PG_PASSWORD is empty. Set a password for the app account in .env.");
  }
  const exists = await t.oneOrNone("SELECT 1 FROM pg_roles WHERE rolname = $1", appUser);
  const verb = exists ? "ALTER" : "CREATE";
  await t.none(
    `${verb} ROLE $1:name WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD $2`,
    [appUser, process.env.PG_PASSWORD]
  );
  // Start from nothing, so reruns also take away access no longer listed.
  await t.none("REVOKE ALL ON DATABASE $2:name FROM $1:name", [appUser, process.env.PG_DATABASE]);
  await t.none("REVOKE ALL ON ALL TABLES IN SCHEMA public FROM $1:name", appUser);
  await t.none("REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM $1:name", appUser);
  await t.none("GRANT CONNECT ON DATABASE $2:name TO $1:name", [appUser, process.env.PG_DATABASE]);
  await t.none("GRANT USAGE ON SCHEMA public TO $1:name", appUser);
  for (const grant of APP_GRANTS) {
    await t.none(grant, appUser);
  }
  console.log(`App account ${appUser} is ${exists ? "up to date" : "created"}`);
}

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(value);

async function hashSeedPasswords(t) {
  const users = await t.any("SELECT user_id, password FROM users");
  for (const user of users) {
    if (isBcryptHash(user.password)) continue;
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await t.none("UPDATE users SET password = $1 WHERE user_id = $2", [hashedPassword, user.user_id]);
  }
}

async function setup() {
  await db.tx(async (t) => {
    await t.none(readSql("schema.sql"));
    console.log("Tables are in place");

    const { count } = await t.one("SELECT count(*)::int AS count FROM users");
    if (count === 0) {
      await t.none(readSql("seed.sql"));
      console.log("Loaded the sample data");
    } else {
      console.log(`Found ${count} users; left the data as it is`);
    }
    // Also catches plaintext passwords loaded by the old seed scripts.
    await hashSeedPasswords(t);
    // Login lowercases the email it is given, so stored ones must match.
    await t.none("UPDATE users SET email = lower(trim(email)) WHERE email <> lower(trim(email))");
    // Registration doesn't allow spaces in usernames; older rows had them.
    // Leading and trailing whitespace (tabs too) is dropped; inner runs become "_".
    await t.none("UPDATE users SET username = regexp_replace(regexp_replace(username, '^[[:space:]]+|[[:space:]]+$', '', 'g'), '[[:space:]]+', '_', 'g') WHERE username ~ '[[:space:]]'");
    // Anything still breaking the registration rules (such as a name that
    // was only spaces) needs a person to rename it, so stop and say which.
    const badNames = await t.any("SELECT user_id, username FROM users WHERE username !~ '^[A-Za-z0-9_.-]{3,30}$'");
    if (badNames.length) {
      const list = badNames.map((u) => `${u.user_id} "${u.username}"`).join(", ");
      throw new Error(`These usernames break the registration rules: ${list}. Rename them, then run setup again.`);
    }

    // The next id handed out is one past the highest in use (or 1 if the
    // table is empty).
    for (const [table, column] of ID_COLUMNS) {
      await t.one(
        "SELECT setval(pg_get_serial_sequence($1, $2), COALESCE(MAX($2:name), 1), MAX($2:name) IS NOT NULL) FROM $1:name",
        [table, column]
      );
    }
    console.log("Id counters are past the existing rows");

    await setUpAppAccount(t);
  });
}

setup()
  .catch((error) => {
    console.error("Database setup failed, so nothing was changed:", error.message);
    // 42501: Postgres insufficient_privilege
    if (error.code === "42501") {
      console.error("PG_ADMIN_USER must own the database and be allowed to create and manage roles (CREATEROLE).");
    }
    // 23505: Postgres unique_violation, e.g. two emails that differ only by case
    if (error.code === "23505") {
      console.error("Two users would end up with the same email or username (" + error.detail.replace(/[.]$/, "") + "). Change one of them, then run setup again.");
    }
    process.exitCode = 1;
  })
  .finally(() => pgp.end());
