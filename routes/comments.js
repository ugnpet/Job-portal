const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
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

// Middleware to get comment by ID
async function getComment(req, res, next) {
  let comment;
  try {
    comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.comment = comment;
  next();
}

// GET comments for a job
router.get('/jobs/:jobId/comments', authenticateToken, async (req, res) => {
  try {
    const comments = await Comment.find({ jobId: req.params.jobId });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add a comment to a job
router.post('/jobs/:jobId/comments', authenticateToken, async (req, res) => {
  const comment = new Comment({
    content: req.body.content,
    jobId: req.params.jobId,
    userId: req.body.userId, 
  });

  try {
    const newComment = await comment.save();
    res.status(201).json(newComment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET comment by ID
router.get('/comments/:id', authenticateToken, getComment, (req, res) => {
  res.json(res.comment);
});

// PUT update a comment
router.put('/comments/:id', authenticateToken, getComment, async (req, res) => {
  if (req.body.content != null) {
    res.comment.content = req.body.content;
  }
  if (req.body.content == null) {
    return res.status(400).json({ message: 'All fields must be provided. Missing field: name' });
  }

  try {
    const updatedComment = await res.comment.save();
    res.json(updatedComment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a comment
router.delete('/comments/:id', authenticateToken, getComment, async (req, res) => {
  if (!req.params.id) {
    return res.status(500).json({ message: 'ID parameter is missing' });
  }
  try {
    await res.comment.deleteOne();
    res.status(204).json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
