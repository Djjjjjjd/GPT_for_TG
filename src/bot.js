import { config } from "./config.js";
import { createAssistantReply } from "./openai.js";
import { addMessage, getHistory, resetHistory } from "./sessionStore.js";

const telegramApiBaseUrl = `https://api.telegram.org/bot${config.telegramBotToken}`;

function splitTelegramMessage(text) {
  const maxLength = 4000;
  const chunks = [];

  for (let start = 0; start < text.length; start += maxLength) {
    chunks.push(text.slice(start, start + maxLength));
  }

  return chunks;
}

async function callTelegramApi(method, payload) {
  const response = await fetch(`${telegramApiBaseUrl}/${method}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.ok === false) {
    throw new Error(
      `Telegram API ${method} failed: ${response.status} ${JSON.stringify(data)}`
    );
  }

  return data;
}

async function sendSafeMessage(chatId, text) {
  try {
    for (const messagePart of splitTelegramMessage(text)) {
      await callTelegramApi("sendMessage", {
        chat_id: chatId,
        text: messagePart
      });
    }
  } catch (error) {
    console.error("Telegram sendMessage error:", error);
  }
}

async function sendChatAction(chatId, action) {
  try {
    await callTelegramApi("sendChatAction", {
      chat_id: chatId,
      action
    });
  } catch (error) {
    console.error("Telegram sendChatAction error:", error);
  }
}

export async function handleTelegramUpdate(update) {
  const message = update.message;

  if (!message) {
    return;
  }

  const chatId = message.chat.id;
  const text = message.text?.trim();

  if (text === "/start") {
    await sendSafeMessage(
      chatId,
      "Hi! Send me a text message, and I will answer as a GPT assistant."
    );
    return;
  }

  if (text === "/reset") {
    resetHistory(chatId);
    await sendSafeMessage(chatId, "Dialog history has been cleared.");
    return;
  }

  if (!text) {
    await sendSafeMessage(
      chatId,
      "For now I can only reply to text messages. Please send your question as text."
    );
    return;
  }

  try {
    // Telegram shows the user that the bot is working on the answer.
    await sendChatAction(chatId, "typing");

    addMessage(chatId, "user", text);
    const history = getHistory(chatId);
    const assistantReply = await createAssistantReply(history);

    addMessage(chatId, "assistant", assistantReply);
    await sendSafeMessage(chatId, assistantReply);
  } catch (error) {
    console.error("OpenAI or bot handler error:", error);
    await sendSafeMessage(
      chatId,
      "Sorry, I could not get an answer right now. Please try again a bit later."
    );
  }
}
