-- Local setup: run against an existing, empty coinsmatter_dev database.
-- Unlike schema.sql, this never drops the database or existing tables.

CREATE TABLE IF NOT EXISTS users (
 user_id SERIAL PRIMARY KEY,
 username VARCHAR(255) UNIQUE NOT NULL,
 email TEXT UNIQUE NOT NULL,
 password TEXT NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lists (
 list_id SERIAL PRIMARY KEY,
 user_id INTEGER REFERENCES users(user_id)
 ON DELETE CASCADE,
 list_name TEXT NOT NULL,
 products TEXT[],
 note VARCHAR(255),
 date_created TEXT
);

CREATE TABLE IF NOT EXISTS retailers (
  retailer_id SERIAL PRIMARY KEY,
  retailer_name VARCHAR(255) UNIQUE NOT NULL,
  zipcodes_array INTEGER[],
  website TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
 product_id SERIAL PRIMARY KEY,
 product_name TEXT,
 size TEXT,
 price DECIMAL,
 retailer_id INTEGER REFERENCES retailers(retailer_id),
 thumbnail TEXT
);

CREATE TABLE IF NOT EXISTS products_list (
  product_id INTEGER,
  list_id INTEGER,
  quantity INTEGER,
  PRIMARY KEY (product_id, list_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id),
  FOREIGN KEY (list_id) REFERENCES lists(list_id)
  ON DELETE CASCADE
);
