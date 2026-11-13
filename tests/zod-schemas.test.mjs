import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

import {
  loginSchema,
  activateSchema,
  profileNameSchema,
  avatarUploadSchema,
  formatZodError,
} from '../src/server/validation/schemas.ts';

test('loginSchema validates identifier and 4-digit PIN', () => {
  // Empty identifier
  const emptyId = loginSchema.safeParse({ identifier: '', pin: '1234' });
  assert.equal(emptyId.success, false);
  if (!emptyId.success) {
    assert.equal(formatZodError(emptyId.error), 'Enter your member number or email address.');
  }

  // Invalid PIN (not 4 digits)
  const invalidPin = loginSchema.safeParse({ identifier: '123456', pin: '12a' });
  assert.equal(invalidPin.success, false);
  if (!invalidPin.success) {
    assert.equal(formatZodError(invalidPin.error), 'Enter your four digit PIN.');
  }

  // Valid with identifier
  const valid = loginSchema.safeParse({ identifier: ' 123456 ', pin: '1234' });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.identifier, '123456');
    assert.equal(valid.data.pin, '1234');
  }

  // Valid with legacy email fallback
  const validEmail = loginSchema.safeParse({ email: ' user@example.com ', pin: '5678' });
  assert.equal(validEmail.success, true);
  if (validEmail.success) {
    assert.equal(validEmail.data.identifier, 'user@example.com');
  }
});

test('activateSchema validates code, 4-digit PIN, and privacy acceptance', () => {
  // Missing privacy acceptance
  const noPrivacy = activateSchema.safeParse({
    code: 'ABCDEFGH',
    pin: '1234',
    privacyAccepted: false,
  });
  assert.equal(noPrivacy.success, false);
  if (!noPrivacy.success) {
    assert.equal(formatZodError(noPrivacy.error), 'Accept the privacy notice before setting your PIN.');
  }

  // Invalid PIN
  const badPin = activateSchema.safeParse({
    code: 'ABCDEFGH',
    pin: '123',
    privacyAccepted: true,
  });
  assert.equal(badPin.success, false);
  if (!badPin.success) {
    assert.equal(formatZodError(badPin.error), 'PIN must be exactly four digits.');
  }

  // Valid full payload
  const valid = activateSchema.safeParse({
    code: 'abcdefgh',
    pin: '9876',
    privacyAccepted: true,
    email: 'Member@Example.Com',
    fullName: 'Chioma Okonkwo',
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.code, 'ABCDEFGH');
    assert.equal(valid.data.pin, '9876');
    assert.equal(valid.data.email, 'member@example.com');
    assert.equal(valid.data.fullName, 'Chioma Okonkwo');
  }
});

test('profileNameSchema enforces 2-part full names and length boundaries', () => {
  // Single word
  const single = profileNameSchema.safeParse({ fullName: 'Chioma' });
  assert.equal(single.success, false);
  if (!single.success) {
    assert.equal(formatZodError(single.error), 'Enter both your first name and your last name.');
  }

  // Control characters / HTML tags
  const tags = profileNameSchema.safeParse({ fullName: '<script>alert(1)</script> User' });
  assert.equal(tags.success, false);
  if (!tags.success) {
    assert.equal(formatZodError(tags.error), 'That name contains characters we cannot store.');
  }

  // Valid name
  const valid = profileNameSchema.safeParse({ fullName: '  Emeka   Onyebuchi  ' });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.fullName, 'Emeka   Onyebuchi');
  }
});

test('avatarUploadSchema validates data URL and MIME format', () => {
  // Missing dataUrl
  const empty = avatarUploadSchema.safeParse({ dataUrl: '' });
  assert.equal(empty.success, false);
  if (!empty.success) {
    assert.equal(formatZodError(empty.error), 'Choose a picture first.');
  }

  // Unsupported MIME type
  const badMime = avatarUploadSchema.safeParse({
    dataUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  });
  assert.equal(badMime.success, false);
  if (!badMime.success) {
    assert.equal(formatZodError(badMime.error), 'Use a JPEG, PNG or WebP picture.');
  }

  // Valid JPEG data URL
  const valid = avatarUploadSchema.safeParse({
    dataUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
  });
  assert.equal(valid.success, true);
});
