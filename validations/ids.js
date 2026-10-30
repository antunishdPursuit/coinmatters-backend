// Route ids must be whole numbers that fit a Postgres integer. Anything else
// is answered with 400 before it reaches the database.
const isId = (value) => /^[1-9]\d{0,9}$/.test(value) && Number(value) <= 2147483647;

// Middleware that checks the named route parameters, e.g. checkIds("id").
const checkIds = (...names) => (req, res, next) => {
  for (const name of names) {
    if (!isId(req.params[name])) {
      return res.status(400).json({ error: `Invalid ${name}` });
    }
  }
  next();
};

module.exports = { checkIds };
