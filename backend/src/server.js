require('dotenv').config();
const cron = require('node-cron');
const app = require('./app');
const { connectDB } = require('./config/database');
const { runAlertScans } = require('./jobs/alertJob');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Schedule daily alert scan job (00:00 daily per UC-09)
    cron.schedule('0 0 * * *', () => {
      runAlertScans().catch(err => console.error('Daily alert job error:', err));
    });

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
      console.log(`Health check: http://localhost:${PORT}/api/v1/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
