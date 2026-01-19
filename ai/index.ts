import { google } from "@ai-sdk/google";
import { experimental_wrapLanguageModel as wrapLanguageModel } from "ai";

import { customMiddleware } from "./custom-middleware";

export const models = [
  {
    id: "gemini-3-flash-preview",
    label: "Gemini 3 Flash",
  },
  {
    id: "gemini-3-pro-preview",
    label: "Gemini 3 Pro",
  },
] as const;

export type ModelId = (typeof models)[number]["id"];

export const geminiProModel = wrapLanguageModel({
  model: google("gemini-3-pro-preview"),
  middleware: customMiddleware,
});

export const geminiFlashModel = wrapLanguageModel({
  model: google("gemini-3-flash-preview"),
  middleware: customMiddleware,
});

export const getModelById = (id: string) => {
  if (id === "gemini-3-pro-preview") {
    return geminiProModel;
  }
  return geminiFlashModel;
};
