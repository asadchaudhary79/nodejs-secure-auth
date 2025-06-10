const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/dbConfig');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorMiddleware = require('./middlewares/errorMiddleware');
const cors = require('cors');
const helmet = require('helmet');
const { securityMiddleware } = require('./middlewares/securityMiddleware');

dotenv.config();
connectDB();

const app = express();

// Security middleware
app.use(securityMiddleware);

// CORS
app.use(cors());

// Body parser
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorMiddleware);

module.exports = app; 