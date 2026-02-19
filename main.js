const quizFolders = ["energia-na-start"];

function formatQuizName(slug) {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const quizList = document.getElementById("quizList");

quizFolders.forEach((folder) => {
  const card = document.createElement("a");
  card.className = "card";
  card.href = `./${folder}/index.html`;
  card.innerHTML = `
    <h3>${formatQuizName(folder)}</h3>
  `;
  quizList.appendChild(card);
});
