require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');
const fs = require('fs').promises;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { setCacheHeaders } = require('./setCacheHeaders');

const app = express();
app.disable('x-powered-by');
const port = process.env.PORT || 3000;

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

const urlencodedParser = bodyParser.urlencoded({ extended: false });
app.use(cookieParser());

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
});

app.get(['/', '/index.html'], async (req, res) => {
  const flagKey = 'versionone';
  const queryString = req.query[flagKey];
  if (queryString != undefined && queryString === 'false') {
    res.sendFile(`${__dirname}/public/coming_soon.html`);
    // Delete the cookie
    res.clearCookie(flagKey);
    return;
  }
  if (req.cookies[flagKey] === 'true') {
    res.sendFile(`${__dirname}/public/index.html`);
    return;
  }
  if (req.query[flagKey] === undefined) {
    res.sendFile(`${__dirname}/public/coming_soon.html`);
    return;
  }
  res.cookie(flagKey, 'true', { maxAge: 900000, httpOnly: true });
  res.sendFile(`${__dirname}/public/index.html`);
});

app.use(setCacheHeaders);

app.use(express.static('public'));

app.post('/submit', urlencodedParser, async (req, res) => {
  let name = req.body.name;
  let email = req.body.email;
  let numberOfGuests = req.body.numberOfGuests;
  let isAttending = req.body.isAttending;
  let dietary = req.body.dietary;
  let morningWalk = req.body.morningWalk;

  let clientIp =
    req.headers['x-client-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress;

  let timestamp = new Date().toISOString();
  const logEntry = `Timestamp: ${timestamp}, Name: ${name}, Email: ${email}, Number of Guests: ${numberOfGuests}, Is Attending: ${isAttending}, Message: ${dietary}, Morning Walk: ${morningWalk}, IP: ${clientIp}`;
  console.log(logEntry);
  if (isAttending === 'true') {
    res.send(
      '<div class="alert alert-success" role="alert">🎉 Thank You, we look forward celebrating with you! 🎉</div>'
    );
  } else {
    res.send(
      '<div class="alert alert-danger" role="alert">Sorry you are unable to attend. We look forward to celebrating with you another time! 😢</div>'
    );
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
