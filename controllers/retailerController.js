const express = require("express");
const retailers = express.Router();

const {
  getAllRetailers,
  getRetailer,
} = require("../queries/retailers.js");
const { checkIds } = require("../validations/ids.js");

// INDEX
retailers.get("/", async (req, res) => {
  res.json(await getAllRetailers());
});

// SHOW
retailers.get("/:id", checkIds("id"), async (req, res) => {
  const retailer = await getRetailer(req.params.id);
  if (retailer) {
    res.json(retailer);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

module.exports = retailers;
