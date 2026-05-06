"use strict";

const iconMap = {
  "バーガー": "🍔",
  "ポテト": "🍟",
  "ピザ": "🍕",
  "寿司": "🍣",
  "ケーキ": "🍰",
  "コーヒー": "☕"
};

const foods = Object.keys(iconMap);
const SHOW_TIME = 1700;

const startScreen = document.querySelector("#startScreen");
const gameScreen = document.querySelector("#gameScreen");
const resultScreen = document.querySelector("#resultScreen");
const scoreText = document.querySelector("#scoreText");
const comboText = document.querySelector("#comboText");
const missText = document.querySelector("#missText");
const timerLabel = document.querySelector("#timerLabel");
const timeText = document.querySelector("#timeText");
const modeText = document.querySelector("#modeText");
const phaseText = document.querySelector("#phaseText");
const orderItems = document.querySelector("#orderItems");
const feedbackText = document.querySelector("#feedbackText");
const resultModeText = document.querySelector("#resultModeText");
const resultTitle = document.querySelector("#resultTitle");
const resultScoreLabel = document.querySelector("#resultScoreLabel");
const resultScore = document.querySelector("#resultScore");
const resultMaxCombo = document.querySelector("#resultMaxCombo");
const resultMiss = document.querySelector("#resultMiss");
const retryButton = document.querySelector("#retryButton");
const backToStartButton = document.querySelector("#backToStartButton");
const choiceButtons = document.querySelectorAll("[data-food]");

const game = {
  mode: "time",
  score: 0,
  combo: 0,
  maxCombo: 0,
  misses: 0,
  timeLeft: 60,
  order: [],
  selected: [],
  timerId: 0,
  roundTimerId: 0,
  feedbackTimerId: 0,
  isPlaying: false,
  isAnswering: false
};

function setAppHeight() {
  const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
  document.documentElement.style.setProperty("--app-height", `${height}px`);
}

function showScreen(screen) {
  startScreen.classList.toggle("is-hidden", screen !== "start");
  gameScreen.classList.toggle("is-hidden", screen !== "game");
  resultScreen.classList.toggle("is-hidden", screen !== "result");
}

function startGame(mode) {
  clearInterval(game.timerId);
  clearTimeout(game.roundTimerId);
  clearTimeout(game.feedbackTimerId);
  game.mode = mode;
  game.score = 0;
  game.combo = 0;
  game.maxCombo = 0;
  game.misses = 0;
  game.timeLeft = 60;
  game.isPlaying = true;
  modeText.textContent = mode === "time" ? "タイムアタック 60秒" : "エンドレス ミスするまで";
  timerLabel.textContent = mode === "time" ? "時間" : "成功";
  showScreen("game");
  showFeedback("");
  updateHud();
  startRound();
  if (mode === "time") {
    game.timerId = setInterval(tickTimer, 1000);
  }
}

function tickTimer() {
  game.timeLeft -= 1;
  updateHud();
  if (game.timeLeft <= 0) {
    finishGame();
  }
}

function startRound() {
  if (!game.isPlaying) {
    return;
  }
  const itemCount = game.combo >= 6 ? 3 : 2;
  game.order = makeOrder(itemCount);
  game.selected = [];
  game.isAnswering = false;
  setChoicesDisabled(true);
  phaseText.textContent = "注文を覚えてください";
  renderOrder(false);
  game.roundTimerId = window.setTimeout(() => {
    game.isAnswering = true;
    setChoicesDisabled(false);
    phaseText.textContent = "同じ注文を選んでください";
    renderOrder(true);
  }, Math.max(900, SHOW_TIME - game.combo * 70));
}

function makeOrder(count) {
  const shuffled = [...foods].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function renderOrder(hidden) {
  orderItems.innerHTML = "";
  game.order.forEach((item) => {
    const chip = document.createElement("div");
    chip.className = hidden ? "order-chip hidden-order" : "order-chip";
    chip.textContent = hidden ? "?" : iconMap[item];
    orderItems.appendChild(chip);
  });
}

function chooseFood(food) {
  if (!game.isPlaying || !game.isAnswering) {
    return;
  }
  game.selected.push(food);
  if (game.selected.length === game.order.length) {
    judgeOrder();
  }
}

function judgeOrder() {
  game.isAnswering = false;
  setChoicesDisabled(true);
  const correct = [...game.order].sort().join(",");
  const selected = [...game.selected].sort().join(",");
  if (correct === selected) {
    game.score += 1;
    game.combo += 1;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    showFeedback("正解 +1");
    updateHud();
    window.setTimeout(startRound, 360);
  } else {
    game.misses += 1;
    game.combo = 0;
    showFeedback("注文が違います", true);
    updateHud();
    if (game.mode === "endless") {
      window.setTimeout(finishGame, 360);
    } else {
      window.setTimeout(startRound, 520);
    }
  }
}

function setChoicesDisabled(disabled) {
  choiceButtons.forEach((button) => {
    button.disabled = disabled;
  });
}

function showFeedback(message, isWrong = false) {
  clearTimeout(game.feedbackTimerId);
  feedbackText.textContent = message;
  feedbackText.classList.toggle("is-wrong", isWrong);
  feedbackText.classList.toggle("is-visible", message.length > 0);
  if (message.length > 0) {
    game.feedbackTimerId = window.setTimeout(() => feedbackText.classList.remove("is-visible"), 850);
  }
}

function updateHud() {
  scoreText.textContent = game.score;
  comboText.textContent = game.combo;
  missText.textContent = game.misses;
  timeText.textContent = game.mode === "time" ? Math.max(0, game.timeLeft) : game.score;
}

function finishGame() {
  clearInterval(game.timerId);
  clearTimeout(game.roundTimerId);
  game.isPlaying = false;
  game.isAnswering = false;
  setChoicesDisabled(true);
  resultModeText.textContent = game.mode === "time" ? "タイムアタック結果" : "エンドレス結果";
  resultTitle.textContent = game.mode === "time" ? "時間切れ" : "記憶終了";
  resultScoreLabel.textContent = game.mode === "time" ? "スコア" : "正解数";
  resultScore.textContent = game.score;
  resultMaxCombo.textContent = game.maxCombo;
  resultMiss.textContent = game.misses;
  showScreen("result");
}

document.querySelectorAll("[data-start-mode]").forEach((button) => {
  button.addEventListener("click", () => startGame(button.dataset.startMode));
});

choiceButtons.forEach((button) => {
  button.addEventListener("click", () => chooseFood(button.dataset.food));
});

retryButton.addEventListener("click", () => startGame(game.mode));
backToStartButton.addEventListener("click", () => {
  clearInterval(game.timerId);
  clearTimeout(game.roundTimerId);
  game.isPlaying = false;
  showScreen("start");
});

window.addEventListener("resize", setAppHeight);
window.addEventListener("orientationchange", setAppHeight);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", setAppHeight);
}
setAppHeight();
setChoicesDisabled(true);
