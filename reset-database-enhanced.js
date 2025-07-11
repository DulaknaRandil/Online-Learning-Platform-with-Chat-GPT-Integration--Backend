/**
 * Database Reset and Initialization Script
 * 
 * This script completely clears the database and sets up fresh data
 * to ensure proper operation of courses and enrollments
 */

// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const { User, Course, Enrollment } = require('./src/models');
const { USER_ROLES, COURSE_STATUS, DIFFICULTY_LEVELS, ENROLLMENT_STATUS } = require('./src/constants');

// Database connection
async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/learning_platform');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
}

// Drop all collections
async function clearDatabase() {
  console.log('Clearing database...');
  await User.deleteMany({});
  console.log('Users collection cleared');
  await Course.deleteMany({});
  console.log('Courses collection cleared');
  await Enrollment.deleteMany({});
  console.log('Enrollments collection cleared');
}

// Create basic users for testing
async function createUsers() {
  console.log('Creating users...');
  
  // Create admin
  const admin = await User.create({
    username: 'admin',
    email: 'admin@example.com',
    password: 'Admin123!', // Let the pre-save hook handle hashing
    role: USER_ROLES.ADMIN,
    firstName: 'Admin',
    lastName: 'User',
    bio: 'Platform administrator',
    isActive: true,
    expertise: ['Administration', 'Education']
  });
  
  // Create instructor
  const instructor = await User.create({
    username: 'instructor',
    email: 'instructor@example.com',
    password: 'Teach123!', // Let the pre-save hook handle hashing
    role: USER_ROLES.INSTRUCTOR,
    firstName: 'Jane',
    lastName: 'Smith',
    bio: 'Experienced web developer and instructor',
    isActive: true,
    expertise: ['Web Development', 'JavaScript', 'React']
  });
  
  // Create student
  const student = await User.create({
    username: 'student',
    email: 'student@example.com',
    password: 'Learn123!', // Let the pre-save hook handle hashing
    role: USER_ROLES.STUDENT,
    firstName: 'John',
    lastName: 'Doe',
    bio: 'Eager to learn new technologies',
    isActive: true,
    expertise: ['Beginner Programming']
  });
  
  console.log(`Created users: 
    - Admin: ${admin._id} (${admin.email})
    - Instructor: ${instructor._id} (${instructor.email})
    - Student: ${student._id} (${student.email})`);
    
  return { admin, instructor, student };
}

// Create additional students
async function createAdditionalStudents() {
  console.log('Creating additional students...');
  
  const students = [];
  
  // Student 2
  const student2 = await User.create({
    username: 'student2',
    email: 'student2@example.com',
    password: 'Learn456!', // Let the pre-save hook handle hashing
    role: USER_ROLES.STUDENT,
    firstName: 'Sarah',
    lastName: 'Johnson',
    bio: 'Data science enthusiast looking to expand my skills',
    isActive: true,
    expertise: ['Data Analysis', 'Basic Python']
  });
  students.push(student2);
  
  // Student 3
  const student3 = await User.create({
    username: 'student3',
    email: 'student3@example.com',
    password: 'Learn789!', // Let the pre-save hook handle hashing
    role: USER_ROLES.STUDENT,
    firstName: 'David',
    lastName: 'Wilson',
    bio: 'Software engineer interested in full stack development',
    isActive: true,
    expertise: ['Java', 'Spring', 'SQL']
  });
  students.push(student3);
  
  // Student 4
  const student4 = await User.create({
    username: 'student4',
    email: 'student4@example.com',
    password: 'Learn101!', // Let the pre-save hook handle hashing
    role: USER_ROLES.STUDENT,
    firstName: 'Emily',
    lastName: 'Brown',
    bio: 'UX/UI designer looking to learn frontend development',
    isActive: true,
    expertise: ['UI Design', 'UX Research', 'Figma']
  });
  students.push(student4);
  
  // Student 5
  const student5 = await User.create({
    username: 'student5',
    email: 'student5@example.com',
    password: 'Learn202!', // Let the pre-save hook handle hashing
    role: USER_ROLES.STUDENT,
    firstName: 'Michael',
    lastName: 'Lee',
    bio: 'AI researcher interested in deep learning applications',
    isActive: true,
    expertise: ['Python', 'Mathematics', 'Research']
  });
  students.push(student5);
  
  console.log(`Created ${students.length} additional students`);
  return students;
}

// Create sample courses
async function createCourses(instructor) {
  console.log('Creating courses...');
  
  // Create additional instructor for better diversity
  const secondInstructor = await User.create({
    username: 'instructor2',
    email: 'instructor2@example.com',
    password: 'Teach456!', // Let the pre-save hook handle hashing
    role: USER_ROLES.INSTRUCTOR,
    firstName: 'Michael',
    lastName: 'Johnson',
    bio: 'AI and Machine Learning specialist with industry experience',
    isActive: true,
    expertise: ['Machine Learning', 'Python', 'Data Science', 'AI']
  });
  
  console.log(`Created second instructor: ${secondInstructor._id} (${secondInstructor.email})`);
  
  const courses = [];
  
  // First Instructor's Courses
  
  // Course 1 - Free
  const course1 = await Course.create({
    title: 'Introduction to Web Development',
    description: 'A comprehensive introduction to HTML, CSS, and JavaScript fundamentals.',
    category: 'Web Development',
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    status: COURSE_STATUS.PUBLISHED,
    price: 0, // Free course
    instructor: instructor._id,
    language: 'English',
    duration: 120,
    tags: ['HTML', 'CSS', 'JavaScript', 'Beginner'],
    requirements: ['Basic computer skills', 'No prior coding experience required'],
    objectives: [
      'Understand HTML document structure',
      'Create responsive layouts with CSS',
      'Build interactive elements with JavaScript'
    ],
    isPublished: true,
    publishedAt: new Date(),
    enrollmentCount: 0,
    rating: 4.7,
    lessons: [
      {
        title: 'HTML Basics',
        description: 'Introduction to HTML structure and elements',
        content: '<h1>HTML Basics</h1><p>In this lesson, you will learn the fundamentals of HTML...</p>',
        duration: 45,
        order: 1
      },
      {
        title: 'CSS Styling',
        description: 'Learn how to style your HTML with CSS',
        content: '<h1>CSS Styling</h1><p>In this lesson, you will learn how to apply styles...</p>',
        duration: 35,
        order: 2
      },
      {
        title: 'JavaScript Fundamentals',
        description: 'Introduction to JavaScript programming',
        content: '<h1>JavaScript Fundamentals</h1><p>In this lesson, you will learn basic programming concepts...</p>',
        duration: 40,
        order: 3
      }
    ]
  });
  courses.push(course1);
  
  // Course 2 - Paid
  const course2 = await Course.create({
    title: 'React for Beginners',
    description: 'Learn the fundamentals of React, a popular JavaScript library for building user interfaces.',
    category: 'Web Development',
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    status: COURSE_STATUS.PUBLISHED,
    price: 79.99,
    instructor: instructor._id,
    language: 'English',
    duration: 180,
    tags: ['React', 'JavaScript', 'Frontend'],
    requirements: ['JavaScript fundamentals', 'Basic HTML and CSS knowledge'],
    objectives: [
      'Understand React component architecture',
      'Work with props and state',
      'Build single-page applications'
    ],
    isPublished: true,
    publishedAt: new Date(),
    enrollmentCount: 0,
    rating: 4.8,
    lessons: [
      {
        title: 'React Introduction',
        description: 'Overview of React and its core concepts',
        content: '<h1>React Introduction</h1><p>In this lesson, you will learn about React and its philosophy...</p>',
        duration: 50,
        order: 1
      },
      {
        title: 'Components and Props',
        description: 'Working with React components and props',
        content: '<h1>Components and Props</h1><p>In this lesson, you will learn about component-based architecture...</p>',
        duration: 65,
        order: 2
      },
      {
        title: 'State and Lifecycle',
        description: 'Managing state and understanding component lifecycle',
        content: '<h1>State and Lifecycle</h1><p>In this lesson, you will learn about state management...</p>',
        duration: 65,
        order: 3
      }
    ]
  });
  courses.push(course2);
  
  // Course 3 - Draft
  const course3 = await Course.create({
    title: 'Advanced Node.js',
    description: 'Deep dive into Node.js backend development with advanced concepts and practices.',
    category: 'Backend Development',
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    status: COURSE_STATUS.DRAFT,
    price: 99.99,
    instructor: instructor._id,
    language: 'English',
    duration: 240,
    tags: ['Node.js', 'Backend', 'JavaScript', 'Express'],
    requirements: ['JavaScript experience', 'Basic Node.js knowledge'],
    objectives: [
      'Build robust APIs with Express',
      'Implement authentication and authorization',
      'Work with databases and caching'
    ],
    isPublished: false,
    enrollmentCount: 0,
    rating: 0,
    lessons: [
      {
        title: 'Advanced Express Patterns',
        description: 'Deep dive into Express.js architecture',
        content: '<h1>Advanced Express Patterns</h1><p>In this lesson, you will learn advanced Express techniques...</p>',
        duration: 80,
        order: 1
      },
      {
        title: 'Authentication Strategies',
        description: 'Implementing various authentication methods',
        content: '<h1>Authentication Strategies</h1><p>In this lesson, you will learn about JWT, OAuth, and more...</p>',
        duration: 70,
        order: 2
      },
      {
        title: 'Database Optimization',
        description: 'Optimizing database queries and performance',
        content: '<h1>Database Optimization</h1><p>In this lesson, you will learn advanced database concepts...</p>',
        duration: 90,
        order: 3
      }
    ]
  });
  courses.push(course3);
  
  // Course 4 - First instructor, paid course
  const course4 = await Course.create({
    title: 'Full Stack Development with MERN',
    description: 'Build complete web applications using MongoDB, Express, React, and Node.js.',
    category: 'Full Stack Development',
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    status: COURSE_STATUS.PUBLISHED,
    price: 129.99,
    instructor: instructor._id,
    language: 'English',
    duration: 320,
    tags: ['MongoDB', 'Express', 'React', 'Node.js', 'Full Stack'],
    requirements: ['JavaScript fundamentals', 'Basic understanding of web development'],
    objectives: [
      'Build complete MERN applications from scratch',
      'Implement user authentication and authorization',
      'Deploy applications to production'
    ],
    isPublished: true,
    publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    enrollmentCount: 0,
    rating: 4.9,
    lessons: [
      {
        title: 'MERN Stack Overview',
        description: 'Introduction to the MERN stack architecture',
        content: '<h1>MERN Stack Overview</h1><p>In this lesson, you will learn about the MERN stack components...</p>',
        duration: 60,
        order: 1
      },
      {
        title: 'Backend with Express and MongoDB',
        description: 'Building a robust backend API',
        content: '<h1>Backend Development</h1><p>In this lesson, you will build a complete REST API...</p>',
        duration: 90,
        order: 2
      },
      {
        title: 'Frontend with React',
        description: 'Creating a dynamic frontend interface',
        content: '<h1>React Frontend</h1><p>In this lesson, you will create a responsive UI...</p>',
        duration: 80,
        order: 3
      },
      {
        title: 'Authentication and Authorization',
        description: 'Implementing secure user authentication',
        content: '<h1>User Authentication</h1><p>In this lesson, you will learn about JWT authentication...</p>',
        duration: 70,
        order: 4
      },
      {
        title: 'Deployment',
        description: 'Deploying your application to production',
        content: '<h1>Deployment</h1><p>In this lesson, you will learn how to deploy your application...</p>',
        duration: 50,
        order: 5
      }
    ]
  });
  courses.push(course4);
  
  // Second Instructor's Courses
  
  // Course 5 - Machine Learning (paid)
  const course5 = await Course.create({
    title: 'Machine Learning Fundamentals',
    description: 'Learn the core concepts and algorithms of machine learning with practical Python examples.',
    category: 'Data Science',
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    status: COURSE_STATUS.PUBLISHED,
    price: 89.99,
    instructor: secondInstructor._id,
    language: 'English',
    duration: 240,
    tags: ['Machine Learning', 'Python', 'Data Science', 'AI'],
    requirements: ['Basic Python knowledge', 'Understanding of algebra and statistics'],
    objectives: [
      'Understand core machine learning concepts',
      'Implement supervised and unsupervised learning algorithms',
      'Evaluate and improve machine learning models'
    ],
    isPublished: true,
    publishedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    enrollmentCount: 0,
    rating: 4.7,
    lessons: [
      {
        title: 'Introduction to Machine Learning',
        description: 'Overview of machine learning concepts and applications',
        content: '<h1>Introduction to ML</h1><p>In this lesson, you will learn about the fundamentals of machine learning...</p>',
        duration: 60,
        order: 1
      },
      {
        title: 'Linear Regression',
        description: 'Understanding and implementing linear regression',
        content: '<h1>Linear Regression</h1><p>In this lesson, you will implement linear regression from scratch...</p>',
        duration: 70,
        order: 2
      },
      {
        title: 'Classification Models',
        description: 'Building classification models with scikit-learn',
        content: '<h1>Classification</h1><p>In this lesson, you will learn about logistic regression and decision trees...</p>',
        duration: 80,
        order: 3
      },
      {
        title: 'Neural Networks',
        description: 'Introduction to neural networks and deep learning',
        content: '<h1>Neural Networks</h1><p>In this lesson, you will build your first neural network...</p>',
        duration: 90,
        order: 4
      }
    ]
  });
  courses.push(course5);
  
  // Course 6 - Data Visualization (free)
  const course6 = await Course.create({
    title: 'Data Visualization with Python',
    description: 'Master the art of creating impactful data visualizations using Python libraries.',
    category: 'Data Science',
    difficulty: DIFFICULTY_LEVELS.BEGINNER,
    status: COURSE_STATUS.PUBLISHED,
    price: 0, // Free
    instructor: secondInstructor._id,
    language: 'English',
    duration: 180,
    tags: ['Python', 'Data Visualization', 'Matplotlib', 'Seaborn'],
    requirements: ['Basic Python knowledge'],
    objectives: [
      'Create effective data visualizations',
      'Master popular Python visualization libraries',
      'Tell compelling stories with data'
    ],
    isPublished: true,
    publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    enrollmentCount: 0,
    rating: 4.6,
    lessons: [
      {
        title: 'Visualization Fundamentals',
        description: 'Core principles of effective data visualization',
        content: '<h1>Visualization Fundamentals</h1><p>In this lesson, you will learn about the principles of data visualization...</p>',
        duration: 50,
        order: 1
      },
      {
        title: 'Matplotlib Essentials',
        description: 'Creating plots with Matplotlib',
        content: '<h1>Matplotlib</h1><p>In this lesson, you will learn how to create various plots with Matplotlib...</p>',
        duration: 60,
        order: 2
      },
      {
        title: 'Advanced Visualizations with Seaborn',
        description: 'Statistical data visualization with Seaborn',
        content: '<h1>Seaborn</h1><p>In this lesson, you will create advanced statistical visualizations...</p>',
        duration: 70,
        order: 3
      }
    ]
  });
  courses.push(course6);
  
  // Course 7 - Second instructor, draft course
  const course7 = await Course.create({
    title: 'Deep Learning for Computer Vision',
    description: 'Advanced deep learning techniques for image processing and computer vision tasks.',
    category: 'Artificial Intelligence',
    difficulty: DIFFICULTY_LEVELS.ADVANCED,
    status: COURSE_STATUS.DRAFT,
    price: 149.99,
    instructor: secondInstructor._id,
    language: 'English',
    duration: 280,
    tags: ['Deep Learning', 'Computer Vision', 'Neural Networks', 'TensorFlow'],
    requirements: ['Machine learning fundamentals', 'Python programming experience'],
    objectives: [
      'Build and train convolutional neural networks',
      'Implement image classification and object detection',
      'Apply transfer learning to real-world problems'
    ],
    isPublished: false,
    enrollmentCount: 0,
    rating: 0,
    lessons: [
      {
        title: 'Introduction to Computer Vision',
        description: 'Overview of computer vision applications and challenges',
        content: '<h1>Computer Vision Intro</h1><p>In this lesson, you will learn about the field of computer vision...</p>',
        duration: 60,
        order: 1
      },
      {
        title: 'Convolutional Neural Networks',
        description: 'Understanding and implementing CNNs',
        content: '<h1>CNNs</h1><p>In this lesson, you will build convolutional neural networks for image processing...</p>',
        duration: 80,
        order: 2
      },
      {
        title: 'Object Detection',
        description: 'Implementing object detection algorithms',
        content: '<h1>Object Detection</h1><p>In this lesson, you will learn about YOLO and other detection algorithms...</p>',
        duration: 90,
        order: 3
      }
    ]
  });
  courses.push(course7);
  
  // Course 8 - Second instructor, paid course
  const course8 = await Course.create({
    title: 'Natural Language Processing with Python',
    description: 'Learn how to process, analyze, and generate human language with modern NLP techniques.',
    category: 'Artificial Intelligence',
    difficulty: DIFFICULTY_LEVELS.INTERMEDIATE,
    status: COURSE_STATUS.PUBLISHED,
    price: 99.99,
    instructor: secondInstructor._id,
    language: 'English',
    duration: 210,
    tags: ['NLP', 'Python', 'Machine Learning', 'Text Processing'],
    requirements: ['Python programming', 'Basic understanding of machine learning'],
    objectives: [
      'Process and analyze text data',
      'Build text classification and sentiment analysis models',
      'Create language generation applications'
    ],
    isPublished: true,
    publishedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
    enrollmentCount: 0,
    rating: 4.8,
    lessons: [
      {
        title: 'Text Processing Fundamentals',
        description: 'Basic text processing and tokenization',
        content: '<h1>Text Processing</h1><p>In this lesson, you will learn about tokenization, stemming, and lemmatization...</p>',
        duration: 50,
        order: 1
      },
      {
        title: 'Text Classification',
        description: 'Building models for text classification',
        content: '<h1>Text Classification</h1><p>In this lesson, you will implement various text classification algorithms...</p>',
        duration: 60,
        order: 2
      },
      {
        title: 'Sentiment Analysis',
        description: 'Analyzing sentiment in text data',
        content: '<h1>Sentiment Analysis</h1><p>In this lesson, you will build models to detect sentiment in text...</p>',
        duration: 60,
        order: 3
      },
      {
        title: 'Language Models',
        description: 'Introduction to language modeling',
        content: '<h1>Language Models</h1><p>In this lesson, you will learn about statistical and neural language models...</p>',
        duration: 70,
        order: 4
      }
    ]
  });
  courses.push(course8);
  
  console.log(`Created ${courses.length} courses from 2 instructors`);
  
  // Log published and draft courses
  const publishedCourses = courses.filter(course => course.isPublished);
  const draftCourses = courses.filter(course => !course.isPublished);
  console.log(`- ${publishedCourses.length} published courses`);
  console.log(`- ${draftCourses.length} draft courses`);
  
  // Log free and paid courses
  const freeCourses = courses.filter(course => course.price === 0);
  const paidCourses = courses.filter(course => course.price > 0);
  console.log(`- ${freeCourses.length} free courses`);
  console.log(`- ${paidCourses.length} paid courses`);
  
  return courses;
}

// Create enrollments
async function createEnrollments(mainStudent, courses) {
  console.log('Creating enrollments...');
  
  // Get additional students
  const additionalStudents = await createAdditionalStudents();
  const allStudents = [mainStudent, ...additionalStudents];
  
  const enrollments = [];
  const publishedCourses = courses.filter(course => course.isPublished);
  
  // Distribution matrix for enrollments (which students enroll in which courses)
  // 1 means enrolled, 0 means not enrolled
  const enrollmentMatrix = [
    [1, 1, 0, 1, 0, 1, 0, 0], // mainStudent (student1)
    [0, 0, 0, 1, 1, 1, 0, 1], // student2
    [1, 1, 0, 0, 0, 1, 0, 0], // student3
    [1, 0, 0, 0, 0, 1, 0, 1], // student4
    [0, 0, 0, 1, 1, 0, 0, 1]  // student5
  ];
  
  for (let i = 0; i < allStudents.length; i++) {
    const student = allStudents[i];
    let studentEnrollments = 0;
    
    for (let j = 0; j < courses.length; j++) {
      const course = courses[j];
      
      // Skip if not marked for enrollment or course is not published
      if (!enrollmentMatrix[i][j] || !course.isPublished) {
        continue;
      }
      
      // Random progress between 0-100%
      const randomProgress = Math.floor(Math.random() * 101);
      
      // Calculate completed lessons based on progress
      const completedLessons = [];
      const totalLessons = course.lessons.length;
      const lessonsToComplete = Math.floor((randomProgress / 100) * totalLessons);
      
      for (let k = 0; k < lessonsToComplete; k++) {
        if (k < course.lessons.length) {
          completedLessons.push({
            lessonId: course.lessons[k]._id,
            completedAt: new Date(Date.now() - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000),
            timeSpent: Math.floor(Math.random() * 60) + 20 // 20-80 minutes
          });
        }
      }
      
      // Total time spent is the sum of time spent on each completed lesson
      const totalTimeSpent = completedLessons.reduce((total, lesson) => total + lesson.timeSpent, 0);
      
      // Create enrollment object with common properties
      const enrollmentData = {
        student: student._id,
        course: course._id,
        enrollmentDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        status: ENROLLMENT_STATUS.ACTIVE,
        progress: {
          percentage: randomProgress,
          completedLessons,
          totalTimeSpent,
          lastAccessedLesson: completedLessons.length > 0 
            ? completedLessons[completedLessons.length - 1].lessonId 
            : (course.lessons.length > 0 ? course.lessons[0]._id : null)
        }
      };
      
      // Add payment info based on course price
      if (course.price > 0) {
        // For paid courses
        enrollmentData.paymentInfo = {
          amount: course.price,
          currency: 'USD',
          paymentMethod: 'credit_card', // Simulate payment by card
          transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          paidAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        };
      } else {
        // For free courses
        enrollmentData.paymentInfo = {
          amount: 0,
          currency: 'USD',
          paymentMethod: 'free',
          transactionId: `free_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          paidAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
        };
      }
      
      // Create the enrollment
      const enrollment = await Enrollment.create(enrollmentData);
      
      // Update course enrollment count
      await Course.findByIdAndUpdate(course._id, { $inc: { enrollmentCount: 1 } });
      
      enrollments.push(enrollment);
      studentEnrollments++;
      console.log(`Enrolled student ${student.username} in course "${course.title}"`);
    }
    
    console.log(`Student ${student.username} enrolled in ${studentEnrollments} courses`);
  }
  
  console.log(`Created ${enrollments.length} enrollments total`);
  
  // Get enrollment statistics
  const freeCourseEnrollments = enrollments.filter(e => e.paymentInfo.amount === 0).length;
  const paidCourseEnrollments = enrollments.filter(e => e.paymentInfo.amount > 0).length;
  
  console.log(`- ${freeCourseEnrollments} enrollments in free courses`);
  console.log(`- ${paidCourseEnrollments} enrollments in paid courses`);
  
  return enrollments;
}

// Main function
async function main() {
  try {
    await connectDB();
    await clearDatabase();
    
    console.log('===== INITIALIZING DATABASE =====');
    
    const { admin, instructor, student } = await createUsers();
    const courses = await createCourses(instructor);
    const enrollments = await createEnrollments(student, courses);
    
    console.log('\n===== DATABASE RESET COMPLETE =====');
    console.log('\nLogin credentials:');
    console.log('  Admin: admin@example.com / Admin123!');
    console.log('  Instructor 1: instructor@example.com / Teach123!');
    console.log('  Instructor 2: instructor2@example.com / Teach456!');
    console.log('  Student 1: student@example.com / Learn123!');
    console.log('  Student 2: student2@example.com / Learn456!');
    console.log('  Student 3: student3@example.com / Learn789!');
    console.log('  Student 4: student4@example.com / Learn101!');
    console.log('  Student 5: student5@example.com / Learn202!');
    
    console.log('\nEnvironment Configuration:');
    if (process.env.OPENAI_API_KEY) {
      console.log('- OpenAI API Key: ✅ Configured');
    } else {
      console.log('- OpenAI API Key: ❌ Not configured (recommendation system will use fallback)');
    }
    
    if (process.env.GROQ_API_KEY) {
      console.log('- Groq API Key: ✅ Configured');
    } else {
      console.log('- Groq API Key: ❌ Not configured (recommendation system will use fallback)');
    }
    
    console.log('\nRecommendation system is', 
      (process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY) 
        ? '✅ ENABLED' 
        : '❌ DISABLED (using mock data)');
    
    console.log('\nDatabase statistics:');
    console.log(`- Users: ${await User.countDocuments()} (${await User.countDocuments({ role: 'admin' })} admins, ${await User.countDocuments({ role: 'instructor' })} instructors, ${await User.countDocuments({ role: 'student' })} students)`);
    console.log(`- Courses: ${await Course.countDocuments()} (${await Course.countDocuments({ isPublished: true })} published, ${await Course.countDocuments({ isPublished: false })} drafts)`);
    console.log(`- Enrollments: ${await Enrollment.countDocuments()}`);
    
    // Exit successfully
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error during database initialization:', error);
    process.exit(1);
  }
}

// Run the script
main();
