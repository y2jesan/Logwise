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
  }
}, {
  timestamps: true
});

export default mongoose.model('Service', serviceSchema);

