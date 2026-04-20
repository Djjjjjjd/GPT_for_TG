import OpenAI from "openai";
import { config } from "./config.js";

const openai = new OpenAI({
  apiKey: config.openaiApiKey
});

export async function createAssistantReply(history) {
  const response = await openai.responses.create({
    model: config.openaiModel,
    instructions: config.systemPrompt,
    input: history.map((message) => ({
      role: message.role,
      content: message.content
    }))
  });

  return response.output_text?.trim() || "Не получилось сформировать ответ.";
}
