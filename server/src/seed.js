import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import Admin from './models/Admin.js';
import Content from './models/Content.js';

if (
  !process.env.MONGODB_URI ||
  !process.env.ADMIN_EMAIL ||
  !process.env.ADMIN_PASSWORD ||
  process.env.ADMIN_PASSWORD.length < 12
) {
  console.error('Set MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD (12+ chars) in .env');
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);

const email = process.env.ADMIN_EMAIL.toLowerCase().trim();
await Admin.findOneAndUpdate(
  { email },
  { $set: { passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12) } },
  { upsert: true, new: true },
);

const entries = {
  products: [
    ['Tally Prime', 'tally-prime'],
    ['Tally Software Services', 'tally-software-services'],
    ['Tally Virtual User (TVU) License', 'tally-virtual-user'],
    ['TallyPrime Server', 'tallyprime-server'],
    ['Spine', 'spine'],
    ['Pucho AI', 'pucho-ai'],
  ],
  services: [
    ['AMC', 'amc'],
    ['Tally Cloud', 'tally-cloud'],
    ['Tally Data Synchronization', 'tally-data-synchronization'],
    ['Tally Support – Onsite & Remote', 'tally-support'],
    ['Training and Implementations', 'training-implementations'],
  ],
};

for (const [kind, items] of Object.entries(entries)) {
  for (const [title, slug] of items) {
    await Content.updateOne(
      { kind, slug },
      { $setOnInsert: { kind, slug, title, description: '' } },
      { upsert: true },
    );
  }
}

console.log('Admin account and initial content seeded.');
await mongoose.disconnect();
