import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String },
  dateOfSale: { type: Date, required: true },
  sold: { type: Boolean, default: false },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
