import assert from "node:assert/strict";
import test from "node:test";

import { getCategoryKeys } from "../src/question-engine.js";
import {
  getQuizItems,
  isCorrectAnswer,
  letterIndices,
  maskAnswer,
  normalizeAnswer,
  randomQuizItem,
  quizItems
} from "../src/quiz-bank.js";

test("банк игры покрывает все темы", () => {
  assert.equal(quizItems.length, 180);
  assert.equal(new Set(quizItems.map((item) => item.id)).size, quizItems.length);
  for (const key of getCategoryKeys()) {
    assert.equal(getQuizItems(key).length, 30);
  }
});

test("каждый игровой вопрос имеет ответ и две подсказки", () => {
  for (const item of quizItems) {
    assert.ok(item.question.endsWith("?"));
    assert.ok(item.answer.length >= 3);
    assert.equal(item.hints.length, 2);
    assert.ok(item.hints.every(Boolean));
    assert.ok(["medium", "hard", "expert"].includes(item.difficulty));
  }
});

test("в игре на 30 раундов вопросы одной темы не повторяются", () => {
  for (const key of getCategoryKeys()) {
    const usedIds = [];
    for (let round = 0; round < 30; round += 1) {
      const item = randomQuizItem(key, usedIds);
      assert.equal(usedIds.includes(item.id), false);
      usedIds.push(item.id);
    }
    assert.equal(new Set(usedIds).size, 30);
  }
});

test("проверка ответа не зависит от регистра, пробелов и буквы ё", () => {
  const item = {
    answer: "Личные границы",
    alternatives: ["границы"]
  };
  assert.equal(normalizeAnswer("  ЛИЧНЫЕ, ГРАНИЦЫ! "), "личныеграницы");
  assert.ok(isCorrectAnswer(item, "личные границы"));
  assert.ok(isCorrectAnswer(item, "границы"));
  assert.equal(isCorrectAnswer(item, "доверие"), false);
});

test("одна небольшая опечатка допускается в длинном ответе", () => {
  const item = quizItems.find((candidate) => candidate.answer === "эмпатия");
  assert.ok(isCorrectAnswer(item, "эмпатия"));
  assert.ok(isCorrectAnswer(item, "эмпатиа"));
  assert.equal(isCorrectAnswer(item, "симпатия"), false);
});

test("маска открывает только выбранные буквы", () => {
  assert.equal(maskAnswer("вера"), "＿ ＿ ＿ ＿");
  assert.equal(maskAnswer("вера", [1]), "＿ Е ＿ ＿");
  assert.deepEqual(letterIndices("а б"), [0, 2]);
});
