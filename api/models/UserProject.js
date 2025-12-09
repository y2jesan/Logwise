import mongoose from 'mongoose';

const userProjectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  }
}, {
  timestamps: true
});

// Ensure unique combination of user and project
userProjectSchema.index({ user: 1, project: 1 }, { unique: true });

export default mongoose.model('UserProject', userProjectSchema);

