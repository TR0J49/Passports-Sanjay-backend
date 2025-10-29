const express = require('express');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Register User
router.post('/register', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'cv', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, passportNumber, dateOfBirth, designation, ppType, mobileNumber, villageTown, remark } = req.body;

    // Validation
    if (!name || !passportNumber || !dateOfBirth || !designation || !ppType || !mobileNumber || !villageTown) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    // Check if passport number already exists
    const existingUser = await User.findOne({ passportNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'Passport number already registered' });
    }

    const userData = {
      name,
      passportNumber,
      dateOfBirth,
      designation,
      ppType,
      mobileNumber,
      villageTown,
      remark: remark || '',
      photo: req.files?.photo ? req.files.photo[0].filename : null,
      cv: req.files?.cv ? req.files.cv[0].filename : null,
    };

    const user = new User(userData);
    await user.save();

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search Users (Protected)
router.get('/search', protect, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { mobileNumber: { $regex: query, $options: 'i' } }
      ]
    });

    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get User Details (Protected)
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Download CV (Protected)
router.get('/:id/download-cv', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.cv) {
      return res.status(404).json({ message: 'CV not found' });
    }

    const filePath = path.join(__dirname, '../uploads', user.cv);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath, `${user.name}-CV${path.extname(user.cv)}`);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Photo (Public)
router.get('/:id/photo', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }

    const filePath = path.join(__dirname, '../uploads', user.photo);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Users (Protected)
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users, count: users.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
