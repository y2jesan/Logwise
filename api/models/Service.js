import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['up', 'down', 'unknown'],
    default: 'unknown'
  },
  lastChecked: {
    type: Date,
    default: Date.now
  },
  project_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  auto_check: {
    type: Boolean,
    default: false
  },
  minute_interval: {
    type: Number,
    default: null,
    min: 1
  },
  report_success: {
    type: Boolean,
    default: false
  },
  lastAutoCheck: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('Service', serviceSchema);

