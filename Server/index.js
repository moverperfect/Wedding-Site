require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');

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
  
  logImageAccess(imageName, clientIp).catch(error => {
    console.error('Falied to log image access:', error);
  })
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
