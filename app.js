// Load .env here too, so the settings below don't depend on which module
// happens to load it first (the tests require app.js without server.js).
require("dotenv").config({ quiet: true });

const { requireLogin } = require("./verification/checkAuth");
const { loginLimiter, registerLimiter } = require("./verification/rateLimits");
const { validate, registerProblem, loginProblem } = require("./validations/input");

// DEPENDENCIES
const cors = require("cors");
const express = require("express");
const registerController = require("./controllers/registerController");
const CookieParser = require("cookie-parser");
const db = require("./db/dbConfig");


// CONFIGURATION
const app = express();
// Don't advertise the framework in every response.
app.disable("x-powered-by");

const originURL = process.env.ORIGIN_URL; 

// MIDDLEWARE
app.use(express.json());
app.use(CookieParser());
app.use(cors({
  origin : originURL,
  credentials: true,
}))

// Requests that change data must be JSON. Another site can only send JSON
// here after a CORS check that it fails, so this blocks forged form posts.
// A DELETE without a body passes too: browsers send it with no content
// type, and forms can't send DELETE at all.
const hasBody = (req) =>
  req.headers["transfer-encoding"] !== undefined || Number(req.headers["content-length"] || 0) > 0;
app.use((req, res, next) => {
  const type = (req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  if (["GET", "HEAD", "OPTIONS"].includes(req.method) || type === "application/json") {
    return next();
  }
  if (req.method === "DELETE" && !hasBody(req)) {
    return next();
  }
  res.status(415).json({ error: "Requests that change data must be JSON" });
});

// ROUTES
app.get("/", (req, res) => {
  res.send("Welcome to CoinMatters App, where ya coin really matters");
});

// Says whether the API can reach its database, for scripts and monitors.
// The reason for a failure stays in the server log.
app.get("/health", async (req, res) => {
  try {
    await db.one("SELECT 1");
    res.json({ status: "ok" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({ status: "unavailable" });
  }
});

app.post('/register', registerLimiter, validate(registerProblem), registerController.registerUser);
app.post('/login', loginLimiter, validate(loginProblem), registerController.loginUser);
app.get('/user', requireLogin, registerController.userData)
app.get('/check-login', requireLogin, registerController.checkLogin)
app.post('/logout', registerController.logOut)


// Products ROUTE
const productsController = require("./controllers/productsListController.js");
app.use("/products", productsController);

// Retailer ROUTE
const retailerController = require("./controllers/retailerController.js");
app.use("/retailer", retailerController);

//Lists ROUTES
const listsRouter = require("./controllers/listsController.js");

//Use the lists router for requests to '/lists'
app.use("/lists", listsRouter);


// 404 PAGE
// JSON like every other response, so clients can always read { error }.
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ERRORS
// Express sends thrown errors and rejected promises here. A request the
// server could not read (such as broken JSON) gets its 4xx status; anything
// else is a 500 whose details stay in the server log.
app.use((err, req, res, next) => {
  // A response already under way can't change its status; let Express end it.
  if (res.headersSent) {
    return next(err);
  }
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: "Invalid request" });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

// EXPORT
module.exports = app;
