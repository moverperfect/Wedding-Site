import express from 'express';
import app from './app.js';
import { CONFIG } from './config/config.js';

import invitationRoutes from './routes/invitationRoutes.js';
import indexRoutes from './routes/indexRoutes.js';
import submitRoutes from './routes/submitRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

app.use('/', indexRoutes);
app.use('/invitation', invitationRoutes);
app.use('/submit', submitRoutes);
app.use('/health', healthRoutes);
app.use(express.static('public'));

app
  .listen(CONFIG.port, () => {
    console.log(`Server started in ${CONFIG.environment} mode`);
    console.log(`Static files served from: ${CONFIG.dirname}/public`);
    console.log(`Server listening at http://localhost:${CONFIG.port}/`);
  })
  .on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
