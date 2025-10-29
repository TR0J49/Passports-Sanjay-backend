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

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.cv) {
      return res.status(404).json({ message: 'No CV uploaded for this user' });
    }

    const filePath = path.join(__dirname, '../uploads', user.cv);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('CV file not found at:', filePath);
      return res.status(404).json({ message: 'CV file not found on server' });
    }

    // Get file stats
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      return res.status(400).json({ message: 'CV file is empty' });
    }

    // Set proper headers for file download
    const fileName = `${user.name}-CV${path.extname(user.cv)}`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', stats.size);
    
    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Error downloading file' });
        }
      }
    });
  } catch (error) {
    console.error('CV download error:', error);
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

// Debug: Check CV file status (Protected)
router.get('/:id/cv-status', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.cv) {
      return res.json({ 
        hasCV: false, 
        message: 'No CV uploaded for this user',
        userId: user._id,
        userName: user.name
      });
    }
    
    const filePath = path.join(__dirname, '../uploads', user.cv);
    const fileExists = fs.existsSync(filePath);
    
    if (!fileExists) {
      const stats = fs.statSync(filePath).catch(() => null);
      return res.json({ 
        hasCV: true,
        cvFileName: user.cv,
        fileExists: false,
        filePath: filePath,
        message: 'CV file not found on server'
      });
    }
    
    const stats = fs.statSync(filePath);
    
    res.json({ 
      hasCV: true,
      cvFileName: user.cv,
      fileExists: true,
      filePath: filePath,
      fileSize: stats.size,
      message: 'CV file found and ready for download'
    });
  } catch (error) {
    console.error('CV status check error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
