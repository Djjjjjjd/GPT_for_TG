import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envPath = path.join(projectRoot, ".env");
const dotenvResult = dotenv.config({ path: envPath });

const requiredEnv = ["TELEGRAM_BOT_TOKEN", "OPENAI_API_KEY", "BASE_URL"];

function getLoadedEnvKeys() {
  if (!fs.existsSync(envPath)) {
    return [];
  }

  return fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => line.split("=", 1)[0]);
}

for (const envName of requiredEnv) {
  if (!process.env[envName]) {
    throw new Error(
      [
        `Missing required environment variable: ${envName}`,
        `cwd: ${process.cwd()}`,
        `env path: ${envPath}`,
        `env file exists: ${fs.existsSync(envPath)}`,
        `dotenv error: ${dotenvResult.error?.message || "none"}`,
        `env keys found: ${getLoadedEnvKeys().join(", ") || "none"}`
      ].join("\n")
    );
  }
}

function loadSystemPrompt() {
  const promptFile = process.env.SYSTEM_PROMPT_FILE;

  if (promptFile) {
    const absolutePromptPath = path.resolve(projectRoot, promptFile);

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
