const LOCAL_STORAGE_KEY = 'penguinMexGameState';
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day in milliseconds

function getGameStateForStorage() {
    // Handle Map serialization for overtakenPlayersMap
    const overtakenPlayersArray = Array.from(overtakenPlayersMap.entries());
    // Handle Infinity for roundLowestScore
    const storableRoundLowestScore = (roundLowestScore === Infinity) ? Number.MAX_SAFE_INTEGER : roundLowestScore;

    return {
        // Globals
        players,
        currentRound,
        gameState,
        roundThrowsLimit,
        mexCountThisRound,
        roundLowestScore: storableRoundLowestScore,
        currentRoundLowestPlayerIds,
        onlyMexRolledSoFar,
        roundTurnOrder,
        currentPlayerId,
        lastRoundLoserIds,
        overtakenPlayersMap: overtakenPlayersArray, // Store as array
        longestTurnDrinkEnabled,

        // Player Round Data
        playerRoundData,

        // Current Turn State
        throwsThisTurn,
        currentDice,
        currentScoreResult,
        heldDice,
        lockedDieIndex,
        allowHolding,

        // Timestamp
        timestamp: Date.now()
    };
}

function saveGameState() {
    try {
        const stateToSave = getGameStateForStorage();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        // console.log("Game state saved.");
    } catch (error) {
        console.error("Error saving game state to localStorage:", error);
    }
}

function loadGameState() {
    try {
        const savedStateString = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!savedStateString) {
            // console.log("No saved game state found.");
            return false; // No state to load
        }

        const savedState = JSON.parse(savedStateString);

        // Check timestamp
        if (Date.now() - savedState.timestamp > MAX_AGE_MS) {
            console.log("Saved game state is older than 1 day. Not loading.");
            localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear old state
            return false;
        }

        // Repopulate global variables
        players = savedState.players || [];
        currentRound = savedState.currentRound || 0;
        gameState = savedState.gameState || 'setup';
        roundThrowsLimit = savedState.roundThrowsLimit || 3;
        mexCountThisRound = savedState.mexCountThisRound || 0;
        roundLowestScore = (savedState.roundLowestScore === Number.MAX_SAFE_INTEGER) ? Infinity : (savedState.roundLowestScore || Infinity);
        currentRoundLowestPlayerIds = savedState.currentRoundLowestPlayerIds || [];
        onlyMexRolledSoFar = (savedState.onlyMexRolledSoFar === undefined) ? true : savedState.onlyMexRolledSoFar;
        roundTurnOrder = savedState.roundTurnOrder || [];
        currentPlayerId = savedState.currentPlayerId || null;
        lastRoundLoserIds = savedState.lastRoundLoserIds || [];
        
        // Reconstruct Map for overtakenPlayersMap
        overtakenPlayersMap = new Map(savedState.overtakenPlayersMap || []);
        
        longestTurnDrinkEnabled = savedState.longestTurnDrinkEnabled || false;

        playerRoundData = savedState.playerRoundData || {};

        throwsThisTurn = savedState.throwsThisTurn || 0;
        currentDice = savedState.currentDice || [0, 0];
        currentScoreResult = savedState.currentScoreResult || {};
        heldDice = savedState.heldDice || [false, false];
        lockedDieIndex = savedState.lockedDieIndex !== undefined ? savedState.lockedDieIndex : null;
        allowHolding = savedState.allowHolding || false;

        console.log("Game state loaded successfully.");
        return true; // State loaded

    } catch (error) {
        console.error("Error loading game state from localStorage:", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear potentially corrupted state
        return false;
    }
}

function clearSavedGameStateAndResetApp() {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    console.log("Saved game state cleared.");

    // Reset all relevant global variables to their initial state
    players = [];
    playerRoundData = {};
    currentRound = 0;
    gameState = 'setup'; // Critical to go back to setup
    roundThrowsLimit = 3;
    mexCountThisRound = 0;
    roundLowestScore = Infinity;
    currentRoundLowestPlayerIds = [];
    onlyMexRolledSoFar = true;
    roundTurnOrder = [];
    currentPlayerId = null;
    lastRoundLoserIds = [];
    overtakenPlayersMap = new Map();
    longestTurnDrinkEnabled = false;
    throwsThisTurn = 0;
    currentDice = [0, 0];
    currentScoreResult = {};
    heldDice = [false, false];
    lockedDieIndex = null;
    allowHolding = false;
    animationInterval = null; // Clear any animation interval reference

    // Update UI to reflect reset
    setupFaseDiv.style.display = 'flex';
    spelFaseDiv.style.display = 'none';
    rondeResultatenDiv.style.display = 'none';
    playerInput.value = '';
    updatePlayerListForSetup(); // In setup.js
    checkStartGameButtonState(); // In helpers.js
    hideMessage(); // In helpers.js
    if (settingsMenu.classList.contains('visible')) {
        hideSettingsMenuAndSave(); // Close settings menu if open
    }
    alert("Opgeslagen speldata is gewist. Je kunt een nieuw spel starten.");
}

function restoreUIFromState() {
    // This function is crucial for making the loaded state visible.
    hideMessage(); // Start fresh with messages

    if (gameState === 'setup') {
        setupFaseDiv.style.display = 'flex';
        spelFaseDiv.style.display = 'none';
        rondeResultatenDiv.style.display = 'none';
        updatePlayerListForSetup();
        checkStartGameButtonState();
        // playerInput might need to be focused or cleared depending on exact setup state
    } else if (gameState === 'playing' || gameState === 'turnOver' || gameState === 'roundOver') {
        setupFaseDiv.style.display = 'none';
        spelFaseDiv.style.display = 'flex'; // Show game phase container

        // Update round title
        rondeTitel.textContent = `Ronde ${currentRound}`;

        // Dice display
        updateDiceDisplay(); // In dice.js - uses currentDice & heldDice

        // Score display
        if (currentScoreResult && currentScoreResult.display) {
            scoreDisplayDiv.textContent = `Score: ${currentScoreResult.display}`;
        } else {
            scoreDisplayDiv.textContent = "Score: -";
        }

        // Player turn info
        if (currentPlayerId && playerRoundData[currentPlayerId]) {
            const playerGlobalInfo = players.find(p => p.id === currentPlayerId);
            spelerAanZetH3.textContent = `${playerGlobalInfo ? playerGlobalInfo.name : playerRoundData[currentPlayerId].name}`;
            worpTellerSpan.textContent = throwsThisTurn;
            maxWorpenSpan.textContent = roundThrowsLimit;
        } else if (gameState !== 'roundOver') { // Only clear if not showing results
            spelerAanZetH3.textContent = "Speler: ...";
            worpTellerSpan.textContent = "0";
        }

        // Button states
        mainActionBtn.disabled = false; // Default, specific states will override
        showLowestBtn.disabled = false;

        if (gameState === 'playing') {
            mainActionBtn.textContent = "Gooi";
            // Dice elements might need .clickable class if allowHolding is true
            if (allowHolding) {
                die1Div.classList.add('clickable');
                die2Div.classList.add('clickable');
            } else {
                die1Div.classList.remove('clickable');
                die2Div.classList.remove('clickable');
            }
            // Make sure held dice are visually marked
            die1Div.classList.toggle('held', heldDice[0]);
            die2Div.classList.toggle('held', heldDice[1]);

        } else if (gameState === 'turnOver') {
            mainActionBtn.textContent = "Volgende Speler";
            showLowestBtn.disabled = true;
            die1Div.classList.remove('clickable', 'held');
            die2Div.classList.remove('clickable', 'held');
        } else if (gameState === 'roundOver') {
            // Need to reconstruct and show the round results screen
            // This is the most complex UI restoration part.
            // We need to essentially call parts of endRound() that deal with UI.
            mainActionBtn.disabled = true;
            mainActionBtn.textContent = "Ronde Klaar";
            showLowestBtn.disabled = true;
            document.getElementById('message-wrapper').style.display = 'none';
            diceContainer.style.display = 'none';
            spelInfoDiv.style.display = 'none';
            scoreDisplayDiv.style.display = 'none';
            actieKnoppenDiv.style.display = 'none';
            
            // Re-populate results (this might need to call a modified endRound or a new displayResults function)
            // For now, let's assume endRound() can be called if gameState is roundOver,
            // but it might re-calculate things. A dedicated display function is better.
            // Let's make a simplified version for now.
            displayRoundResultsUI(); // We'll define this helper or integrate into endRound.

            rondeResultatenDiv.style.display = 'block';
            nextRoundBtn.style.display = 'block';
            nextRoundBtn.disabled = false;
        }

        // Show/hide elements based on game state (spel-info, dice-container, etc.)
        spelInfoDiv.style.display = (gameState === 'playing' || gameState === 'turnOver') ? 'flex' : 'none';
        diceContainer.style.display = (gameState === 'playing' || gameState === 'turnOver') ? 'flex' : 'none';
        scoreDisplayDiv.style.display = (gameState === 'playing' || gameState === 'turnOver') ? 'block' : 'none';
        actieKnoppenDiv.style.display = (gameState === 'playing' || gameState === 'turnOver') ? 'flex' : 'none';
        rondeResultatenDiv.style.display = (gameState === 'roundOver') ? 'block' : 'none';
        if(gameState !== 'roundOver') document.getElementById('message-wrapper').style.display = '';


    } else {
        console.warn("Loaded game state is unknown:", gameState);
        // Default to setup
        setupFaseDiv.style.display = 'flex';
        spelFaseDiv.style.display = 'none';
    }
}

// Helper to display results UI without re-calculating logic
// This should ideally use the already calculated and saved data from playerRoundData, overtakenPlayersMap etc.
// The original endRound() does a lot of calculation. If that's saved, we just display it.
// For now, this is a placeholder; true restoration of endRound UI is complex.
// The most important parts of endRound were to calculate drinksToTake and populate action messages
// and score history. playerRoundData *should* have this.
function displayRoundResultsUI() {
    const drinksMultiplier = Math.pow(2, mexCountThisRound); // Recalculate for display consistency

    // These calls are to re-generate messages from loaded data.
    // If playerRoundData.drinksToTake was already comprehensive, we might not need all these.
    let allActionMessages = [];
    allActionMessages.push(...calculateSpecialActionMessages()); // from round.js
    allActionMessages.push(...calculateOvertakeMessagesAndUpdateDrinks(true)); // from round.js - pass flag to *not* add to drinksToTake again
    
    const { messages: lowestScoreMessages, lowestScoreDisplayForMessage, actualLowestPlayerIdsForPenalty } = calculateLowestScorePenalty(drinksMultiplier, true); // from round.js - flag
    allActionMessages.push(...lowestScoreMessages);
    
    allActionMessages.push(...calculateLongestTurnPenalty(drinksMultiplier, true)); // from round.js - flag

    let actionsHTML = "";
    actionsHTML = '<div class="actions-section">';
    actionsHTML += allActionMessages.length > 0 ? allActionMessages.join('<br>') : "Geen speciale acties deze ronde.";
    if (mexCountThisRound > 0) {
        const mexWord = numberToWord(mexCountThisRound);
        actionsHTML += `<br><em>(Drankjes x${drinksMultiplier} door ${mexWord} Mex worp${mexCountThisRound > 1 ? 'en' : ''})</em>`;
    }
    actionsHTML += '</div>';
    resultatenActiesDiv.innerHTML = actionsHTML;
    resultatenScoresDiv.innerHTML = buildScoresHtml(); // from round.js

    // Highlight lowest scores
    if (lowestScoreDisplayForMessage && roundLowestScore !== 1000 && actualLowestPlayerIdsForPenalty) {
        actualLowestPlayerIdsForPenalty.forEach(playerId => {
            const finalThrowSpan = resultatenScoresDiv.querySelector(`.throw-history[data-player-id="${playerId}"] .final-throw`);
            if (finalThrowSpan && finalThrowSpan.textContent === lowestScoreDisplayForMessage && finalThrowSpan.dataset.scoreType === 'normal') {
                finalThrowSpan.classList.add('lowest-score-highlight');
            }
        });
    }

    // Lowest score announcement banner
    const announcementDiv = document.getElementById('lowest-score-announcement');
    if (actualLowestPlayerIdsForPenalty && actualLowestPlayerIdsForPenalty.length > 0 && playerRoundData[actualLowestPlayerIdsForPenalty[0]] /*&& playerRoundData[actualLowestPlayerIdsForPenalty[0]].drinksToTake > 0*/) {
         const loserNames = actualLowestPlayerIdsForPenalty.map(id => playerRoundData[id]?.name || id).join(' en ');
         const penaltyDrinks = 1 * drinksMultiplier;
         announcementDiv.textContent = `${loserNames} laag - ${penaltyDrinks} ${pluralizeSlok(penaltyDrinks)}!`;
    } else {
        announcementDiv.textContent = "";
    }

    // Longest turn announcement
    const longestTurnAnnouncementDiv = document.getElementById('longest-turn-announcement');
    let longestTurnPlayerIdForDisplay = null;
    if (longestTurnDrinkEnabled) {
        let maxDuration = -1;
        for (const playerId in playerRoundData) {
             if (playerRoundData[playerId]?.isActive && playerRoundData[playerId]?.turnDuration > maxDuration) {
                maxDuration = playerRoundData[playerId].turnDuration;
                longestTurnPlayerIdForDisplay = playerId;
            }
        }
        if (longestTurnPlayerIdForDisplay && playerRoundData[longestTurnPlayerIdForDisplay]?.turnDuration > 0) {
            const drinksForLongest = 1 * drinksMultiplier;
            longestTurnAnnouncementDiv.textContent = `${playerRoundData[longestTurnPlayerIdForDisplay].name} atje des - ${drinksForLongest} ${pluralizeSlok(drinksForLongest)}!`;
            longestTurnAnnouncementDiv.style.display = 'block';
        } else {
            longestTurnAnnouncementDiv.style.display = 'none';
        }
    } else {
         longestTurnAnnouncementDiv.style.display = 'none';
    }

    rondeResultatenDiv.classList.add('showing-results');
    rondeResultatenDiv.insertBefore(nextRoundBtn, resultsHeader.previousElementSibling);
}

// Modify sub-functions in round.js to accept a 'displayOnly' flag
// to prevent them from re-adding drinks when called by displayRoundResultsUI.
// Example for one of them:
function calculateOvertakeMessagesAndUpdateDrinks(displayOnly = false) {
    const messages = [];
    if (overtakenPlayersMap.size > 0) {
        overtakenPlayersMap.forEach((totalOvertakeDrinks, playerId) => {
            const overtakenPlayerData = playerRoundData[playerId];
            if (overtakenPlayerData) {
                messages.push(`<strong>${overtakenPlayerData.name}</strong> drinkt ${totalOvertakeDrinks} ${pluralizeSlok(totalOvertakeDrinks)} (laag overgenomen)`);
                if (!displayOnly) { // Only update drinks if not in display-only mode
                    overtakenPlayerData.drinksToTake += totalOvertakeDrinks;
                }
            }
        });
    }
    return messages;
}
// Similar modifications for calculateLowestScorePenalty and calculateLongestTurnPenalty in round.js