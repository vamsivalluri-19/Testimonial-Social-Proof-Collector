const mongoose = require('mongoose');

const customQuestionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const themeSchema = new mongoose.Schema(
  {
    primaryColor: { type: String, default: '#6366f1' },
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#1f2937' },
    darkMode: { type: Boolean, default: false },
  },
  { _id: false }
);

const spaceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Space name is required'],
      trim: true,
      maxlength: [100, 'Space name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    logo: {
      type: String,
      default: '',
    },
    prompt: {
      type: String,
      default: 'Would you mind sharing a quick review of your experience with us?',
      trim: true,
    },
    avatarSetting: {
      type: String,
      enum: ['optional', 'required', 'hidden'],
      default: 'optional',
    },
    ratingSetting: {
      type: String,
      enum: ['optional', 'required', 'hidden'],
      default: 'required',
    },
    customQuestions: {
      type: [customQuestionSchema],
      default: [],
    },
    theme: {
      type: themeSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

const Space = mongoose.model('Space', spaceSchema);

module.exports = Space;
