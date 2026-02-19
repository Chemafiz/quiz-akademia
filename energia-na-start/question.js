const qc = window.quizCommon;

const quizId = qc.getQuizIdFromPath();
const { storageKey, state } = qc.initQuizState(quizId);

const heading = document.getElementById("questionHeading");
heading.textContent = `Quiz ${qc.formatQuizName(quizId)} - pytanie`;

const questionBox = document.getElementById("questionBox");

async function loadQuestion() {
  try {
    const questions = await qc.loadQuestions(quizId);

    if (!Array.isArray(questions) || questions.length === 0) {
      questionBox.innerHTML = "<p>Brak pytań (CORS dla file://). Uruchom lokalnie: <strong>python -m http.server 5500</strong> i otwórz <strong>http://localhost:5500/zz/energia-na-start/</strong>.</p>";
      return;
    }

    if (state.currentQuestion >= questions.length) {
      questionBox.innerHTML = `
        <h2>Wszystkie pytania zostały już użyte</h2>
        <p class="small">Możesz zakończyć quiz lub wrócić do panelu punktacji.</p>
        <div class="footer-nav">
          <a class="button secondary" href="./summary.html">Przejdź do podsumowania</a>
          <a class="button" href="./index.html">Wróć do quizu</a>
        </div>
      `;
      return;
    }

    const question = questions[state.currentQuestion];

    const answersHtml = question.answers
      .map(
        (answer, index) => `<button class="answer" type="button" data-answer-index="${index}">${answer}</button>`
      )
      .join("");

    questionBox.innerHTML = `
      <div class="small">Pytanie ${state.currentQuestion + 1}/${questions.length}</div>
      <h2>${question.question}</h2>
      <div class="answers">${answersHtml}</div>
      <p id="feedback" class="small"></p>
      <div class="footer-nav">
        <button type="button" id="backAfterAnswer" class="secondary" disabled>Wróć do quizu</button>
      </div>
    `;

    const feedback = document.getElementById("feedback");
    const backButton = document.getElementById("backAfterAnswer");
    const answerButtons = [...questionBox.querySelectorAll("[data-answer-index]")];

    let answered = false;

    answerButtons.forEach((button) => {
      button.addEventListener("click", () => {
        if (answered) return;
        answered = true;

        const selectedIndex = Number(button.dataset.answerIndex);

        answerButtons.forEach((item, optionIndex) => {
          item.disabled = true;
          if (optionIndex === question.correctIndex) {
            item.classList.add("correct");
          }
        });

        if (selectedIndex !== question.correctIndex) {
          button.classList.add("wrong");
          feedback.textContent = "Niepoprawna odpowiedź. Poprawna została zaznaczona na zielono.";
        } else {
          feedback.textContent = "Poprawna odpowiedź!";
        }

        backButton.disabled = false;
      });
    });

    backButton.addEventListener("click", () => {
      state.currentQuestion = Math.min(state.currentQuestion + 1, questions.length);
      qc.saveQuizState(storageKey, state);
      window.location.href = "./index.html";
    });
  } catch (_error) {
    questionBox.innerHTML = "<p>Nie udało się wczytać pytań.</p>";
  }
}

loadQuestion();
