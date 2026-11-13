import test from 'node:test';
import assert from 'node:assert/strict';

import { formatPinInput } from '../app/auth/view.ts';
import { loginSchema, activateSchema } from '../src/server/validation/schemas.ts';

test('formatPinInput trims whitespace and formats PIN to 4 digits', () => {
  assert.equal(formatPinInput(' 1234 '), '1234');
  assert.equal(formatPinInput('   9876   '), '9876');
  assert.equal(formatPinInput('\t4321\n'), '4321');
  assert.equal(formatPinInput('1 2 3 4'), '1234');
  assert.equal(formatPinInput(' 12-34 '), '1234');
  assert.equal(formatPinInput('12345'), '1234');
  assert.equal(formatPinInput(''), '');
});

test('server-side loginSchema trims PIN before validation', () => {
  const result = loginSchema.safeParse({
    identifier: '123456',
    pin: '  4321  ',
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.pin, '4321');
  }
});

test('server-side activateSchema trims PIN before validation', () => {
  const result = activateSchema.safeParse({
    code: 'ABCDEFGH',
    pin: '  8765  ',
    privacyAccepted: true,
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.pin, '8765');
  }
});
