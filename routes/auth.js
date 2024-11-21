const jwt = require('jsonwebtoken');
const RefreshToken = require('../models/RefreshToken');
require('dotenv').config();

// Generate Access Token
function generateAccessToken(user) {
  return jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// Generate Refresh Token and store it in the database
async function generateRefreshToken(user) {
  const token = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' } 
  );

  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 7);

  const refreshToken = new RefreshToken({
    token,
    userId: user._id,
    expiryDate,
  });

  await refreshToken.save();
  return token;
}

// Middleware to authenticate Access Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    req.user = user;
    next();
  });
}

// Middleware to authorize Admin
function authorizeAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  authenticateToken,
  authorizeAdmin,
};
