const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const { authenticateToken } = require('./auth');

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

// Middleware to check if the user owns the comment
function authorizeCommentOwner(req, res, next) {
  if (res.comment.userId.toString() !== req.user._id) {
    return res.status(403).json({ message: 'Access denied. You do not own this comment.' });
  }
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
    userId: req.user._id, 
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

// PUT update a comment (only comment owner)
router.put('/comments/:id', authenticateToken, getComment, authorizeCommentOwner, async (req, res) => {
  if (req.body.content != null) {
    res.comment.content = req.body.content;
  } else {
    return res.status(400).json({ message: 'Content is required.' });
  }

  try {
    const updatedComment = await res.comment.save();
    res.json(updatedComment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a comment (only comment owner)
router.delete('/comments/:id', authenticateToken, getComment, authorizeCommentOwner, async (req, res) => {
  try {
    await res.comment.deleteOne();
    res.status(204).json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
