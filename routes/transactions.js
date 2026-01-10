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

// Create a new transaction
router.post('/', async (req, res) => {
  try {
    const { contributorId, amount, phoneNumber, paymentMethod = 'cash', status = 'completed', notes } = req.body;

    // Validation
    if (!contributorId || !amount || !phoneNumber) {
      return res.status(400).json({
        status: false,
        message: 'contributorId, amount, and phoneNumber are required'
      });
    }

    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid phone number format (must be 10 digits)'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        status: false,
        message: 'Amount must be greater than 0'
      });
    }

    // Check if contributor exists
    const contributor = await prisma.contributor.findUnique({
      where: { id: contributorId }
    });

    if (!contributor) {
      return res.status(404).json({
        status: false,
        message: 'Contributor not found'
      });
    }

    // Create transaction and update contributor amount in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          contributorId,
          amount: Number(amount),
          phoneNumber,
          paymentMethod,
          status,
          notes: notes || null
        },
        include: {
          contributor: true
        }
      });

      // Update contributor's total amount (only if status is 'completed')
      if (status === 'completed') {
        await tx.contributor.update({
          where: { id: contributorId },
          data: {
            amount: {
              increment: Number(amount)
            }
          }
        });
      }

      return transaction;
    });

    res.status(201).json({
      status: true,
      message: 'Transaction created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all transactions with optional filtering
router.get('/', async (req, res) => {
  try {
    const { contributorId, startDate, endDate, status, page = 1, limit = 20 } = req.query;
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const whereClause = {};

    // Apply filters
    if (contributorId) {
      whereClause.contributorId = contributorId;
    }

    if (status) {
      whereClause.status = status;
    }

    // Date range filtering
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          contributor: {
            select: {
              id: true,
              name: true,
              mobile: true,
              amount: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.transaction.count({ where: whereClause })
    ]);

    res.status(200).json({
      status: true,
      data: transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        contributor: true
      }
    });

    if (!transaction) {
      return res.status(404).json({
        status: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      status: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// Update transaction
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, phoneNumber, paymentMethod, status, notes } = req.body;

    // Check if transaction exists
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!existingTransaction) {
      return res.status(404).json({
        status: false,
        message: 'Transaction not found'
      });
    }

    // Validate phone number if provided
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid phone number format'
      });
    }

    const updateData = {};
    if (amount !== undefined) updateData.amount = Number(amount);
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        contributor: true
      }
    });

    res.status(200).json({
      status: true,
      message: 'Transaction updated successfully',
      data: updatedTransaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if transaction exists
    const transaction = await prisma.transaction.findUnique({
      where: { id }
    });

    if (!transaction) {
      return res.status(404).json({
        status: false,
        message: 'Transaction not found'
      });
    }

    // Delete transaction and reverse contributor amount if it was completed
    await prisma.$transaction(async (tx) => {
      if (transaction.status === 'completed') {
        await tx.contributor.update({
          where: { id: transaction.contributorId },
          data: {
            amount: {
              decrement: transaction.amount
            }
          }
        });
      }

      await tx.transaction.delete({
        where: { id }
      });
    });

    res.status(200).json({
      status: true,
      message: 'Transaction deleted successfully'
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// Dashboard: Get transaction summary by contributor
router.get('/dashboard/contributor-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause = {};
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }
    whereClause.status = 'completed';

    const summary = await prisma.transaction.groupBy({
      by: ['contributorId'],
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      where: whereClause,
      orderBy: {
        _sum: {
          amount: 'desc'
        }
      }
    });

    // Fetch contributor details
    const result = await Promise.all(
      summary.map(async (item) => {
        const contributor = await prisma.contributor.findUnique({
          where: { id: item.contributorId }
        });
        return {
          contributor,
          totalTransactionAmount: item._sum.amount || 0,
          transactionCount: item._count.id
        };
      })
    );

    res.status(200).json({
      status: true,
      data: result
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// Dashboard: Get overall statistics
router.get('/dashboard/statistics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause = { status: 'completed' };
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const [totalTransactions, totalAmount, uniqueContributors] = await Promise.all([
      prisma.transaction.count({ where: whereClause }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: whereClause
      }),
      prisma.transaction.findMany({
        where: whereClause,
        distinct: ['contributorId'],
        select: { contributorId: true }
      })
    ]);

    res.status(200).json({
      status: true,
      data: {
        totalTransactions,
        totalAmount: totalAmount._sum.amount || 0,
        uniqueContributors: uniqueContributors.length,
        averageContribution: totalTransactions > 0 ? (totalAmount._sum.amount || 0) / totalTransactions : 0
      }
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

export default router;
