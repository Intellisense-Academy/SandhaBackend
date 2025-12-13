import express from 'express';
const router = express.Router();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/index.js'; // make sure to include .js
import dotenv from "dotenv";

dotenv.config();
const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { phoneNumber: phoneNumber }
    });
    
    console.log(user);
    res.status(200).json({
      status: true,
      message: 'User found',
      data: user
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
    
    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        phoneNumber,
        password,
        role,
        tenant,
      }
    });
    
    res.status(201).json({
      status: true,
      message: 'User registered successfully',
      data: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      status: false,
      message: 'Server error' 
    });
  }
});

export default router; 