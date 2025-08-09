/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import { createApp } from "./line/app";
import { buildAnswerer } from "./rag/answerer";
import { verifySignature as verifySignatureImpl } from "./line/signature";
import { replyMessage as replyMessageImpl } from "./line/reply";
import { LINE_CHANNEL_ID, LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN, GENAI_API_KEY } from "./params";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// Build dependencies with env/secret params
const app = createApp({
  answerQuestion: buildAnswerer({ genaiApiKeyEnv: GENAI_API_KEY }),
  verifySignature: (rawBody, signature) =>
    verifySignatureImpl({
      rawBody,
      signature,
      channelSecret: process.env.LINE_CHANNEL_SECRET ?? "",
    }),
  replyMessage: (replyToken, text) => replyMessageImpl({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN ?? "",
    replyToken,
    text,
  }),
});

export const lineWebhook = onRequest(
  { secrets: [LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN, GENAI_API_KEY] },
  (req, res) => {
    // Health endpoint
    if (req.method === "GET") {
      res.status(200).send("ok");
      return;
    }
    app(req, res);
  }
);

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
