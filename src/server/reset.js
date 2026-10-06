import { randomBytes, timingSafeEqual } from 'node:crypto';

export function createResetGuard() {
  let currentToken = null;

  return {
    issueToken() {
      currentToken = randomBytes(32).toString('hex');
      return currentToken;
    },
    assertToken(candidate) {
      if (typeof candidate !== 'string' || !currentToken) {
        throw new Error('invalid reset token');
      }
      const expected = Buffer.from(currentToken);
      const actual = Buffer.from(candidate);
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
        throw new Error('invalid reset token');
      }
    },
  };
}
