const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    // Check if there is a token in the "Authorization" header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            // Verify the token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gosuap_secret_key');

            // Attach user info to the request
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ error: "Not authorized, token failed" });
        }
    }

    if (!token) {
        res.status(401).json({ error: "Not authorized, no token" });
    }
};

module.exports = { protect };