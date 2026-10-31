const { test } = require("node:test");
const assert = require("node:assert/strict");
const { db } = require("./helpers.js");

// The browser finds a list item at a store by looking for the item's name,
// ignoring letter case, inside product names, then compares the cheapest
// match at each store. Each extra item should turn up at exactly these
// stores, with the cheapest match being one of the extra products.
const CTOWN = 1;
const TARGET = 2;
const WALMART = 3;
const EXTRA_ITEMS = {
  bread: [CTOWN, TARGET, WALMART],
  bananas: [CTOWN, TARGET, WALMART],
  pasta: [CTOWN, TARGET, WALMART],
  "cold cuts": [CTOWN, TARGET, WALMART],
  pizza: [TARGET, WALMART],
  "ice cream": [CTOWN, WALMART],
  yogurt: [CTOWN, TARGET],
  rice: [TARGET, WALMART],
  "orange juice": [CTOWN, TARGET],
  "peanut butter": [CTOWN, WALMART],
  apples: [CTOWN],
  cereal: [WALMART],
};

// The products db/more-products.sql adds at each store.
const EXTRA_NAMES = {
  [CTOWN]: ["White Bread", "Bananas", "Spaghetti Pasta", "Penne Pasta", "Turkey Cold Cuts", "Vanilla Ice Cream", "Vanilla Yogurt", "Orange Juice", "Creamy Peanut Butter", "Gala Apples"],
  [TARGET]: ["White Bread", "Whole Wheat Bread", "Bananas", "Spaghetti Pasta", "Turkey Cold Cuts", "Pepperoni Pizza", "Vanilla Yogurt", "White Rice", "Brown Rice", "Orange Juice"],
  [WALMART]: ["White Bread", "Bananas", "Spaghetti Pasta", "Turkey Cold Cuts", "Pepperoni Pizza", "Vanilla Ice Cream", "White Rice", "Creamy Peanut Butter", "Corn Flakes Cereal", "Honey Oat Cereal"],
};

// Items the sample data had before, whose matches should stay the same.
const EARLIER_ITEMS = ["milk", "eggs", "cheese", "chicken", "coffee", "water", "strawberries", "velveeta"];

const loadProducts = () => db.any("SELECT product_id, product_name, price, retailer_id FROM products ORDER BY product_id");
const matching = (products, item) => products.filter((p) => p.product_name.toLowerCase().includes(item));
const isExtra = (p) => EXTRA_NAMES[p.retailer_id]?.includes(p.product_name) ?? false;

test("each store has its 10 extra products", async () => {
  const products = await loadProducts();
  for (const [store, names] of Object.entries(EXTRA_NAMES)) {
    const found = products.filter((p) => p.retailer_id === Number(store) && isExtra(p)).map((p) => p.product_name);
    assert.deepEqual(found.sort(), [...names].sort(), `store ${store}`);
  }
});

test("each extra item is found at exactly its stores", async () => {
  const products = await loadProducts();
  for (const [item, stores] of Object.entries(EXTRA_ITEMS)) {
    const found = [...new Set(matching(products, item).map((p) => p.retailer_id))].sort((a, b) => a - b);
    assert.deepEqual(found, stores, item);
    for (const store of stores) {
      const atStore = matching(products, item).filter((p) => p.retailer_id === store);
      const cheapest = atStore.reduce((a, b) => (b.price < a.price ? b : a));
      assert.ok(isExtra(cheapest), `${item} at store ${store}: ${cheapest.product_name}`);
    }
  }
});

test("earlier items don't match any extra product", async () => {
  const products = await loadProducts();
  for (const item of EARLIER_ITEMS) {
    const extras = matching(products, item).filter(isExtra);
    assert.deepEqual(extras.map((p) => p.product_name), [], item);
  }
});
