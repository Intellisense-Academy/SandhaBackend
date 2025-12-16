import express from 'express';
const router = express.Router();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/index.js';
import dotenv from "dotenv";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    
    // Input validation
    if (!phoneNumber || !password) {
      return res.status(400).json({
        status: false,
        message: 'Phone number and password are required'
      });
    }
    
    // Validate phone number format (basic validation)
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid phone number format'
      });
    }
    
    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        status: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Find user by phone number only
    const user = await prisma.user.findUnique({
      where: { phoneNumber: phoneNumber }
    });
    
    // If user doesn't exist
    if (!user) {
      return res.status(401).json({
        status: false,
        message: 'Invalid phone number or password'
      });
    }
    
    // Compare the provided password with the hashed password in database
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    // If password is invalid
    if (!isPasswordValid) {
      return res.status(401).json({
        status: false,
        message: 'Invalid phone number or password'
      });
    }
    
    // Check if user is active/authorized (add this field to your User model if needed)
    if (user.isActive === false) {
      return res.status(403).json({
        status: false,
        message: 'Account is deactivated or not authorized'
      });
    }
    
    // Create JWT token (optional but recommended)
    const token = jwt.sign(
      { 
        userId: user.id, 
        phoneNumber: user.phoneNumber,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('Login successful for user:', user.phoneNumber);
    res.status(200).json({
      status: true,
      message: 'Login successful',
      data: userWithoutPassword,
      token: token
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      status: false,
      message: 'Server error' 
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, phoneNumber, password, role, tenant } = req.body;
    
    // Input validation
    if (!name || !phoneNumber || !password || !role || !tenant) {
      return res.status(400).json({
        status: false,
        message: 'All fields are required: name, phoneNumber, password, role, tenant'
      });
    }
    
    // Validate phone number format
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid phone number format'
      });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        status: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: phoneNumber }
    });
    
    if (existingUser) {
      return res.status(400).json({
        status: false,
        message: 'User with this phone number already exists'
      });
    }
    
    // Hash the password before storing
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new user with hashed password
    const newUser = await prisma.user.create({
      data: {
        name,
        phoneNumber,
        password: hashedPassword, // Store the hashed password
        role,
        tenant,
        isActive: true, // Default to active
        createdAt: new Date()
      }
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    
    // Create JWT token for immediate login after registration
    const token = jwt.sign(
      { 
        userId: newUser.id, 
        phoneNumber: newUser.phoneNumber,
        role: newUser.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      status: true,
      message: 'User registered successfully',
      data: userWithoutPassword,
      token: token
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Prisma unique constraint error
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        status: false,
        message: 'User with this phone number already exists' 
      });
    }
    
    res.status(500).json({ 
      status: false,
      message: 'Server error' 
    });
  }
});

export default router;