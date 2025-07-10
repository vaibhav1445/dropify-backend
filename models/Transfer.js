const mongoose = require('mongoose');

const transferSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  roomId: String,
  fileName: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transfer', transferSchema);
