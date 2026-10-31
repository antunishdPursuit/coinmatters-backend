-- More sample groceries, so price comparison has more items to work with.
-- Prices are sample data, not real store prices. db:setup runs this on
-- every run, after the id counters are set, so fresh and existing
-- databases both get these products. A product already at a store (same
-- name, same store) is left as it is.
INSERT INTO products (product_name, size, price, retailer_id)
SELECT v.product_name, v.size, v.price, v.retailer_id
  FROM (VALUES
    -- CTown
    ('White Bread', '20 Ounces', 2.99, 1),
    ('Bananas', '1 Pound', 0.79, 1),
    ('Spaghetti Pasta', '16 Ounces', 1.29, 1),
    ('Penne Pasta', '16 Ounces', 1.09, 1),
    ('Turkey Cold Cuts', '16 Ounces', 6.99, 1),
    ('Vanilla Ice Cream', '48 Ounces', 4.49, 1),
    ('Vanilla Yogurt', '32 Ounces', 3.29, 1),
    ('Orange Juice', '52 Ounces', 4.29, 1),
    ('Creamy Peanut Butter', '16 Ounces', 2.99, 1),
    ('Gala Apples', '3 Pounds', 4.49, 1),
    -- Target
    ('White Bread', '20 Ounces', 2.49, 2),
    ('Whole Wheat Bread', '20 Ounces', 2.79, 2),
    ('Bananas', '1 Pound', 0.65, 2),
    ('Spaghetti Pasta', '16 Ounces', 1.19, 2),
    ('Turkey Cold Cuts', '16 Ounces', 7.49, 2),
    ('Pepperoni Pizza', '1 Pizza', 5.99, 2),
    ('Vanilla Yogurt', '32 Ounces', 3.49, 2),
    ('White Rice', '5 Pounds', 4.99, 2),
    ('Brown Rice', '5 Pounds', 5.89, 2),
    ('Orange Juice', '52 Ounces', 3.99, 2),
    -- Walmart
    ('White Bread', '20 Ounces', 2.28, 3),
    ('Bananas', '1 Pound', 0.58, 3),
    ('Spaghetti Pasta', '16 Ounces', 1.32, 3),
    ('Turkey Cold Cuts', '16 Ounces', 7.24, 3),
    ('Pepperoni Pizza', '1 Pizza', 5.47, 3),
    ('Vanilla Ice Cream', '48 Ounces', 4.98, 3),
    ('White Rice', '5 Pounds', 5.24, 3),
    ('Creamy Peanut Butter', '16 Ounces', 2.62, 3),
    ('Corn Flakes Cereal', '18 Ounces', 3.48, 3),
    ('Honey Oat Cereal', '18 Ounces', 3.98, 3)
  ) AS v (product_name, size, price, retailer_id)
 WHERE NOT EXISTS (
   SELECT 1 FROM products p
    WHERE p.product_name = v.product_name AND p.retailer_id = v.retailer_id
 );
