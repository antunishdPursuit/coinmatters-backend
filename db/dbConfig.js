const pgp = require("pg-promise")();
const dotenv = require("dotenv");
dotenv.config({ quiet: true });

const cn = {
    host: process.env.PG_HOST,
    port: process.env.PG_PORT,
    database: process.env.PG_DATABASE,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
};

const db = pgp(cn);

module.exports = db;
