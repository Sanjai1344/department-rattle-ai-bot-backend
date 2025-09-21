const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'ppt', 'pptx', 'image', 'doc', 'docx'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  extractedText: {
    type: String,
    default: ''
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true
  },
  tags: [{
    type: String
  }],
  metadata: {
    size: Number,
    pages: Number,
    language: String
  }
}, {
  timestamps: true
});

// Index for text search
documentSchema.index({ extractedText: 'text', originalName: 'text' });

module.exports = mongoose.model('Document', documentSchema);