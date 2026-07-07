const mongoose = require('mongoose');

const codeSessionSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    code: {
      type: String,
      default: '// Start coding here...\n',
    },
    language: {
      type: String,
      default: 'javascript',
      enum: ['javascript', 'python', 'cpp', 'java'],
    },
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CodeSession', codeSessionSchema);
