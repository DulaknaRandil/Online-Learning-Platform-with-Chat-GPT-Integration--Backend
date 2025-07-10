const mongoose = require('mongoose');
const { COURSE_STATUS, DIFFICULTY_LEVELS } = require('../constants');

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lesson title is required'],
    trim: true,
    minLength: [3, 'Lesson title must be at least 3 characters long'],
    maxLength: [100, 'Lesson title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxLength: [1000, 'Lesson description cannot exceed 1000 characters']
  },
  content: {
    type: String,
    required: [true, 'Lesson content is required']
  },
  videoUrl: {
    type: String,
    trim: true,
    default: ''
  },
  duration: {
    type: Number, // in minutes
    min: [0, 'Duration cannot be negative'],
    default: 0
  },
  order: {
    type: Number,
    required: true
  },
  resources: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: ['pdf', 'video', 'link', 'other'],
      default: 'link'
    }
  }],
  quiz: {
    questions: [{
      question: {
        type: String,
        required: true
      },
      options: [{
        type: String,
        required: true
      }],
      correctOption: {
        type: Number,
        required: true
      }
    }]
  }
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    minLength: [3, 'Course title must be at least 3 characters long'],
    maxLength: [100, 'Course title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Course description is required'],
    trim: true,
    minLength: [10, 'Course description must be at least 10 characters long'],
    maxLength: [2000, 'Course description cannot exceed 2000 characters']
  },
  thumbnail: {
    type: String,
    default: ''
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Instructor is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    index: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  lessons: [lessonSchema],
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    validate: {
      validator: function(v) {
        return v <= this.price;
      },
      message: 'Discount price cannot be greater than the regular price'
    }
  },
  difficulty: {
    type: String,
    enum: Object.values(DIFFICULTY_LEVELS),
    required: [true, 'Difficulty level is required']
  },
  language: {
    type: String,
    required: [true, 'Language is required'],
    default: 'English'
  },
  status: {
    type: String,
    enum: Object.values(COURSE_STATUS),
    default: COURSE_STATUS.DRAFT
  },
  duration: {
    type: Number, // Total course duration in minutes
    default: function() {
      return this.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
    }
  },
  enrollmentCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    min: [0, 'Rating cannot be below 0'],
    max: [5, 'Rating cannot exceed 5'],
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      trim: true,
      maxLength: [500, 'Comment cannot exceed 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  requirements: [{
    type: String,
    trim: true
  }],
  objectives: [{
    type: String,
    trim: true
  }],
  featured: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
courseSchema.index({ title: 'text', description: 'text', tags: 'text' });
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ instructor: 1 });
courseSchema.index({ difficulty: 1 });
courseSchema.index({ price: 1 });
courseSchema.index({ featured: 1 });
courseSchema.index({ isPublished: 1 });

// Virtual field for total lessons count
courseSchema.virtual('lessonCount').get(function() {
  return this.lessons ? this.lessons.length : 0;
});

// Middleware to update duration when lessons are modified
courseSchema.pre('save', function(next) {
  if (this.isModified('lessons')) {
    this.duration = this.lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
  }
  
  // Set publishedAt date when course is published
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = Date.now();
  }
  
  next();
});

// Update rating method
courseSchema.methods.updateRating = async function(newRating, oldRating = null) {
  if (oldRating) {
    // Updating an existing rating
    this.averageRating = (this.averageRating * this.totalRatings - oldRating + newRating) / this.totalRatings;
  } else {
    // Adding a new rating
    this.averageRating = (this.averageRating * this.totalRatings + newRating) / (this.totalRatings + 1);
    this.totalRatings += 1;
  }
  
  return this.save();
};

// Method to check if a user has enrolled in this course
courseSchema.methods.isUserEnrolled = async function(userId) {
  const Enrollment = mongoose.model('Enrollment');
  const enrollment = await Enrollment.findOne({ 
    course: this._id,
    student: userId,
    status: { $ne: 'dropped' }
  });
  
  return !!enrollment;
};

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
