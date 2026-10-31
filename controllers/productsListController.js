const express = require("express");

const products = express.Router();
const { getAllProducts, getProduct } = require("../queries/products.js");
const { checkIds } = require("../validations/ids.js");

// INDEX
products.get("/", async (req, res) => {
  res.json(await getAllProducts());
});

// SHOW
products.get("/:id", checkIds("id"), async (req, res) => {
  const product = await getProduct(req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

module.exports = products;
