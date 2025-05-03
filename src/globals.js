// --- JavaScript ---

// Globale Variabelen
let players = [];
let playerRoundData = [];
let currentRound = 0;
let gameState = 'setup';
let roundThrowsLimit = 3;
let mexCountThisRound = 0;
let roundLowestScore = Infinity;
let roundLowestPlayerIndices = [];
let onlyMexRolledSoFar = true;
let roundTurnOrder = [];
let currentPlayerIndex = 0;
let lastRoundLowestIndices = [];
let overtakenPlayersMap = new Map();

// Current Turn State
let throwsThisTurn = 0;
let currentDice = [0, 0];
let currentScoreResult = {};
let heldDice = [false, false];
let lockedDieIndex = null;
let allowHolding = false;
let animationInterval = null;

// DOM Elementen

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
const mainActionBtn = document.getElementById('main-action-btn'); // Restored main button reference
const nextRoundBtn = document.getElementById('next-round-btn');
const showLowestBtn = document.getElementById('show-lowest-btn');
const rondeResultatenDiv = document.getElementById('ronde-resultaten');
const resultatenScoresDiv = document.getElementById('resultaten-scores');
const resultatenActiesDiv = document.getElementById('resultaten-acties');
const diceContainer = document.querySelector('.dice-container');
const spelInfoDiv = document.getElementById('spel-info');
const actieKnoppenDiv = document.getElementById('actie-knoppen');
const setupFaseDiv = document.getElementById('setup-fase');

// Settings DOM Elements
const settingsButton = document.getElementById('settings-button');
const settingsMenu = document.getElementById('settings-menu');
const saveSettingsButton = document.getElementById('save-settings-button');
const settingsPlayerList = document.getElementById('settings-player-list');
const settingsPlayerInput = document.getElementById('settings-player-input');
const settingsAddPlayerBtn = document.getElementById('settings-add-player-btn');

// Sound Element References
const soundDiceRoll = document.getElementById('sound-dice-roll');
const soundButtonClick = document.getElementById('sound-button-click');
const soundHoldDie = document.getElementById('sound-hold-die');
const soundMex = document.getElementById('sound-mex');
const soundSpecial = document.getElementById('sound-special');
const soundError = document.getElementById('sound-error');
const soundRoundEnd = document.getElementById('sound-round-end');
const soundPlayerAdded = document.getElementById('sound-player-added');
const soundShowLowest = document.getElementById('sound-show-lowest'); // Added
