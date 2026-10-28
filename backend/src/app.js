const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { successResponse, errorResponse } = require('./utils/response');

// Pre-load and register all Mongoose models
require('./models');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const locationRoutes = require('./routes/locationRoutes');
const goodsRoutes = require('./routes/goodsRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const stockRequestRoutes = require('./routes/stockRequestRoutes');
const transferRoutes = require('./routes/transferRoutes');
const beneficiaryRoutes = require('./routes/beneficiaryRoutes');
const quotaRoutes = require('./routes/quotaRoutes');
const distributionRoutes = require('./routes/distributionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const alertRoutes = require('./routes/alertRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  return successResponse(
    res,
    {
      status: 'healthy',
      system: 'Essential Goods Distribution and Inventory Management System for North Shewa Zone',
      version: '1.0.0',
      region: 'North Shewa Zone, Amhara Region, Ethiopia',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    },
    'System is running normally'
  );
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/goods', goodsRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/stock-requests', stockRequestRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/beneficiaries', beneficiaryRoutes);
app.use('/api/v1/quota-rules', quotaRoutes);
app.use('/api/v1/distributions', distributionRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/audit-logs', auditLogRoutes);

// 404 Handler
app.use((req, res) => {
  return errorResponse(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return errorResponse(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === 'development' ? err.stack : null
  );
});

module.exports = app;
