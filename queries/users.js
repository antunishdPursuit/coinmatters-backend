const db = require("../db/dbConfig.js");

// Columns safe to send to a client. The password hash never leaves the database.
const PUBLIC_COLUMNS = "user_id, username, email, created_at";

// Database errors are not caught here: they reach the app's error handler,
// which answers 500 without exposing the error.

// ONE User, or null if there is none
const getUser = (id) =>
  db.oneOrNone(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE user_id=$1`, id);

module.exports = {
  getUser
};
