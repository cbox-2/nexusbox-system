const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const registeredUserSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  boxId: { type: mongoose.Schema.Types.ObjectId, ref: 'Box', required: true, index: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  level: { type: Number, default: 2, enum: [2, 3, 4, 5] },
  voiced: { type: Boolean, default: false },
  lastUsed: { type: Date },
  lastIP: { type: String, default: '' },
  registeredAt: { type: Date, default: Date.now }
}, { timestamps: true });

registeredUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

registeredUserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

registeredUserSchema.index({ owner: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('RegisteredUser', registeredUserSchema);
