const pgp = require("pg-promise")();
const dotenv = require("dotenv");
dotenv.config({ quiet: true });

// Postgres sends NUMERIC values (product prices) as text, so the browser
// compared "11.59" < "2.69" as words. Read them as numbers instead.
const NUMERIC_TYPE_ID = 1700;
pgp.pg.types.setTypeParser(NUMERIC_TYPE_ID, (value) => (value === null ? null : parseFloat(value)));

const cn = {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
};

const db = pgp(cn);

module.exports = db;
