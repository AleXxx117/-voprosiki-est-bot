import { VoprosikiBot } from "./bot.js";
import { loadConfig } from "./config.js";
import { JsonStore } from "./store.js";
import { TelegramApi } from "./telegram-api.js";

async function main() {
  const config = loadConfig();
  const store = await new JsonStore(config.dataFile, {
    channelId: config.channelId,
    autopostEnabled: config.autopostEnabled,
    autopostTimes: config.autopostTimes,
    timezone: config.timezone
  }).init();
  const api = new TelegramApi(config.token);
  const bot = await new VoprosikiBot(api, store, config).init();

  const shutdown = () => {
    bot.stop();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  await bot.run();
}

main().catch((error) => {
  console.error(error?.message ?? error);
  process.exitCode = 1;
});
