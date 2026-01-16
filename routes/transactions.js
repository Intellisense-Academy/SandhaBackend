import express from 'express';
const router = express.Router();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/index.js';
import dotenv from 'dotenv';

dotenv.config();
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ============== HELPER FUNCTIONS ==============
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
};

const validateMonthFormat = (month) => {
  const monthRegex = /^\d{4}-\d{2}$/;
  return monthRegex.test(month);
};

const validateStatus = (status) => {
  return ['completed', 'pending', 'failed'].includes(status);
};

// ============== TRANSACTION ENDPOINTS ==============

// 1. SEARCH CONTRIBUTOR BY NAME
router.get('/search/contributor', async (req, res) => {
  try {
    const { name } = req.query;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        status: false,
        message: 'Contributor name is required'
      });
    }

    const contributors = await prisma.contributor.findMany({
      where: {
        name: { contains: name, mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        amount: true
      },
      take: 10,
      orderBy: { name: 'asc' }
    });

    if (contributors.length === 0) {
      return res.status(404).json({
        status: false,
        message: `No contributor found with name "${name}"`
      });
    }

    res.status(200).json({
      status: true,
      data: contributors
    });
  } catch (error) {
    console.error('Search contributor error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 2. CREATE TRANSACTION (ADMIN ADD PAYMENT)
router.post('/', async (req, res) => {
  try {
    const { contributorName, amount, month, paymentMethod = 'cash', status = 'completed', notes } = req.body;

    // Validation
    if (!contributorName || !amount || !month) {
      return res.status(400).json({
        status: false,
        message: 'contributorName, amount, and month are required'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        status: false,
        message: 'Amount must be greater than 0'
      });
    }

    if (!validateMonthFormat(month)) {
      return res.status(400).json({
        status: false,
        message: 'Month must be in format YYYY-MM (e.g., 2026-01)'
      });
    }

    if (!validateStatus(status)) {
      return res.status(400).json({
        status: false,
        message: 'Status must be one of: completed, pending, failed'
      });
    }

    // Search for contributor by name
    const contributor = await prisma.contributor.findFirst({
      where: {
        name: { contains: contributorName, mode: 'insensitive' }
      }
    });

    if (!contributor) {
      return res.status(404).json({
        status: false,
        message: `Contributor with name "${contributorName}" not found`
      });
    }

    // Create transaction and update contributor amount
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          contributorId: contributor.id,
          amount: Number(amount),
          phoneNumber: contributor.mobile,
          paymentMethod,
          status,
          month,
          notes: notes || null
        },
        include: { contributor: true }
      });

      if (status === 'completed') {
        await tx.contributor.update({
          where: { id: contributor.id },
          data: {
            amount: { increment: Number(amount) }
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

// 3. GET ALL TRANSACTIONS WITH FILTERING
router.get('/', async (req, res) => {
  try {
    const { 
      contributorId, 
      startDate, 
      endDate, 
      status, 
      month, 
      paymentMethod,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const whereClause = {};

    if (contributorId) whereClause.contributorId = contributorId;
    if (status) whereClause.status = status;
    if (month) whereClause.month = month;
    if (paymentMethod) whereClause.paymentMethod = paymentMethod;

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const validSortFields = ['amount', 'createdAt', 'status', 'month'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const orderBy = { [sortField]: order === 'asc' ? 'asc' : 'desc' };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          contributor: {
            select: { id: true, name: true, mobile: true, amount: true }
          }
        },
        orderBy,
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

// 4. GET TRANSACTION BY ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { contributor: true }
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

// 5. UPDATE TRANSACTION
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, status, month, notes } = req.body;

    const existingTransaction = await prisma.transaction.findUnique({ where: { id } });
    if (!existingTransaction) {
      return res.status(404).json({
        status: false,
        message: 'Transaction not found'
      });
    }

    const updateData = {};

    if (amount !== undefined) {
      if (amount <= 0) {
        return res.status(400).json({
          status: false,
          message: 'Amount must be greater than 0'
        });
      }
      updateData.amount = Number(amount);
    }

    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    
    if (status !== undefined) {
      if (!validateStatus(status)) {
        return res.status(400).json({
          status: false,
          message: 'Invalid status'
        });
      }
      updateData.status = status;
    }

    if (month !== undefined) {
      if (!validateMonthFormat(month)) {
        return res.status(400).json({
          status: false,
          message: 'Invalid month format'
        });
      }
      updateData.month = month;
    }

    if (notes !== undefined) updateData.notes = notes;

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: { contributor: true }
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

// 6. DELETE TRANSACTION
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({ where: { id } });
    if (!transaction) {
      return res.status(404).json({
        status: false,
        message: 'Transaction not found'
      });
    }

    // Reverse amount if it was completed
    if (transaction.status === 'completed') {
      await prisma.contributor.update({
        where: { id: transaction.contributorId },
        data: {
          amount: { decrement: transaction.amount }
        }
      });
    }

    await prisma.transaction.delete({ where: { id } });

    res.status(200).json({
      status: true,
      message: 'Transaction deleted successfully',
      data: { deletedId: id }
    });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 7. FILTER BY MONTH AND STATUS (PAID/UNPAID)
router.get('/filter/month-status', async (req, res) => {
  try {
    const { month, paymentStatus, page = 1, limit = 20 } = req.query;

    if (!month) {
      return res.status(400).json({
        status: false,
        message: 'Month parameter is required (format: YYYY-MM)'
      });
    }

    if (!validateMonthFormat(month)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid month format'
      });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const whereClause = { month };

    if (paymentStatus) {
      if (!validateStatus(paymentStatus)) {
        return res.status(400).json({
          status: false,
          message: 'Invalid payment status'
        });
      }
      whereClause.status = paymentStatus;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        include: {
          contributor: {
            select: { id: true, name: true, mobile: true }
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
      summary: {
        month,
        paymentStatus: paymentStatus || 'all',
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('Filter error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 8. PAID VS UNPAID SUMMARY FOR A MONTH
router.get('/summary/paid-unpaid', async (req, res) => {
  try {
    const { month } = req.query;

    if (!month) {
      return res.status(400).json({
        status: false,
        message: 'Month parameter is required (format: YYYY-MM)'
      });
    }

    if (!validateMonthFormat(month)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid month format'
      });
    }

    const whereClause = { month };

    const [paidCount, unpaidCount, paidAmount, unpaidAmount, contributors] = await Promise.all([
      prisma.transaction.count({
        where: { ...whereClause, status: 'completed' }
      }),
      prisma.transaction.count({
        where: { ...whereClause, status: { in: ['pending', 'failed'] } }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { ...whereClause, status: 'completed' }
      }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { ...whereClause, status: { in: ['pending', 'failed'] } }
      }),
      prisma.contributor.findMany({
        select: {
          id: true,
          name: true,
          mobile: true,
          transactions: {
            where: whereClause,
            select: { id: true, amount: true, status: true, month: true }
          }
        }
      })
    ]);

    res.status(200).json({
      status: true,
      data: {
        month,
        summary: {
          paid: {
            count: paidCount,
            amount: paidAmount._sum.amount || 0
          },
          unpaid: {
            count: unpaidCount,
            amount: unpaidAmount._sum.amount || 0
          },
          total: {
            count: paidCount + unpaidCount,
            amount: (paidAmount._sum.amount || 0) + (unpaidAmount._sum.amount || 0)
          }
        },
        contributors: contributors.filter(c => c.transactions.length > 0)
      }
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 9. DASHBOARD - CONTRIBUTOR SUMMARY
router.get('/dashboard/contributor-summary', async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;

    const whereClause = { status: 'completed' };

    if (month) {
      whereClause.month = month;
    } else if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const summary = await prisma.transaction.groupBy({
      by: ['contributorId'],
      _sum: { amount: true },
      _count: { id: true },
      where: whereClause,
      orderBy: {
        _sum: { amount: 'desc' }
      }
    });

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
    console.error('Contributor summary error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 10. DASHBOARD - OVERALL STATISTICS
router.get('/dashboard/statistics', async (req, res) => {
  try {
    const { startDate, endDate, month } = req.query;

    const whereClause = { status: 'completed' };

    if (month) {
      whereClause.month = month;
    } else if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const [totalTransactions, totalAmount, uniqueContributors, byPaymentMethod] = await Promise.all([
      prisma.transaction.count({ where: whereClause }),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: whereClause
      }),
      prisma.transaction.findMany({
        where: whereClause,
        distinct: ['contributorId'],
        select: { contributorId: true }
      }),
      prisma.transaction.groupBy({
        by: ['paymentMethod'],
        _sum: { amount: true },
        _count: { id: true },
        where: whereClause
      })
    ]);

    res.status(200).json({
      status: true,
      data: {
        totalTransactions,
        totalAmount: totalAmount._sum.amount || 0,
        uniqueContributors: uniqueContributors.length,
        averageContribution: totalTransactions > 0 ? (totalAmount._sum.amount || 0) / totalTransactions : 0,
        byPaymentMethod: byPaymentMethod.map(item => ({
          method: item.paymentMethod,
          count: item._count.id,
          amount: item._sum.amount || 0
        }))
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

// 11. BULK GET TRANSACTIONS
router.post('/bulk/get', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'ids array is required'
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: { id: { in: ids } },
      include: { contributor: true }
    });

    res.status(200).json({
      status: true,
      data: transactions,
      count: transactions.length
    });
  } catch (error) {
    console.error('Bulk get error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 12. PAYMENT METHOD STATISTICS
router.get('/stats/payment-methods', async (req, res) => {
  try {
    const { month, startDate, endDate } = req.query;

    const whereClause = { status: 'completed' };

    if (month) {
      whereClause.month = month;
    } else if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const stats = await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      _sum: { amount: true },
      _count: { id: true },
      where: whereClause,
      orderBy: {
        _sum: { amount: 'desc' }
      }
    });

    res.status(200).json({
      status: true,
      data: stats.map(item => ({
        paymentMethod: item.paymentMethod,
        count: item._count.id,
        totalAmount: item._sum.amount || 0,
        averageAmount: item._count.id > 0 ? (item._sum.amount || 0) / item._count.id : 0
      }))
    });
  } catch (error) {
    console.error('Payment methods stats error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 13. MONTHLY COLLECTION TREND
router.get('/stats/monthly-trend', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { status: 'completed' },
      select: { month: true, amount: true },
      orderBy: { month: 'desc' }
    });

    const trend = {};
    for (const tx of transactions) {
      const month = tx.month || 'N/A';
      if (!trend[month]) {
        trend[month] = { count: 0, amount: 0 };
      }
      trend[month].count++;
      trend[month].amount += tx.amount;
    }

    res.status(200).json({
      status: true,
      data: trend
    });
  } catch (error) {
    console.error('Monthly trend error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

export default router;
