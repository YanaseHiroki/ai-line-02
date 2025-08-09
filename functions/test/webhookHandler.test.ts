import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/line/app';

describe('LINE webhook', () => {
  it('テキストメッセージに対して回答を生成し reply API を呼ぶ', async () => {
    const mockAnswer = vi.fn().mockResolvedValue('営業時間は9:00-18:00です。');
    const mockReply = vi.fn().mockResolvedValue(undefined);
    const mockVerify = vi.fn().mockReturnValue(true);

    const app = createApp({
      answerQuestion: mockAnswer,
      replyMessage: mockReply,
      verifySignature: (_, __) => mockVerify(),
    });

    const body = {
      events: [
        {
          type: 'message',
          message: { type: 'text', text: '営業時間は？' },
          replyToken: 'REPLY_TOKEN',
        },
      ],
    };

    await request(app)
      .post('/line/webhook')
      .set('x-line-signature', 'valid')
      .send(body)
      .expect(200);

    expect(mockVerify).toHaveBeenCalled();
    expect(mockAnswer).toHaveBeenCalledWith('営業時間は？');
    expect(mockReply).toHaveBeenCalledWith('REPLY_TOKEN', '営業時間は9:00-18:00です。');
  });
});


