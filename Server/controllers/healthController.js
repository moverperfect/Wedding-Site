const fs = require('fs').promises;
const prisma = require('../config/database');
const path = require('path');

exports.checkHealth = async (req, res) => {
  try {
    const files = await fs.readdir(path.join(__dirname, '../invitations'));
    if (files.length === 0) {
      throw new Error('No images found in invitations folder');
    }

    await prisma.$connect();

    res.status(200).json({
      status: 'success',
      message: 'Health check passed',
      invitationsCount: files.length,
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};
