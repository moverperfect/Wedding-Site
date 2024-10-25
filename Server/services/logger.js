// services/logger.js
const prisma = require('../config/database');

async function logImageAccess(imageName, ipAddress) {
  try {
    await prisma.logEntry.create({
      data: {
        imageName,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to log image access:', error);
  }
}

module.exports = {
  logImageAccess,
};
