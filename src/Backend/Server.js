const express = require('express');
const cors = require('cors');
require('dotenv').config();

const adminRoutes = require('./routes/adminRoutes');

const helmet = require('helmet');
const compression = require('compression');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
  crossOriginEmbedderPolicy: false,
}));

app.use(compression());

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
}));

// 4. Body parser
app.use(express.json());

const logRoutes = (prefix, router) => {
  if (!router || !router.stack) return;
  console.log(`\nMounted routes for ${prefix}:`);
  router.stack.forEach((layer) => {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
      console.log(`  ${methods} ${prefix}${layer.route.path}`);
    }
  });
};

app.use('/api/admin', adminRoutes);
logRoutes('/api/admin', adminRoutes);

const PORT = process.env.BACK_PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));