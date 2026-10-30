const db = require("../db/dbConfig.js");

// Database errors are not caught here: they reach the app's error handler,
// which answers 500 without exposing the error.

const getUserLists = (user_id) =>
  db.any("SELECT * FROM lists WHERE user_id=$1", user_id);

// One list, or null if there is none
const getList = (id) =>
  db.oneOrNone("SELECT * FROM lists WHERE list_id = $1", id);

// date_created is set by the database, not the client.
const newList = (list) =>
  db.one(
    "INSERT INTO lists (user_id, list_name, products, note) VALUES($1, $2, $3, $4) RETURNING *",
    [list.user_id, list.list_name, list.products, list.note]
  );

// The deleted list, or null if the user has no list with that id
const deleteList = (id, user_id) =>
  db.oneOrNone("DELETE FROM lists WHERE list_id=$1 AND user_id=$2 RETURNING *", [id, user_id]);

// The updated list, or null if the user has no list with that id
const updateList = (id, user_id, list) =>
  db.oneOrNone(
    "UPDATE lists SET list_name=$1, products=$2, note=$3 WHERE list_id=$4 AND user_id=$5 RETURNING *",
    [list.list_name, list.products, list.note, id, user_id]
  );

module.exports = {
  getUserLists,
  getList,
  newList,
  deleteList,
  updateList,
};
