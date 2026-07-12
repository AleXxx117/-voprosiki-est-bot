import {
  formatQuestionCount,
  getCategoryKeys,
  getQuestionCount,
  getTotalQuestionCount,
  categories
} from "../src/question-engine.js";
import { getQuizItems } from "../src/quiz-bank.js";

console.log("Вопросики есть. Проверка содержимого.");
for (const key of getCategoryKeys()) {
  console.log(
    `${categories[key].title}: ${formatQuestionCount(getQuestionCount(key))} комбинаций, ${getQuizItems(key).length} вопросов с точным ответом.`
  );
}
console.log(`Всего комбинаций: ${formatQuestionCount(getTotalQuestionCount())}.`);

if (getTotalQuestionCount() < 1_000_000) {
  process.exitCode = 1;
}
