const db = require("../db/dbConfig.js");

// Columns safe to send to a client. The password hash never leaves the database.
const PUBLIC_COLUMNS = "user_id, username, email, created_at";

// ONE User
const getUser = async (id) => {
  try {
    const oneUser = await db.one(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE user_id=$1`, id);
    return oneUser;
  } catch (error) {
    return error;
  }
};

// CREATE TABLE users (
//     id SERIAL PRIMARY KEY,
//     username VARCHAR(255) UNIQUE NOT NULL,
//     email TEXT UNIQUE NOT NULL,
//     password TEXT NOT NULL,
//     created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//    );

module.exports = {
  getUser
};