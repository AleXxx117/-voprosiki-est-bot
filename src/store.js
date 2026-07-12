import fs from "node:fs/promises";
import path from "node:path";

const MAX_ANSWERED_IDS = 1500;
const MAX_RECENT_IDS = 250;

function freshState(defaultSettings) {
  return {
    version: 1,
    settings: {
      channelId: defaultSettings.channelId ?? null,
      autopostEnabled: Boolean(defaultSettings.autopostEnabled),
      autopostTimes: defaultSettings.autopostTimes ?? ["10:00"],
      timezone: defaultSettings.timezone ?? "Europe/Kyiv",
      lastAutopostSlot: null
    },
    users: {},
    leaderboards: {},
    sessions: {},
    recentQuestions: {}
  };
}

function normalizeState(value, defaultSettings) {
  const fallback = freshState(defaultSettings);
  if (!value || typeof value !== "object") {
    return fallback;
  }

  return {
    version: 1,
    settings: {
      ...fallback.settings,
      ...(value.settings && typeof value.settings === "object" ? value.settings : {})
    },
    users: value.users && typeof value.users === "object" ? value.users : {},
    leaderboards:
      value.leaderboards && typeof value.leaderboards === "object"
        ? value.leaderboards
        : {},
    sessions: value.sessions && typeof value.sessions === "object" ? value.sessions : {},
    recentQuestions:
      value.recentQuestions && typeof value.recentQuestions === "object"
        ? value.recentQuestions
        : {}
  };
}

function identityName(identity) {
  const fullName = [identity.first_name, identity.last_name].filter(Boolean).join(" ").trim();
  return fullName || identity.username || `Игрок ${identity.id}`;
}

function ensureUser(state, identity) {
  const id = String(identity.id);
  const current = state.users[id] ?? {
    id: identity.id,
    name: identityName(identity),
    username: identity.username ?? null,
    points: 0,
    answered: 0,
    skipped: 0,
    streak: 0,
    bestStreak: 0,
    answeredIds: [],
    pending: null
  };

  current.points ??= 0;
  current.answered ??= 0;
  current.skipped ??= 0;
  current.streak ??= 0;
  current.bestStreak ??= 0;
  current.answeredIds ??= [];
  current.pending ??= null;
  current.name = identityName(identity);
  current.username = identity.username ?? current.username ?? null;
  state.users[id] = current;
  return current;
}

function ensureBoardPlayer(state, scope, user) {
  const boardKey = String(scope);
  state.leaderboards[boardKey] ??= {};
  const id = String(user.id);
  const player = state.leaderboards[boardKey][id] ?? {
    id: user.id,
    name: user.name,
    username: user.username,
    points: 0,
    answered: 0
  };
  player.name = user.name;
  player.username = user.username;
  state.leaderboards[boardKey][id] = player;
  return player;
}

export class JsonStore {
  constructor(file, defaultSettings = {}) {
    this.file = file;
    this.defaultSettings = defaultSettings;
    this.state = freshState(defaultSettings);
    this.writeQueue = Promise.resolve();
  }

  async init() {
    try {
      const content = await fs.readFile(this.file, "utf8");
      this.state = normalizeState(JSON.parse(content), this.defaultSettings);
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
      await this.#write();
    }
    return this;
  }

  async #write() {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const temporary = `${this.file}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(this.state, null, 2)}\n`, "utf8");
    await fs.rename(temporary, this.file);
  }

  mutate(mutator) {
    const operation = this.writeQueue.then(async () => {
      const result = mutator(this.state);
      await this.#write();
      return result;
    });
    this.writeQueue = operation.catch(() => undefined);
    return operation;
  }

  getSettings() {
    return structuredClone(this.state.settings);
  }

  updateSettings(patch) {
    return this.mutate((state) => {
      state.settings = { ...state.settings, ...patch };
      return structuredClone(state.settings);
    });
  }

  getRecent(scope) {
    return [...(this.state.recentQuestions[String(scope)] ?? [])];
  }

  rememberQuestion(scope, questionId) {
    return this.mutate((state) => {
      const key = String(scope);
      const recent = state.recentQuestions[key] ?? [];
      state.recentQuestions[key] = [
        questionId,
        ...recent.filter((id) => id !== questionId)
      ].slice(0, MAX_RECENT_IDS);
    });
  }

  setPending(identity, pending) {
    return this.mutate((state) => {
      const user = ensureUser(state, identity);
      user.pending = pending;
      return structuredClone(user.pending);
    });
  }

  getPending(userId) {
    return structuredClone(this.state.users[String(userId)]?.pending ?? null);
  }

  clearPending(userId) {
    return this.mutate((state) => {
      const user = state.users[String(userId)];
      if (user) {
        user.pending = null;
      }
    });
  }

  recordAnswer(identity, questionId, scope = "global", points = 1) {
    return this.mutate((state) => {
      const user = ensureUser(state, identity);
      if (user.answeredIds.includes(questionId)) {
        return { awarded: false, points: user.points, streak: user.streak };
      }

      user.answeredIds = [questionId, ...user.answeredIds].slice(0, MAX_ANSWERED_IDS);
      user.points += points;
      user.answered += 1;
      user.streak += 1;
      user.bestStreak = Math.max(user.bestStreak, user.streak);
      if (user.pending?.questionId === questionId) {
        user.pending = null;
      }

      const scopes = new Set(["global", String(scope)]);
      for (const boardScope of scopes) {
        const player = ensureBoardPlayer(state, boardScope, user);
        player.points += points;
        player.answered += 1;
      }

      return { awarded: true, points: user.points, streak: user.streak };
    });
  }

  recordSkip(identity, questionId) {
    return this.mutate((state) => {
      const user = ensureUser(state, identity);
      user.skipped += 1;
      user.streak = 0;
      if (user.pending?.questionId === questionId) {
        user.pending = null;
      }
      return { skipped: user.skipped };
    });
  }

  getUserStats(userId) {
    const user = this.state.users[String(userId)];
    if (!user) {
      return {
        points: 0,
        answered: 0,
        skipped: 0,
        streak: 0,
        bestStreak: 0
      };
    }
    return structuredClone(user);
  }

  getTop(scope = "global", limit = 10) {
    return Object.values(this.state.leaderboards[String(scope)] ?? {})
      .sort((a, b) => b.points - a.points || b.answered - a.answered)
      .slice(0, limit)
      .map((item) => structuredClone(item));
  }

  setSession(userId, session) {
    return this.mutate((state) => {
      if (session === null) {
        delete state.sessions[String(userId)];
        return null;
      }
      state.sessions[String(userId)] = session;
      return structuredClone(session);
    });
  }

  getSession(userId) {
    return structuredClone(this.state.sessions[String(userId)] ?? null);
  }

  listSessions() {
    return Object.entries(this.state.sessions).map(([key, session]) => ({
      key,
      session: structuredClone(session)
    }));
  }
}
