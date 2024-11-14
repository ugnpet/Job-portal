const express = require('express');
const router = express.Router();
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

// Middleware to get job by ID
async function getJob(req, res, next) {
  let job;
  try {
    job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.job = job;
  next();
}

// GET all jobs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const jobs = await Job.find();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET job by ID
router.get('/:id', authenticateToken, getJob, (req, res) => {
  res.json(res.job);
});

// POST create a new job
router.post('/', authenticateToken, async (req, res) => {
  const job = new Job({
    title: req.body.title,
    description: req.body.description,
    categoryId: req.body.categoryId,
    userId: req.body.userId, 
  });

  try {
    const newJob = await job.save();
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT update a job
router.put('/:id',authenticateToken, getJob, async (req, res) => {
  if (req.body.title != null) {
    res.job.title = req.body.title;
  }
  if (req.body.description != null) {
    res.job.description = req.body.description;
  }
  if (req.body.categoryId != null) {
    res.job.categoryId = req.body.categoryId;
  }
  if (req.body.title == null || req.body.categoryId == null || req.body.description == null) {
    return res.status(400).json({ message: 'All fields must be provided. Missing field: name' });
  }

  try {
    const updatedJob = await res.job.save();
    res.json(updatedJob);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a job
router.delete('/:id', authenticateToken, getJob, async (req, res) => {
  if (!req.params.id) {
    return res.status(500).json({ message: 'ID parameter is missing' });
  }
  try {
    await res.job.deleteOne();
    res.status(204).json({ message: 'Job deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
