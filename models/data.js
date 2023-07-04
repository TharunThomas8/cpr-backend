const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const trainerSchema = new Schema({
  trainerId: String,
  name: String,
  userIds: [String], // Array of user IDs associated with the trainer
  // Other trainer fields
});

const cprDetailSchema = new Schema({
  cprRate: Number,
  cprFraction: Number,
  compression: Number,
  totalTime: Number,
  feedback: Boolean,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new Schema({
  userId: String,
  cprDetails: [cprDetailSchema],
  trainer: {
    type: Schema.Types.ObjectId,
    ref: 'Trainer'
  }
});

const Trainer = mongoose.model('Trainer', trainerSchema);
const Data = mongoose.model('Data', userSchema);

module.exports = {
  Trainer,
  Data
};
