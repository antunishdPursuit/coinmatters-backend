const { rateLimit } = require("express-rate-limit");

// Limits count requests per IP address. The tests raise them through the
// environment so that only the rate-limit test runs into them.
const limitFrom = (name, fallback) => Number(process.env[name]) || fallback;

// Only failed logins count, so people who sign in normally are never blocked.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: limitFrom("LOGIN_LIMIT", 10),
  skipSuccessfulRequests: true,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many failed logins. Try again in 15 minutes." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: limitFrom("REGISTER_LIMIT", 5),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many new accounts from this address. Try again later." },
});

module.exports = { loginLimiter, registerLimiter };
