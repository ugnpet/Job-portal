const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Job = require('../models/Job');

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

// GET all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST create a new category
router.post('/', async (req, res) => {
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


// PUT update a category
router.put('/:id', validateObjectId, getCategory, async (req, res) => {
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

// DELETE a category
router.delete('/:id', validateObjectId, getCategory, async (req, res) => {
  if (!req.params.id) {
    return res.status(500).json({ message: 'ID parameter is missing' });
  }
  try {
    await res.category.deleteOne();
    res.status(204).json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET jobs by category
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

module.exports = router;

router.get('/all-comments', async (req, res) => {
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