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
    type: String,
    default: 'anonymous'
  },
  department: {
    type: String,
    default: 'AI_DS'
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Create a text index for searching
documentSchema.index({ extractedText: 'text' });

module.exports = mongoose.model('Document', documentSchema);
