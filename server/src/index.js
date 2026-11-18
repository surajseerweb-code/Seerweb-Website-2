import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

import Enquiry from './models/Enquiry.js';
import Content from './models/Content.js';
import Admin from './models/Admin.js';
import auth from './middleware/auth.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '30kb' }));

const wrap = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const enquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().max(40).optional().default(''),
  topic: z.string().max(160).optional().default(''),
  subject: z.string().max(160).optional().default(''),
  message: z.string().trim().min(3).max(5000),
  source: z.string().max(250).optional().default('website'),
});

const contentSchema = z.object({
  title: z.string().trim().min(2).max(150),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/).max(150),
  description: z.string().max(3000).optional().default(''),
});

const validContentKinds = ['products', 'services'];

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.post(
  '/api/enquiries',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-7', legacyHeaders: false }),
  wrap(async (req, res) => {
    const parsed = enquirySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Please provide a valid name, email and message.',
        errors: parsed.error.flatten().fieldErrors,
      });
    }
    const enquiry = await Enquiry.create(parsed.data);
    return res.status(201).json({ message: 'Enquiry received', id: enquiry.id });
  }),
);

app.post(
  '/api/auth/login',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 10 }),
  wrap(async (req, res) => {
    const email = String(req.body.email || '').toLowerCase().trim();
    const admin = await Admin.findOne({ email });
    if (!admin || !(await bcrypt.compare(String(req.body.password || ''), admin.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    return res.json({
      token: jwt.sign({ sub: admin.id }, process.env.JWT_SECRET, { expiresIn: '8h' }),
    });
  }),
);

app.get('/api/content/:kind', wrap(async (req, res) => {
  if (!validContentKinds.includes(req.params.kind)) {
    return res.status(404).json({ message: 'Not found' });
  }
  return res.json(await Content.find({ kind: req.params.kind }).sort({ title: 1 }));
}));

// Every route registered below this middleware requires a valid admin JWT.
app.use('/api/admin', auth);

app.get('/api/admin/:kind', wrap(async (req, res) => {
  const kind = req.params.kind;
  if (kind === 'enquiries') {
    return res.json(await Enquiry.find().sort({ createdAt: -1 }).limit(500));
  }
  if (!validContentKinds.includes(kind)) {
    return res.status(404).json({ message: 'Not found' });
  }
  return res.json(await Content.find({ kind }).sort({ title: 1 }));
}));

app.patch('/api/admin/enquiries/:id', wrap(async (req, res) => {
  if (!['new', 'contacted', 'closed'].includes(req.body.status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  const enquiry = await Enquiry.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true },
  );
  if (!enquiry) return res.status(404).json({ message: 'Not found' });
  return res.json(enquiry);
}));

app.post('/api/admin/:kind', wrap(async (req, res) => {
  if (!validContentKinds.includes(req.params.kind)) {
    return res.status(404).json({ message: 'Not found' });
  }
  const parsed = contentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid content data' });
  const content = await Content.create({ ...parsed.data, kind: req.params.kind });
  return res.status(201).json(content);
}));

app.put('/api/admin/:kind/:id', wrap(async (req, res) => {
  if (!validContentKinds.includes(req.params.kind)) {
    return res.status(404).json({ message: 'Not found' });
  }
  const parsed = contentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid content data' });
  const content = await Content.findOneAndUpdate(
    { _id: req.params.id, kind: req.params.kind },
    parsed.data,
    { new: true, runValidators: true },
  );
  if (!content) return res.status(404).json({ message: 'Not found' });
  return res.json(content);
}));

app.delete('/api/admin/:kind/:id', wrap(async (req, res) => {
  const kind = req.params.kind;
  let deleted;
  if (kind === 'enquiries') {
    deleted = await Enquiry.findByIdAndDelete(req.params.id);
  } else if (validContentKinds.includes(kind)) {
    deleted = await Content.findOneAndDelete({ _id: req.params.id, kind });
  } else {
    return res.status(404).json({ message: 'Not found' });
  }
  if (!deleted) return res.status(404).json({ message: 'Not found' });
  return res.json({ deleted: true });
}));

app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier' });
  }
  return res.status(500).json({ message: 'Internal server error' });
});

const port = Number(process.env.PORT || 5000);
if (!process.env.MONGODB_URI || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('Set MONGODB_URI and a JWT_SECRET of at least 32 characters in server/.env');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });
