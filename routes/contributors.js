import express from 'express';
const router = express.Router();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/index.js';
import dotenv from 'dotenv';

dotenv.config();
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Helper function to validate phone number
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

// Create contributor
router.post('/', async (req, res) => {
  try {
    const { name, mobile, amount = 0 } = req.body;

    if (!name || !mobile) {
      return res.status(400).json({
        status: false,
        message: 'name and mobile are required'
      });
    }

    if (!validatePhoneNumber(mobile)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid mobile format (must be 10 digits)'
      });
    }

    const newContributor = await prisma.contributor.create({
      data: {
        name,
        mobile,
        amount: Number(amount)
      }
    });

    res.status(201).json({
      status: true,
      message: 'Contributor created successfully',
      data: newContributor
    });
  } catch (error) {
    console.error('Create contributor error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        status: false,
        message: 'Contributor with this mobile number already exists'
      });
    }
    res.status(500).json({
      status: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// List contributors with optional pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const whereClause = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [contributors, total] = await Promise.all([
      prisma.contributor.findMany({
        where: whereClause,
        include: {
          transactions: {
            select: {
              id: true,
              amount: true,
              createdAt: true,
              status: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.contributor.count({ where: whereClause })
    ]);

    res.status(200).json({
      status: true,
      data: contributors,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('List contributors error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// Get contributor by ID with transaction history
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const contributor = await prisma.contributor.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!contributor) {
      return res.status(404).json({
        status: false,
        message: 'Contributor not found'
      });
    }

    res.status(200).json({
      status: true,
      data: contributor
    });
  } catch (error) {
    console.error('Get contributor error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// Update contributor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (mobile) {
      if (!validatePhoneNumber(mobile)) {
        return res.status(400).json({
          status: false,
          message: 'Invalid mobile format'
        });
      }
      updateData.mobile = mobile;
    }

    const updatedContributor = await prisma.contributor.update({
      where: { id },
      data: updateData,
      include: {
        transactions: true
      }
    });

    res.status(200).json({
      status: true,
      message: 'Contributor updated successfully',
      data: updatedContributor
    });
  } catch (error) {
    console.error('Update contributor error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        status: false,
        message: 'Mobile number already exists'
      });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({
        status: false,
        message: 'Contributor not found'
      });
    }
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// Delete contributor (soft delete - keep records for audit)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if contributor exists
    const contributor = await prisma.contributor.findUnique({
      where: { id }
    });

    if (!contributor) {
      return res.status(404).json({
        status: false,
        message: 'Contributor not found'
      });
    }

    // Delete contributor and cascade delete transactions
    await prisma.contributor.delete({
      where: { id }
    });

    res.status(200).json({
      status: true,
      message: 'Contributor deleted successfully'
    });
  } catch (error) {
    console.error('Delete contributor error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// Get all contributors for dropdown/autocomplete
router.get('/list/autocomplete', async (req, res) => {
  try {
    const { search = '' } = req.query;

    const contributors = await prisma.contributor.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { mobile: { contains: search, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        amount: true
      },
      take: 20
    });

    res.status(200).json({
      status: true,
      data: contributors
    });
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// Get contributor transaction history with date filtering
router.get('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, status } = req.query;

    const whereClause = { contributorId: id };

    if (status) {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({
      status: true,
      data: transactions
    });
  } catch (error) {
    console.error('Get contributor transactions error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

export default router;
