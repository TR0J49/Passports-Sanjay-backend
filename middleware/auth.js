const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    // Use same JWT_SECRET as login (with fallback)
    const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret_key_change_in_production';
    const decoded = jwt.verify(token, jwtSecret);
    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

module.exports = { protect };
