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
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Log', logSchema);

