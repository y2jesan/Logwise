import mongoose from 'mongoose';

const queryOptimizeLogSchema = new mongoose.Schema({
  query: {
    type: String,
    required: true
  },
  queryType: {
    type: String,
    default: 'Unknown'
  },
  language: {
    type: String,
    default: 'Unknown'
  },
  isValid: {
    type: Boolean,
    default: true
  },
  errors: {
    type: [String],
    default: []
  },
  optimizedQuery: {
    type: String,
    default: ''
  },
  optimizationReason: {
    type: String,
    default: ''
  },
  optimizations: {
    type: [{
      suggestion: String,
      reason: String,
      impact: String
    }],
    default: []
  },
  indexSuggestions: {
    type: [{
      index: String,
      reason: String,
      columns: [String]
    }],
    default: []
  },
  correctedQuery: {
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
  function_name: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('QueryOptimizeLog', queryOptimizeLogSchema);

