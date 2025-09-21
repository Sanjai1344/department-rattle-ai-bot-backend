const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    hasVoice: Boolean,
    fileAttached: String,
    language: String
  }
});

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [messageSchema],
  context: {
    relatedDocuments: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }],
    currentTopic: String,
    language: {
      type: String,
      default: 'english'
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Conversation', conversationSchema);