-- CoinMatters tables. Safe to run more than once: it never drops the
-- database or a table, and only creates what is missing. Run it with
-- `npm run db:setup`, which also loads the sample data into an empty database.
-- Tables made by an older version are brought up to date by upgrades.sql.

CREATE TABLE IF NOT EXISTS users (
 user_id SERIAL PRIMARY KEY,
 username VARCHAR(255) UNIQUE NOT NULL,
 email TEXT UNIQUE NOT NULL,
 password TEXT NOT NULL,
 created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lists (
 list_id SERIAL PRIMARY KEY,
 user_id INTEGER NOT NULL REFERENCES users(user_id)
 ON DELETE CASCADE,
 list_name TEXT NOT NULL,
 products TEXT[],
 note VARCHAR(255),
 date_created TEXT
);

-- The app looks up lists by their owner.
CREATE INDEX IF NOT EXISTS lists_user_id_idx ON lists (user_id);

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
