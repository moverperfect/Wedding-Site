require('dotenv').config();
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { PrismaLibSQL } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');
const fs = require('fs').promises;
const cookieParser = require('cookie-parser');
const { setCacheHeaders } = require('./setCacheHeaders');
const { z, ZodError } = require('zod');

const submitSchema = z
  .object({
    name: z.string().min(1, { message: 'Please enter your name.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    isAttending: z
      .enum(['true', 'false'], {
        errorMap: () => ({ message: 'Please indicate if you are attending.' }),
      })
      .transform((val) => val === 'true'),
    numberOfGuests: z.coerce
      .number({ invalid_type_error: 'Please enter a valid number of guests.' })
      .or(z.literal('')),
    dietary: z.string().optional(),
    morningWalk: z
      .enum(['true', 'false'], {
        errorMap: () => ({
          message:
            'Please indicate if you are joining us for a walk the day after.',
        }),
      })
      .transform((val) => val === 'true')
      .or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.isAttending) {
      if (
        data.numberOfGuests === undefined ||
        Number.isNaN(data.numberOfGuests) ||
        data.numberOfGuests === '' ||
        data.numberOfGuests < 1
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please enter the number of guests.',
          path: ['numberOfGuests'],
        });
      }
      if (data.morningWalk === undefined || data.morningWalk === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Please indicate if you are joining us for a walk the day after.',
          path: ['morningWalk'],
        });
      }
    }
  });

const app = express();
app.disable('x-powered-by');
const port = process.env.PORT || 3000;

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

const urlencodedParser = express.urlencoded({ extended: false });
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
  const queryFlag = req.query[flagKey];
  const cookieFlag = req.cookies[flagKey];

  if (queryFlag === 'false') {
    res.clearCookie(flagKey);
    return res.sendFile(`${__dirname}/public/coming_soon.html`);
  }

  if (cookieFlag === 'true' || queryFlag === '' || queryFlag === 'true') {
    res.cookie(flagKey, 'true', { maxAge: 900000, httpOnly: true });
    return res.sendFile(`${__dirname}/public/index.html`);
  }

  res.sendFile(`${__dirname}/public/coming_soon.html`);
});

app.use(setCacheHeaders);

app.use(express.static('public'));

app.post('/submit', urlencodedParser, async (req, res) => {
  try {
    const validatedData = submitSchema.parse(req.body);

    const { name, email, numberOfGuests, isAttending, dietary, morningWalk } =
      validatedData;

    let clientIp =
      req.headers['x-client-ip'] ||
      req.headers['x-forwarded-for'] ||
      req.connection.remoteAddress;

    let timestamp = new Date().toISOString();
    const logEntry = `Timestamp: ${timestamp}, Name: ${name}, Email: ${email}, Number of Guests: ${numberOfGuests}, Is Attending: ${isAttending}, Message: ${dietary}, Morning Walk: ${morningWalk}, IP: ${clientIp}`;
    console.log(logEntry);
    if (isAttending === true) {
      res.send(
        '<div class="alert alert-success" role="alert">🎉 Thank You, we look forward celebrating with you! 🎉</div>'
      );
    } else {
      res.send(
        '<div class="alert alert-danger" role="alert">Sorry you are unable to attend. We look forward to celebrating with you another time! 😢</div>'
      );
    }
  } catch (error) {
    if (error instanceof ZodError) {
      let message = '';
      error.issues.forEach((issue) => {
        message += `<div class="alert alert-danger" role="alert">${issue.message}</div>`;
      });
      res.status(400).send(message);
    } else {
      console.error('An unexpected error occurred:', error);
      res
        .status(500)
        .send(
          '<div class="alert alert-danger" role="alert">An unexpected error occurred. Please try again later.</div>'
        );
    }
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
