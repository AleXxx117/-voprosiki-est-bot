export class TelegramApiError extends Error {
  constructor(method, response) {
    super(`Telegram API ${method}: ${response.description ?? "неизвестная ошибка"}`);
    this.name = "TelegramApiError";
    this.method = method;
    this.errorCode = response.error_code;
    this.parameters = response.parameters;
  }
}

export class TelegramApi {
  constructor(token) {
    this.baseUrl = `https://api.telegram.org/bot${token}`;
  }

  async call(method, payload = {}, timeoutMs = 45_000) {
    const response = await fetch(`${this.baseUrl}/${method}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new TelegramApiError(method, result);
    }
    return result.result;
  }

  getMe() {
    return this.call("getMe");
  }

  getChat(chatId) {
    return this.call("getChat", { chat_id: chatId });
  }

  deleteWebhook() {
    return this.call("deleteWebhook", { drop_pending_updates: false });
  }

  setMyCommands(commands) {
    return this.call("setMyCommands", { commands });
  }

  getUpdates(offset, timeout = 30) {
    return this.call(
      "getUpdates",
      {
        offset,
        timeout,
        allowed_updates: ["message", "callback_query", "channel_post"]
      },
      (timeout + 10) * 1000
    );
  }

  sendMessage(chatId, text, options = {}) {
    return this.call("sendMessage", {
      chat_id: chatId,
      text,
      ...options
    });
  }

  editMessageText(chatId, messageId, text, options = {}) {
    return this.call("editMessageText", {
      chat_id: chatId,
      message_id: messageId,
      text,
      ...options
    });
  }

  answerCallbackQuery(callbackQueryId, options = {}) {
    return this.call("answerCallbackQuery", {
      callback_query_id: callbackQueryId,
      ...options
    });
  }
}
