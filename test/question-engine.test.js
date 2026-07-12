import assert from "node:assert/strict";
import test from "node:test";

import {
  getCategoryKeys,
  getQuestionCount,
  getTotalQuestionCount,
  questionFromId,
  questionFromIndex
} from "../src/question-engine.js";

test("генератор содержит больше миллиона комбинаций", () => {
  assert.equal(getCategoryKeys().length, 6);
  assert.equal(getTotalQuestionCount(), 1_036_800);
  assert.ok(getTotalQuestionCount() > 1_000_000);
});

test("идентификатор вопроса восстанавливает тот же вопрос", () => {
  for (const key of getCategoryKeys()) {
    const count = getQuestionCount(key);
    for (const index of [0, 1, Math.floor(count / 2), count - 1]) {
      const question = questionFromIndex(key, index);
      assert.deepEqual(questionFromId(question.id), question);
      assert.ok(question.text.endsWith("?"));
    }
  }
});

test("первые 2000 вопросов каждой темы уникальны", () => {
  for (const key of getCategoryKeys()) {
    const texts = new Set();
    for (let index = 0; index < 2_000; index += 1) {
      texts.add(questionFromIndex(key, index).text);
    }
    assert.equal(texts.size, 2_000, `Повтор в категории ${key}`);
  }
});

test("некорректные идентификаторы не принимаются", () => {
  assert.equal(questionFromId(""), null);
  assert.equal(questionFromId("unknown_1"), null);
  assert.equal(questionFromId("p_zzzzzz"), null);
});
