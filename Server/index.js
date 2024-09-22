require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');
const fs = require('fs').promises;

const app = express();
app.disable('x-powered-by');
const port = process.env.PORT || 3000;

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function logImageAccess(imageName, ipAddress) {
  await prisma.logEntry.create({
    data: {
      imageName,
      ipAddress,
    },
  });
}

app.set('trust proxy', true);

app.get('/invitation/:imageName', async (req, res) => {
  let imageName = req.params.imageName;
  let clientIp =
    req.headers['x-client-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress;
  let timestamp = new Date().toISOString();
  const logEntry = `Timestamp: ${timestamp}, Image: ${imageName}, IP: ${clientIp}`;
  console.log(logEntry);
  res.sendFile(`${__dirname}/invitations/${imageName}`);

  logImageAccess(imageName, clientIp).catch((error) => {
    console.error('Falied to log image access:', error);
  });
});

app.get('/health', async (req, res) => {
  try {
    const files = await fs.readdir(`${__dirname}/invitations`);
    if (files.length === 0) {
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
});

app.listen(port, () => {
});
