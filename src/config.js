import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

dotenv.config();

const requiredEnv = ["TELEGRAM_BOT_TOKEN", "OPENAI_API_KEY", "BASE_URL"];

for (const envName of requiredEnv) {
  if (!process.env[envName]) {
    throw new Error(`Missing required environment variable: ${envName}`);
  }
}

function loadSystemPrompt() {
  const promptFile = process.env.SYSTEM_PROMPT_FILE;

  if (promptFile) {
    const absolutePromptPath = path.resolve(process.cwd(), promptFile);

    if (!fs.existsSync(absolutePromptPath)) {
      throw new Error(`SYSTEM_PROMPT_FILE does not exist: ${absolutePromptPath}`);
    }

    const filePrompt = fs.readFileSync(absolutePromptPath, "utf8").trim();

    if (filePrompt) {
      return filePrompt;
    }
  }

  return (
    process.env.SYSTEM_PROMPT ||
    "You are a helpful Telegram assistant. Answer clearly, briefly, and politely."
  );
}

export const config = {
  port: Number(process.env.PORT || 3000),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || "",
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL || "gpt-5.4",
  baseUrl: process.env.BASE_URL.replace(/\/$/, ""),
  systemPrompt: loadSystemPrompt(),
  historyLimit: Number(process.env.HISTORY_LIMIT || 20)
};

export const telegramWebhookPath = "/telegram/webhook";
