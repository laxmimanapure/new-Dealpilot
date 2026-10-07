const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const express = require('express');
const cors = require('cors');
const { connectDB, mongoose } = require('./db');

const authRoutes = require('./routes/authRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const buyerRoutes = require('./routes/buyerRoutes');
const orderRoutes = require('./routes/orderRoutes');
const auditRoutes = require('./routes/auditRoutes');
const aiRoutes = require('./routes/aiRoutes');
const searchRoutes = require('./routes/searchRoutes');

const { seedDatabase } = require('./seed');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// Support large image payloads (Base64 file uploads & camera captures up to 50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isConnected = mongoose.connection && mongoose.connection.readyState === 1;
  res.json({
    status: isConnected ? 'ok' : 'error',
    service: 'DealPilot Procure API',
    database: isConnected ? 'connected' : 'disconnected',
    dbName: isConnected ? mongoose.connection.name : null,
    version: '3.0.0',
    time: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', searchRoutes);
app.use('/api', orderRoutes);

// Catch unhandled /api routes with a clean JSON 404 response
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

// Serve frontend in production build if built
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

const User = require('./models/User');
const { JWT_SECRET } = require('./middleware/auth');

// Start Server
async function startServer() {
  try {
    const conn = await connectDB();
    await seedDatabase(false);

    const userCount = await User.countDocuments();
    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`🚀 DealPilot Procure API Server running on port ${PORT}`);
      console.log(`   MongoDB connected: true`);
      console.log(`   Connected database name: ${conn.connection.name}`);
      console.log(`   User collection name: ${User.collection.name}`);
      console.log(`   Registered users count: ${userCount}`);
      console.log(`   JWT_SECRET configured: ${Boolean(JWT_SECRET)}`);
      console.log(`   Gemini configured: ${Boolean(process.env.GEMINI_API_KEY)}`);
      console.log(`   Razorpay configured: ${Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)}`);
      console.log(`   Health Check: http://localhost:${PORT}/api/health`);
      console.log(`===================================================`);
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
}

startServer();
