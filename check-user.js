const mongoose = require('mongoose');
const { User } = require('./src/models');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to MongoDB');
  const user = await User.findOne({ email: 'student@example.com' });
  console.log('Found user:', user ? user.email : 'Not found');
  if (user) {
    console.log('User role:', user.role);
    console.log('User isActive:', user.isActive);
    console.log('User isLocked:', user.isLocked());
    const passwordMatch = await user.comparePassword('Learn123!');
    console.log('Password match:', passwordMatch);
  }
  process.exit(0);
});
