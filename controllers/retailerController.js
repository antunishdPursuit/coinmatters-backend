const express = require("express");
const retailers = express.Router();

const {
  getAllRetailers,
  getRetailer,
} = require("../queries/retailers.js");
// const { validateURL } = require("../validations/checkRetailers.js");
// const listsController = require("./listsController.js");
// retailers.use("/:retailerId/lists", listsController);

// INDEX
retailers.get("/", async (req, res) => {
    const allRetailers = await getAllRetailers();
    if (allRetailers[0]) {
      res.status(200).json(allRetailers);
    } else {
      res.status(500).json({ error: "server error" });
    }
});

// SHOW
retailers.get("/:id", async (req, res) => {
  const id = req.params.id;
  const retailer = await getRetailer(id);
  if (retailer) {
    res.json(retailer);
  } else {
    res.status(404).json({ error: "not found" });
  }
});


module.exports = retailers;