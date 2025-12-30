const SPECIAL_SYMBOL = "*";
const HOURGLASS_SYMBOL = "!";
const ALL_SYMBOLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + SPECIAL_SYMBOL + SPECIAL_SYMBOL;
// special symbol included twice to increase its chances of being selected

const STORAGE_KEY = "cardgame_card_count";
const HOURGLASS_DURATION = 90; // seconds

let hourglassTimer = null;

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

  if (symbol === HOURGLASS_SYMBOL) {
    return `
                <div class="card hourglass-card animate ${animation}" style="animation-delay: ${delay}ms; --deal-rotation: ${rotation}deg;" onclick="startHourglass(event)">
                    <div class="card-border"></div>
                    <div class="card-corner top-left">
                        <span class="card-letter hourglass-color">${HOURGLASS_SYMBOL}</span>
                    </div>
                    <div class="card-center hourglass-container">
                        <div class="hourglass">
                            <div class="hourglass-top">
                                <div class="sand-top"></div>
                            </div>
                            <div class="hourglass-middle"></div>
                            <div class="hourglass-bottom">
                                <div class="sand-bottom"></div>
                            </div>
                        </div>
                    </div>
                    <div class="card-corner bottom-right">
                        <span class="card-letter hourglass-color">${HOURGLASS_SYMBOL}</span>
                    </div>
                </div>
            `;
  }

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

function startHourglass(event) {
  event.stopPropagation(); // Prevent dealing new cards

  const card = event.currentTarget;
  const sandTop = card.querySelector(".sand-top");
  const sandBottom = card.querySelector(".sand-bottom");

  // Reset any existing timer
  if (hourglassTimer) {
    clearInterval(hourglassTimer);
  }

  // Reset sand
  sandTop.style.transition = "none";
  sandBottom.style.transition = "none";
  sandTop.style.height = "100%";
  sandBottom.style.height = "0%";

  // Force reflow
  sandTop.offsetHeight;

  // Start animation
  sandTop.style.transition = `height ${HOURGLASS_DURATION}s linear`;
  sandBottom.style.transition = `height ${HOURGLASS_DURATION}s linear`;
  sandTop.style.height = "0%";
  sandBottom.style.height = "100%";

  // Add running class for visual feedback
  card.classList.add("hourglass-running");

  // Remove running class when done
  hourglassTimer = setTimeout(() => {
    card.classList.remove("hourglass-running");
    card.classList.add("hourglass-done");
    setTimeout(() => card.classList.remove("hourglass-done"), 1000);
  }, HOURGLASS_DURATION * 1000);
}

function dealCards(count) {
  const container = document.getElementById("cardsContainer");
  container.innerHTML = "";

  // Clear any running hourglass timer
  if (hourglassTimer) {
    clearTimeout(hourglassTimer);
    hourglassTimer = null;
  }

  const usedSymbols = new Set();
  const cards = [];

  // Always add one hourglass card
  const hourglassPosition = Math.floor(Math.random() * (count + 1));

  for (let i = 0; i < count + 1; i++) {
    if (i === hourglassPosition) {
      cards.push({ symbol: HOURGLASS_SYMBOL, color: null });
    } else {
      const symbol = getRandomSymbol(usedSymbols);
      if (symbol === null) break;
      usedSymbols.add(symbol);
      const color = getRandomColor();
      cards.push({ symbol, color });
    }
  }

  cards.forEach((card, i) => {
    const animation = getRandomAnimation();
    const delay = i * 200;
    container.innerHTML += createCard(card.symbol, card.color, animation, delay);
  });
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
    if (e.target.closest(".hourglass-card")) return;

    const count = localStorage.getItem(STORAGE_KEY);
    if (count) {
      dealCards(parseInt(count, 10));
    }
  });
}

init();
