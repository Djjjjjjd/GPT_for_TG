import express from "express";
import { config, telegramWebhookPath } from "./config.js";
import { handleTelegramUpdate } from "./bot.js";
import { getSessionCount } from "./sessionStore.js";

const app = express();

app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    sessions: getSessionCount()
  });
});

app.post(telegramWebhookPath, (req, res) => {
  try {
    if (config.telegramWebhookSecret) {
      const secretHeader = req.get("X-Telegram-Bot-Api-Secret-Token");

      if (secretHeader !== config.telegramWebhookSecret) {
        return res.sendStatus(403);
      }
    }

    handleTelegramUpdate(req.body).catch((error) => {
      console.error("Unhandled Telegram update error:", error);
    });

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.sendStatus(500);
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: "Not found"
  });
});

app.listen(config.port, () => {
  console.log(`Telegram GPT assistant bot is running on port ${config.port}`);
  console.log(`Webhook endpoint: ${config.baseUrl}${telegramWebhookPath}`);
});
