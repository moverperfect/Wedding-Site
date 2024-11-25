import fs from 'fs/promises';
import prisma from '../config/database.js';
import path from 'path';
import { CONFIG } from '../config/config.js';

function withTimeout(promise, ms, errorMessage) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage || `Operation timed out after ${ms} ms`));
    }, ms);
  });
  return Promise.race([
    promise.finally(() => clearTimeout(timeoutId)),
    timeoutPromise,
  ]);
}

export const checkHealth = async (req, res) => {
  const startTime = process.hrtime();

  const invitationsCheck = withTimeout(
    (async () => {
      const invitationsDir = path.join(CONFIG.dirname, 'invitations');
      await fs.access(invitationsDir);
      const files = await fs.readdir(invitationsDir);
      const imageFiles = files.filter((file) =>
        /\.(jpg|jpeg|png|gif)$/i.test(file)
      );
      if (imageFiles.length === 0) {
        throw new Error('No image files found in invitations folder');
      }
      return { status: 'healthy', count: imageFiles.length };
    })(),
    3000,
    'Invitations check timed out'
  ).then(
    (result) => ({ invitations: result }),
    (error) => ({ invitations: { status: 'unhealthy', error: error.message } })
  );

  const databaseCheck = withTimeout(
    (async () => {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        latency: process.hrtime(startTime)[1] / 1e6,
      };
    })(),
    3000,
    'Database check timed out'
  ).then(
    (result) => ({ database: result }),
    (error) => ({ database: { status: 'unhealthy', error: error.message } })
  );

  const systemCheck = withTimeout(
    Promise.resolve({
      status: 'healthy',
      memory: process.memoryUsage().rss / 1024 / 1024,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
    3000,
    'System check timed out'
  ).then(
    (result) => ({ system: result }),
    (error) => ({ system: { status: 'unhealthy', error: error.message } })
  );

  try {
    // Run all checks in parallel and collect results
    const results = await Promise.allSettled([
      invitationsCheck,
      databaseCheck,
      systemCheck,
    ]);

    const checksResults = results.reduce((acc, curr) => {
      if (curr.status === 'fulfilled') {
        return { ...acc, ...curr.value };
      }
      return acc;
    }, {});

    // Determine overall health status
    const overallStatus = Object.values(checksResults).every(
      (check) => check.status === 'healthy'
    )
      ? 'success'
      : 'error';

    res.status(overallStatus === 'success' ? 200 : 503).json({
      status: overallStatus,
      data: {
        message:
          overallStatus === 'success'
            ? 'Health check passed'
            : 'Health check failed',
        checks: checksResults,
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: {
        message: 'Health check failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    });
  } finally {
    await prisma.$disconnect();
  }
};
