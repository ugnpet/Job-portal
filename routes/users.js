const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 

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

async function getUser(req, res, next) {
  let user;
  try {
    user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.user = user;
  next();
}

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



router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid email or password' });


    const token = jwt.sign(
      { _id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', authenticateToken, getUser, async (req, res) => {
  if (req.user._id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  if (req.body.name != null) {
    res.user.name = req.body.name;
  }
  if (req.body.email != null) {
    res.user.email = req.body.email;
  }
  if (!req.body.name || !req.body.email) {
    return res.status(400).json({ message: 'All fields must be provided. Missing field: name or email' });
  }

  try {
    const updatedUser = await res.user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/:id', authenticateToken, getUser, (req, res) => {
  if (req.user._id !== req.params.id && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  res.json(res.user);
});

module.exports = router;
