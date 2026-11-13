import test from 'node:test';
import assert from 'node:assert/strict';

import { formatEmailInput, formatIdentifierInput } from '../app/auth/view.ts';

test('formatEmailInput normalizes mixed-case and uppercase emails to lowercase', () => {
  // Uppercase domain and local part
  assert.equal(formatEmailInput('CHIOMA@GMAIL.COM'), 'chioma@gmail.com');

  // Mixed case with spaces
  assert.equal(formatEmailInput(' Chioma.Okonkwo@SpotterGym.COM '), 'chioma.okonkwo@spottergym.com');

  // Mobile keyboard initial caps
  assert.equal(formatEmailInput('John.Doe@Example.com'), 'john.doe@example.com');

  // All whitespace stripped
  assert.equal(formatEmailInput(' user @ domain . com '), 'user@domain.com');
});

test('formatIdentifierInput only lowercases when an @ symbol is present', () => {
  // 6-digit numeric member number is untouched
  assert.equal(formatIdentifierInput('123456'), '123456');
  assert.equal(formatIdentifierInput(' 123456 '), '123456 ');

  // Email format is normalized to lowercase
  assert.equal(formatIdentifierInput('User@Example.COM'), 'user@example.com');
});
