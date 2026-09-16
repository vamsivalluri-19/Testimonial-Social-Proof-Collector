const mongoose = require('mongoose');

const customAnswerSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const testimonialSchema = new mongoose.Schema(
  {
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      required: true,
      index: true,
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
      maxlength: [100, 'Client name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Client email is required'],
      trim: true,
      lowercase: true,
    },
    companyRole: {
      type: String,
      trim: true,
      default: '',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    reviewText: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
      maxlength: [3000, 'Review text cannot exceed 3000 characters'],
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    customAnswers: {
      type: [customAnswerSchema],
      default: [],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'archived'],
      default: 'pending',
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    liked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Composite indexes for common query patterns
testimonialSchema.index({ space: 1, status: 1 });
testimonialSchema.index({ space: 1, featured: 1 });

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

module.exports = Testimonial;
