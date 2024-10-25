import express from 'express';
import app from './app.js';
import path from 'path';
import { fileURLToPath } from 'url';

import invitationRoutes from './routes/invitationRoutes.js';
import indexRoutes from './routes/indexRoutes.js';
import submitRoutes from './routes/submitRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
const port = process.env.PORT || 3000;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use('/', indexRoutes);
app.use('/invitation', invitationRoutes);
app.use('/submit', submitRoutes);
app.use('/health', healthRoutes);
app.use(express.static('public'));

app
  .listen(port, () => {
    console.log(
      `Server started in ${process.env.NODE_ENV || 'development'} mode`
    );
    console.log(`Static files served from: ${__dirname}/public`);
    console.log(`Server listening at http://localhost:${port}/`);
  })
  .on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
