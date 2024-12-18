import express from 'express';
import 'dotenv/config';
import transactionRoutes from './routes/transactionRoutes.js';
import connectDB from './config/db.js';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL;

app.use(cors({
  origin: [CLIENT_URL,'http://localhost:3000'], 
}));
app.use(express.json());

connectDB();

// Routes
app.use('/api/transactions', transactionRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
