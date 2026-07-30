const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User document schema for authentication and profile data.
 * @type {mongoose.Schema}
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    isAdmin: {type: Boolean, default: false}
  },
  { timestamps: true }
);

/**
 * Hashes and stores a plaintext password for the current user.
 * @param {string} password - Plaintext password to secure.
 * @returns {Promise<void>}
 */
userSchema.methods.setPassword = async function setPassword(password) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(password, salt);
};

/**
 * Compares a plaintext password with the stored hash.
 * @param {string} password - Plaintext password to verify.
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

/**
 * Returns a safe subset of the user document for API responses.
 * @returns {{ id: string, name: string, email: string, isAdmin: boolean, createdAt: Date }}
 */
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return { id: this._id, name: this.name, email: this.email, isAdmin: this.isAdmin, createdAt: this.createdAt };
};

/**
 * Mongoose model for application users.
 * @type {mongoose.Model}
 */
module.exports = mongoose.model('User', userSchema);