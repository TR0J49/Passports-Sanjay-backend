const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const router = express.Router();

// Admin Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, confirmPassword, email } = req.body;

    // Validation
    if (!username || !password || !confirmPassword || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [{ username }, { email }] 
    });

    if (existingAdmin) {
      return res.status(400).json({ message: 'Username or email already registered' });
    }

    // Create new admin
    const admin = new Admin({ 
      username, 
      password,
      email 
    });

    await admin.save();

    res.status(201).json({ 
      message: 'Admin registered successfully! Please login with your credentials.',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username }).select('+password');

    if (!admin) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ 
      id: admin._id, 
      username: admin.username,
      email: admin.email 
    }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ 
      token, 
      message: 'Login successful',
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if any admin exists (for first-time setup)
router.get('/check-admin', async (req, res) => {
  try {
    const adminCount = await Admin.countDocuments();
    res.json({ 
      adminExists: adminCount > 0,
      message: adminCount > 0 ? 'Admin exists' : 'No admin found'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
