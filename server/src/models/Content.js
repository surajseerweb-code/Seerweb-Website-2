import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  kind: { type: String, enum: ['products', 'services'], required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  description: String,
}, { timestamps: true });

export default mongoose.model('Content', contentSchema);
