import assert from "node:assert/strict";
import test from "node:test";

import { findDueSlot, localDateTime } from "../src/time.js";

test("время правильно переводится в часовой пояс Киева", () => {
  const value = localDateTime(new Date("2026-07-12T07:00:00Z"), "Europe/Kyiv");
  assert.deepEqual(value, { date: "2026-07-12", time: "10:00" });
});

test("автопубликация срабатывает один раз на временной слот", () => {
  const settings = {
    channelId: -100123,
    autopostEnabled: true,
    autopostTimes: ["10:00", "19:00"],
    timezone: "Europe/Kyiv",
    lastAutopostSlot: null
  };
  const now = new Date("2026-07-12T07:00:20Z");
  assert.equal(findDueSlot(settings, now), "2026-07-12|10:00");
  settings.lastAutopostSlot = "2026-07-12|10:00";
  assert.equal(findDueSlot(settings, now), null);
});
