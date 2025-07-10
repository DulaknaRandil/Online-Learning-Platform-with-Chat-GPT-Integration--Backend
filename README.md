# Online Learning Platform - Backend

A robust, scalable backend API for an online learning platform built with Node.js, Express, and MongoDB.

## 🚀 Features

- **RESTful API** with proper HTTP status codes
- **MongoDB** integration with Mongoose ODM
- **JWT Authentication** with role-based access control
- **Input Validation** with Joi
- **Rate Limiting** and security middleware
- **Comprehensive Logging** with Winston
- **Error Handling** with custom error classes
- **API Documentation** with health check endpoints
- **OpenAI Integration** for course recommendations
- **Rate limiting** for AI API usage and monitoring

## 📁 Project Structure

```
backend/
├── src/                  # Main source directory
│   ├── app.js            # Express application setup
│   ├── config/           # Configuration files
│   │   ├── database.js   # Database connection
│   │   └── index.js      # Environment config
│   ├── constants/        # Application constants
│   │   └── index.js
│   ├── controllers/      # Request handlers
│   │   ├── authController.js
│   │   ├── courseController.js
│   │   ├── enrollmentController.js
│   │   ├── recommendationController.js
│   │   ├── userController.js
│   │   └── index.js
│   ├── middleware/       # Express middleware
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── index.js
│   ├── models/           # MongoDB models
│   │   ├── User.js
│   │   ├── Course.js
│   │   ├── Enrollment.js
│   │   └── index.js
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── enrollments.js
│   │   ├── health.js
│   │   ├── recommendations.js
│   │   ├── users.js
│   │   └── index.js
│   ├── services/         # Business logic services
│   │   ├── authService.js
│   │   ├── courseService.js
│   │   ├── enrollmentService.js
│   │   ├── recommendationService.js
│   │   └── index.js
│   ├── scripts/          # Utility scripts
│   │   └── seed.js       # Database seeding
│   ├── utils/            # Utility functions
│   │   ├── errors.js
│   │   ├── logger.js
│   │   ├── response.js
│   │   └── index.js
│   ├── validators/       # Input validation schemas
│   │   └── index.js
│   └── __tests__/        # Test files
│       └── api-health.test.js
├── logs/                 # Application logs
├── server.js             # Application entry point
├── jest.config.js        # Jest configuration
├── jest.setup.js         # Jest setup file
├── .eslintrc.js          # ESLint configuration
├── .env                  # Environment variables
├── .gitignore            # Git ignore file
└── package.json          # Dependencies and scripts
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=your-super-secret-jwt-key
   OPENAI_API_KEY=your-openai-api-key
   CORS_ORIGIN=http://localhost:3000
   API_URL=http://localhost:5000
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🔧 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with nodemon
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run seed` - Seed the database with sample data
- `npm run clean` - Remove node_modules

## 📚 API Endpoints

### Health Check
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `DELETE /api/users/:id` - Delete user account

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (Instructor only)
- `PUT /api/courses/:id` - Update course
- `DELETE /api/courses/:id` - Delete course

### Enrollments
- `POST /api/enrollments` - Enroll in course
- `GET /api/enrollments/my` - Get user's enrollments
- `GET /api/enrollments/:id` - Get enrollment by ID
- `GET /api/enrollments/course/:courseId` - Get enrollments for course

### Recommendations
- `GET /api/recommendations/personalized` - Get personalized recommendations
- `GET /api/recommendations/trending` - Get trending courses
- `GET /api/recommendations/similar/:courseId` - Get similar courses
- `GET /api/recommendations/category/:category` - Get courses by category
- `GET /api/recommendations/learning-path/:skill` - Get learning path
- `POST /api/recommendations/chat` - Get AI-powered chat recommendations
- `GET /api/recommendations/usage` - Get API usage statistics (Admin only)
- `GET /api/recommendations/anonymous` - Get recommendations for anonymous users

## 🤖 AI Integration with OpenAI

The platform integrates OpenAI's GPT models to provide intelligent course recommendations:

### Features

- **AI-powered course recommendations**: Students can describe their learning goals and receive tailored course recommendations
- **API usage tracking**: Monitors and limits API requests to prevent overuse
- **Rate limiting**: Implements per-minute rate limiting for API requests
- **Fallback mechanism**: Provides basic recommendations if API is unavailable or limits reached
- **Admin monitoring**: Endpoint to check API usage statistics

### Implementation Details

- Uses OpenAI's chat completions API with GPT-3.5-turbo
- Limits requests to 250 total and 10 per minute
- Builds user profile based on previous enrollments and interests
- Provides natural language processing of user queries
- Tracks all API usage for monitoring and billing

### Example Chat Query

Students can ask natural language questions like:
- "I want to become a software engineer, what courses should I take?"
- "Recommend courses for data science beginners"
- "What should I learn to become a full-stack developer?"

The AI analyzes the query, user profile (if available), and course catalog to provide personalized recommendations.

## 🔐 Authentication & Authorization

The API uses JWT tokens for authentication with role-based access control:

- **Student**: Can browse courses, enroll, and track progress
- **Instructor**: Can create and manage courses
- **Admin**: Full system access

## 🗄️ Database Models

### User Model
- Personal information (name, email, avatar)
- Authentication data (password, login attempts)
- Role-based permissions (student, instructor, admin)
- Course relationships (enrolled courses, created courses)
- Expertise and interests for recommendations

### Course Model
- Course content and metadata (title, description, price)
- Instructor information
- Enrollment tracking
- Categories, difficulty, and tags
- Rating and popularity metrics

### Enrollment Model
- Student-course relationship
- Progress tracking
- Completion status
- Enrollment date
- Payment information

## 🛡️ Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API rate limiting
- **Input Validation** - Joi validation schemas
- **Password Hashing** - bcrypt encryption
- **JWT Authentication** - Secure token-based auth
- **Error Sanitization** - Prevent leaking sensitive data

## 📊 Logging & Monitoring

- **Winston** logger with multiple transports
- **Morgan** HTTP request logging
- **Health check** endpoints for monitoring
- **Error tracking** with stack traces
- **OpenAI API usage** monitoring

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT signing secret | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `CORS_ORIGIN` | CORS origin | http://localhost:3000 |
| `API_URL` | Public API URL | http://localhost:5000 |

## 🚀 Deployment

The application is production-ready with:
- Environment-based configuration
- Graceful shutdown handling
- Process management support
- Health check endpoints
- Comprehensive logging
- Error handling and recovery

## 📄 License

This project is licensed under the MIT License.
