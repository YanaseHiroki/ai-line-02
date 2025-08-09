import { defineSecret, defineString } from "firebase-functions/params";

export const LINE_CHANNEL_ID = defineString("LINE_CHANNEL_ID");
export const LINE_CHANNEL_SECRET = defineSecret("LINE_CHANNEL_SECRET");
export const LINE_CHANNEL_ACCESS_TOKEN = defineSecret("LINE_CHANNEL_ACCESS_TOKEN");
export const GENAI_API_KEY = defineSecret("GENAI_API_KEY");


