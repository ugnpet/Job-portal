const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); 

const app = express();

app.use(cors());
app.use(express.json());

const mongoURI = 'mongodb+srv://ugne2p:JLmTDby4ImRemDdT@cluster0.umdhm.mongodb.net/';

mongoose.connect(mongoURI);

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Error:'));
db.once('open', () => {
  console.log('Connected.');
});

const categoriesRouter = require('./routes/categories');
const jobsRouter = require('./routes/jobs');
const commentsRouter = require('./routes/comments');
const usersRouter = require('./routes/users');

app.use('/categories', categoriesRouter);
app.use('/jobs', jobsRouter);
app.use('/', commentsRouter); 
app.use('/users', usersRouter);

app.listen(5000, () => {
  console.log('Server is running.');
});