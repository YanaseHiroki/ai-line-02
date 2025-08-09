import { Client } from '@line/bot-sdk';

export async function replyMessage({
  channelAccessToken,
  replyToken,
  text,
}: {
  channelAccessToken: string;
  replyToken: string;
  text: string;
}): Promise<void> {
  const client = new Client({ channelAccessToken });
  await client.replyMessage(replyToken, { type: 'text', text });
}


