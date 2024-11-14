const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to get user by ID
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

// POST register a new user
router.post('/', async (req, res) => {
  
  if (!req.body.password || req.body.password.length < 7) {
    return res.status(422).json({ message: 'Password must be at least 7 characters long' });
  }
  
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
  });

  try {
    const newUser = await user.save();
    res.status(201).json({ 
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT: Update user information by ID
router.put('/:id', getUser, async (req, res) => {
  if (req.body.name != null) {
    res.user.name = req.body.name;
  }
  if (req.body.email != null) {
    res.user.email = req.body.email;
  }
  if (req.body.name == null || req.body.email == null) {
    return res.status(400).json({ message: 'All fields must be provided. Missing field: name' });
  }

  try {
    const updatedUser = await res.user.save();
    res.json(updatedUser);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET user information
router.get('/:id', getUser, (req, res) => {
  res.json(res.user);
});

module.exports = router;
