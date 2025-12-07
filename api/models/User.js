const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'blocked'], default: 'active' },
  tetCategory: { type: String, enum: ['1', '2', '3'], required: true },
  
  // Extended Profile
  email: String,
  mobile: String,
  district: String,
  subDistrict: String,
  avatarUrl: String,
  selectedSubjects: [String],
  mainSubject: String,
  
  // Usage tracking
  totalUsageTime: { type: Number, default: 0 },
  
  // Permissions
  canManageContent: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
