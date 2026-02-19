const qc = window.quizCommon;

const quizId = qc.getQuizIdFromPath();
const { storageKey, state } = qc.initQuizState(quizId);

if (typeof state.phase !== "string") state.phase = "setup";
if (!Array.isArray(state.groups)) state.groups = qc.buildDefaultGroups(state.groupCount || 2);
if (!Number.isInteger(state.currentQuestion)) state.currentQuestion = 0;
if (!Number.isInteger(state.lastAwardedGroupIndex)) state.lastAwardedGroupIndex = -1;
if (typeof state.answerChecked !== "boolean") state.answerChecked = false;
if (!Number.isInteger(state.selectedAnswerIndex)) state.selectedAnswerIndex = -1;

const heading = document.getElementById("quizHeading");
heading.textContent = `Quiz ${qc.formatQuizName(quizId)}`;
document.title = `Quiz ${qc.formatQuizName(quizId)}`;

const setupStage = document.getElementById("setupStage");
const playStage = document.getElementById("playStage");
const resultsStage = document.getElementById("resultsStage");

const groupCountSelect = document.getElementById("groupCount");
const startQuizBtn = document.getElementById("startQuizBtn");
const groupInfo = document.getElementById("groupInfo");
const questionMeta = document.getElementById("questionMeta");
const setupGroups = document.getElementById("setupGroups");

const questionCounter = document.getElementById("questionCounter");
const questionText = document.getElementById("questionText");
const questionAnswers = document.getElementById("questionAnswers");
const awardInfo = document.getElementById("awardInfo");
const nextQuestionBtn = document.getElementById("nextQuestionBtn");
const endQuizBtn = document.getElementById("endQuizBtn");
const awardModal = document.getElementById("awardModal");
const awardGroups = document.getElementById("awardGroups");

const resultsLead = document.getElementById("resultsLead");
const resultsTable = document.getElementById("resultsTable");
const restartBtn = document.getElementById("restartBtn");

let questions = [];

for (let count = 1; count <= 10; count += 1) {
  const option = document.createElement("option");
  option.value = String(count);
  option.textContent = `${count} grup`;
  groupCountSelect.appendChild(option);
}

groupCountSelect.value = String(state.groupCount);

function saveState() {
  qc.saveQuizState(storageKey, state);
}

function normalizeGroupsToCount(targetCount) {
  const previous = [...state.groups];
  state.groups = qc.buildDefaultGroups(targetCount).map((group, index) => previous[index] || group);
  state.groupCount = targetCount;
}

function renameTeam(index) {
  const currentName = state.groups[index].name || `Grupa ${index + 1}`;
  const proposed = window.prompt("Podaj nazwę grupy:", currentName);
  if (proposed === null) return;
  const trimmed = proposed.trim();
  state.groups[index].name = trimmed || `Grupa ${index + 1}`;
  saveState();
  renderSetupGroups();
  renderAnswerGroups();
}

function applyGroupCount() {
  const parsed = Number.parseInt(groupCountSelect.value, 10);
  const targetCount = Number.isNaN(parsed) ? state.groupCount : Math.min(10, Math.max(1, parsed));
  groupCountSelect.value = String(targetCount);

  if (targetCount !== state.groupCount) {
    normalizeGroupsToCount(targetCount);
    saveState();
  }

  renderSetupGroups();
}


function renderSetupGroups() {
  setupGroups.innerHTML = "";

  state.groups.forEach((group, index) => {
    const card = document.createElement("article");
    card.className = "name-card";
    card.innerHTML = `
      <div class="team-name">${group.name}</div>
      <button type="button" class="ghost" data-rename-index="${index}">Zmień nazwę</button>
    `;
    setupGroups.appendChild(card);
  });

  setupGroups.querySelectorAll("[data-rename-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.renameIndex);
      renameTeam(index);
    });
  });
}

function renderAnswerGroups() {
  awardGroups.innerHTML = "";

  const question = questions[state.currentQuestion];
  const correctIndex = Number.isInteger(question?.correctIndex) ? question.correctIndex : -1;
  const awaitingAward = state.answerChecked && state.selectedAnswerIndex === correctIndex && state.lastAwardedGroupIndex === -1;
  const canAwardPoint = awaitingAward;

  if (awardModal) {
    awardModal.hidden = !awaitingAward;
  }

  state.groups.forEach((group, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "group-answer-btn";
    button.textContent = group.name;
    button.dataset.groupIndex = String(index);

    button.addEventListener("click", () => {
      if (!canAwardPoint) return;
      state.groups[index].points += 1;
      state.lastAwardedGroupIndex = index;
      saveState();
      awardInfo.textContent = `Dodano 1 punkt dla: ${group.name}`;
      nextQuestionBtn.disabled = false;
      renderAnswerGroups();
    });

    if (state.lastAwardedGroupIndex === index) {
      button.classList.add("selected");
    }

    if (!canAwardPoint) {
      button.disabled = true;
    }

    awardGroups.appendChild(button);
  });
}

function renderQuestion() {
  if (state.currentQuestion >= questions.length) {
    finishQuiz();
    return;
  }

  const question = questions[state.currentQuestion];
  questionCounter.textContent = `Pytanie ${state.currentQuestion + 1}`;
  questionText.textContent = question.question;

  const labels = ["A", "B", "C", "D", "E", "F"];
  const answers = Array.isArray(question.answers) ? question.answers : [];
  const correctIndex = Number.isInteger(question.correctIndex) ? question.correctIndex : -1;

  questionAnswers.innerHTML = answers
    .map((answer, index) => {
      let className = "answer-line answer-btn";

      if (state.answerChecked) {
        if (index === correctIndex) {
          className += " is-correct";
        } else if (index === state.selectedAnswerIndex) {
          className += " is-wrong";
        }
      }

      return `
        <button type="button" class="${className}" data-answer-index="${index}" ${state.answerChecked ? "disabled" : ""}>
          <span class="answer-letter">${labels[index] || index + 1}</span>
          <span>${answer}</span>
        </button>
      `;
    })
    .join("");

  questionAnswers.querySelectorAll("[data-answer-index]").forEach((button) => {
    button.addEventListener("click", () => {
      if (state.answerChecked) return;
      state.selectedAnswerIndex = Number(button.dataset.answerIndex);
      state.answerChecked = true;
      saveState();
      renderQuestion();
    });
  });

  const awaitingAward = state.answerChecked && state.selectedAnswerIndex === correctIndex && state.lastAwardedGroupIndex === -1;
  questionText.hidden = awaitingAward;
  questionAnswers.hidden = awaitingAward;
  questionCounter.hidden = awaitingAward;

  if (!state.answerChecked) {
    nextQuestionBtn.disabled = true;
  } else if (state.selectedAnswerIndex !== correctIndex) {
    nextQuestionBtn.disabled = false;
  } else if (state.lastAwardedGroupIndex === -1) {
    awardInfo.textContent = "Ktora druzyna zyskuje punkt?";
    nextQuestionBtn.disabled = true;
  } else {
    const awardedName = state.groups[state.lastAwardedGroupIndex]?.name || "grupa";
    awardInfo.textContent = `Dodano 1 punkt dla: ${awardedName}`;
    nextQuestionBtn.disabled = false;
  }

  renderAnswerGroups();
}

function finishQuiz() {
  state.phase = "finished";
  saveState();
  renderView();
}

function startQuiz() {
  if (!questions.length) {
    if (questionMeta) {
      questionMeta.textContent = "Brak pytań (CORS dla file://). Uruchom: python -m http.server 5500 i otwórz http://localhost:5500/zz/.";
    }
    return;
  }

  if (state.currentQuestion >= questions.length) {
    state.currentQuestion = 0;
  }

  state.lastAwardedGroupIndex = -1;
  state.answerChecked = false;
  state.selectedAnswerIndex = -1;
  state.phase = "playing";
  saveState();
  renderView();
}

function goToNextQuestion() {
  const question = questions[state.currentQuestion];
  const correctIndex = Number.isInteger(question?.correctIndex) ? question.correctIndex : -1;

  if (!state.answerChecked) return;
  if (state.selectedAnswerIndex === correctIndex && state.lastAwardedGroupIndex === -1) return;

  state.currentQuestion += 1;
  state.lastAwardedGroupIndex = -1;
  state.answerChecked = false;
  state.selectedAnswerIndex = -1;
  saveState();

  if (state.currentQuestion >= questions.length) {
    finishQuiz();
    return;
  }

  renderQuestion();
}

function renderResults() {
  const ranking = state.groups
    .map((group) => ({ ...group }))
    .sort((a, b) => b.points - a.points);

  if (!ranking.length) {
    resultsLead.textContent = "Brak danych do podsumowania.";
    resultsTable.innerHTML = "";
    return;
  }

  const winnerPoints = ranking[0].points;
  const winners = ranking.filter((group) => group.points === winnerPoints).map((group) => group.name);

  if (winners.length === 1) {
    resultsLead.textContent = `Wygrywa: ${winners[0]} (${winnerPoints} pkt)`;
  } else {
    resultsLead.textContent = `Remis: ${winners.join(", ")} (${winnerPoints} pkt)`;
  }

  resultsTable.innerHTML = "";
  ranking.forEach((group) => {
    const row = document.createElement("article");
    row.className = "team";
    row.innerHTML = `
      <div class="team-top">
        <div class="team-name">${group.name}</div>
        <div class="points">${group.points} pkt</div>
      </div>
    `;
    resultsTable.appendChild(row);
  });
}

function renderView() {
  setupStage.hidden = state.phase !== "setup";
  playStage.hidden = state.phase !== "playing";
  resultsStage.hidden = state.phase !== "finished";

  if (state.phase === "setup") {
    renderSetupGroups();
  }

  if (state.phase === "playing") {
    renderQuestion();
  }

  if (state.phase === "finished") {
    renderResults();
  }
}

groupCountSelect.addEventListener("change", applyGroupCount);

startQuizBtn.addEventListener("click", startQuiz);
nextQuestionBtn.addEventListener("click", goToNextQuestion);
endQuizBtn.addEventListener("click", finishQuiz);

restartBtn.addEventListener("click", () => {
  state.currentQuestion = 0;
  state.lastAwardedGroupIndex = -1;
  state.answerChecked = false;
  state.selectedAnswerIndex = -1;
  state.groups = qc.buildDefaultGroups(state.groupCount);
  state.phase = "setup";
  saveState();
  renderView();
});

async function init() {
  questions = await qc.loadQuestions(quizId);

  renderView();
  saveState();
}

init();
