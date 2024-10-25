import { z } from 'zod';

const createBooleanField = (errorMessage) =>
  z
    .enum(['true', 'false'], {
      errorMap: () => ({ message: errorMessage }),
    })
    .transform((val) => val === 'true');

const submitSchema = z
  .object({
    name: z.string().min(1, { message: 'Please enter your name.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    isAttending: createBooleanField('Please indicate if you are attending.'),
    numberOfGuests: z.coerce
      .number({ invalid_type_error: 'Please enter a valid number of guests.' })
      .min(1, { message: 'At least 1 guest is required.' })
      .or(z.literal('')),
    dietary: z
      .string()
      .trim()
      .transform((val) => (val === '' ? undefined : val))
      .optional(),
    morningWalk: createBooleanField(
      'Please indicate if you are joining us for a walk the day after.'
    ).or(z.literal('')),
  })
  .superRefine((data, ctx) => {
    if (data.isAttending) {
      if (
        data.numberOfGuests === undefined ||
        Number.isNaN(data.numberOfGuests) ||
        data.numberOfGuests === ''
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

export default submitSchema;
