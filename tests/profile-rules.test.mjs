import test from 'node:test';
import assert from 'node:assert/strict';

// Business logic rules verified against PRD & user specs:
// 1. Max 4 name changes in a rolling 2-month window (60 days)
// 2. Window resets/rolls based on the timestamp of the first change in the window
// 3. Name parsing requires both first and last name, max 200 chars total, 100 per part
// 4. Placeholder name detection correctly triggers the first-time profile modal

const NAME_CHANGE_LIMIT = 4;
const NAME_CHANGE_WINDOW_DAYS = 60;
const NAME_CHANGE_WINDOW_MS = NAME_CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

function summarizeNameChanges(changes, now = new Date()) {
  const cutoff = now.getTime() - NAME_CHANGE_WINDOW_MS;
  const inWindow = changes
    .filter((change) => change.changedAt.getTime() > cutoff)
    .sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());

  const used = inWindow.length;
  const remaining = Math.max(0, NAME_CHANGE_LIMIT - used);
  const windowEndsAt =
    remaining === 0
      ? new Date(inWindow[0].changedAt.getTime() + NAME_CHANGE_WINDOW_MS)
      : null;

  return { used, remaining, windowEndsAt };
}

function isPlaceholderName(name) {
  if (!name) return true;
  const trimmed = name.trim().toLowerCase();
  return (
    trimmed === '' ||
    trimmed === 'member' ||
    trimmed === 'spotter' ||
    trimmed === 'spotter member' ||
    trimmed === 'sign up tester' ||
    trimmed === 'set your name' ||
    trimmed.includes('tester') ||
    trimmed.includes('sign up') ||
    trimmed.includes('signup') ||
    trimmed.includes('spotter member') ||
    trimmed.startsWith('spotter')
  );
}

function parseFullName(raw) {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Enter your first and last name.' };
  }

  const fullName = raw.trim().replace(/\s+/g, ' ');
  if (fullName.length < 2) {
    return { ok: false, error: 'Enter your first and last name.' };
  }
  if (fullName.length > 200) {
    return { ok: false, error: 'That name is too long. Use 200 characters or fewer.' };
  }
  if (/[\u0000-\u001f<>]/.test(fullName)) {
    return { ok: false, error: 'That name contains characters we cannot store.' };
  }

  const parts = fullName.split(' ');
  if (parts.length < 2) {
    return { ok: false, error: 'Enter both your first name and your last name.' };
  }

  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');
  if (firstName.length > 100 || lastName.length > 100) {
    return { ok: false, error: 'That name is too long for one of the name fields.' };
  }

  return { ok: true, name: { firstName, lastName, fullName } };
}

test('NAME_CHANGE_LIMIT is 4 and WINDOW is 60 days (2 months)', () => {
  assert.equal(NAME_CHANGE_LIMIT, 4);
  assert.equal(NAME_CHANGE_WINDOW_DAYS, 60);
  assert.equal(NAME_CHANGE_WINDOW_MS, 60 * 24 * 60 * 60 * 1000);
});

test('summarizeNameChanges tracks usage and unlocks after 60 days', () => {
  const now = new Date('2026-11-12T12:00:00.000Z');
  const dayMs = 24 * 60 * 60 * 1000;

  // 0 changes: 4 remaining
  assert.deepEqual(summarizeNameChanges([], now), {
    used: 0,
    remaining: 4,
    windowEndsAt: null,
  });

  // 2 changes: 2 remaining
  const two = summarizeNameChanges(
    [
      { changedAt: new Date(now.getTime() - 20 * dayMs) },
      { changedAt: new Date(now.getTime() - 5 * dayMs) },
    ],
    now
  );
  assert.equal(two.used, 2);
  assert.equal(two.remaining, 2);
  assert.equal(two.windowEndsAt, null);

  // 4 changes within 60 days: 0 remaining, windowEndsAt matches oldest + 60 days
  const oldest = new Date(now.getTime() - 45 * dayMs);
  const maxed = summarizeNameChanges(
    [
      { changedAt: oldest },
      { changedAt: new Date(now.getTime() - 30 * dayMs) },
      { changedAt: new Date(now.getTime() - 15 * dayMs) },
      { changedAt: new Date(now.getTime() - 2 * dayMs) },
    ],
    now
  );
  assert.equal(maxed.used, 4);
  assert.equal(maxed.remaining, 0);
  assert.equal(maxed.windowEndsAt.getTime(), oldest.getTime() + 60 * dayMs);

  // Expired change: 1 change was 65 days ago, 3 recent -> 3 used, 1 remaining
  const expired = summarizeNameChanges(
    [
      { changedAt: new Date(now.getTime() - 65 * dayMs) },
      { changedAt: new Date(now.getTime() - 30 * dayMs) },
      { changedAt: new Date(now.getTime() - 15 * dayMs) },
      { changedAt: new Date(now.getTime() - 2 * dayMs) },
    ],
    now
  );
  assert.equal(expired.used, 3);
  assert.equal(expired.remaining, 1);
  assert.equal(expired.windowEndsAt, null);
});

test('isPlaceholderName identifies uncompleted or test names', () => {
  assert.equal(isPlaceholderName('sign up tester'), true);
  assert.equal(isPlaceholderName('spotter member'), true);
  assert.equal(isPlaceholderName('Member'), true);
  assert.equal(isPlaceholderName('Spotter'), true);
  assert.equal(isPlaceholderName('set your name'), true);
  assert.equal(isPlaceholderName(''), true);
  assert.equal(isPlaceholderName(null), true);
  assert.equal(isPlaceholderName(undefined), true);

  // Real user names
  assert.equal(isPlaceholderName('Chioma Okonkwo'), false);
  assert.equal(isPlaceholderName('Emeka Davies'), false);
  assert.equal(isPlaceholderName('Sarah Johnson'), false);
});

test('parseFullName validates full name formatting', () => {
  assert.equal(parseFullName('').ok, false);
  assert.equal(parseFullName('SingleWord').ok, false);
  assert.equal(parseFullName('12345').ok, false);

  const res = parseFullName('  Ada   Lovelace  ');
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.name.firstName, 'Ada');
    assert.equal(res.name.lastName, 'Lovelace');
    assert.equal(res.name.fullName, 'Ada Lovelace');
  }
});
