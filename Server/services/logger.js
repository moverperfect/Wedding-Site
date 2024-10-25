import prisma from '../config/database.js';

export async function logImageAccess(imageName, ipAddress) {
  if (!imageName || !ipAddress) {
    throw new Error('Image name and IP address are required');
  }

  try {
    await prisma.logEntry.create({
      data: {
        imageName,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to log image access:', {
      error: error.message,
      imageName,
      timestamp: new Date().toISOString(),
    });
    throw new Error('Failed to log image access');
  }
}
