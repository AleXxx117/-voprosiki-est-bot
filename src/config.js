import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file = path.resolve(".env")) {
  if (!fs.existsSync(file)) {
    return;
  }

  const content = fs.readFileSync(file, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator < 1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function asBoolean(value, fallback = false) {
  if (value === undefined || value === "") {
    return fallback;
  }
  return ["1", "true", "yes", "on", "да"].includes(String(value).toLowerCase());
}

function parseAdminIds(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter(Number.isSafeInteger);
}

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum
    ? parsed
    : fallback;
}

export function parseTimeList(value = "10:00,19:00") {
  const times = [...new Set(
    value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(item))
  )].sort();
  return times.length ? times : ["10:00"];
}

export function loadConfig() {
  loadEnvFile();

  const token = process.env.BOT_TOKEN?.trim()
    || process.env.TELEGRAM_BOT_TOKEN?.trim()
    || "";
  if (!token) {
    throw new Error(
      "Не найден BOT_TOKEN или TELEGRAM_BOT_TOKEN. Добавь новый токен BotFather в переменные сервиса."
    );
  }

  return {
    token,
    adminIds: new Set(parseAdminIds(process.env.ADMIN_IDS)),
    channelId: process.env.CHANNEL_ID?.trim() || null,
    autopostEnabled: asBoolean(process.env.AUTOPOST_ENABLED, false),
    autopostTimes: parseTimeList(process.env.AUTOPOST_TIMES),
    timezone: process.env.TIMEZONE?.trim() || "Europe/Kyiv",
    roundStepSeconds: boundedInteger(process.env.ROUND_STEP_SECONDS, 20, 5, 300),
    dataFile: path.resolve(process.env.DATA_FILE?.trim() || "./data/state.json")
  };
}
