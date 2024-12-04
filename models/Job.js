const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  remote: { type: Boolean, default: false }, 
  jobType: { type: String, enum: ['full-time', 'part-time', 'freelance', 'internship'], default: 'full-time' },
  experienceLevel: { type: String, enum: ['entry', 'mid', 'senior'], default: 'entry' }, 
});

module.exports = mongoose.model('Job', JobSchema);
