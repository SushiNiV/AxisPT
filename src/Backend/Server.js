const express = require('express');
const cors = require('cors');
require('dotenv').config();

const adminRoutes = require('./routes/adminRoutes');
const studentRoutes = require('./routes/studentRoutes');

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
app.use('/api/student', studentRoutes);

logRoutes('/api/admin', adminRoutes);
logRoutes('/api/student', studentRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Production server running on port ${PORT}`));