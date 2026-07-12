import assert from "node:assert/strict";
import test from "node:test";

import { getCategoryKeys } from "../src/question-engine.js";
import {
  getQuizItems,
  isCorrectAnswer,
  letterIndices,
  maskAnswer,
  normalizeAnswer,
  quizItems
} from "../src/quiz-bank.js";

test("банк игры покрывает все темы", () => {
  assert.equal(quizItems.length, 72);
  assert.equal(new Set(quizItems.map((item) => item.id)).size, quizItems.length);
  for (const key of getCategoryKeys()) {
    assert.equal(getQuizItems(key).length, 12);
  }
});

test("каждый игровой вопрос имеет ответ и две подсказки", () => {
  for (const item of quizItems) {
    assert.ok(item.question.endsWith("?"));
    assert.ok(item.answer.length >= 3);
    assert.equal(item.hints.length, 2);
    assert.ok(item.hints.every(Boolean));
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
