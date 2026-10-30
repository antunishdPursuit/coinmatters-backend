const db = require("../db/dbConfig.js");

// ALL Retailers
const getAllRetailers = async () => {
    try {
      const allRetailers = await db.any("SELECT * FROM retailers");
      return allRetailers;
    } catch (error) {
      return error;
    }
};

// ONE Retailer
const getRetailer = async (id) => {
  try {
    const oneRetailer = await db.one("SELECT * FROM retailers WHERE retailer_id=$1", id);
    return oneRetailer;
  } catch (error) {
    return error;
  }
};

module.exports = {
  getAllRetailers,
  getRetailer
};