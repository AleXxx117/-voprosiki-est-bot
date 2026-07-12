import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { JsonStore } from "../src/store.js";

async function temporaryStore(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "voprosiki-store-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return new JsonStore(path.join(directory, "state.json"), {
    autopostTimes: ["10:00"],
    timezone: "Europe/Kyiv"
  }).init();
}

test("ответ начисляет очки только один раз", async (t) => {
  const store = await temporaryStore(t);
  const user = { id: 7, first_name: "Саша", username: "sasha" };
  const first = await store.recordAnswer(user, "quiz_round_1", "chat-1", 5);
  const duplicate = await store.recordAnswer(user, "quiz_round_1", "chat-1", 5);

  assert.equal(first.awarded, true);
  assert.equal(duplicate.awarded, false);
  assert.equal(store.getUserStats(7).points, 5);
  assert.equal(store.getTop("chat-1")[0].points, 5);
  assert.equal(store.getTop("global")[0].name, "Саша");
});

test("сессия игры сохраняется и удаляется", async (t) => {
  const store = await temporaryStore(t);
  await store.setSession(-1001, { type: "quiz", roundNumber: 1 });
  assert.equal(store.getSession(-1001).roundNumber, 1);
  assert.equal(store.listSessions().length, 1);
  await store.setSession(-1001, null);
  assert.equal(store.getSession(-1001), null);
});

test("недавние вопросы не растут бесконечно", async (t) => {
  const store = await temporaryStore(t);
  for (let index = 0; index < 300; index += 1) {
    await store.rememberQuestion("chat", `q${index}`);
  }
  assert.equal(store.getRecent("chat").length, 250);
  assert.equal(store.getRecent("chat")[0], "q299");
});
