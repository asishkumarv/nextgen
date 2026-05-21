const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nextgen_jwt_secret_key_12345');
    req.user = decoded; // { id, phone }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nextgen_jwt_secret_key_12345');
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Access denied, administrator role required' });
    }
    req.admin = decoded; // { id, email, isAdmin: true }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = {
  authenticateUser,
  authenticateAdmin
};
