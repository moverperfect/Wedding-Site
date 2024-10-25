import fs from 'fs/promises';
import prisma from '../config/database.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { time } from 'console';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const checkHealth = async (req, res) => {
  try {
    const invitationsDir = path.join(__dirname, '../invitations');
    try {
      await fs.access(invitationsDir);
    } catch {
      throw new Error('Invitations directory not found');
    }
    const files = await fs.readdir(invitationsDir);
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif)$/i.test(file)
    );
    if (imageFiles.length === 0) {
      throw new Error('No image files found in invitations folder');
    }

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database connection timeout')), 5000)
    );
    await Promise.race([prisma.$connect(), timeout]);

    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Health check passed',
        checks: {
          invitations: {
            status: 'healthy',
            count: imageFiles.length,
          },
          database: {
            status: 'healthy',
            latency: process.hrtime()[1] / 1000000,
          },
          system: {
            status: 'healthy',
            memory: process.memoryUsage().rss / 1024 / 1024,
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
          },
        },
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
