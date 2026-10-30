const db = require("../db/dbConfig.js");

// Database errors are not caught here: they reach the app's error handler,
// which answers 500 without exposing the error.

const getAllProducts = () => db.any("SELECT * FROM products");

// One product, or null if there is none
const getProduct = (id) =>
  db.oneOrNone("SELECT * FROM products WHERE product_id=$1", id);

module.exports = {
  getAllProducts,
  getProduct
};
