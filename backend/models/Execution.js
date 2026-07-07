const mongoose = require('mongoose');

const executionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    roomId: {
      type: String,
      default: null,
    },
    language: {
      type: String,
      required: true,
      enum: ['javascript', 'python', 'cpp', 'java'],
    },
    code: {
      type: String,
      required: true,
    },
    stdout: {
      type: String,
      default: '',
    },
    stderr: {
      type: String,
      default: '',
    },
    exitCode: {
      type: Number,
      default: 0,
    },
    executionTime: {
      type: Number, // ms
      default: 0,
    },
    status: {
      type: String,
      enum: ['success', 'error', 'timeout', 'pending'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Index for efficient user query
executionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Execution', executionSchema);
