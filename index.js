const SPECIAL_SYMBOL = "*";
const HOURGLASS_SYMBOL = "!";
const ALL_SYMBOLS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + SPECIAL_SYMBOL + SPECIAL_SYMBOL;
// special symbol included twice to increase its chances of being selected

const STORAGE_KEY = "cardgame_card_count";
const STORAGE_SEED = "cardgame_seed";
const STORAGE_ITERATION = "cardgame_iteration";
const HOURGLASS_DURATION = 90; // seconds

let hourglassTimer = null;

// Seeded random number generator (Mulberry32)
let currentSeed = 1;
let currentIteration = 0;

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let seededRandom = mulberry32(currentSeed);

function initializeRandom(seed, iteration) {
  currentSeed = seed;
  currentIteration = iteration;
  // Recreate the random generator from the seed
  seededRandom = mulberry32(seed);
  // Advance to the current iteration
  for (let i = 0; i < iteration * 100; i++) {
    seededRandom();
  }
}

function nextIteration() {
  currentIteration++;
  localStorage.setItem(STORAGE_ITERATION, currentIteration.toString());
}

function seededRandomValue() {
  return seededRandom();
}

function getRandomSymbol(usedSymbols) {
  const available = ALL_SYMBOLS.split("").filter((s) => !usedSymbols.has(s));
  if (available.length === 0) return null;
  return available[Math.floor(seededRandomValue() * available.length)];
}

function getRandomColor() {
  return seededRandomValue() < 0.5 ? "red" : "green";
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
  return animations[Math.floor(seededRandomValue() * animations.length)];
}

function createCard(symbol, color, animation, delay) {
  const rotation = seededRandomValue() * 90 - 45; // Random rotation between -45 and 45 degrees

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

  // Advance to next iteration for deterministic randomness
  nextIteration();
  updateIterationDisplay();

  const usedSymbols = new Set();
  const cards = [];

  // Always add one hourglass card
  const hourglassPosition = Math.floor(seededRandomValue() * (count + 1));

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

  // Get seed from slider
  const seedSlider = document.getElementById("seedSlider");
  const seed = parseInt(seedSlider.value, 10);
  localStorage.setItem(STORAGE_SEED, seed.toString());
  localStorage.setItem(STORAGE_ITERATION, "0");

  initializeRandom(seed, 0);
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
  const savedSeed = localStorage.getItem(STORAGE_SEED);
  const savedIteration = localStorage.getItem(STORAGE_ITERATION);

  if (savedCount && savedSeed) {
    // Restore game state
    const seed = parseInt(savedSeed, 10);
    const iteration = parseInt(savedIteration || "0", 10);
    initializeRandom(seed, iteration);

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

function updateSeedDisplay(value) {
  document.getElementById("seedValue").textContent = value;
}

function updateIterationDisplay() {
  const display = document.getElementById("iterationDisplay");
  if (display) {
    display.textContent = `#${currentIteration}`;
  }
}

init();
