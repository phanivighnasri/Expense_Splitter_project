const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = require('./config/database');
connectDB();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const groupRoutes = require('./routes/groups');
const expenseRoutes = require('./routes/expenses');
const settlementRoutes = require('./routes/settlements');
const paymentRoutes = require('./routes/payments');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/payments', paymentRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Expense Splitter API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Documentation Route
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Expense Splitter API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register/Login user',
        'GET /api/auth/profile': 'Get user profile (Auth required)',
        'POST /api/auth/contacts': 'Add contact (Auth required)',
        'GET /api/auth/search': 'Search users (Auth required)'
      },
      groups: {
        'POST /api/groups': 'Create group (Auth required)',
        'GET /api/groups': 'Get user groups (Auth required)',
        'GET /api/groups/:groupId': 'Get group details (Auth required)',
        'POST /api/groups/:groupId/members': 'Add member (Auth required)'
      },
      expenses: {
        'POST /api/expenses': 'Add expense (Auth required)',
        'GET /api/expenses/group/:groupId': 'Get group expenses (Auth required)',
        'DELETE /api/expenses/:expenseId': 'Delete expense (Auth required)',
        'GET /api/expenses/analytics/:groupId': 'Get expense analytics (Auth required)'
      },
      settlements: {
        'GET /api/settlements/calculate/:groupId': 'Calculate settlements (Auth required)',
        'GET /api/settlements/group/:groupId': 'Get group settlements (Auth required)',
        'PUT /api/settlements/:settlementId': 'Update settlement status (Auth required)'
      },
      payments: {
        'POST /api/payments/create-order': 'Create payment order (Auth required)',
        'GET /api/payments/verify/:orderId': 'Verify payment (Auth required)',
        'POST /api/payments/webhook': 'Payment webhook',
        'GET /api/payments/callback': 'Payment callback',
        'GET /api/payments/methods': 'Get payment methods (Auth required)'
      }
    },
    health: 'GET /api/health - API health check'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// Handle 404 - This should be LAST
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log('💰      EXPENSE SPLITTER BACKEND');
  console.log('🚀 ========================================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`💰 Cashfree: ${process.env.CASHFREE_CLIENT_ID ? 'Configured' : 'Demo Mode'}`);
  
  if (process.env.MONGODB_URI) {
    const dbType = process.env.MONGODB_URI.includes('localhost') ? 'Local MongoDB' : 'MongoDB Atlas';
    console.log(`🗄️  Database: ${dbType}`);
  } else {
    console.log('❌ Database: Not configured - check MONGODB_URI in .env');
  }
  
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api`);
  console.log('🚀 ========================================');
});

