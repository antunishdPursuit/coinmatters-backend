// CONFIGURATION
// Load .env before the app, so every module sees the settings.
require("dotenv").config({ quiet: true });
const PORT = process.env.PORT;
const HOST = process.env.HOST;

// Sessions are signed with this secret; refuse to start without one.
if (!process.env.TOKEN_SECRET) {
  console.error("TOKEN_SECRET is not set. Add it to .env before starting the server.");
  process.exit(1);
}

// DEPENDENCIES
const app = require("./app.js");

// LISTEN
app.listen(PORT, HOST, () => {
  console.log(`Listening on ${HOST || "all interfaces"}:${PORT}`);
});
