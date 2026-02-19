function formatQuizName(slug) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getQuizIdFromPath() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const htmlIndex = parts.findIndex((part) => part.endsWith(".html"));
  const folderIndex = htmlIndex > 0 ? htmlIndex - 1 : parts.length - 1;
  return parts[folderIndex] || "quiz";
}

function storageKeyForQuiz(quizId) {
  return `quiz-state:${quizId}`;
}

function buildDefaultGroups(count) {
  return Array.from({ length: count }, (_, index) => ({
    name: `Grupa ${index + 1}`,
    points: 0,
  }));
}

function initQuizState(quizId) {
  const storageKey = storageKeyForQuiz(quizId);
  const raw = localStorage.getItem(storageKey);

  let state = {
    groupCount: 2,
    groups: buildDefaultGroups(2),
    currentQuestion: 0,
  };

  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.groups)) {
        state = {
          groupCount: Number(parsed.groupCount) || parsed.groups.length || 2,
          groups: parsed.groups,
          currentQuestion: Number(parsed.currentQuestion) || 0,
        };
      }
    } catch (_error) {
      state = {
        groupCount: 2,
        groups: buildDefaultGroups(2),
        currentQuestion: 0,
      };
    }
  }

  if (state.groupCount < 1) state.groupCount = 1;
  if (state.groupCount > 10) state.groupCount = 10;

  if (state.groups.length < state.groupCount) {
    const missing = state.groupCount - state.groups.length;
    const offset = state.groups.length;
    const additions = Array.from({ length: missing }, (_, index) => ({
      name: `Grupa ${offset + index + 1}`,
      points: 0,
    }));
    state.groups = state.groups.concat(additions);
  }

  if (state.groups.length > state.groupCount) {
    state.groups = state.groups.slice(0, state.groupCount);
  }

  state.groups = state.groups.map((group, index) => ({
    name: String(group.name || `Grupa ${index + 1}`),
    points: Number(group.points) || 0,
  }));

  return { storageKey, state };
}

function saveQuizState(storageKey, state) {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

async function loadQuestions(quizId) {
  const cacheKey = `quiz-questions:${quizId}`;
  const fileUrl = new URL("./questions.json", window.location.href).toString();

  try {
    const response = await fetch(fileUrl, { cache: "no-store" });
    if (!response.ok) throw new Error("questions fetch failed");
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("questions must be an array");
    localStorage.setItem(cacheKey, JSON.stringify(data));
    return data;
  } catch (_error) {
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (!cachedRaw) return [];
      const cached = JSON.parse(cachedRaw);
      return Array.isArray(cached) ? cached : [];
    } catch (_cacheError) {
      return [];
    }
  }
}

window.quizCommon = {
  formatQuizName,
  getQuizIdFromPath,
  storageKeyForQuiz,
  buildDefaultGroups,
  initQuizState,
  saveQuizState,
  loadQuestions,
};
