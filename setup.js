const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('./models/Admin');

dotenv.config();

async function setupAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ MongoDB connected');

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('✅ Admin already exists');
      process.exit(0);
    }

    // Create admin
    const admin = new Admin({
      username: 'admin',
      password: 'admin123',
    });

    await admin.save();
    console.log('✅ Admin created successfully');
    console.log('Username: admin');
    console.log('Password: admin123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupAdmin();
