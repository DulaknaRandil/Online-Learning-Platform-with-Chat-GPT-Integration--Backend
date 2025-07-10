/**
 * Database Seed Script
 * 
 * This script populates the database with initial data for development and testing.
 * Usage: npm run seed
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Course } = require('../models');
const { USER_ROLES } = require('../constants');
const logger = require('../utils/logger');

// Sample users
const users = [
  {
    username: 'admin',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: USER_ROLES.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
    bio: 'Platform administrator',
    isActive: true,
    expertise: ['Administration', 'Education']
  },
  {
    username: 'instructor1',
    email: 'instructor@example.com',
    password: 'Teach123!',
    role: USER_ROLES.INSTRUCTOR,
    firstName: 'Jane',
    lastName: 'Smith',
    bio: 'Experienced web developer and instructor',
    isActive: true,
    expertise: ['Web Development', 'JavaScript', 'React']
  },
  {
    username: 'student1',
    email: 'student@example.com',
    password: 'Learn123!',
    role: USER_ROLES.STUDENT,
    firstName: 'John',
    lastName: 'Doe',
    bio: 'Eager to learn new technologies',
    isActive: true,
    expertise: ['Beginner Programming']
  }
];

// Sample courses
const sampleCourses = [
  {
    title: 'Introduction to JavaScript',
    description: 'Learn the fundamentals of JavaScript programming language.',
    category: 'Web Development',
    difficulty: 'beginner', // Changed to match enum values
    price: 49.99,
    language: 'English',
    tags: ['JavaScript', 'Web Development', 'Programming'],
    status: 'published',
    lessons: [
      {
        title: 'JavaScript Basics',
        content: 'Introduction to JavaScript syntax and basic concepts.',
        duration: 45,
        order: 1, // Added required order field
        resources: [
          { title: 'JavaScript Cheat Sheet', url: 'https://example.com/js-cheatsheet.pdf' }
        ]
      },
      {
        title: 'Functions and Objects',
        content: 'Understanding functions and object-oriented programming in JavaScript.',
        duration: 60,
        order: 2, // Added required order field
        resources: [
          { title: 'Functions Reference', url: 'https://example.com/functions-reference.pdf' }
        ]
      }
    ]
  },
  {
    title: 'Advanced React Development',
    description: 'Master React hooks, context API, and advanced patterns.',
    category: 'Web Development',
    difficulty: 'advanced', // Changed to match enum values
    price: 89.99,
    language: 'English',
    tags: ['React', 'JavaScript', 'Frontend'],
    status: 'published',
    lessons: [
      {
        title: 'React Hooks Deep Dive',
        content: 'Comprehensive guide to React hooks and their applications.',
        duration: 75,
        order: 1, // Added required order field
        resources: [
          { title: 'Hooks Cheat Sheet', url: 'https://example.com/hooks-cheatsheet.pdf' }
        ]
      }
    ]
  },
  {
    title: 'Data Science Fundamentals',
    description: 'Introduction to data science concepts and techniques.',
    category: 'Data Science',
    difficulty: 'intermediate', // Changed to match enum values
    price: 69.99,
    language: 'English',
    tags: ['Python', 'Data Analysis', 'Statistics'],
    status: 'published',
    lessons: [
      {
        title: 'Introduction to Python for Data Science',
        content: 'Learn Python basics for data analysis.',
        duration: 60,
        order: 1, // Added required order field
        resources: [
          { title: 'Python Data Science Handbook', url: 'https://example.com/python-ds.pdf' }
        ]
      }
    ]
  }
];

// Connect to the database
async function connectDB() {
  try {
    logger.info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Seed the database
async function seed() {
  try {
    // Connect to the database
    await connectDB();
    
    // Clear existing data
    logger.info('Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    
    // Create users
    logger.info('Creating users...');
    const createdUsers = [];
    
    for (const user of users) {
      const newUser = await User.create({
        ...user
        // Don't hash password here - let the model's pre-save hook handle it
      });
      createdUsers.push(newUser);
      logger.info(`Created user: ${user.username} (${user.role})`);
    }
    
    // Find the instructor user
    const instructor = createdUsers.find(user => user.role === USER_ROLES.INSTRUCTOR);
    
    // Create courses
    logger.info('Creating courses...');
    for (const course of sampleCourses) {
      const newCourse = await Course.create({
        ...course,
        instructor: instructor._id,
        enrollmentCount: Math.floor(Math.random() * 50),
        rating: {
          average: (3 + Math.random() * 2).toFixed(1),
          count: Math.floor(Math.random() * 20) + 5
        }
      });
      
      // Update instructor with created course
      await User.findByIdAndUpdate(
        instructor._id,
        { $push: { createdCourses: newCourse._id } }
      );
      
      logger.info(`Created course: ${course.title}`);
    }
    
    logger.info('✅ Database seeded successfully!');
    
    // Close the connection
    await mongoose.disconnect();
    logger.info('MongoDB connection closed');
    
  } catch (error) {
    logger.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seed();
