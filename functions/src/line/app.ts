import express, { Request, Response } from "express";

type Deps = {
  answerQuestion: (query: string) => Promise<string>;
  replyMessage: (replyToken: string, text: string) => Promise<void>;
  verifySignature: (rawBody: Buffer, signatureHeader: string | undefined) => boolean;
};

export function createApp(deps: Deps) {
  const app = express();

  // LINE signature verification requires raw body
  app.use(
    express.json({
      verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
        req.rawBody = Buffer.from(buf);
      },
    })
  );

  app.get("/line/webhook", (_req, res) => res.status(200).send("ok"));

  app.post("/line/webhook", async (req: Request & { rawBody?: Buffer }, res: Response): Promise<void> => {
    const signature = req.header("x-line-signature");
    const ok = deps.verifySignature(req.rawBody ?? Buffer.from(""), signature);
    if (!ok) {
      res.status(401).send("invalid signature");
      return;
    }

    const events = (req.body?.events ?? []) as any[];
    for (const ev of events) {
      if (ev.type === "message" && ev.message?.type === "text") {
        const text: string = ev.message.text;
        const answer = await deps.answerQuestion(text);
        await deps.replyMessage(ev.replyToken, answer);
      }
    }
    res.status(200).send("ok");
    return;
  });

  return app;
}


