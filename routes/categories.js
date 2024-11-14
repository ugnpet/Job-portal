const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Job = require('../models/Job');
const jwt = require('jsonwebtoken'); 
require('dotenv').config(); 

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied: No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Access denied: Invalid token' });

    req.user = user; 
    next();
  });
}

// Middleware to check for admin role
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admins only' });
  }
}

// Middleware to validate ObjectId format
function validateObjectId(req, res, next) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  next();
}

// Middleware to get category by ID
async function getCategory(req, res, next) {
  let category;
  try {
    category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.category = category;
  next();
}

// GET all categories (public route)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create a new category (admin only)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  if (req.body.id) {
    return res.status(400).json({ message: 'ID should not be set when creating a new category' });
  }

  const category = new Category({
    name: req.body.name,
  });

  try {
    const newCategory = await category.save();
    res.status(201).json(newCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update a category (admin only)
router.put('/:id', authenticateToken, isAdmin, validateObjectId, getCategory, async (req, res) => {
  if (req.body.name != null) {
    res.category.name = req.body.name;
  }

  if (req.body.name == null) {
    return res.status(400).json({ message: 'All fields must be provided. Missing field: name' });
  }

  try {
    const updatedCategory = await res.category.save();
    res.json(updatedCategory);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a category (admin only)
router.delete('/:id', authenticateToken, isAdmin, validateObjectId, getCategory, async (req, res) => {
  try {
    await res.category.deleteOne();
    res.status(204).json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET jobs by category (public route)
router.get('/:id/jobs', validateObjectId, async (req, res) => {
  try {
    const jobs = await Job.find({ categoryId: req.params.id });
    if (jobs.length === 0) {
      return res.status(404).json({ message: 'No jobs found for this category' });
    }
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all comments (authenticated users)
router.get('/all-comments', authenticateToken, async (req, res) => {
  try {
    const categories = await Category.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: 'categoryId',
          as: 'jobs'
        }
      },
      {
        $unwind: '$jobs'
      },
      {
        $lookup: {
          from: 'comments',
          localField: 'jobs._id',
          foreignField: 'jobId',
          as: 'jobs.comments'
        }
      },
      {
        $group: {
          _id: '$_id',
          name: { $first: '$name' },
          jobs: { $push: '$jobs' }
        }
      }
    ]);

    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
