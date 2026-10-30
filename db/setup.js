// Sets up the database: `npm run db:setup`. Safe to run more than once.
//   1. Creates any missing tables (schema.sql).
//   2. If there are no users yet, loads the sample data (seed.sql). Then
//      replaces any plaintext password (the sample data has them) with a
//      bcrypt hash.
// The database itself must already exist.
require("dotenv").config({ quiet: true });
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const pgp = require("pg-promise")();

const db = pgp({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  database: process.env.PG_DATABASE,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
});

// Reads a SQL file, leaving out psql-only lines such as "\c database".
const readSql = (name) =>
  fs.readFileSync(path.join(__dirname, name), "utf8")
    .split(/\r?\n/)
    .filter((line) => !line.startsWith("\\"))
    .join("\n");

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
  });
}

setup()
  .catch((error) => {
    console.error("Database setup failed, so nothing was changed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pgp.end());
