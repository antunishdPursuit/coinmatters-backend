-- Brings tables made by an older schema.sql up to the current one.
-- db:setup runs it after schema.sql on every run, so each statement must
-- be safe to repeat. It fails, and setup changes nothing, if existing rows
-- break a new rule.

-- Every list belongs to a user.
ALTER TABLE lists ALTER COLUMN user_id SET NOT NULL;

-- A list's creation time is a real timestamp that the server sets. Old
-- rows stored it as ISO text, which converts directly; missing ones get
-- the time of the upgrade. Text without a time zone is read as UTC,
-- whatever the server's own zone is.
SET LOCAL TIME ZONE 'UTC';
ALTER TABLE lists ALTER COLUMN date_created TYPE TIMESTAMPTZ USING date_created::TIMESTAMPTZ;
UPDATE lists SET date_created = now() WHERE date_created IS NULL;
ALTER TABLE lists ALTER COLUMN date_created SET DEFAULT now();
ALTER TABLE lists ALTER COLUMN date_created SET NOT NULL;

-- Every product has a name, a store and a price in dollars and cents.
-- Changing the type would silently round prices with more decimals, so
-- stop and say so instead.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM products WHERE price <> round(price, 2)) THEN
    RAISE EXCEPTION 'products.price has values with more than two decimals; fix them before running setup';
  END IF;
END $$;
ALTER TABLE products ALTER COLUMN price TYPE NUMERIC(10, 2);
ALTER TABLE products ALTER COLUMN price SET NOT NULL;
ALTER TABLE products ALTER COLUMN product_name SET NOT NULL;
ALTER TABLE products ALTER COLUMN retailer_id SET NOT NULL;

-- The sample data once had an image link starting "https:/https://".
UPDATE products SET thumbnail = substr(thumbnail, length('https:/') + 1)
 WHERE thumbnail LIKE 'https:/https://%';

-- Lists keep their items as names in lists.products; products_list was
-- never used. It is dropped only while empty, so no data can be lost.
DO $$
BEGIN
  IF to_regclass('public.products_list') IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM products_list) THEN
      RAISE EXCEPTION 'products_list has rows; move or delete them before running setup';
    END IF;
    DROP TABLE products_list;
  END IF;
END $$;
