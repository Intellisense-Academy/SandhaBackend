const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/passwordHelper');
const { successResponse, errorResponse, serverErrorResponse } = require('../utils/responseHelper');

const prisma = new PrismaClient();

// Register a new user
async function registerUser(req, res) {
  try {
    const { name, contactNumber, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { contactNumber }
        ]
      }
    });
    
    if (existingUser) {
      const errors = [];
      
      if (existingUser.email === email.toLowerCase()) {
        errors.push('Email is already registered');
      }
      
      if (existingUser.contactNumber === contactNumber) {
        errors.push('Contact number is already registered');
      }
      
      return errorResponse(res, 'User already exists', errors, 409);
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Create user in database
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        contactNumber: contactNumber.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword
      },
      select: {
        id: true,
        name: true,
        email: true,
        contactNumber: true,
        createdAt: true
      }
    });
    
    // Send success response
    return successResponse(
      res,
      'User registered successfully',
      newUser,
      201
    );
    
  } catch (error) {
    return serverErrorResponse(res, error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get all users (for testing purposes)
async function getAllUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        contactNumber: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return successResponse(
      res,
      'Users retrieved successfully',
      users
    );
    
  } catch (error) {
    return serverErrorResponse(res, error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get single user by ID
async function getUserById(req, res) {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        contactNumber: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return errorResponse(res, 'User not found', [], 404);
    }
    
    return successResponse(
      res,
      'User retrieved successfully',
      user
    );
    
  } catch (error) {
    return serverErrorResponse(res, error);
  } finally {
    await prisma.$disconnect();
  }
}

// Login user
async function loginUser(req, res) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return errorResponse(res, 'Email and password are required');
    }
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
    
    if (!user) {
      return errorResponse(res, 'Invalid credentials', [], 401);
    }
    
    // Compare password
    const { comparePassword } = require('../utils/passwordHelper');
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return errorResponse(res, 'Invalid credentials', [], 401);
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return successResponse(
      res,
      'Login successful',
      userWithoutPassword
    );
    
  } catch (error) {
    return serverErrorResponse(res, error);
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = {
  registerUser,
  getAllUsers,
  getUserById,
  loginUser
};