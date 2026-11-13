import { z } from 'zod';

export const AVATAR_MAX_DATA_URL_LENGTH = 4 * 1024 * 1024;

export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message || 'Invalid form input.';
}

export const loginSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().optional(),
    pin: z
      .string({ message: 'Enter your four digit PIN.' })
      .trim()
      .regex(/^\d{4}$/, 'Enter your four digit PIN.'),
    deviceId: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    identifier: (data.identifier?.trim() || data.email?.trim() || ''),
  }))
  .refine((data) => data.identifier.length > 0, {
    message: 'Enter your member number or email address.',
    path: ['identifier'],
  });

export type LoginInput = z.infer<typeof loginSchema>;

export const activateSchema = z.object({
  code: z
    .string({ message: 'Enter your eight character activation code.' })
    .trim()
    .min(1, 'Enter your eight character activation code.')
    .transform((val) => val.toUpperCase()),
  pin: z
    .string({ message: 'PIN must be exactly four digits.' })
    .trim()
    .regex(/^\d{4}$/, 'PIN must be exactly four digits.'),
  privacyAccepted: z
    .boolean({ message: 'Accept the privacy notice before setting your PIN.' })
    .refine((val) => val === true, {
      message: 'Accept the privacy notice before setting your PIN.',
    }),
  email: z
    .string()
    .trim()
    .max(320, 'Email address is too long.')
    .refine((val) => val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val), {
      message: 'Enter a valid email address.',
    })
    .optional()
    .transform((val) => (val && val.length > 0 ? val.toLowerCase() : undefined)),
  fullName: z
    .string()
    .trim()
    .max(200, 'That name is too long. Use 200 characters or fewer.')
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  deviceId: z.string().trim().optional(),
});

export type ActivateInput = z.infer<typeof activateSchema>;

export const profileNameSchema = z.object({
  fullName: z
    .string({ message: 'Enter your first and last name.' })
    .trim()
    .min(2, 'Enter your first and last name.')
    .max(200, 'That name is too long. Use 200 characters or fewer.')
    .refine((val) => !/[\u0000-\u001f<>]/.test(val), {
      message: 'That name contains characters we cannot store.',
    })
    .refine((val) => val.split(/\s+/).filter(Boolean).length >= 2, {
      message: 'Enter both your first name and your last name.',
    })
    .refine(
      (val) => {
        const parts = val.split(/\s+/).filter(Boolean);
        const first = parts[0] || '';
        const last = parts.slice(1).join(' ');
        return first.length <= 100 && last.length <= 100;
      },
      {
        message: 'That name is too long for one of the name fields.',
      }
    ),
});

export type ProfileNameInput = z.infer<typeof profileNameSchema>;

export const avatarUploadSchema = z.object({
  dataUrl: z
    .string({ message: 'Choose a picture first.' })
    .min(1, 'Choose a picture first.')
    .max(
      AVATAR_MAX_DATA_URL_LENGTH,
      'That picture is larger than 2 MB. Choose a smaller one.'
    )
    .regex(
      /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/,
      'Use a JPEG, PNG or WebP picture.'
    ),
});

export type AvatarUploadInput = z.infer<typeof avatarUploadSchema>;
