import { randomInt } from "node:crypto";

import { parseTimeList } from "./config.js";
import {
  categories,
  formatQuestionCount,
  getCategory,
  questionFromId,
  randomQuestion
} from "./question-engine.js";
import {
  getQuizItem,
  isCorrectAnswer,
  letterIndices,
  randomQuizItem
} from "./quiz-bank.js";
import { findDueSlot } from "./time.js";
import {
  categoryKeyboard,
  escapeHtml,
  gameKeyboard,
  gameQuestionText,
  mainMenuKeyboard,
  openQuestionKeyboard,
  roundsKeyboard,
  welcomeText
} from "./ui.js";

const COMMANDS = [
  { command: "start", description: "Открыть главное меню" },
  { command: "game", description: "Начать игру" },
  { command: "stopgame", description: "Остановить текущую игру" },
  { command: "question", description: "Получить вопрос без правильного ответа" },
  { command: "stats", description: "Моя статистика" },
  { command: "top", description: "Рейтинг игроков" },
  { command: "rules", description: "Правила игры" },
  { command: "id", description: "Показать Telegram ID" },
  { command: "help", description: "Все команды" }
];

const ROUND_OPTIONS = new Set([5, 10, 15, 20, 30]);

function commandParts(text = "") {
  if (!text.startsWith("/")) {
    return null;
  }
  const [rawCommand, ...args] = text.trim().split(/\s+/);
  const command = rawCommand.slice(1).split("@")[0].toLowerCase();
  return { command, args };
}

function displayName(user) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ")
    || user.username
    || `Игрок ${user.id}`;
}

function sleepTimer(callback, milliseconds) {
  const timer = setTimeout(callback, milliseconds);
  timer.unref?.();
  return timer;
}

function formatCategoryTitle(categoryKey) {
  if (categoryKey === "all") {
    return "Все темы";
  }
  const category = getCategory(categoryKey);
  return category ? `${category.emoji} ${category.title}` : "Все темы";
}

function resolveCategory(value, fallback = "all") {
  if (!value) {
    return fallback;
  }
  const normalized = value.toLowerCase();
  if (normalized === "all" || normalized === "все") {
    return "all";
  }
  if (getCategory(normalized)) {
    return normalized;
  }
  return fallback;
}

function scoreForStage(current) {
  let basePoints;
  if (current.stage === 0) {
    basePoints = 5;
  } else if (current.stage === 1) {
    basePoints = 4;
  } else if (current.stage === 2) {
    basePoints = 3;
  } else {
    basePoints = current.revealedIndices.length <= 1 ? 2 : 1;
  }

  const difficultyBonus = current.difficulty === "expert"
    ? 2
    : current.difficulty === "hard" ? 1 : 0;
  return basePoints + difficultyBonus;
}

export class VoprosikiBot {
  constructor(api, store, config) {
    this.api = api;
    this.store = store;
    this.config = config;
    this.me = null;
    this.running = false;
    this.offset = 0;
    this.scheduler = null;
    this.roundTimers = new Map();
    this.chatQueues = new Map();
  }

  async init() {
    this.me = await this.api.getMe();
    await this.api.deleteWebhook();
    await this.api.setMyCommands(COMMANDS);
    for (const { key, session } of this.store.listSessions()) {
      if (session?.type === "quiz" && session.current && !session.current.resolved) {
        this.scheduleClue(key, session.id, session.roundNumber);
      }
    }
    return this;
  }

  async run() {
    this.running = true;
    this.scheduler = setInterval(() => {
      this.checkAutopost().catch((error) => this.logError("автопубликация", error));
    }, 15_000);
    this.scheduler.unref?.();

    console.log(`Бот @${this.me.username} запущен.`);
    console.log(`Доступно вопросов: ${formatQuestionCount()}.`);

    while (this.running) {
      try {
        const updates = await this.api.getUpdates(this.offset, 30);
        for (const update of updates) {
          this.offset = update.update_id + 1;
          try {
            await this.handleUpdate(update);
          } catch (error) {
            this.logError(`обновление ${update.update_id}`, error);
          }
        }
      } catch (error) {
        if (!this.running) {
          break;
        }
        this.logError("получение обновлений", error);
        await new Promise((resolve) => setTimeout(resolve, 2_000));
      }
    }
  }

  stop() {
    this.running = false;
    clearInterval(this.scheduler);
    for (const timer of this.roundTimers.values()) {
      clearTimeout(timer);
    }
    this.roundTimers.clear();
  }

  logError(context, error) {
    console.error(`[${context}] ${error?.message ?? error}`);
  }

  withChatLock(chatId, task) {
    const key = String(chatId);
    const previous = this.chatQueues.get(key) ?? Promise.resolve();
    const operation = previous.then(task, task);
    const queued = operation.catch(() => undefined);
    this.chatQueues.set(key, queued);
    return operation.finally(() => {
      if (this.chatQueues.get(key) === queued) {
        this.chatQueues.delete(key);
      }
    });
  }

  async handleUpdate(update) {
    if (update.callback_query) {
      await this.handleCallback(update.callback_query);
      return;
    }
    if (update.channel_post) {
      await this.handleChannelPost(update.channel_post);
      return;
    }
    if (update.message) {
      await this.handleMessage(update.message);
    }
  }

  async handleChannelPost(message) {
    const parsed = commandParts(message.text);
    if (!parsed) {
      return;
    }

    if (parsed.command === "bind" || parsed.command === "channelid") {
      await this.store.updateSettings({ channelId: message.chat.id });
      await this.api.sendMessage(
        message.chat.id,
        "Канал привязан к игре «Вопросики есть». Теперь автопубликации можно включить командой /autopost_on в личном чате с ботом."
      );
    }
  }

  async handleMessage(message) {
    if (!message.from || message.from.is_bot) {
      return;
    }

    const parsed = commandParts(message.text);
    if (parsed) {
      await this.handleCommand(message, parsed.command, parsed.args);
      return;
    }

    const session = this.store.getSession(message.chat.id);
    if (session?.type === "quiz" && session.current) {
      const candidate = message.text ?? message.caption ?? "";
      if (candidate) {
        await this.withChatLock(message.chat.id, () => this.tryGameAnswer(message, candidate));
      }
    }
  }

  async handleCommand(message, command, args) {
    const chat = message.chat;
    switch (command) {
      case "start": {
        const payload = args[0] ?? "";
        if (payload.startsWith("q_")) {
          const question = questionFromId(payload.slice(2));
          if (question) {
            await this.sendOpenQuestion(chat, question.categoryKey, question);
            return;
          }
        }
        await this.sendWelcome(chat.id);
        return;
      }
      case "game":
        await this.showGameCategories(chat);
        return;
      case "stopgame":
        await this.withChatLock(chat.id, () => this.stopGame(chat.id, message.from));
        return;
      case "question":
        await this.sendOpenQuestion(chat, resolveCategory(args[0]));
        return;
      case "stats":
        await this.sendStats(chat.id, message.from);
        return;
      case "top":
        await this.sendTop(chat);
        return;
      case "rules":
        await this.sendRules(chat.id);
        return;
      case "id":
        await this.api.sendMessage(
          chat.id,
          `Твой Telegram ID. <code>${message.from.id}</code>\nID этого чата. <code>${chat.id}</code>`,
          { parse_mode: "HTML" }
        );
        return;
      case "help":
        await this.sendHelp(chat.id);
        return;
      case "setchannel":
        await this.adminSetChannel(message, args);
        return;
      case "publish":
        await this.adminPublish(message, args);
        return;
      case "settimes":
        await this.adminSetTimes(message, args);
        return;
      case "autopost_on":
        await this.adminToggleAutopost(message, true);
        return;
      case "autopost_off":
        await this.adminToggleAutopost(message, false);
        return;
      case "status":
        await this.adminStatus(message);
        return;
      default:
        await this.api.sendMessage(chat.id, "Такой команды пока нет. Открой /help.");
    }
  }

  async handleCallback(query) {
    const data = query.data ?? "";
    const message = query.message;
    if (!message) {
      await this.api.answerCallbackQuery(query.id);
      return;
    }

    try {
      if (data === "menu") {
        await this.api.answerCallbackQuery(query.id);
        await this.sendWelcome(message.chat.id);
        return;
      }
      if (data === "game:start") {
        await this.api.answerCallbackQuery(query.id);
        await this.showGameCategories(message.chat);
        return;
      }
      if (data.startsWith("gamecat:")) {
        const categoryKey = resolveCategory(data.split(":")[1]);
        await this.api.answerCallbackQuery(query.id);
        await this.showRoundChoice(message.chat.id, categoryKey);
        return;
      }
      if (data.startsWith("rounds:")) {
        const [, categoryValue, roundValue] = data.split(":");
        const categoryKey = resolveCategory(categoryValue);
        const totalRounds = Number(roundValue);
        await this.api.answerCallbackQuery(query.id, { text: "Игра начинается" });
        if (!ROUND_OPTIONS.has(totalRounds)) {
          return;
        }
        await this.withChatLock(message.chat.id, () =>
          this.startGame(message.chat, query.from, categoryKey, totalRounds)
        );
        return;
      }
      if (data === "game:skip") {
        await this.api.answerCallbackQuery(query.id);
        await this.withChatLock(message.chat.id, () => this.skipRound(message.chat.id, query.from));
        return;
      }
      if (data === "game:stop") {
        await this.api.answerCallbackQuery(query.id);
        await this.withChatLock(message.chat.id, () => this.stopGame(message.chat.id, query.from));
        return;
      }
      if (data === "open:categories") {
        await this.api.answerCallbackQuery(query.id);
        await this.api.sendMessage(message.chat.id, "Выбери тему вопроса.", {
          reply_markup: categoryKeyboard("opencat")
        });
        return;
      }
      if (data.startsWith("opencat:")) {
        const categoryKey = resolveCategory(data.split(":")[1]);
        await this.api.answerCallbackQuery(query.id);
        await this.sendOpenQuestion(message.chat, categoryKey);
        return;
      }
      if (data.startsWith("open:next:")) {
        const categoryKey = resolveCategory(data.split(":")[2]);
        await this.api.answerCallbackQuery(query.id);
        await this.sendOpenQuestion(message.chat, categoryKey);
        return;
      }
      if (data.startsWith("done:")) {
        const questionId = data.slice(5);
        const question = questionFromId(questionId);
        if (!question) {
          await this.api.answerCallbackQuery(query.id, { text: "Вопрос уже недоступен" });
          return;
        }
        const result = await this.store.recordAnswer(
          query.from,
          questionId,
          message.chat.id,
          1
        );
        await this.api.answerCallbackQuery(query.id, {
          text: result.awarded
            ? `Засчитано. Теперь у тебя ${result.points} очков.`
            : "Этот вопрос уже был засчитан."
        });
        return;
      }
      if (data === "stats") {
        await this.api.answerCallbackQuery(query.id);
        await this.sendStats(message.chat.id, query.from);
        return;
      }
      if (data === "top") {
        await this.api.answerCallbackQuery(query.id);
        await this.sendTop(message.chat);
        return;
      }
      if (data === "rules") {
        await this.api.answerCallbackQuery(query.id);
        await this.sendRules(message.chat.id);
        return;
      }
      await this.api.answerCallbackQuery(query.id);
    } catch (error) {
      this.logError("кнопка", error);
      await this.api.answerCallbackQuery(query.id, {
        text: "Не получилось выполнить действие. Попробуй ещё раз."
      }).catch(() => undefined);
    }
  }

  async sendWelcome(chatId) {
    await this.api.sendMessage(chatId, welcomeText(), {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard()
    });
  }

  async showGameCategories(chat) {
    if (chat.type === "channel") {
      await this.api.sendMessage(
        chat.id,
        "Игру с текстовыми ответами запускай в привязанной группе обсуждений или в личном чате с ботом."
      );
      return;
    }
    await this.api.sendMessage(chat.id, "Выбери тему игры.", {
      reply_markup: categoryKeyboard("gamecat")
    });
  }

  async showRoundChoice(chatId, categoryKey) {
    await this.api.sendMessage(
      chatId,
      `Тема. ${formatCategoryTitle(categoryKey)}.\n\nСколько будет раундов?`,
      { reply_markup: roundsKeyboard(categoryKey) }
    );
  }

  async startGame(chat, owner, categoryKey, totalRounds) {
    const active = this.store.getSession(chat.id);
    if (active?.type === "quiz") {
      await this.api.sendMessage(
        chat.id,
        "Здесь уже идёт игра. Сначала заверши её кнопкой «Стоп игра» или командой /stopgame."
      );
      return;
    }

    const session = {
      type: "quiz",
      id: `${Date.now().toString(36)}${randomInt(36 ** 3).toString(36).padStart(3, "0")}`,
      chatId: chat.id,
      ownerId: owner.id,
      categoryKey,
      totalRounds,
      roundNumber: 1,
      usedItemIds: [],
      scores: {},
      current: null,
      startedAt: new Date().toISOString()
    };
    await this.store.setSession(chat.id, session);
    await this.api.sendMessage(
      chat.id,
      `<b>Игра начинается.</b>\n\nТема. ${escapeHtml(formatCategoryTitle(categoryKey))}.\nРаундов. ${totalRounds}.\n\nПервый правильный ответ получает очки.`,
      { parse_mode: "HTML" }
    );
    await this.beginRound(chat.id);
  }

  async beginRound(chatId) {
    const session = this.store.getSession(chatId);
    if (!session?.type || session.roundNumber > session.totalRounds) {
      await this.finishGame(chatId, "Все раунды завершены");
      return;
    }

    const item = randomQuizItem(session.categoryKey, session.usedItemIds);
    const validIndices = letterIndices(item.answer);
    session.usedItemIds = [item.id, ...session.usedItemIds].slice(0, 100);
    session.current = {
      itemId: item.id,
      token: `quiz_${session.id}_${session.roundNumber}`,
      stage: 0,
      difficulty: item.difficulty,
      revealedIndices: [],
      maxReveals: Math.min(5, Math.max(1, Math.ceil(validIndices.length * 0.45))),
      messageId: null,
      resolved: false,
      startedAt: new Date().toISOString()
    };
    await this.store.setSession(chatId, session);

    const sent = await this.api.sendMessage(chatId, gameQuestionText(session, item), {
      parse_mode: "HTML",
      reply_markup: gameKeyboard()
    });
    session.current.messageId = sent.message_id;
    await this.store.setSession(chatId, session);
    this.scheduleClue(chatId, session.id, session.roundNumber);
  }

  scheduleClue(chatId, sessionId, roundNumber) {
    this.clearRoundTimer(chatId);
    const timer = sleepTimer(() => {
      this.withChatLock(chatId, () => this.advanceClue(chatId, sessionId, roundNumber))
        .catch((error) => this.logError("подсказка", error));
    }, this.config.roundStepSeconds * 1000);
    this.roundTimers.set(String(chatId), timer);
  }

  clearRoundTimer(chatId) {
    const key = String(chatId);
    const timer = this.roundTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.roundTimers.delete(key);
    }
  }

  async advanceClue(chatId, expectedSessionId, expectedRound) {
    const session = this.store.getSession(chatId);
    if (
      session?.id !== expectedSessionId
      || session.roundNumber !== expectedRound
      || !session.current
      || session.current.resolved
    ) {
      return;
    }

    const item = getQuizItem(session.current.itemId);
    if (!item) {
      await this.advanceRound(chatId);
      return;
    }

    if (session.current.stage < 2) {
      session.current.stage += 1;
    } else if (session.current.revealedIndices.length < session.current.maxReveals) {
      const unopened = letterIndices(item.answer).filter(
        (index) => !session.current.revealedIndices.includes(index)
      );
      if (unopened.length) {
        session.current.revealedIndices.push(unopened[randomInt(unopened.length)]);
      }
      session.current.stage += 1;
    } else {
      this.clearRoundTimer(chatId);
      session.current.resolved = true;
      await this.store.setSession(chatId, session);
      await this.api.sendMessage(
        chatId,
        `Время раунда закончилось. Правильный ответ. <b>${escapeHtml(item.answer)}</b>.`,
        { parse_mode: "HTML" }
      );
      this.scheduleNextRound(chatId, session.id, session.roundNumber);
      return;
    }

    await this.store.setSession(chatId, session);
    if (session.current.messageId) {
      await this.api.editMessageText(
        chatId,
        session.current.messageId,
        gameQuestionText(session, item),
        { parse_mode: "HTML", reply_markup: gameKeyboard() }
      ).catch((error) => {
        if (!String(error.message).includes("message is not modified")) {
          throw error;
        }
      });
    }
    this.scheduleClue(chatId, session.id, session.roundNumber);
  }

  async tryGameAnswer(message, candidate) {
    const chatId = message.chat.id;
    const session = this.store.getSession(chatId);
    if (!session?.current || session.current.resolved) {
      return;
    }
    const item = getQuizItem(session.current.itemId);
    if (!item || !isCorrectAnswer(item, candidate)) {
      if (message.chat.type === "private") {
        await this.api.sendMessage(chatId, "Пока не угадано. Попробуй ещё раз.");
      }
      return;
    }

    this.clearRoundTimer(chatId);
    session.current.resolved = true;
    const points = scoreForStage(session.current);
    const result = await this.store.recordAnswer(
      message.from,
      session.current.token,
      chatId,
      points
    );
    if (!result.awarded) {
      return;
    }

    const playerKey = String(message.from.id);
    const player = session.scores[playerKey] ?? {
      id: message.from.id,
      name: displayName(message.from),
      points: 0,
      correct: 0
    };
    player.name = displayName(message.from);
    player.points += points;
    player.correct += 1;
    session.scores[playerKey] = player;
    await this.store.setSession(chatId, session);

    await this.api.sendMessage(
      chatId,
      `Правильно, <b>${escapeHtml(player.name)}</b>. Ответ. <b>${escapeHtml(item.answer)}</b>. Плюс ${points} очков.`,
      { parse_mode: "HTML" }
    );
    this.scheduleNextRound(chatId, session.id, session.roundNumber);
  }

  scheduleNextRound(chatId, sessionId, roundNumber) {
    this.clearRoundTimer(chatId);
    const timer = sleepTimer(() => {
      this.withChatLock(chatId, async () => {
        const current = this.store.getSession(chatId);
        if (current?.id !== sessionId || current.roundNumber !== roundNumber) {
          return;
        }
        await this.advanceRound(chatId);
      }).catch((error) => this.logError("следующий раунд", error));
    }, 2_500);
    this.roundTimers.set(String(chatId), timer);
  }

  async advanceRound(chatId) {
    const session = this.store.getSession(chatId);
    if (!session?.type) {
      return;
    }
    this.clearRoundTimer(chatId);
    session.roundNumber += 1;
    session.current = null;
    await this.store.setSession(chatId, session);
    if (session.roundNumber > session.totalRounds) {
      await this.finishGame(chatId, "Все раунды завершены");
      return;
    }
    await this.beginRound(chatId);
  }

  canControlGame(session, user) {
    return session.ownerId === user.id || this.config.adminIds.has(user.id);
  }

  async skipRound(chatId, user) {
    const session = this.store.getSession(chatId);
    if (!session?.current) {
      await this.api.sendMessage(chatId, "Сейчас активной игры нет.");
      return;
    }
    if (!this.canControlGame(session, user)) {
      await this.api.sendMessage(chatId, "Пропустить раунд может тот, кто запустил игру.");
      return;
    }
    const item = getQuizItem(session.current.itemId);
    await this.api.sendMessage(
      chatId,
      `Раунд пропущен. Ответ. <b>${escapeHtml(item?.answer ?? "неизвестен")}</b>.`,
      { parse_mode: "HTML" }
    );
    await this.advanceRound(chatId);
  }

  async stopGame(chatId, user) {
    const session = this.store.getSession(chatId);
    if (!session?.type) {
      await this.api.sendMessage(chatId, "Сейчас активной игры нет. Начать новую. /game");
      return;
    }
    if (!this.canControlGame(session, user)) {
      await this.api.sendMessage(chatId, "Остановить игру может тот, кто её запустил.");
      return;
    }
    await this.finishGame(chatId, "Игра остановлена");
  }

  async finishGame(chatId, reason) {
    const session = this.store.getSession(chatId);
    if (!session?.type) {
      return;
    }
    this.clearRoundTimer(chatId);
    const ranking = Object.values(session.scores)
      .sort((a, b) => b.points - a.points || b.correct - a.correct);
    const lines = [
      `<b>${escapeHtml(reason)}.</b>`,
      "",
      `Сыграно раундов. ${Math.min(session.roundNumber, session.totalRounds)} из ${session.totalRounds}.`
    ];
    if (ranking.length) {
      lines.push("", "<b>Результаты.</b>");
      ranking.forEach((player, index) => {
        lines.push(
          `${index + 1}. ${escapeHtml(player.name)}. ${player.points} очков, правильных ответов ${player.correct}.`
        );
      });
    } else {
      lines.push("", "В этой игре пока не было правильных ответов.");
    }
    lines.push("", "Новая игра. /game");
    await this.store.setSession(chatId, null);
    await this.api.sendMessage(chatId, lines.join("\n"), {
      parse_mode: "HTML",
      reply_markup: mainMenuKeyboard()
    });
  }

  async sendOpenQuestion(chat, categoryKey = "all", selectedQuestion = null) {
    const recent = this.store.getRecent(chat.id);
    const question = selectedQuestion ?? randomQuestion(categoryKey, recent);
    await this.store.rememberQuestion(chat.id, question.id);
    const text = [
      "<b>Вопросики есть</b>",
      "",
      `${question.categoryEmoji} <b>${escapeHtml(question.categoryTitle)}</b>`,
      "",
      escapeHtml(question.text)
    ].join("\n");
    await this.api.sendMessage(chat.id, text, {
      parse_mode: "HTML",
      reply_markup: openQuestionKeyboard(question, this.me.username, chat.type)
    });
  }

  async sendStats(chatId, user) {
    const stats = this.store.getUserStats(user.id);
    await this.api.sendMessage(
      chatId,
      [
        `<b>Статистика. ${escapeHtml(displayName(user))}.</b>`,
        "",
        `Очки. ${stats.points}.`,
        `Правильные и обдуманные ответы. ${stats.answered}.`,
        `Текущая серия. ${stats.streak}.`,
        `Лучшая серия. ${stats.bestStreak}.`
      ].join("\n"),
      { parse_mode: "HTML" }
    );
  }

  async sendTop(chat) {
    const scope = chat.type === "private" ? "global" : chat.id;
    const top = this.store.getTop(scope, 10);
    const lines = ["<b>Рейтинг игроков.</b>", ""];
    if (!top.length) {
      lines.push("Пока никто не набрал очки.");
    } else {
      top.forEach((player, index) => {
        lines.push(`${index + 1}. ${escapeHtml(player.name)}. ${player.points} очков.`);
      });
    }
    await this.api.sendMessage(chat.id, lines.join("\n"), { parse_mode: "HTML" });
  }

  async sendRules(chatId) {
    await this.api.sendMessage(
      chatId,
      [
        "<b>Правила игры.</b>",
        "",
        "Сначала выбери тему и количество раундов.",
        "Пиши ответ одним сообщением.",
        "До подсказок правильный ответ приносит 5 очков.",
        "После первой подсказки начисляется 4 очка, после второй 3 очка.",
        "Когда начинают открываться буквы, можно получить 1 или 2 очка.",
        "За сложный вопрос добавляется 1 очко, за экспертный — 2 очка.",
        "Если ответа нет, бот сам даёт две подсказки, затем открывает по одной букве.",
        "Кнопками можно пропустить раунд или полностью остановить игру.",
        "",
        "В Telegram-канале участники не могут писать ответы прямо в ленту. Для общей игры добавь бота администратором в привязанную группу обсуждений, тогда он увидит ответы игроков."
      ].join("\n"),
      { parse_mode: "HTML" }
    );
  }

  async sendHelp(chatId) {
    await this.api.sendMessage(
      chatId,
      [
        "<b>Команды.</b>",
        "",
        "/game. Начать игру.",
        "/stopgame. Остановить игру.",
        "/question. Случайный вопрос без правильного ответа.",
        "/stats. Личная статистика.",
        "/top. Рейтинг.",
        "/rules. Правила.",
        "/id. Твой ID и ID чата.",
        "",
        "Команды владельца.",
        "/setchannel @имя_канала.",
        "/publish. Опубликовать вопрос сейчас.",
        "/settimes 10:00,19:00.",
        "/autopost_on и /autopost_off.",
        "/status. Настройки публикаций."
      ].join("\n"),
      { parse_mode: "HTML" }
    );
  }

  isAdmin(userId) {
    return this.config.adminIds.has(userId);
  }

  async requireAdmin(message) {
    if (this.isAdmin(message.from.id)) {
      return true;
    }
    await this.api.sendMessage(
      message.chat.id,
      "Эта команда доступна владельцу. Добавь свой Telegram ID в ADMIN_IDS и перезапусти бота. Узнать ID можно командой /id."
    );
    return false;
  }

  async adminSetChannel(message, args) {
    if (!(await this.requireAdmin(message))) return;
    const raw = args[0];
    if (!raw) {
      await this.api.sendMessage(message.chat.id, "Укажи канал. Пример. /setchannel @my_channel");
      return;
    }
    const channelId = /^-?\d+$/.test(raw) ? Number(raw) : raw;
    const chat = await this.api.getChat(channelId);
    if (chat.type !== "channel") {
      await this.api.sendMessage(message.chat.id, "Это не Telegram-канал.");
      return;
    }
    await this.store.updateSettings({ channelId: chat.id });
    await this.api.sendMessage(
      message.chat.id,
      `Канал привязан. ${escapeHtml(chat.title ?? String(chat.id))}.`,
      { parse_mode: "HTML" }
    );
  }

  async adminPublish(message, args) {
    if (!(await this.requireAdmin(message))) return;
    const settings = this.store.getSettings();
    if (!settings.channelId) {
      await this.api.sendMessage(message.chat.id, "Сначала привяжи канал командой /setchannel.");
      return;
    }
    const categoryKey = resolveCategory(args[0]);
    await this.publishChannelQuestion(settings.channelId, categoryKey);
    await this.api.sendMessage(message.chat.id, "Вопрос опубликован в канале.");
  }

  async adminSetTimes(message, args) {
    if (!(await this.requireAdmin(message))) return;
    const raw = args.join("");
    const times = parseTimeList(raw);
    if (!raw || (times.length === 1 && times[0] === "10:00" && raw !== "10:00")) {
      await this.api.sendMessage(
        message.chat.id,
        "Укажи время в формате ЧЧ:ММ через запятую. Пример. /settimes 10:00,19:00"
      );
      return;
    }
    await this.store.updateSettings({ autopostTimes: times });
    await this.api.sendMessage(message.chat.id, `Время публикаций. ${times.join(", ")}.`);
  }

  async adminToggleAutopost(message, enabled) {
    if (!(await this.requireAdmin(message))) return;
    const settings = this.store.getSettings();
    if (enabled && !settings.channelId) {
      await this.api.sendMessage(message.chat.id, "Сначала привяжи канал командой /setchannel.");
      return;
    }
    await this.store.updateSettings({ autopostEnabled: enabled });
    await this.api.sendMessage(
      message.chat.id,
      enabled ? "Автопубликации включены." : "Автопубликации выключены."
    );
  }

  async adminStatus(message) {
    if (!(await this.requireAdmin(message))) return;
    const settings = this.store.getSettings();
    await this.api.sendMessage(
      message.chat.id,
      [
        "<b>Настройки публикаций.</b>",
        "",
        `Канал. ${escapeHtml(settings.channelId ?? "не привязан")}.`,
        `Автопубликации. ${settings.autopostEnabled ? "включены" : "выключены"}.`,
        `Время. ${escapeHtml(settings.autopostTimes.join(", "))}.`,
        `Часовой пояс. ${escapeHtml(settings.timezone)}.`,
        `Подсказки в игре. Каждые ${this.config.roundStepSeconds} секунд.`
      ].join("\n"),
      { parse_mode: "HTML" }
    );
  }

  async publishChannelQuestion(channelId, categoryKey = "all") {
    const recent = this.store.getRecent(channelId);
    const question = randomQuestion(categoryKey, recent);
    await this.store.rememberQuestion(channelId, question.id);
    const text = [
      "<b>Вопросики есть</b>",
      "",
      `${question.categoryEmoji} <b>${escapeHtml(question.categoryTitle)}</b>`,
      "",
      escapeHtml(question.text),
      "",
      "Подумай честно и нажми кнопку, когда ответишь себе."
    ].join("\n");
    await this.api.sendMessage(channelId, text, {
      parse_mode: "HTML",
      reply_markup: openQuestionKeyboard(question, this.me.username, "channel")
    });
  }

  async checkAutopost(now = new Date()) {
    const settings = this.store.getSettings();
    const slot = findDueSlot(settings, now);
    if (!slot) {
      return;
    }
    await this.publishChannelQuestion(settings.channelId, "all");
    await this.store.updateSettings({ lastAutopostSlot: slot });
  }
}
