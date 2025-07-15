const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/config/dbConfig');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const errorMiddleware = require('./src/middlewares/errorMiddleware');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { securityMiddleware } = require('./src/middlewares/securityMiddleware');

dotenv.config();
connectDB();

const app = express();

// CORS configuration - MUST come before other middleware
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // List of allowed origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
            'http://127.0.0.1:8080'
        ];
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Allow cookies and authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Security middleware
app.use(securityMiddleware);

// Body parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Health check
app.get('/', (req, res) => {
    res.send(`Server is running on port ${process.env.PORT}`);
});

// CORS test endpoint
app.get('/api/test-cors', (req, res) => {
    res.json({
        status: 'success',
        message: 'CORS is working correctly',
        timestamp: new Date().toISOString(),
        origin: req.headers.origin || 'No origin header'
    });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorMiddleware);

module.exports = app; 