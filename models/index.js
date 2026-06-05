const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'moderator', 'admin'] },
  status: { type: String, default: 'active', enum: ['active', 'banned', 'suspended'] },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date }
});
userSchema.pre('save', async function(next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
userSchema.methods.comparePassword = async function(pwd) {
  return await bcrypt.compare(pwd, this.password);
};
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};
const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: String, default: 'general' },
  isSticky: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}));
const Ban = mongoose.model('Ban', new mongoose.Schema({
  target: { type: String, required: true },
  reason: { type: String, default: '' },
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
}));
const Channel = mongoose.model('Channel', new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}));
const PublishSettings = mongoose.model('PublishSettings', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  siteUrl: { type: String, default: '' },
  whitelistEnabled: { type: Boolean, default: false },
  whitelist: { type: String, default: '' },
  useSSL: { type: Boolean, default: false },
  securityTag: { type: String, default: '' },
  updatedAt: { type: Date, default: Date.now }
}));
const Theme = mongoose.model('Theme', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name: { type: String, default: 'My custom CSS' },
  css: { type: String, default: '' },
  preset: { type: Number, default: -1000 },
  updatedAt: { type: Date, default: Date.now }
}));
const LayoutSettings = mongoose.model('LayoutSettings', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  width: { type: Number, default: 400 },
  height: { type: Number, default: 400 },
  formHeight: { type: Number, default: 107 },
  autoFormHeight: { type: Boolean, default: true },
  adaptiveHeight: { type: Boolean, default: false },
  formOnTop: { type: Boolean, default: false },
  narrowLayout: { type: Boolean, default: false },
  language: { type: String, default: 'ar' },
  messagesPerPage: { type: Number, default: 20 },
  sortDirection: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
}));
const IntegrationSettings = mongoose.model('IntegrationSettings', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  privateKey: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  autoRegister: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
}));
const RegUserSettings = mongoose.model('RegUserSettings', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  regOnly: { type: Boolean, default: false },
  selfReg: { type: Boolean, default: true },
  authFacebook: { type: Boolean, default: false },
  lastPostDel: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
}));
const registeredUserSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  level: { type: Number, default: 2 },
  voiced: { type: Boolean, default: false },
  lastUsed: { type: Date },
  lastIP: { type: String, default: '' },
  registeredAt: { type: Date, default: Date.now }
});
registeredUserSchema.pre('save', async function(next) {
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
registeredUserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};
const RegisteredUser = mongoose.model('RegisteredUser', registeredUserSchema);
module.exports = { User, Message, Ban, Channel, PublishSettings, Theme, LayoutSettings, IntegrationSettings, RegUserSettings, RegisteredUser };
