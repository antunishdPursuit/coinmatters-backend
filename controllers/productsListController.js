const express = require("express");

const products = express.Router({ mergeParams: true });
const { getAllProducts, getProduct } = require("../queries/products.js");

// INDEX
products.get("/", async (req, res) => {
    const { listId } = req.params;

    try {
      const allProducts = await getAllProducts(listId);
      res.json(allProducts);
    } catch (err) {
      res.json(err);
    }
  });

// SHOW
products.get("/:id", async (req, res) => {
  const { id } = req.params;
  const product = await getProduct(id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: "not found" });
  }
});


module.exports = products;