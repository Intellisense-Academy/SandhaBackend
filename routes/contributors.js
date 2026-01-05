import express from 'express';
const router = express.Router();
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/index.js';
import dotenv from 'dotenv';

dotenv.config();
const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Create contributor
router.post('/', async (req, res) => {
  try {
    const { name, mobile, amount } = req.body;

    if (!name || !mobile || amount === undefined) {
      return res.status(400).json({ status: false, message: 'name, mobile and amount are required' });
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(mobile)) {
      return res.status(400).json({ status: false, message: 'Invalid mobile format' });
    }

    const newContributor = await prisma.contributor.create({
      data: {
        name,
        mobile,
        amount: Number(amount),
      }
    });

    res.status(201).json({ status: true, message: 'Contributor created', data: newContributor });
  } catch (error) {
    console.error('Create contributor error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ status: false, message: 'Contributor with this mobile already exists' });
    }
    res.status(500).json({ status: false, message: 'Server error' });
  }
});

// List contributors
router.get('/', async (req, res) => {
  try {
    const contributors = await prisma.contributor.findMany({ orderBy: { createdAt: 'desc' } });
    res.status(200).json({ status: true, data: contributors });
  } catch (error) {
    console.error('List contributors error:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});

// Get contributor by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contributor = await prisma.contributor.findUnique({ where: { id } });
    if (!contributor) return res.status(404).json({ status: false, message: 'Contributor not found' });
    res.status(200).json({ status: true, data: contributor });
  } catch (error) {
    console.error('Get contributor error:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});

// Update contributor
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mobile, amount } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (amount !== undefined) updateData.amount = Number(amount);

    const updated = await prisma.contributor.update({ where: { id }, data: updateData });
    res.status(200).json({ status: true, message: 'Contributor updated', data: updated });
  } catch (error) {
    console.error('Update contributor error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ status: false, message: 'Contributor not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ status: false, message: 'Mobile already in use' });
    }
    res.status(500).json({ status: false, message: 'Server error' });
  }
});

// Delete contributor
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.contributor.delete({ where: { id } });
    res.status(200).json({ status: true, message: 'Contributor deleted' });
  } catch (error) {
    console.error('Delete contributor error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ status: false, message: 'Contributor not found' });
    }
    res.status(500).json({ status: false, message: 'Server error' });
  }
});

export default router;
