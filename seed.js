require('dotenv').config();
const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');


const Category = require('./models/Category');
const User = require('./models/User');
const Job = require('./models/Job');
const Comment = require('./models/Comment');
const mongoURI = 'mongodb+srv://ugne2p:JLmTDby4ImRemDdT@cluster0.umdhm.mongodb.net/';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Prisijungta prie MongoDB Atlas');
    seedDatabase();
  })
  .catch((err) => {
    console.error('Prisijungimo klaida:', err);
  });

async function seedDatabase() {
  try {
    await Comment.deleteMany({});
    await Job.deleteMany({});
    await User.deleteMany({});
    await Category.deleteMany({});

    console.log('Išvalyta duomenų bazė');

    const categories = [];
    const categoryNames = ['IT', 'Marketing', 'Finance', 'Healthcare', 'Education', 'Engineering', 'Sales', 'Customer Support'];
    for (let name of categoryNames) {
      const category = new Category({ name });
      await category.save();
      categories.push(category);
    }

    console.log('Sukurtos kategorijos');

    const users = [];
    for (let i = 0; i < 10; i++) {
      const user = new User({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: faker.internet.password(),
        role: faker.helpers.arrayElement(['user', 'admin']),
      });
      await user.save();
      users.push(user);
    }

    console.log('Sukurti naudotojai');

    const jobs = [];
    for (let i = 0; i < 20; i++) {
      const job = new Job({
        title: faker.person.jobTitle(),
        description: faker.lorem.paragraphs(2),
        categoryId: faker.helpers.arrayElement(categories)._id,
        userId: faker.helpers.arrayElement(users)._id,
        createdAt: faker.date.past(), 
      });
      await job.save();
      jobs.push(job);
    }

    console.log('Sukurti darbo skelbimai');

    for (let i = 0; i < 50; i++) {
      const comment = new Comment({
        content: faker.lorem.sentence(),
        jobId: faker.helpers.arrayElement(jobs)._id,
        userId: faker.helpers.arrayElement(users)._id,
        createdAt: faker.date.past(), 
      });
      await comment.save();
    }

    console.log('Sukurti komentarai');

    console.log('Duomenų bazė užpildyta sėkmingai!');
    process.exit();
  } catch (err) {
    console.error('Klaida seed skripte:', err);
    process.exit(1);
  }
}
