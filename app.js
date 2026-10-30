const { checkToken, checkLoginMiddleware, logOutVerify } = require("./verification/checkAuth") 

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

// ROUTES
app.get("/", (req, res) => {
  res.send("Welcome to CoinMatters App, where ya coin really matters");
});

app.post('/register', registerController.registerUser);
app.post('/login', registerController.loginUser);
app.get('/user', checkToken, registerController.userData)
app.get('/check-login', checkLoginMiddleware, registerController.checkLogin)
app.post('/logout', logOutVerify, registerController.logOut)


// Users ROUTES
const usersController = require("./controllers/usersController.js");
app.use("/users", usersController);

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
app.get("/{*splat}", (req, res) => {
  res.status(404).send("Page not found");
});

// EXPORT
module.exports = app;
