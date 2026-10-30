// Checks request bodies before they reach the database. Each check returns
// an error message for the first problem it finds, or null if the body is
// fine. Express leaves req.body undefined when there is no body.

const isText = (value, min, max) =>
  typeof value === "string" && value.trim().length >= min && value.length <= max;

// Usernames appear in page addresses (/:username), so keep them simple.
const USERNAME = /^[A-Za-z0-9_.-]{3,30}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const registerProblem = (body = {}) => {
  if (typeof body.username !== "string" || !USERNAME.test(body.username)) {
    return "Username must be 3 to 30 letters, numbers, dots, dashes or underscores";
  }
  if (!isText(body.email, 3, 254) || !EMAIL.test(body.email)) {
    return "Enter a valid email address";
  }
  // bcrypt only uses the first 72 bytes of a password.
  if (typeof body.password !== "string" || body.password.length < 8 || Buffer.byteLength(body.password) > 72) {
    return "Password must be 8 to 72 characters";
  }
  return null;
};

const loginProblem = (body = {}) => {
  if (!isText(body.email, 1, 254) || typeof body.password !== "string" || Buffer.byteLength(body.password) > 72) {
    return "Enter your email and password";
  }
  return null;
};

const listProblem = (body = {}) => {
  if (!isText(body.list_name, 1, 255)) {
    return "List name must be 1 to 255 characters";
  }
  if (body.products !== undefined && body.products !== null &&
      !(Array.isArray(body.products) && body.products.length <= 500 &&
        body.products.every((item) => isText(item, 0, 255)))) {
    return "Products must be a list of up to 500 names";
  }
  if (body.note !== undefined && body.note !== null && !isText(body.note, 0, 255)) {
    return "Note must be at most 255 characters";
  }
  if (body.date_created !== undefined && body.date_created !== null && !isText(body.date_created, 0, 50)) {
    return "Invalid date";
  }
  return null;
};

// Wraps a check as middleware that answers 400 with the problem.
const validate = (problemOf) => (req, res, next) => {
  const problem = problemOf(req.body);
  if (problem) {
    return res.status(400).json({ error: problem });
  }
  next();
};

module.exports = { validate, registerProblem, loginProblem, listProblem };
