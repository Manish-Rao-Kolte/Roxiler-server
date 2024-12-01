import axios from 'axios';
import Transaction from '../models/Transaction.js';

/**
 * Initialize the database with data from the third-party API.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - Success message.
 */
export const initializeDB = async (req, res) => {
  try {
    const { data } = await axios.get(process.env.API_URL);

    // Clear existing transactions
    await Transaction.deleteMany();

    // Insert data into the database
    const transactions = await Transaction.insertMany(data);

    res.status(200).json({
      message: 'Database initialized successfully!',
      totalRecords: transactions.length,
    });
  } catch (error) {
    console.error(`Error initializing database: ${error.message}`);
    res.status(500).json({ message: 'Failed to initialize database', error: error.message });
  }
};

/**
 * List transactions with search and pagination.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - List of transactions.
 */
export const listTransactions = async (req, res) => {
  try {
    const { month, search = '', page = 1, perPage = 10 } = req.query;

    if(!month || +month <= 0 || +month > 12) {
      return res.status(400).json({ message: 'Valid month is required' });
    };

    // Pagination parameters
    const limit = parseInt(perPage, 10) || 10;
    const skip = (parseInt(page, 10) - 1) * limit;

    // Search criteria
    const searchRegex = new RegExp(search, 'i'); 
    const searchQuery = {
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { price: isNaN(Number(search)) ? undefined : Number(search) },
      ].filter(Boolean),
    };

    // Aggregation pipeline
    const pipeline = [
      {
        $addFields: {
          month: { $month: '$dateOfSale' },
        },
      },
      {
        $match: {
          ...(month ? { month: +month } : {}), 
          ...searchQuery,
        },
      },
      {
        $skip: skip, 
      },
      {
        $limit: limit, 
      },
      {
        $project: {
          title: 1,
          description: 1,
          price: 1,
          sold: 1,
          dateOfSale: 1,
          category: 1,
        },
      },
    ];

    // Execute the aggregation pipeline
    const transactions = await Transaction.aggregate(pipeline);

    // Count total records for pagination
    const totalRecordsPipeline = [
      ...pipeline.slice(0, -2), // Exclude `$skip` and `$limit` for the count
      { $count: 'totalRecords' },
    ];
    const totalCountResult = await Transaction.aggregate(totalRecordsPipeline);
    const totalRecords = totalCountResult[0]?.totalRecords || 0;

    res.status(200).json({
      transactions,
      pagination: {
        totalRecords,
        currentPage: parseInt(page, 10),
        perPage: limit,
        totalPages: Math.ceil(totalRecords / limit),
      },
    });
  } catch (error) {
    console.error(`Error fetching transactions: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch transactions', error: error.message });
  }
};


/**
 * Get statistics for a specific month.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - Statistics data.
 */
export const getStatistics = async (req, res) => {
  try {
    const { month } = req.query;
    if(!month || +month <= 0 || +month > 12) {
      return res.status(400).json({ message: 'Valid month is required' });
    };

    // Fetch all transactions where date of sale includes the month as regex can't be used with date
    const transactions = await Transaction.aggregate(
      [
        {
          $addFields: {
            month: { $month: '$dateOfSale' },
          }
        },
        {
          $match: {
            month: +month,
          }
        },
        {
          $project: {
            price: 1,
            sold: 1,
          }
        }
        
      ]
    )

    // Calculate statistics
    const totalSaleAmount = transactions
      .filter((item) => item.sold)
      .reduce((sum, item) => sum + item.price, 0);

    const totalSoldItems = transactions.filter((item) => item.sold).length;
    const totalUnsoldItems = transactions.length - totalSoldItems;

    res.status(200).json({
      totalSaleAmount,
      totalSoldItems,
      totalUnsoldItems,
    });
  } catch (error) {
    console.error(`Error fetching statistics: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
  }
};


/**
 * Get bar chart data for a specific month.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - Bar chart data.
 */
export const getBarChart = async (req, res) => {
  try {
    const { month } = req.query;

    if(!month || +month <= 0 || +month > 12) {
      return res.status(400).json({ message: 'Valid month is required' });
    };

    // Fetch all transactions matching the month
    const transactions = await Transaction.aggregate(
      [
        {
          $addFields: {
            month: { $month: '$dateOfSale' },
          }
        },
        {
          $match: {
            month: +month,
          }
        },
        {
          $project: {
            price: 1,
            sold: 1,
          }
        }
        
      ]
    )

    // Define price ranges
    const ranges = [
      { label: '0-100', min: 0, max: 100 },
      { label: '101-200', min: 101, max: 200 },
      { label: '201-300', min: 201, max: 300 },
      { label: '301-400', min: 301, max: 400 },
      { label: '401-500', min: 401, max: 500 },
      { label: '501-600', min: 501, max: 600 },
      { label: '601-700', min: 601, max: 700 },
      { label: '701-800', min: 701, max: 800 },
      { label: '801-900', min: 801, max: 900 },
      { label: '901-above', min: 901, max: Infinity },
    ];

    // Calculate the number of items in each range
    const rangeCounts = ranges.map((range) => ({
      range: range.label,
      count: transactions.filter(
        (item) => item.price >= range.min && item.price <= range.max && item.sold
      ).length,
    }));

    res.status(200).json({ rangeCounts });
  } catch (error) {
    console.error(`Error fetching bar chart data: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch bar chart data', error: error.message });
  }
};

/**
 * Get pie chart data for a specific month.
 * @param {Object} req - Express request object.  
 * @param {Object} res - Express response object.
 * @returns {Object} - Pie chart data.
 */
export const getPieChart = async (req, res) => {
  try {
    const { month } = req.query;

    if(!month || +month <= 0 || +month > 12) {
      return res.status(400).json({ message: 'Valid month is required' });
    };

    // Fetch all transactions matching the month
    const transactions = await Transaction.aggregate(
      [
        {
          $addFields: {
            month: { $month: '$dateOfSale' },
          }
        },
        {
          $match: {
            month: +month,
          }
        },
        {
          $project: {
            category: 1,
          }
        }
        
      ]
    )

    // Group items by category and count them
    const categoryCounts = transactions.reduce((acc, transaction) => {
      const category = transaction.category || 'Uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Format the result for the pie chart
    const result = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    }));

    res.status(200).json({ categoryCounts: result });
  } catch (error) {
    console.error(`Error fetching pie chart data: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch pie chart data', error: error.message });
  }
};

/**
 * Get combined data for statistics, bar chart, and pie chart.  
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @returns {Object} - Combined data.
 */
export const getCombinedData = async (req, res) => {
  try {
    const { month } = req.query;

    if(!month || +month <= 0 || +month > 12) {
      return res.status(400).json({ message: 'Valid month is required' });
    };

    // Fetch data from individual APIs
    const statisticsPromise = getStatistics({ query: { month } }, null, true);
    const barChartPromise = getBarChart({ query: { month } }, null, true);
    const pieChartPromise = getPieChart({ query: { month } }, null, true);

    const [statistics, barChart, pieChart] = await Promise.all([
      statisticsPromise,
      barChartPromise,
      pieChartPromise,
    ]);

    if (statistics.error || barChart.error || pieChart.error) {
      throw new Error('Error fetching data from one or more APIs');
    }

    // Combine the results
    const combinedData = {
      statistics: statistics.data,
      barChart: barChart.data,
      pieChart: pieChart.data,
    };

    res.status(200).json(combinedData);
  } catch (error) {
    console.error(`Error fetching combined data: ${error.message}`);
    res.status(500).json({ message: 'Failed to fetch combined data', error: error.message });
  }
};

