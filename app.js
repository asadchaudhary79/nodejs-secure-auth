const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/config/dbConfig');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const errorMiddleware = require('./src/middlewares/errorMiddleware');
const cors = require('cors');
const helmet = require('helmet');
const { securityMiddleware } = require('./src/middlewares/securityMiddleware');

dotenv.config();
connectDB();

const app = express();

// Security middleware
app.use(securityMiddleware);

// CORS
app.use(cors());

// Body parser
app.use(express.json());

// Health check
app.get('/', (req, res) => {
    res.send('Server is running on port 5000 and backend url is http://localhost:5000');
});


// Routes

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorMiddleware);

module.exports = app; 