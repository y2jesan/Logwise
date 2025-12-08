import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    default: ''
  },
  cause: {
    type: String,
    default: ''
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info'
  },
  fix: {
    type: String,
    default: ''
  },
  aiRaw: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

export default mongoose.model('Log', logSchema);

