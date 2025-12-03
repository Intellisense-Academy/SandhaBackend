const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import controllers
const authController = require('./controllers/authcontroller');

// Import middlewares
const { validateRegistration } = require('./middlewares/validators');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.post('/api/register', validateRegistration, authController.registerUser);
app.post('/api/login', authController.loginUser);
app.get('/api/users', authController.getAllUsers);
app.get('/api/users/:id', authController.getUserById);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Sandha Backend API',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/register',
      login: 'POST /api/login',
      users: 'GET /api/users',
      userById: 'GET /api/users/:id',
      health: 'GET /health'
    }
  });
});

// 404 handler
app.use( (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

module.exports = app;