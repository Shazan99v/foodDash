
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const adminCatalogRoutes = require('./routes/adminCatalogRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const businessRoutes = require('./routes/businessRoutes');
const riderRoutes = require('./routes/riderRoutes');
const riderOrderRoutes = require('./routes/riderOrderRoutes');
const customerOrderRoutes = require('./routes/customerOrderRoutes');
const customerCatalogRoutes = require('./routes/customerCatalogRoutes');
const cartRoutes = require('./routes/cartRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Allow images to be loaded by the Expo web app on another origin.
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cors({ origin: '*' }));

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

const applicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

const businessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const riderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const customerOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

const customerCatalogLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

const cartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Food App API is running',
  });
});

// Serve uploaded images with cross-origin resource policy enabled.
app.use(
  '/uploads',
  express.static(require('path').join(__dirname, 'uploads'), {
    setHeaders(res) {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/applications', applicationLimiter, applicationRoutes);
app.use('/api/uploads', uploadLimiter, uploadRoutes);
app.use('/api/admin', adminLimiter, adminRoutes);
app.use('/api/admin/catalog', adminLimiter, adminCatalogRoutes);

app.use('/api/business', businessLimiter, businessRoutes);
app.use('/api/rider', riderLimiter, riderRoutes);
app.use('/api/rider/orders', riderLimiter, riderOrderRoutes);
app.use('/api/catalog', customerCatalogLimiter, customerCatalogRoutes);
app.use('/api/cart', cartLimiter, cartRoutes);
app.use('/api/orders', customerOrderLimiter, customerOrderRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API route not found.',
  });
});

app.use(errorHandler);

module.exports = app;
