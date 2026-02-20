const qc = window.quizCommon;

const quizId = qc.getQuizIdFromPath();
const { storageKey, state } = qc.initQuizState(quizId);

const heading = document.getElementById("summaryHeading");
heading.textContent = `Quiz ${qc.formatQuizName(quizId)} - podsumowanie`;

const winnerBox = document.getElementById("winnerBox");
const summaryTable = document.getElementById("summaryTable");
const resetBtn = document.getElementById("resetBtn");

function renderSummary() {
  const ranking = state.groups
    .map((group) => ({ ...group }))
    .sort((a, b) => b.points - a.points);

  if (ranking.length === 0) {
    winnerBox.textContent = "Brak drużyn do podsumowania.";
    return;
  }

  const topPoints = ranking[0].points;
  const winners = ranking.filter((group) => group.points === topPoints);



  summaryTable.innerHTML = "";
  ranking.forEach((group, index) => {
    const item = document.createElement("article");
    item.className = "team";
    item.innerHTML = `
      <div class="team-top">
        <div>
          <div class="small">Miejsce ${index + 1}</div>
          <div class="team-name">${group.name}</div>
        </div>
        <div class="points">${group.points} pkt</div>
      </div>
    `;
    summaryTable.appendChild(item);
  });
}

resetBtn.addEventListener("click", () => {
  const groupCount = state.groupCount || state.groups.length || 2;
  state.currentQuestion = 0;
  state.groups = qc.buildDefaultGroups(groupCount);
  qc.saveQuizState(storageKey, state);
  renderSummary();
});

renderSummary();
