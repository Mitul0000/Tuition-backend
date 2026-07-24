const mongoose = require('mongoose');

const { SESSION_EXPIRATION } = require('../Config/constants').constants;

const chunkSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  vector: {
    type: [Number],
    required: true
  },
  sectionTag: {
    type: String,
  },
  chunkIndex: {
    type: Number,
  },
}, { _id: false });

const vectorSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  chunks: {
    type: [chunkSchema],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: SESSION_EXPIRATION
  }
});

module.exports = mongoose.model('RagVector', vectorSchema);