import { config } from "./config.js";

const sessions = new Map();

function trimHistory(history) {
  return history.slice(-config.historyLimit);
}

export function getHistory(chatId) {
  return sessions.get(String(chatId)) || [];
}

export function addMessage(chatId, role, content) {
  const key = String(chatId);
  const history = getHistory(key);

  history.push({ role, content });
  sessions.set(key, trimHistory(history));
}

export function resetHistory(chatId) {
  sessions.delete(String(chatId));
}

export function getSessionCount() {
  return sessions.size;
}
