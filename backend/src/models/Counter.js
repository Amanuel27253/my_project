const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true
    },
    seq: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

counterSchema.statics.getNextSequence = async function (key, session = null) {
  const options = { new: true, upsert: true };
  if (session) options.session = session;

  const counter = await this.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    options
  );
  return counter.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
