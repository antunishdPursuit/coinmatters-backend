const db = require("../db/dbConfig.js");

// Database errors are not caught here: they reach the app's error handler,
// which answers 500 without exposing the error.

const getUserLists = (user_id) =>
  db.any("SELECT * FROM lists WHERE user_id=$1", user_id);

// One list, or null if there is none
const getList = (id) =>
  db.oneOrNone("SELECT * FROM lists WHERE list_id = $1", id);

const newList = (list) =>
  db.one(
    "INSERT INTO lists (user_id, list_name, products, note, date_created) VALUES($1, $2, $3, $4, $5) RETURNING *",
    [list.user_id, list.list_name, list.products, list.note, list.date_created]
  );

// The deleted list, or null if there was none
const deleteList = (id) =>
  db.oneOrNone("DELETE FROM lists WHERE list_id=$1 RETURNING *", id);

// The updated list, or null if there was none
const updateList = (id, list) =>
  db.oneOrNone(
    "UPDATE lists SET list_name=$1, products=$2, note=$3 WHERE list_id=$4 RETURNING *",
    [list.list_name, list.products, list.note, id]
  );

module.exports = {
  getUserLists,
  getList,
  newList,
  deleteList,
  updateList,
};
