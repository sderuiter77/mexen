// --- JavaScript ---

// Globale Variabelen
let players = []; // Array of player objects { id: guid, name: string, active: boolean (global status) }
let playerRoundData = {}; // Object keyed by playerId, stores { name, scoreDisplay, ..., isActive (for current round), turnDuration, finalThrowValue, etc. }
let currentRound = 0;
let gameState = 'setup'; // Possible states: 'setup', 'playing', 'turnOver', 'roundOver'
let roundThrowsLimit = 3;
let mexCountThisRound = 0; // Number of "Mex" rolls this round, affects drink multiplier
let roundLowestScore = Infinity; // Lowest score achieved in the current round (excluding special 31/32)
let currentRoundLowestPlayerIds = []; // Array of player IDs who currently have the roundLowestScore
let onlyMexRolledSoFar = true; // Tracks if only "Mex" has been rolled (for first player setting throw limit)
let roundTurnOrder = []; // Array of player IDs defining the turn order for the current round
let currentPlayerId = null; // ID of the player whose turn it is
let lastRoundLoserIds = []; // Array of player IDs who had the lowest score in the last round
let overtakenPlayersMap = new Map(); // Map<playerId, drinksToTake> for players whose low score was "overtaken"

// Settings
let longestTurnDrinkEnabled = false; // Default value

// Timer variable for turn duration (managed within turn logic)

// Current Turn State (reset at the start of each player's turn)
let throwsThisTurn = 0;
let currentDice = [0, 0]; // Values of the two dice
let currentScoreResult = {}; // Result of the current dice roll { value, display, type }
let heldDice = [false, false]; // Boolean array indicating if die1 or die2 is held
let lockedDieIndex = null; // Index (0 or 1) of a die that was held and cannot be re-held this turn
let allowHolding = false; // Whether dice holding is currently allowed
let animationInterval = null; // Interval ID for dice roll animation

// DOM Elementen (using const for references)
const setupFaseDiv = document.getElementById('setup-fase');
const spelFaseDiv = document.getElementById('spel-fase');
const playerInput = document.getElementById('player-input');
const addPlayerBtn = document.getElementById('add-player-btn');
const playerListUl = document.getElementById('player-list');
const startGameBtn = document.getElementById('start-game-btn');

const rondeTitel = document.getElementById('ronde-titel');
const spelerAanZetH3 = document.getElementById('speler-aan-zet');
const die1Div = document.getElementById('die1');
const die2Div = document.getElementById('die2');
const scoreDisplayDiv = document.getElementById('score-display');
const worpTellerSpan = document.getElementById('worp-teller');
const maxWorpenSpan = document.getElementById('max-worpen');
const messageAreaDiv = document.getElementById('message-area');
const mainActionBtn = document.getElementById('main-action-btn');
const nextRoundBtn = document.getElementById('next-round-btn');
const showLowestBtn = document.getElementById('show-lowest-btn');

const rondeResultatenDiv = document.getElementById('ronde-resultaten');
const resultsHeader = document.getElementById('results-header');
const resultatenScoresDiv = document.getElementById('resultaten-scores');
const resultatenActiesDiv = document.getElementById('resultaten-acties');
const diceContainer = document.querySelector('.dice-container');
const spelInfoDiv = document.getElementById('spel-info');
const actieKnoppenDiv = document.getElementById('actie-knoppen');

// Settings DOM Elements
const settingsMenu = document.getElementById('settings-menu');
const saveSettingsButton = document.getElementById('save-settings-button');
const settingsPlayerList = document.getElementById('settings-player-list');
const settingsPlayerInput = document.getElementById('settings-player-input');
const settingsAddPlayerBtn = document.getElementById('settings-add-player-btn');
// Note: settingsButton is selected in listeners.js via querySelectorAll

// Sound Element References
const soundDiceRoll = document.getElementById('sound-dice-roll');
const soundShowLowest = document.getElementById('sound-show-lowest');
// Add other sound elements if they exist in HTML and are used:
// const soundButtonClick = document.getElementById('sound-button-click');
// const soundHoldDie = document.getElementById('sound-hold-die');
// const soundMex = document.getElementById('sound-mex');
// const soundSpecial = document.getElementById('sound-special');
// const soundError = document.getElementById('sound-error');
// const soundRoundEnd = document.getElementById('sound-round-end');
// const soundPlayerAdded = document.getElementById('sound-player-added');