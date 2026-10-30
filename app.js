const { requireLogin } = require("./verification/checkAuth");
const { loginLimiter, registerLimiter } = require("./verification/rateLimits");
const { validate, registerProblem, loginProblem } = require("./validations/input");

// DEPENDENCIES
const cors = require("cors");
const express = require("express");
const registerController = require("./controllers/registerController"); 
const CookieParser = require("cookie-parser");


// CONFIGURATION
const app = express();

const originURL = process.env.ORIGIN_URL; 

// MIDDLEWARE
app.use(express.json());
app.use(CookieParser());
app.use(cors({
  origin : originURL,
  credentials: true,
}))

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', `${originURL}`);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Requests that change data must be JSON. Another site can only send JSON
// here after a CORS check that it fails, so this blocks forged form posts.
app.use((req, res, next) => {
  const type = (req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  if (["GET", "HEAD", "OPTIONS"].includes(req.method) || type === "application/json") {
    return next();
  }
  res.status(415).json({ error: "Requests that change data must be JSON" });
});

// ROUTES
app.get("/", (req, res) => {
  res.send("Welcome to CoinMatters App, where ya coin really matters");
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
app.use((req, res) => {
  res.status(404).send("Page not found");
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
