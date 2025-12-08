import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists');
      await mongoose.connection.close();
      return;
    }

    // Create admin user
    const admin = await User.create({
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin'
    });

    console.log('✅ Admin user created:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('   Role: admin');

    await mongoose.connection.close();
    console.log('✅ Seed completed');
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seed();

