import submitSchema from '../models/submitSchema.js';
import { ZodError } from 'zod';
import getClientIp from '../utils/network.js';
import prisma from '../config/database.js';
import Pushbullet from 'pushbullet';
import fs from 'fs';
import { CONFIG } from '../config/config.js';
import path from 'path';
import fetch from 'node-fetch';

export const handleFormSubmission = async (req, res) => {
  try {
    const validatedData = submitSchema.parse(req.body);

    // Verify Turnstile token
    const turnstileResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
        response: validatedData['cf-turnstile-response'],
        remoteip: getClientIp(req),
      }),
    });

    const turnstileResult = await turnstileResponse.json();

    if (!turnstileResult.success) {
      return res.status(400).send(
        '<div class="alert alert-danger" role="alert">Security check failed. Please try again.</div>'
      );
    }

    const { name, email, numberOfGuests, isAttending, dietary, morningWalk } =
      validatedData;

    const clientIp = getClientIp(req);

    let timestamp = new Date().toISOString();
    const logEntry = `Timestamp: ${timestamp}, Name: ${name}, Email: ${email}, Number of Guests: ${numberOfGuests}, Is Attending: ${isAttending}, Dietary Requirements: ${dietary}, Morning Walk: ${morningWalk}, IP: ${clientIp}`;
    console.log(logEntry);
    await saveRsvp(
      name,
      email,
      isAttending,
      numberOfGuests,
      dietary,
      morningWalk,
      clientIp
    );

    const pushbullet_devices = process.env.PUSHBULLET_DEVICE_IDS.split(',');
    const pushbullet = new Pushbullet(process.env.PUSHBULLET_API_KEY);
    pushbullet_devices.forEach(async (deviceId) => {
      await pushbullet.note(
        deviceId,
        'New RSVP',
        `Name: ${name}\nEmail: ${email}\nNumber of Guests: ${numberOfGuests}\nIs Attending: ${isAttending}\nDietary Requirements: ${dietary}\nMorning Walk: ${morningWalk}\n`
      );
    });

    const logFilePath = path.join(CONFIG.dirname, 'logs/rsvp.log');
    fs.appendFileSync(logFilePath, `${logEntry}\n`);

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
};

const saveRsvp = async (
  name,
  email,
  isAttending,
  numberOfGuests,
  dietary,
  morningWalk,
  clientIp
) => {
  try {
    if (numberOfGuests === undefined || numberOfGuests === '') {
      numberOfGuests = null;
    }
    if (dietary === undefined || dietary === '') {
      dietary = null;
    }
    if (morningWalk === undefined || morningWalk === '') {
      morningWalk = null;
    }
    await prisma.rsvp.create({
      data: {
        name,
        email,
        isAttending,
        numberOfGuests,
        dietary,
        morningWalk,
        clientIp,
      },
    });
  } catch (error) {
    console.error('Failed to save RSVP:', error);
  }
};
