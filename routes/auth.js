const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate Access Token
function generateAccessToken(user) {
  return jwt.sign(
    { _id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
}

// Generate Refresh Token and set it in an HttpOnly cookie
function setRefreshTokenCookie(res, user) {
  const token = jwt.sign(
    { _id: user._id, role: user.role },
    process.env.REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  // Set cookie options
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', 
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, 
  };

  res.cookie('refreshToken', token, options);
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

// Middleware to refresh the Access Token using the Refresh Token in the cookie
function refreshAccessToken(req, res) {
  const token = req.cookies.refreshToken; 
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.REFRESH_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    const newAccessToken = generateAccessToken({ _id: user._id, role: user.role });
    res.json({ accessToken: newAccessToken });
  });
}

module.exports = {
  generateAccessToken,
  setRefreshTokenCookie,
  authenticateToken,
  authorizeAdmin,
  refreshAccessToken,
};
