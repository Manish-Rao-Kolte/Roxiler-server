import express from 'express';
import 'dotenv/config';
import transactionRoutes from './routes/transactionRoutes.js';
import connectDB from './config/db.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "https://roxiler-transactions-dashboard.netlify.app/", 
}));
app.use(express.json());

connectDB();

// Routes
app.use('/api/transactions', transactionRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
