const SPECIAL_SYMBOL = "*";
const ALL_SYMBOLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + SPECIAL_SYMBOL + SPECIAL_SYMBOL;
// special symbol included twice to increase its chances of being selected

const STORAGE_KEY = "cardgame_card_count";

function getRandomSymbol(usedSymbols) {
  const available = ALL_SYMBOLS.split("").filter((s) => !usedSymbols.has(s));
  if (available.length === 0) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function getRandomColor() {
  return Math.random() < 0.5 ? "red" : "green";
}

function getRandomAnimation() {
  const animations = [
    "spin-in",
    "slide-left",
    "slide-right",
    "drop-bounce",
    "rise-up",
    "flip-x",
    "zoom-spin",
    "spiral",
    "wobble-in",
    "elastic",
  ];
  return animations[Math.floor(Math.random() * animations.length)];
}

function createCard(symbol, color, animation, delay) {
  const rotation = Math.random() * 90 - 45; // Random rotation between -15 and 15 degrees

  if (symbol === SPECIAL_SYMBOL) {
    return `
                <div class="card animate ${animation}" style="animation-delay: ${delay}ms; --deal-rotation: ${rotation}deg;">
                    <div class="card-border"></div>
                    <div class="card-corner top-left">
                        <span class="card-letter sync-split">${symbol}</span>
                    </div>
                    <span class="card-center sync-split sync-large">${symbol}</span>
                    <div class="card-corner bottom-right">
                        <span class="card-letter sync-split">${symbol}</span>
                    </div>
                </div>
            `;
  }

  return `
                <div class="card animate ${animation}" style="animation-delay: ${delay}ms; --deal-rotation: ${rotation}deg;">
                    <div class="card-border"></div>
                    <div class="card-corner top-left">
                        <span class="card-letter ${color}">${symbol}</span>
                    </div>
                    <span class="card-center ${color}">${symbol}</span>
                    <div class="card-corner bottom-right">
                        <span class="card-letter ${color}">${symbol}</span>
                    </div>
                </div>
            `;
}

function dealCards(count) {
  const container = document.getElementById("cardsContainer");
  container.innerHTML = "";

  const usedSymbols = new Set();

  for (let i = 0; i < count; i++) {
    const symbol = getRandomSymbol(usedSymbols);
    if (symbol === null) break; // No more unique symbols available
    usedSymbols.add(symbol);

    const color = getRandomColor();
    const animation = getRandomAnimation();
    const delay = i * 200;
    container.innerHTML += createCard(symbol, color, animation, delay);
  }
}

function selectCardCount(count) {
  localStorage.setItem(STORAGE_KEY, count.toString());
  startGame(count);
}

function startGame(count) {
  hideSetup();
  dealCards(count);
}

function showSetup() {
  const setupScreen = document.getElementById("setupScreen");
  setupScreen.classList.remove("hidden");
  const container = document.getElementById("cardsContainer");
  container.innerHTML = "";
  document.getElementById("settingsIcon").classList.add("hidden");
}

function hideSetup() {
  const setupScreen = document.getElementById("setupScreen");
  setupScreen.classList.add("hidden");
  document.getElementById("settingsIcon").classList.remove("hidden");
}

// Initialize on page load
function init() {
  const savedCount = localStorage.getItem(STORAGE_KEY);

  if (savedCount) {
    // Card count already selected, start game directly
    hideSetup();
    dealCards(parseInt(savedCount, 10));
  } else {
    document.getElementById("settingsIcon").classList.add("hidden");
  }
  
  document.body.addEventListener("click", (e) => {
    // Don't trigger on setup screen, settings icon, or buttons
    if (e.target.closest(".setup-screen")) return;
    if (e.target.closest(".settings-icon")) return;

    const count = localStorage.getItem(STORAGE_KEY);
    if (count) {
      dealCards(parseInt(count, 10));
    }
  });
}

init();
