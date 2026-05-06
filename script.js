"use strict";

const iconMap = {
  "バーガー": "🍔",
  "サンド": "🥪",
  "ホットドッグ": "🌭",
  "ポテト": "🍟",
  "ピザ": "🍕",
  "寿司": "🍣",
  "ケーキ": "🍰",
  "ドーナツ": "🍩",
  "コーヒー": "☕"
};

const difficultySettings = {
  easy: {
    label: "かんたん",
    menu: ["バーガー", "ポテト", "ケーキ"],
    showTime: 5000,
    timeLimit: 90,
    minItems: 2,
    maxItems: 2,
    scoreMultiplier: 1,
    comboBonusEvery: 5,
    chipSize: "large"
  },
  normal: {
    label: "ふつう",
    menu: ["バーガー", "ポテト", "ピザ", "コーヒー"],
    showTime: 3000,
    timeLimit: 60,
    minItems: 2,
    maxItems: 3,
    scoreMultiplier: 2,
    comboBonusEvery: 4,
    chipSize: "normal"
  },
  hard: {
    label: "むずかしい",
    menu: ["バーガー", "サンド", "ホットドッグ", "ポテト", "ピザ", "寿司", "ケーキ", "ドーナツ", "コーヒー"],
    showTime: 1700,
    timeLimit: 45,
    minItems: 3,
    maxItems: 5,
    scoreMultiplier: 3,
    comboBonusEvery: 3,
    chipSize: "small"
  }
};

const startScreen = document.querySelector("#startScreen");
const gameScreen = document.querySelector("#gameScreen");
const resultScreen = document.querySelector("#resultScreen");
const scoreText = document.querySelector("#scoreText");
const comboText = document.querySelector("#comboText");
const missText = document.querySelector("#missText");
const timerLabel = document.querySelector("#timerLabel");
const timeText = document.querySelector("#timeText");
const modeText = document.querySelector("#modeText");
const difficultyText = document.querySelector("#difficultyText");
const phaseText = document.querySelector("#phaseText");
const orderItems = document.querySelector("#orderItems");
const feedbackText = document.querySelector("#feedbackText");
const choiceGrid = document.querySelector("#choiceGrid");
const resultModeText = document.querySelector("#resultModeText");
const resultTitle = document.querySelector("#resultTitle");
const resultScoreLabel = document.querySelector("#resultScoreLabel");
const resultScore = document.querySelector("#resultScore");
const resultMaxCombo = document.querySelector("#resultMaxCombo");
const resultMiss = document.querySelector("#resultMiss");
const retryButton = document.querySelector("#retryButton");
const backToStartButton = document.querySelector("#backToStartButton");

const game = {
  mode: "time",
  difficulty: "normal",
  score: 0,
  successCount: 0,
  combo: 0,
  maxCombo: 0,
  misses: 0,
  timeLeft: 60,
  order: [],
  selected: [],
  timerId: 0,
  roundTimerId: 0,
  fadeTimerId: 0,
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

function getSettings() {
  return difficultySettings[game.difficulty];
}

function selectDifficulty(difficulty) {
  game.difficulty = difficulty;
  document.querySelectorAll("[data-difficulty]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.difficulty === difficulty);
  });
}

function startGame(mode) {
  clearInterval(game.timerId);
  clearTimeout(game.roundTimerId);
  clearTimeout(game.fadeTimerId);
  clearTimeout(game.feedbackTimerId);

  const settings = getSettings();
  game.mode = mode;
  game.score = 0;
  game.successCount = 0;
  game.combo = 0;
  game.maxCombo = 0;
  game.misses = 0;
  game.timeLeft = settings.timeLimit;
  game.isPlaying = true;
  game.isAnswering = false;

  modeText.textContent = mode === "time" ? `タイムアタック ${settings.timeLimit}秒` : "エンドレス ミスするまで";
  difficultyText.textContent = `難易度: ${settings.label} / x${settings.scoreMultiplier}`;
  timerLabel.textContent = mode === "time" ? "時間" : "成功";
  showScreen("game");
  renderChoiceButtons();
  setChoicesDisabled(true);
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

  const settings = getSettings();
  game.order = makeOrder(getItemCount(settings));
  game.selected = [];
  game.isAnswering = false;
  setChoicesDisabled(true);
  orderItems.classList.remove("is-fading", "size-large", "size-small");
  orderItems.classList.add(`size-${settings.chipSize}`);
  phaseText.textContent = "注文を覚えてください";
  renderOrder(false);

  const showTime = getShowTime(settings);
  game.fadeTimerId = window.setTimeout(() => {
    orderItems.classList.add("is-fading");
  }, Math.max(300, showTime - 260));

  game.roundTimerId = window.setTimeout(() => {
    game.isAnswering = true;
    setChoicesDisabled(false);
    phaseText.textContent = "同じ注文を選んでください";
    orderItems.classList.remove("is-fading");
    renderOrder(true);
  }, showTime);
}

function getItemCount(settings) {
  if (game.difficulty === "easy") {
    return settings.minItems;
  }

  const progressBonus = game.difficulty === "hard" ? Math.floor(game.combo / 4) : Math.floor(game.combo / 6);
  return Math.min(settings.maxItems, settings.minItems + progressBonus);
}

function getShowTime(settings) {
  if (game.difficulty !== "hard") {
    return settings.showTime;
  }

  return Math.max(1000, settings.showTime - game.combo * 45);
}

function makeOrder(count) {
  const shuffled = [...getSettings().menu].sort(() => Math.random() - 0.5);
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

function renderChoiceButtons() {
  choiceGrid.innerHTML = "";
  getSettings().menu.forEach((food) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.food = food;
    button.innerHTML = `${iconMap[food]}<span>${food}</span>`;
    button.addEventListener("click", () => chooseFood(food));
    choiceGrid.appendChild(button);
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
    game.combo += 1;
    game.successCount += 1;
    game.maxCombo = Math.max(game.maxCombo, game.combo);
    const earned = getEarnedScore();
    game.score += earned;
    showFeedback(`正解 +${earned}`);
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

function getEarnedScore() {
  const settings = getSettings();
  const comboBonus = Math.floor(game.combo / settings.comboBonusEvery);
  return settings.scoreMultiplier + comboBonus;
}

function setChoicesDisabled(disabled) {
  choiceGrid.querySelectorAll("button").forEach((button) => {
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
  timeText.textContent = game.mode === "time" ? Math.max(0, game.timeLeft) : game.successCount;
}

function finishGame() {
  clearInterval(game.timerId);
  clearTimeout(game.roundTimerId);
  clearTimeout(game.fadeTimerId);
  game.isPlaying = false;
  game.isAnswering = false;
  setChoicesDisabled(true);

  resultModeText.textContent = game.mode === "time" ? "タイムアタック結果" : "エンドレス結果";
  resultTitle.textContent = game.mode === "time" ? "時間切れ" : "記憶終了";
  resultScoreLabel.textContent = "スコア";
  resultScore.textContent = game.score;
  resultMaxCombo.textContent = game.maxCombo;
  resultMiss.textContent = game.misses;
  showScreen("result");
}

document.querySelectorAll("[data-difficulty]").forEach((button) => {
  button.addEventListener("click", () => selectDifficulty(button.dataset.difficulty));
});

document.querySelectorAll("[data-start-mode]").forEach((button) => {
  button.addEventListener("click", () => startGame(button.dataset.startMode));
});

retryButton.addEventListener("click", () => startGame(game.mode));
backToStartButton.addEventListener("click", () => {
  clearInterval(game.timerId);
  clearTimeout(game.roundTimerId);
  clearTimeout(game.fadeTimerId);
  game.isPlaying = false;
  showScreen("start");
});

window.addEventListener("resize", setAppHeight);
window.addEventListener("orientationchange", setAppHeight);

if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", setAppHeight);
}

setAppHeight();
renderChoiceButtons();
setChoicesDisabled(true);
