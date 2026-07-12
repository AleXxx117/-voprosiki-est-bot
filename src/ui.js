import { categories, formatQuestionCount } from "./question-engine.js";
import { maskAnswer } from "./quiz-bank.js";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function mainMenuKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "🎮 Начать игру", callback_data: "game:start" }],
      [{ text: "🎲 Вопрос без правильного ответа", callback_data: "open:categories" }],
      [
        { text: "📊 Моя статистика", callback_data: "stats" },
        { text: "🏆 Рейтинг", callback_data: "top" }
      ],
      [{ text: "ℹ️ Правила", callback_data: "rules" }]
    ]
  };
}

export function categoryKeyboard(prefix = "gamecat") {
  const buttons = Object.entries(categories).map(([key, category]) => ({
    text: `${category.emoji} ${category.title}`,
    callback_data: `${prefix}:${key}`
  }));

  return {
    inline_keyboard: [
      [{ text: "🎨 Все темы", callback_data: `${prefix}:all` }],
      [buttons[0], buttons[1]],
      [buttons[2], buttons[3]],
      [buttons[4], buttons[5]],
      [{ text: "⬅️ Меню", callback_data: "menu" }]
    ]
  };
}

export function roundsKeyboard(categoryKey) {
  return {
    inline_keyboard: [
      [5, 10, 15].map((rounds) => ({
        text: `${rounds} раундов`,
        callback_data: `rounds:${categoryKey}:${rounds}`
      })),
      [20, 30].map((rounds) => ({
        text: `${rounds} раундов`,
        callback_data: `rounds:${categoryKey}:${rounds}`
      })),
      [{ text: "⬅️ Назад к темам", callback_data: "game:start" }]
    ]
  };
}

export function gameKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: "⏭ Пропустить", callback_data: "game:skip" },
        { text: "⛔ Стоп игра", callback_data: "game:stop" }
      ]
    ]
  };
}

export function openQuestionKeyboard(question, botUsername, chatType) {
  const rows = [
    [{ text: "✅ Я ответил. +1", callback_data: `done:${question.id}` }]
  ];

  if (chatType === "private") {
    rows.push([
      { text: "➡️ Ещё вопрос", callback_data: `open:next:${question.categoryKey}` },
      { text: "🗂 Другая тема", callback_data: "open:categories" }
    ]);
  } else if (botUsername) {
    rows.push([{
      text: "✍️ Играть в боте",
      url: `https://t.me/${botUsername}?start=q_${question.id}`
    }]);
  }

  return { inline_keyboard: rows };
}

export function gameQuestionText(session, item) {
  const category = categories[item.categoryKey];
  const current = session.current;
  const lines = [
    `<b>Вопросики есть. Раунд ${session.roundNumber} из ${session.totalRounds}</b>`,
    "",
    `${category.emoji} <b>${escapeHtml(category.title)}</b>`,
    "",
    escapeHtml(item.question),
    "",
    `<b>Слово.</b> ${escapeHtml(maskAnswer(item.answer, current.revealedIndices))}`
  ];

  if (current.stage >= 1) {
    lines.push("", `<b>Подсказка 1.</b> ${escapeHtml(item.hints[0])}`);
  }
  if (current.stage >= 2) {
    lines.push(`<b>Подсказка 2.</b> ${escapeHtml(item.hints[1])}`);
  }
  if (current.revealedIndices.length) {
    lines.push("", `Открыто букв. ${current.revealedIndices.length}.`);
  }

  lines.push("", "Пиши ответ одним сообщением.");
  return lines.join("\n");
}

export function welcomeText() {
  return [
    "<b>Вопросики есть</b>",
    "",
    "Выбирай тему и количество раундов. Отвечай одним словом. Если ответа долго нет, бот сам даст две подсказки, а потом начнёт открывать по одной букве.",
    "",
    `Также внутри есть ${formatQuestionCount()} вопросов без единственного правильного ответа.`,
    "",
    "За быстрый ответ начисляется больше очков. Остановить игру можно кнопкой «Стоп игра»."
  ].join("\n");
}
