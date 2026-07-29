require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');

const app = express();
app.set('trust proxy', 1);

// Security: Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Security: Restricted CORS
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow if no origin (server-to-server), if it matches allowedOrigins precisely, 
    // or if it's ANY vercel.app deployment (preview or production)
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Security Headers Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Rate limiting (in-memory implementation)
const rateLimit = require('./middleware/rateLimit');
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 })); // 20 requests per 15min for auth
app.use('/api/ai', rateLimit({ windowMs: 60 * 1000, max: 10 })); // 10 requests per minute for AI
app.use('/api/questions', rateLimit({ windowMs: 60 * 1000, max: 30 })); // 30 requests per minute
app.use('/api/answers', rateLimit({ windowMs: 60 * 1000, max: 15 })); // 15 requests per minute
app.use('/api/comments', rateLimit({ windowMs: 60 * 1000, max: 20 })); // 20 requests per minute
app.use('/api/debates', rateLimit({ windowMs: 60 * 1000, max: 30 })); // 30 requests per minute for debates
app.use('/api/shlokas', rateLimit({ windowMs: 60 * 1000, max: 40 })); // 40 requests per minute for scripture lookups

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(session({
  secret: process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB connected');
  // Initialize WhatsApp client AFTER DB is ready
  if (process.env.WHATSAPP_GROUP_ID) {
    try {
      const whatsappService = require('./services/whatsapp');
      whatsappService.initClient();
      console.log('[WhatsApp] Client initialization triggered');
    } catch (e) {
      console.error('[WhatsApp] Failed to initialize:', e.message);
    }
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/answers', require('./routes/answers'));
app.use('/api/comments', require('./routes/comments'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/users', require('./routes/users'));
app.use('/api/guru', require('./routes/guru'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/bounties', require('./routes/bounties'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/bot', require('./routes/bot'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/verses', require('./routes/verses'));
app.use('/api/debates', require('./routes/debates'));
app.use('/api/shlokas', require('./routes/shlokas'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'CORS policy violation' });
  }
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
