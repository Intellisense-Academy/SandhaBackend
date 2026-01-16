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

// ============== CONTRIBUTOR ENDPOINTS ==============

// 1. CREATE CONTRIBUTOR
router.post('/', async (req, res) => {
  try {
    const { name, mobile, amount = 0 } = req.body;

    // Validation
    if (!name || !mobile) {
      return res.status(400).json({
        status: false,
        message: 'name and mobile are required'
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        status: false,
        message: 'Name must be at least 2 characters'
      });
    }

    if (!validatePhoneNumber(mobile)) {
      return res.status(400).json({
        status: false,
        message: 'Invalid mobile format (must be 10 digits)'
      });
    }

    if (amount < 0) {
      return res.status(400).json({
        status: false,
        message: 'Amount cannot be negative'
      });
    }

    const newContributor = await prisma.contributor.create({
      data: {
        name: name.trim(),
        mobile,
        amount: Number(amount),
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
        message: 'Mobile number already exists'
      });
    }
    res.status(500).json({
      status: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// 2. LIST ALL CONTRIBUTORS WITH PAGINATION & SEARCH
router.get('/getall', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'name', order = 'asc' } = req.query;

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

    const orderBy = {};
    const validSortFields = ['name', 'amount', 'mobile', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    orderBy[sortField] = order === 'desc' ? 'desc' : 'asc';

    const [contributors, total] = await Promise.all([
      prisma.contributor.findMany({
        where: whereClause,
        include: {
          transactions: {
            select: {
              id: true,
              amount: true,
              status: true,
              month: true,
              createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        orderBy,
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
      },
      filters: {
        search: search || null,
        sortBy: sortField,
        order
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

// 3. GET CONTRIBUTOR BY ID
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

    // Calculate statistics
    const completedTransactions = contributor.transactions.filter(t => t.status === 'completed');
    const stats = {
      totalTransactions: contributor.transactions.length,
      completedTransactions: completedTransactions.length,
      totalAmount: contributor.amount,
      lastTransaction: contributor.transactions[0]?.createdAt || null
    };

    res.status(200).json({
      status: true,
      data: {
        ...contributor,
        stats
      }
    });
  } catch (error) {
    console.error('Get contributor error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 4. UPDATE CONTRIBUTOR
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile , amount } = req.body;

    // Check if contributor exists
    const contributor = await prisma.contributor.findUnique({ where: { id } });
    if (!contributor) {
      return res.status(404).json({
        status: false,
        message: 'Contributor not found'
      });
    }

    const updateData = {};

    if (name !== undefined) {
      if (name.trim().length < 2) {
        return res.status(400).json({
          status: false,
          message: 'Name must be at least 2 characters'
        });
      }
      updateData.name = name.trim();
    }

    if (mobile !== undefined) {
      if (!validatePhoneNumber(mobile)) {
        return res.status(400).json({
          status: false,
          message: 'Invalid mobile format'
        });
      }
      updateData.mobile = mobile;
    }
    if (amount !== undefined) {
      if (amount < 0) {
        return res.status(400).json({
          status: false,
          message: 'Amount cannot be negative'
        });
      }     updateData.amount = Number(amount); 
    }



    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: false,
        message: 'No valid fields to update'
      });
    }

    const updatedContributor = await prisma.contributor.update({
      where: { id },
      data: updateData,
      include: { transactions: true }
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
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 5. DELETE CONTRIBUTOR
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const contributor = await prisma.contributor.findUnique({ where: { id } });
    if (!contributor) {
      return res.status(404).json({
        status: false,
        message: 'Contributor not found'
      });
    }

    await prisma.contributor.delete({ where: { id } });

    res.status(200).json({
      status: true,
      message: 'Contributor deleted successfully',
      data: { deletedId: id, deletedName: contributor.name }
    });
  } catch (error) {
    console.error('Delete contributor error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 6. GET AUTOCOMPLETE/DROPDOWN LIST
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
      take: 20,
      orderBy: { name: 'asc' }
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

// 7. GET CONTRIBUTOR TRANSACTION HISTORY
router.get('/:id/transactions', async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, status, month, page = 1, limit = 20 } = req.query;

    const contributor = await prisma.contributor.findUnique({ where: { id } });
    if (!contributor) {
      return res.status(404).json({
        status: false,
        message: 'Contributor not found'
      });
    }

    const whereClause = { contributorId: id };

    if (status) {
      whereClause.status = status;
    }

    if (month) {
      whereClause.month = month;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.transaction.count({ where: whereClause })
    ]);

    res.status(200).json({
      status: true,
      data: {
        contributor: {
          id: contributor.id,
          name: contributor.name,
          mobile: contributor.mobile,
          amount: contributor.amount
        },
        transactions,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    console.error('Get contributor transactions error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 8. GET CONTRIBUTOR STATISTICS
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const contributor = await prisma.contributor.findUnique({
      where: { id },
      include: { transactions: true }
    });

    if (!contributor) {
      return res.status(404).json({
        status: false,
        message: 'Contributor not found'
      });
    }

    const transactions = contributor.transactions;
    const completed = transactions.filter(t => t.status === 'completed');
    const pending = transactions.filter(t => t.status === 'pending');
    const failed = transactions.filter(t => t.status === 'failed');

    const stats = {
      contributor: {
        id: contributor.id,
        name: contributor.name,
        mobile: contributor.mobile
      },
      totalAmount: contributor.amount,
      transactions: {
        total: transactions.length,
        completed: completed.length,
        pending: pending.length,
        failed: failed.length
      },
      amounts: {
        total: contributor.amount,
        completed: completed.reduce((sum, t) => sum + t.amount, 0),
        pending: pending.reduce((sum, t) => sum + t.amount, 0),
        failed: failed.reduce((sum, t) => sum + t.amount, 0)
      },
      lastTransaction: transactions[0]?.createdAt || null,
      transactionsByMonth: {}
    };

    // Group by month
    for (const tx of transactions) {
      const month = tx.month || 'N/A';
      if (!stats.transactionsByMonth[month]) {
        stats.transactionsByMonth[month] = {
          count: 0,
          amount: 0,
          completed: 0,
          pending: 0
        };
      }
      stats.transactionsByMonth[month].count++;
      stats.transactionsByMonth[month].amount += tx.amount;
      if (tx.status === 'completed') stats.transactionsByMonth[month].completed++;
      if (tx.status === 'pending') stats.transactionsByMonth[month].pending++;
    }

    res.status(200).json({
      status: true,
      data: stats
    });
  } catch (error) {
    console.error('Get contributor stats error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 9. BULK GET CONTRIBUTORS
router.post('/bulk/get', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: 'ids array is required and must not be empty'
      });
    }

    const contributors = await prisma.contributor.findMany({
      where: { id: { in: ids } },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      }
    });

    res.status(200).json({
      status: true,
      data: contributors,
      count: contributors.length
    });
  } catch (error) {
    console.error('Bulk get contributors error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

// 10. GET ALL CONTRIBUTORS DASHBOARD
router.get('/dashboard/all', async (req, res) => {
  try {
    const contributors = await prisma.contributor.findMany({
      include: {
        transactions: {
          where: { status: 'completed' },
          select: { amount: true, month: true }
        }
      },
      orderBy: { amount: 'desc' }
    });

    const stats = {
      total: contributors.length,
      totalAmount: contributors.reduce((sum, c) => sum + c.amount, 0),
      topContributors: contributors.slice(0, 5),
      byMonth: {}
    };

    // Group by month
    for (const contributor of contributors) {
      for (const tx of contributor.transactions) {
        const month = tx.month || 'N/A';
        if (!stats.byMonth[month]) {
          stats.byMonth[month] = { count: 0, amount: 0 };
        }
        stats.byMonth[month].count++;
        stats.byMonth[month].amount += tx.amount;
      }
    }

    res.status(200).json({
      status: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      status: false,
      message: 'Server error'
    });
  }
});

export default router;
