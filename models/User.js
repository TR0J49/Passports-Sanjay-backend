const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    passportNumber: {
      type: String,
      required: [true, 'Passport number is required'],
      unique: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
    },
    ppType: {
      type: String,
      required: [true, 'PP Type is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    villageTown: {
      type: String,
      required: [true, 'Village/Town is required'],
      trim: true,
    },
    photo: {
      type: String,
      default: null,
    },
    cv: {
      type: String,
      default: null,
    },
    remark: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Create text index for search
userSchema.index({ name: 'text', mobileNumber: 'text' });

module.exports = mongoose.model('User', userSchema);
