const db = require("../db/dbConfig.js");

// Database errors are not caught here: they reach the app's error handler,
// which answers 500 without exposing the error.

// ALL Retailers
const getAllRetailers = () => db.any("SELECT * FROM retailers");

// ONE Retailer, or null if there is none
const getRetailer = (id) =>
  db.oneOrNone("SELECT * FROM retailers WHERE retailer_id=$1", id);

module.exports = {
  getAllRetailers,
  getRetailer
};
