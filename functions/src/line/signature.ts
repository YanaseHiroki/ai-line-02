import crypto from 'crypto';

export function verifySignature({
  rawBody,
  signature,
  channelSecret,
}: {
  rawBody: Buffer;
  signature: string;
  channelSecret: string;
}): boolean {
  if (!channelSecret || !signature) return false;
  const hmac = crypto.createHmac('sha256', channelSecret);
  hmac.update(rawBody);
  const expected = hmac.digest('base64');
  return expected === signature;
}


