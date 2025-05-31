const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['TEXT', 'VOICE', 'IMAGE', 'SYSTEM'],
    default: 'TEXT'
  },
  content: {
    type: String,
    required: true
  },
  audioUrl: {
    type: String
  },
  sender: {
    type: String,
    enum: ['USER', 'BOT'],
    required: true
  },
  intent: {
    type: String,
    enum: [
      'ORDER_STATUS',
      'REFUND_REQUEST',
      'MEDICINE_INFO',
      'PRESCRIPTION_HELP',
      'DELIVERY_QUERY',
      'GENERAL_QUERY'
    ]
  },
  language: {
    type: String,
    default: 'en'
  },
  metadata: {
    orderId: String,
    medicineId: String,
    prescriptionId: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSessionSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['ACTIVE', 'CLOSED'],
    default: 'ACTIVE'
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }],
  context: {
    lastIntent: String,
    lastOrderId: String,
    lastMedicineId: String,
    userPreferences: {
      language: {
        type: String,
        default: 'en'
      },
      voiceEnabled: {
        type: Boolean,
        default: false
      }
    }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model('Message', messageSchema);
const ChatSession = mongoose.model('ChatSession', chatSessionSchema);

module.exports = { Message, ChatSession }; 