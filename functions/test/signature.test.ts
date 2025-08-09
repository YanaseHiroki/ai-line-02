import { describe, it, expect } from 'vitest';
import { verifySignature } from '../src/line/signature';
import crypto from 'crypto';

describe('verifySignature', () => {
  it('正しい署名は true', () => {
    const secret = 'test_secret';
    const rawBody = Buffer.from('{"a":1}');
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('base64');
    expect(
      verifySignature({ rawBody, signature: expected, channelSecret: secret })
    ).toBe(true);
  });
});


