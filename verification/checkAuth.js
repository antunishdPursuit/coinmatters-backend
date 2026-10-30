const jwt = require('jsonwebtoken');

// Lets a request through only with a valid session cookie, and puts the
// logged-in user ({ user_id, username, email, iat, exp }) on req.user.
const requireLogin = (req, res, next) => {
    const token = req.cookies.dataToken;
    if (!token) {
        return res.status(401).json({ error: 'Not logged in' });
    }

    jwt.verify(token, process.env.TOKEN_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Not logged in' });
        }
        req.user = decoded;
        next();
    });
};

module.exports = { requireLogin };
