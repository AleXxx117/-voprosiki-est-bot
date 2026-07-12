import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { VoprosikiBot } from "../src/bot.js";
import { getQuizItem } from "../src/quiz-bank.js";
import { JsonStore } from "../src/store.js";

class FakeApi {
  constructor() {
    this.messages = [];
    this.edits = [];
    this.nextMessageId = 1;
  }

  async getMe() {
    return { id: 999, username: "voprosiki_test_bot" };
  }

  async deleteWebhook() {}

  async setMyCommands() {}

  async sendMessage(chatId, text, options = {}) {
    const message = {
      message_id: this.nextMessageId++,
      chat: { id: chatId },
      text,
      options
    };
    this.messages.push(message);
    return message;
  }

  async editMessageText(chatId, messageId, text, options = {}) {
    this.edits.push({ chatId, messageId, text, options });
    return { message_id: messageId, text };
  }
}

async function createBot(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "voprosiki-bot-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const store = await new JsonStore(path.join(directory, "state.json"), {
    autopostTimes: ["10:00"],
    timezone: "Europe/Kyiv"
  }).init();
  const api = new FakeApi();
  const bot = await new VoprosikiBot(api, store, {
    adminIds: new Set(),
    roundStepSeconds: 300
  }).init();
  t.after(() => bot.stop());
  return { bot, store, api };
}

test("меню запускает игру на выбранное число раундов", async (t) => {
  const { bot, store, api } = await createBot(t);
  const chat = { id: 101, type: "private" };
  const user = { id: 7, first_name: "Саша", is_bot: false };

  await bot.startGame(chat, user, "psychology", 5);
  const session = store.getSession(chat.id);

  assert.equal(session.totalRounds, 5);
  assert.equal(session.categoryKey, "psychology");
  assert.equal(session.roundNumber, 1);
  assert.ok(getQuizItem(session.current.itemId));
  assert.match(api.messages.at(-1).text, /Раунд 1 из 5/);
  assert.match(api.messages.at(-1).text, /Стоп игра|Пиши ответ/);
});

test("правильный ответ начисляет очки и завершает текущий раунд", async (t) => {
  const { bot, store, api } = await createBot(t);
  const chat = { id: 102, type: "private" };
  const user = { id: 8, first_name: "Игрок", is_bot: false };
  await bot.startGame(chat, user, "nature", 5);
  const session = store.getSession(chat.id);
  const item = getQuizItem(session.current.itemId);

  await bot.tryGameAnswer({ chat, from: user }, item.answer.toUpperCase());

  assert.equal(store.getUserStats(user.id).points, 5);
  assert.equal(store.getSession(chat.id).scores[String(user.id)].correct, 1);
  assert.match(api.messages.at(-1).text, /Правильно/);
});

test("бот сначала даёт две подсказки, а затем открывает букву", async (t) => {
  const { bot, store, api } = await createBot(t);
  const chat = { id: 103, type: "private" };
  const user = { id: 9, first_name: "Игрок", is_bot: false };
  await bot.startGame(chat, user, "love", 5);
  bot.clearRoundTimer(chat.id);

  let session = store.getSession(chat.id);
  await bot.advanceClue(chat.id, session.id, session.roundNumber);
  bot.clearRoundTimer(chat.id);
  session = store.getSession(chat.id);
  assert.equal(session.current.stage, 1);
  assert.match(api.edits.at(-1).text, /Подсказка 1/);

  await bot.advanceClue(chat.id, session.id, session.roundNumber);
  bot.clearRoundTimer(chat.id);
  session = store.getSession(chat.id);
  assert.equal(session.current.stage, 2);
  assert.match(api.edits.at(-1).text, /Подсказка 2/);

  await bot.advanceClue(chat.id, session.id, session.roundNumber);
  bot.clearRoundTimer(chat.id);
  session = store.getSession(chat.id);
  assert.equal(session.current.revealedIndices.length, 1);
  assert.match(api.edits.at(-1).text, /Открыто букв. 1/);
});
