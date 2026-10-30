const db = require("../db/dbConfig.js");

const getAllProducts = async () => {
  try {
  const allProducts = await db.any("SELECT * FROM products");
  return allProducts;
  } catch (err) {
  return err;
  }};

const getProduct = async (id) => {
  try {
    const oneProduct = await db.one("SELECT * FROM products WHERE id=$1", id);
    return oneProduct;
  } catch (error) {
    return error;
  }
};

module.exports = {
  getAllProducts,
  getProduct
};