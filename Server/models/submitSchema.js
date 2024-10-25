const { z } = require('zod');

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

module.exports = submitSchema;
