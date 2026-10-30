// Run after seed.sql: replaces the seed's plaintext sample passwords with
// bcrypt hashes so the sample accounts can log in like registered users.
const bcrypt = require("bcrypt");
const db = require("./dbConfig");

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(value);

async function hashSeedPasswords() {
  const users = await db.any("SELECT user_id, password FROM users");
  let updated = 0;
  for (const user of users) {
    if (isBcryptHash(user.password)) continue;
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await db.none("UPDATE users SET password = $1 WHERE user_id = $2", [
      hashedPassword,
      user.user_id,
    ]);
    updated++;
  }
  console.log(`Hashed ${updated} of ${users.length} user passwords`);
}

hashSeedPasswords()
  .catch((error) => {
    console.error("Error hashing seed passwords:", error.message);
    process.exitCode = 1;
  })
  .finally(() => db.$pool.end());
