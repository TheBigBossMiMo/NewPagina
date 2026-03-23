const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  email: String,
  message: String,
  intent: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ChatAnalytics', schema);