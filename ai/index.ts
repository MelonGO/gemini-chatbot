import { createGoogleGenerativeAI } from '@ai-sdk/google';

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

export const getGoogleProvider = (apiKey: string, baseUrl?: string) => {
  return createGoogleGenerativeAI({
    apiKey,
    baseURL: baseUrl,
    fetch: (input, init) => {
      return fetch(input, init);
    }
  });
};

export const getModelById = (modelId: string) => {
  switch (modelId) {
    case "gemini-3-flash-preview":
      return getGoogleProvider(process.env.GOOGLE_API_KEY!, process.env.GOOGLE_BASE_URL!).languageModel("gemini-3-flash-preview");
    case "gemini-3-pro-preview":
      return getGoogleProvider(process.env.GOOGLE_API_KEY!, process.env.GOOGLE_BASE_URL!).languageModel("gemini-3-pro-preview");
    default:
      throw new Error("Invalid model ID");
  }
};
