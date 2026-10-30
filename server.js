// CONFIGURATION
// Load .env before the app, so every module sees the settings.
require("dotenv").config({ quiet: true });
const PORT = process.env.PORT;
const HOST = process.env.HOST;

// Sessions are signed with TOKEN_SECRET, and ORIGIN_URL is the only site
// allowed to call the API. Refuse to start without either.
for (const name of ["TOKEN_SECRET", "ORIGIN_URL"]) {
  if (!process.env[name]) {
    console.error(`${name} is not set. Add it to .env before starting the server.`);
    process.exit(1);
  }
}

// DEPENDENCIES
const app = require("./app.js");

// LISTEN
app.listen(PORT, HOST, () => {
  console.log(`Listening on ${HOST || "all interfaces"}:${PORT}`);
});
