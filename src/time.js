export function localDateTime(date = new Date(), timeZone = "Europe/Kyiv") {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );

  const hour = parts.hour === "24" ? "00" : parts.hour;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${hour}:${parts.minute}`
  };
}

export function findDueSlot(settings, now = new Date()) {
  if (!settings.autopostEnabled || !settings.channelId) {
    return null;
  }

  const local = localDateTime(now, settings.timezone);
  if (!settings.autopostTimes.includes(local.time)) {
    return null;
  }

  const slot = `${local.date}|${local.time}`;
  return slot === settings.lastAutopostSlot ? null : slot;
}
