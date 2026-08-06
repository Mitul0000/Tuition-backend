const mongoose = require("mongoose");

const paperSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, index: true }, // Firebase uid, from request.user.uid
    title: { type: String, required: true },
    metadata: {
      institutionName: String,
      className: String,
      timeAllowed: String,
      totalMarks: Number,
      watermark: Boolean,
    },
    selectedQuestions: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Paper", paperSchema);