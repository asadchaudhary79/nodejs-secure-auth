require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const createAdmin = async () => {
    try {
        // Use default MongoDB URI if not set in environment
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rescuewheels';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@rescuewheels.com' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash('Admin@123', 12);
        const admin = await User.create({
            name: 'Admin User',
            email: 'admin@rescuewheels.com',
            password: hashedPassword,
            role: 'admin',
            isVerified: true,
            phone: '+919876543210'
        });

        console.log('Admin user created successfully:');
        console.log('Email:', admin.email);
        console.log('Password: Admin@123');
        console.log('Role:', admin.role);

    } catch (error) {
        console.error('Error creating admin:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createAdmin(); 