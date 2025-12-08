import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  telegramBotToken: {
    type: String,
    default: ''
  },
  telegramGroupId: {
    type: String,
    default: ''
  },
  thresholds: {
    responseTime: {
      type: Number,
      default: 1000 // milliseconds
    },
    errorRate: {
      type: Number,
      default: 5 // percentage
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

export default mongoose.model('Setting', settingSchema);

