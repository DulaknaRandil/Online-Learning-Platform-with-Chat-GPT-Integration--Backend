const mongoose = require('mongoose');
const { ENROLLMENT_STATUS } = require('../constants');

const enrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required']
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course is required']
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: Object.values(ENROLLMENT_STATUS),
    default: ENROLLMENT_STATUS.ACTIVE
  },
  progress: {
    completedLessons: [{
      lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      completedAt: {
        type: Date,
        default: Date.now
      },
      timeSpent: {
        type: Number, // in minutes
        default: 0
      }
    }],
    percentage: {
      type: Number,
      default: 0,
      min: [0, 'Progress percentage cannot be negative'],
      max: [100, 'Progress percentage cannot exceed 100']
    },
    lastAccessedLesson: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    totalTimeSpent: {
      type: Number, // in minutes
      default: 0
    }
  },
  completionDate: {
    type: Date
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateUrl: {
    type: String,
    default: ''
  },
  rating: {
    score: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    review: {
      type: String,
      maxLength: [1000, 'Review cannot exceed 1000 characters']
    },
    ratedAt: {
      type: Date
    }
  },
  paymentInfo: {
    amount: {
      type: Number,
      required: true,
      min: [0, 'Payment amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD'
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'paypal', 'stripe', 'free'],
      default: 'free'
    },
    transactionId: {
      type: String,
      default: ''
    },
    paidAt: {
      type: Date,
      default: Date.now
    }
  },
  notes: {
    type: String,
    maxLength: [1000, 'Notes cannot exceed 1000 characters'],
    default: ''
  }
}, {
  timestamps: true
});

// Indexes for better performance
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
enrollmentSchema.index({ student: 1 });
enrollmentSchema.index({ course: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ enrollmentDate: -1 });

// Virtual for completion percentage based on lessons
enrollmentSchema.virtual('calculatedProgress').get(function() {
  if (!this.populated('course') || !this.course.lessons) return this.progress.percentage;
  
  const totalLessons = this.course.lessons.length;
  if (totalLessons === 0) return 0;
  
  const completedLessons = this.progress.completedLessons.length;
  return Math.round((completedLessons / totalLessons) * 100);
});

// Virtual for days since enrollment
enrollmentSchema.virtual('daysSinceEnrollment').get(function() {
  const diffTime = Math.abs(new Date() - this.enrollmentDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for is course completed
enrollmentSchema.virtual('isCompleted').get(function() {
  return this.status === ENROLLMENT_STATUS.COMPLETED;
});

// Update status and completion date based on progress
enrollmentSchema.pre('save', function(next) {
  // Auto-complete if progress is 100%
  if (this.progress.percentage === 100 && this.status !== ENROLLMENT_STATUS.COMPLETED) {
    this.status = ENROLLMENT_STATUS.COMPLETED;
    this.completionDate = new Date();
  } 
  // Set to active if progress > 0 and currently pending
  else if (this.progress.percentage > 0 && this.status === ENROLLMENT_STATUS.PENDING) {
    this.status = ENROLLMENT_STATUS.ACTIVE;
  }
  
  next();
});

// Calculate total time spent from completed lessons
enrollmentSchema.methods.calculateTotalTimeSpent = function() {
  this.progress.totalTimeSpent = this.progress.completedLessons.reduce(
    (total, lesson) => total + (lesson.timeSpent || 0), 
    0
  );
  return this.progress.totalTimeSpent;
};

// Mark lesson as completed
enrollmentSchema.methods.completeLesson = function(lessonId, timeSpent = 0) {
  const existingLesson = this.progress.completedLessons.find(
    lesson => lesson.lessonId.toString() === lessonId.toString()
  );
  
  if (!existingLesson) {
    this.progress.completedLessons.push({
      lessonId,
      completedAt: new Date(),
      timeSpent
    });
  }
  
  this.progress.lastAccessedLesson = lessonId;
  this.calculateTotalTimeSpent();
};

// Get enrollment summary
enrollmentSchema.methods.getSummary = function() {
  return {
    enrollmentId: this._id,
    student: this.student,
    course: this.course,
    status: this.status,
    progress: this.progress.percentage,
    completedLessons: this.progress.completedLessons.length,
    totalTimeSpent: this.progress.totalTimeSpent,
    enrollmentDate: this.enrollmentDate,
    completionDate: this.completionDate,
    certificateIssued: this.certificateIssued,
    daysSinceEnrollment: this.daysSinceEnrollment
  };
};

// Static method to find active enrollments
enrollmentSchema.statics.findActive = function() {
  return this.find({ status: ENROLLMENT_STATUS.ACTIVE });
};

// Static method to find completed enrollments
enrollmentSchema.statics.findCompleted = function() {
  return this.find({ status: ENROLLMENT_STATUS.COMPLETED });
};

// Static method to find enrollments by student
enrollmentSchema.statics.findByStudent = function(studentId) {
  return this.find({ student: studentId });
};

// Static method to find enrollments by course
enrollmentSchema.statics.findByCourse = function(courseId) {
  return this.find({ course: courseId });
};

module.exports = mongoose.model('Enrollment', enrollmentSchema);
