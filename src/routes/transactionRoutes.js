import { 
    initializeDB,
    listTransactions,
    getStatistics, 
    getBarChart,
    getPieChart,
    getCombinedData 
    } from '../controllers/transactionController.js';
import express from 'express';

const router = express.Router();

// Route to initialize the database
router.get('/initialize', initializeDB);

// Route to list transactions with search and pagination
router.get('/', listTransactions);

// Route to get statistics for a given month
router.get('/statistics', getStatistics);

// Route to get bar chart data
router.get('/bar-chart', getBarChart);

// Route to get pie chart data
router.get('/pie-chart', getPieChart);

// Route to get combined data
router.get('/combined-data', getCombinedData);

export default router;
