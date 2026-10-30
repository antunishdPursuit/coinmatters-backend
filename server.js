// DEPENDENCIES
const app = require("./app.js");

// CONFIGURATION
require("dotenv").config();
const PORT = process.env.PORT;
const HOST = process.env.HOST;

// LISTEN
app.listen(PORT, HOST, () => {
  console.log(`Listening on ${HOST || "all interfaces"}:${PORT}`);
});
