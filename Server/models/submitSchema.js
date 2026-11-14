import { z } from 'zod';

const createBooleanField = (errorMessage) =>
  z
    .enum(['true', 'false'], { error: errorMessage })
    .transform((val) => val === 'true');

const walkMessage =
  'Please indicate if you are joining us for a walk the day after.';

const submitSchema = z
  .object({
    name: z
      .string({ error: 'Please enter your name.' })
      .min(1, { message: 'Please enter your name.' }),
    email: z
      .string({ error: 'Please enter a valid email address.' })
      .email({ message: 'Please enter a valid email address.' }),
    isAttending: createBooleanField('Please indicate if you are attending.'),
    numberOfGuests: z.coerce
      .number({ error: 'Please enter a valid number of guests.' })
      .min(1, { message: 'At least 1 guest is required.' })
      .or(z.literal('')),
    dietary: z
      .string()
      .trim()
      .transform((val) => (val === '' ? undefined : val))
      .optional(),
    // zod 4 reports a failed union as "Invalid input", so the message goes on the union
    morningWalk: z.union([createBooleanField(walkMessage), z.literal('')], {
      error: walkMessage,
    }),
  })
  .superRefine((data, ctx) => {
    if (data.isAttending) {
      if (
        data.numberOfGuests === undefined ||
        Number.isNaN(data.numberOfGuests) ||
        data.numberOfGuests === ''
      ) {
        ctx.addIssue({
          code: 'custom',
          message: 'Please enter the number of guests.',
          path: ['numberOfGuests'],
        });
      }
      if (data.morningWalk === undefined || data.morningWalk === '') {
        ctx.addIssue({
          code: 'custom',
          message: walkMessage,
          path: ['morningWalk'],
        });
      }
    }
  });

export default submitSchema;
