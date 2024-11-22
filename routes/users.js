const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  generateAccessToken,
  setRefreshTokenCookie,
  authenticateToken,
} = require('./auth');

// Create a new user
router.post('/', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required.' });
  }

  if (password.length < 7) {
    return res.status(422).json({ message: 'Password must be at least 7 characters long.' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'user',
    });

    const newUser = await user.save();
    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (err) {
    res.status(500).json({ message: 'An error occurred. Please try again later.' });
  }
});

// Login and generate tokens
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid email or password' });

    const accessToken = generateAccessToken(user);
    setRefreshTokenCookie(res, user);

    res.json({ accessToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Refresh Access Token
router.post('/token', (req, res) => {
  const token = req.cookies.refreshToken; // Retrieve refresh token from cookie
  if (!token) return res.status(401).json({ message: 'Refresh token is required' });

  jwt.verify(token, process.env.REFRESH_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid refresh token' });

    const accessToken = generateAccessToken({ _id: user._id, role: user.role });
    res.json({ accessToken });
  });
});

// Revoke Refresh Token (Logout)
router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken'); // Clear the refresh token cookie
  res.status(200).json({ message: 'Logged out successfully' });
});

// Update user data (only the same user can update their profile)
router.put('/:id', authenticateToken, async (req, res) => {
  if (req.user._id !== req.params.id) {
    return res.status(403).json({ message: 'Access denied. You can only edit your own profile.' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.body.name != null) user.name = req.body.name;
    if (req.body.email != null) user.email = req.body.email;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } catch (err) {
    res.status(500).json({ message: 'An error occurred while updating the profile.' });
  }
});

// Get user data (only the same user can get their profile)
router.get('/:id', authenticateToken, async (req, res) => {
  if (req.user._id !== req.params.id) {
    return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
  }

  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: 'An error occurred while fetching the profile.' });
  }
});

module.exports = router;
