import submitSchema from '../models/submitSchema.js';
import { ZodError } from 'zod';
import getClientIp from '../utils/network.js';

export const handleFormSubmission = async (req, res) => {
  try {
    const validatedData = submitSchema.parse(req.body);

    const { name, email, numberOfGuests, isAttending, dietary, morningWalk } =
      validatedData;

    const clientIp = getClientIp(req);

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
};
