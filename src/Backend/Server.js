const express = require('express');
const cors = require('cors');
require('dotenv').config();

const adminRoutes = require('./routes/adminRoutes');

const helmet = require('helmet');
const compression = require('compression')

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet()); 
app.use(compression());

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

const PORT = process.env.BACK_PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));