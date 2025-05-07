function createNewPlayerRoundData(playerName) {
    return {
        name: playerName,
        scoreDisplay: null, // Display string of their final score for the round
        drinksToTake: 0,    // Accumulated from various penalties
        finalThrowValue: null, // Numerical value of their final score
        throwsHistory: [],  // Array of { scoreResult } for each throw
        drinksGivenFrom31: 0,
        drinksTakenFrom32: 0,
        isActive: true,     // Is player active for *this* round (can be set false if removed mid-round after playing)
        turnDuration: 0,    // Time taken for their turn in ms
        turnStartTime: 0    // Timestamp when turn started
    };
}

function startNewRound() {
    // Filter out globally inactive players permanently before starting a new round setup
    players = players.filter(player => player.active);

    if (players.length === 0) {
        console.warn("startNewRound: No active players to start a new round!");
        alert("Geen actieve spelers meer. Ga terug naar setup om spelers toe te voegen.");
        gameState = 'setup';
        setupFaseDiv.style.display = 'flex';
        spelFaseDiv.style.display = 'none';
        return;
    }

    currentRound++;
    rondeTitel.textContent = `Ronde ${currentRound}`;

    // Reset round-specific variables
    roundThrowsLimit = 3;
    mexCountThisRound = 0;
    roundLowestScore = Infinity;
    currentRoundLowestPlayerIds = []; // Renamed from roundLowestPlayerIndices to use IDs
    onlyMexRolledSoFar = true;
    overtakenPlayersMap.clear();
    // lockedDieIndex is reset per turn

    // Reset playerRoundData for all players in the `players` array (they are all active for this new round)
    const newPlayerRoundData = {};
    players.forEach(p => {
        newPlayerRoundData[p.id] = createNewPlayerRoundData(p.name);
        newPlayerRoundData[p.id].isActive = true; // Explicitly active for this round
    });
    playerRoundData = newPlayerRoundData;


    // --- Determine Turn Order (Points 1 & 2) ---
    roundTurnOrder = [];
    const activePlayerIdsForNewRound = players.map(p => p.id); // All players in `players` are active at round start

    if (currentRound === 1 || lastRoundLoserIds.length === 0) {
        // Rule 1: First round or no designated loser from previous round
        roundTurnOrder = [...activePlayerIdsForNewRound];
    } else {
        // Rule 2: Subsequent rounds - start with loser(s), then cycle through `players` array order
        // Find the first loser ID that is still an active player
        const startingPlayerId = lastRoundLoserIds.find(id => activePlayerIdsForNewRound.includes(id));

        if (startingPlayerId) {
            const startIndexInPlayersArray = players.findIndex(p => p.id === startingPlayerId); // Use master `players` array for cycling

            if (startIndexInPlayersArray !== -1) {
                // Add players from starting point to end of players array
                for (let i = startIndexInPlayersArray; i < players.length; i++) {
                    if (playerRoundData[players[i].id]?.isActive) { // Check round active status
                        roundTurnOrder.push(players[i].id);
                    }
                }
                // Add players from start of players array to starting point (wrap around)
                for (let i = 0; i < startIndexInPlayersArray; i++) {
                    if (playerRoundData[players[i].id]?.isActive) { // Check round active status
                        roundTurnOrder.push(players[i].id);
                    }
                }
            } else {
                // Fallback: starting player (loser) is no longer in the game or active globally
                roundTurnOrder = [...activePlayerIdsForNewRound];
            }
        } else {
            // Fallback: No valid loser ID found (e.g., all losers became inactive)
            roundTurnOrder = [...activePlayerIdsForNewRound];
        }
    }
    
    // Safety check: ensure all active players for the round are in the turn order exactly once
    const finalTurnOrderCheck = [];
    activePlayerIdsForNewRound.forEach(id => {
        if (roundTurnOrder.includes(id) && !finalTurnOrderCheck.includes(id)) {
            finalTurnOrderCheck.push(id);
        }
    });
    // If roundTurnOrder somehow got messed up, rebuild from active players.
    // This also ensures that if roundTurnOrder was shorter (e.g. due to only adding a subset above), it gets fixed.
    if (finalTurnOrderCheck.length !== activePlayerIdsForNewRound.length) {
        console.warn("Turn order discrepancy fixed. Original:", roundTurnOrder, "Active:", activePlayerIdsForNewRound);
        roundTurnOrder = [];
        const tempStartingId = (currentRound > 1 && lastRoundLoserIds.length > 0) ? lastRoundLoserIds.find(id => activePlayerIdsForNewRound.includes(id)) : null;
        const tempStartIndex = tempStartingId ? players.findIndex(p => p.id === tempStartingId) : 0;

        for (let i = 0; i < activePlayerIdsForNewRound.length; i++) {
            const playerIndexInMaster = (tempStartIndex + i) % activePlayerIdsForNewRound.length;
            const masterPlayerOrderRefId = players[playerIndexInMaster]?.id; // Get ID from master player list
            // Find this ID in the active players for this round to maintain cyclical order from master
            if (activePlayerIdsForNewRound.includes(masterPlayerOrderRefId)) {
                 roundTurnOrder.push(masterPlayerOrderRefId);
            }
        }
        // If some active players are still missing, append them (should not happen with above logic)
        activePlayerIdsForNewRound.forEach(id => {
            if (!roundTurnOrder.includes(id)) roundTurnOrder.push(id);
        });

    }


    if (roundTurnOrder.length === 0 && activePlayerIdsForNewRound.length > 0) {
        console.error("CRITICAL: Turn order is empty but active players exist. Defaulting to player order.");
        roundTurnOrder = [...activePlayerIdsForNewRound];
    }
    if (roundTurnOrder.length === 0) { // Should be caught by players.length === 0 earlier
        console.error("CRITICAL: No players in turn order after setup!");
        // Game cannot proceed, perhaps go back to setup
        return;
    }
    
    currentPlayerId = roundTurnOrder[0];

    // UI Updates for new round
    rondeResultatenDiv.style.display = 'none';
    rondeResultatenDiv.classList.remove('showing-results');
    document.getElementById('lowest-score-announcement').textContent = '';
    document.getElementById('longest-turn-announcement').textContent = '';
    nextRoundBtn.disabled = true;
    hideMessage();

    diceContainer.style.display = 'flex';
    spelInfoDiv.style.display = 'flex';
    scoreDisplayDiv.style.display = 'block';
    actieKnoppenDiv.style.display = 'flex';
    document.getElementById('message-wrapper').style.display = '';

    setupPlayerTurn();
    saveGameState();
}

function checkRoundEnd() {
    // Rule 6 implicitly handled by advanceToNextPlayer.
    // This function now checks if all players in the turn order who are *supposed* to play this round
    // have indeed completed their turn or are marked inactive for the round.
    if (players.length === 0) return true;

    for (const playerId of roundTurnOrder) {
        const pData = playerRoundData[playerId];
        const pGlobal = players.find(p => p.id === playerId); // Check global status too

        // If player is supposed to be in this round (pData exists) AND
        // they are globally active AND active for this round AND haven't finished their turn
        if (pData && pGlobal?.active && pData.isActive && pData.finalThrowValue === null) {
            return false; // Found an active player yet to complete their turn
        }
    }
    return true; // All players have completed their turns or are inactive for this round
}
// --- endRound function broken down ---

function calculateSpecialActionMessages(displayOnly = false) {
    const messages = [];
    for (const playerId in playerRoundData) {
        const pData = playerRoundData[playerId];
        if (!pData.isActive && !pData.throwsHistory.length > 0) continue; // Skip fully inactive with no history for this round

        if (pData.drinksGivenFrom31 > 0) {
            messages.push(`<strong>${pData.name}</strong> deelt ${pData.drinksGivenFrom31} ${pluralizeSlok(pData.drinksGivenFrom31)} uit (31)`);
        }
        if (pData.drinksTakenFrom32 > 0) {
            messages.push(`<strong>${pData.name}</strong> drinkt ${pData.drinksTakenFrom32} ${pluralizeSlok(pData.drinksTakenFrom32)} (32)`);
        }
    }
    return messages;
}

function calculateOvertakeMessagesAndUpdateDrinks(displayOnly = false) { // Modified from persistence.js, now primary
    const messages = [];
    if (overtakenPlayersMap.size > 0) {
        overtakenPlayersMap.forEach((totalOvertakeDrinks, playerId) => {
            const overtakenPlayerData = playerRoundData[playerId];
            if (overtakenPlayerData) {
                messages.push(`<strong>${overtakenPlayerData.name}</strong> drinkt ${totalOvertakeDrinks} ${pluralizeSlok(totalOvertakeDrinks)} (laag overgenomen)`);
                if (!displayOnly) {
                    overtakenPlayerData.drinksToTake += totalOvertakeDrinks;
                }
            }
        });
    }
    return messages;
}

function calculateLowestScorePenalty(drinksMultiplier, displayOnly = false) { // Added displayOnly
    const messages = [];
    let lowestScoreDisplayForMessage = "";
    let actualLowestPlayerIdsForPenalty = [];

    if (currentRoundLowestPlayerIds.length > 0 && roundLowestScore !== Infinity) {
        const drinksForLowest = 1 * drinksMultiplier;

        if (roundLowestScore === 1000) {
            lowestScoreDisplayForMessage = "Mex";
        } else {
            const pDataExample = playerRoundData[currentRoundLowestPlayerIds[0]];
            const throwExample = pDataExample?.throwsHistory.slice().reverse().find(t => t.scoreResult.value === roundLowestScore && t.scoreResult.type === 'normal');
            lowestScoreDisplayForMessage = throwExample ? throwExample.scoreResult.display : roundLowestScore.toString();
        }

        currentRoundLowestPlayerIds.forEach(playerId => {
            if (playerRoundData[playerId] && !overtakenPlayersMap.has(playerId)) {
                if (!displayOnly) {
                    playerRoundData[playerId].drinksToTake += drinksForLowest;
                }
                actualLowestPlayerIdsForPenalty.push(playerId);
            }
        });
        
        if (actualLowestPlayerIdsForPenalty.length > 0) {
            const playerNames = actualLowestPlayerIdsForPenalty.map(id => `<strong>${playerRoundData[id]?.name || id}</strong>`).join(', ');
            messages.push(`${playerNames} ${actualLowestPlayerIdsForPenalty.length > 1 ? 'hebben' : 'heeft'} laagste score (${lowestScoreDisplayForMessage}), ${drinksForLowest} ${pluralizeSlok(drinksForLowest)}`);
        }
        return { messages, lowestScoreDisplayForMessage, actualLowestPlayerIdsForPenalty };
    }
    return { messages: (roundLowestScore === Infinity && overtakenPlayersMap.size === 0) ? ["Geen geldige laagste score bepaald deze ronde."] : [], lowestScoreDisplayForMessage: "", actualLowestPlayerIdsForPenalty: [] };
}

function calculateLongestTurnPenalty(drinksMultiplier, displayOnly = false) { // Added displayOnly
    const messages = [];
    let longestTurnPlayerId = null;
    const longestTurnAnnouncementDiv = document.getElementById('longest-turn-announcement'); // Get it here

    if (longestTurnDrinkEnabled) {
        let maxDuration = -1;
        for (const playerId in playerRoundData) {
            const pData = playerRoundData[playerId];
            // Ensure player was active in this round and had a turn for this penalty
            if (pData && pData.isActive && pData.turnDuration > 0 && pData.turnDuration > maxDuration) {
                maxDuration = pData.turnDuration;
                longestTurnPlayerId = playerId;
            }
        }

        if (longestTurnPlayerId) {
            const drinksForLongest = 1 * drinksMultiplier;
            if (!displayOnly) {
                playerRoundData[longestTurnPlayerId].drinksToTake += drinksForLongest;
            }
            const durationStr = formatDuration(playerRoundData[longestTurnPlayerId].turnDuration);
            messages.push(`<strong>${playerRoundData[longestTurnPlayerId].name}</strong> atje des (${durationStr}), ${drinksForLongest} ${pluralizeSlok(drinksForLongest)}!`);
            
            if (longestTurnAnnouncementDiv) {
                longestTurnAnnouncementDiv.textContent = `${playerRoundData[longestTurnPlayerId].name} atje des, ${drinksForLongest} ${pluralizeSlok(drinksForLongest)}!`;
                longestTurnAnnouncementDiv.style.display = 'block';
            }
        } else if (longestTurnAnnouncementDiv) {
             longestTurnAnnouncementDiv.style.display = 'none';
        }
    } else if (longestTurnAnnouncementDiv) {
        longestTurnAnnouncementDiv.style.display = 'none';
    }
    return messages;
}

function buildScoresHtml() {
    let scoreHTML = "<strong>Worp details</strong><br>";
    roundTurnOrder.forEach(playerId => {
        const pData = playerRoundData[playerId];
        if (!pData) { // Should not happen if data is synced
            console.warn("buildScoresHtml: Player data not found for ID:", playerId);
            return;
        }

        scoreHTML += `<div class="score-section">`;
        let playerNameDisplay = `<strong>${pData.name}</strong>`;
        if (longestTurnDrinkEnabled) {
            playerNameDisplay += ` (${formatDuration(pData.turnDuration)})`;
        }
        scoreHTML += `<div class="player-name-score">${playerNameDisplay}:</div>`;
        scoreHTML += `<span class="throw-history" data-player-id="${playerId}">`;

        if (pData.throwsHistory.length > 0) {
            let finalNonSpecialThrowIndex = -1;
            for(let j = pData.throwsHistory.length - 1; j >= 0; j--) {
                 if(pData.throwsHistory[j].scoreResult.type !== 'special') {
                     finalNonSpecialThrowIndex = j;
                     break;
                 }
             }

            pData.throwsHistory.forEach((throwData, index) => {
                const scoreStr = throwData.scoreResult.display;
                let classes = [];
                if (index === finalNonSpecialThrowIndex) classes.push('final-throw');
                if (throwData.scoreResult.type === 'special') classes.push('special-throw');
                scoreHTML += `<span class="${classes.join(' ')}" data-score-value="${throwData.scoreResult.value}" data-score-type="${throwData.scoreResult.type}">${scoreStr}</span>`;
            });
        } else {
            scoreHTML += ` (Geen geldige worpen deze ronde)`;
        }
        scoreHTML += `</span></div>`;
    });
    return scoreHTML;
}

function endRound() {
    gameState = 'roundOver';
    mainActionBtn.disabled = true;
    mainActionBtn.textContent = "Ronde Klaar";
    showLowestBtn.disabled = true;
    document.getElementById('message-wrapper').style.display = 'none';
    hideMessage();

    // Hide game elements
    diceContainer.style.display = 'none';
    spelInfoDiv.style.display = 'none';
    scoreDisplayDiv.style.display = 'none';
    actieKnoppenDiv.style.display = 'none';

    const drinksMultiplier = Math.pow(2, mexCountThisRound);
    let allActionMessages = [];

    allActionMessages.push(...calculateSpecialActionMessages());
    allActionMessages.push(...calculateOvertakeMessagesAndUpdateDrinks()); // displayOnly defaults to false
    
    const { messages: lowestScoreMessages, lowestScoreDisplayForMessage, actualLowestPlayerIdsForPenalty } = calculateLowestScorePenalty(drinksMultiplier); // displayOnly defaults to false
    allActionMessages.push(...lowestScoreMessages);
    
    allActionMessages.push(...calculateLongestTurnPenalty(drinksMultiplier)); // displayOnly defaults to false

    // Build Action Display HTML
    let actionsHTML = "<strong class='actions-section'>Acties</strong><br>";
    actionsHTML += '<div class="actions-section">';
    actionsHTML += allActionMessages.length > 0 ? allActionMessages.join('<br>') : "Geen speciale acties deze ronde.";
    if (mexCountThisRound > 0) {
        const mexWord = numberToWord(mexCountThisRound);
        actionsHTML += `<br><em>(Drankjes x${drinksMultiplier} door ${mexWord} Mex worp${mexCountThisRound > 1 ? 'en' : ''})</em>`;
    }
    actionsHTML += '</div>';
    resultatenActiesDiv.innerHTML = actionsHTML;

    // Build and Render Score History HTML
    resultatenScoresDiv.innerHTML = buildScoresHtml();

    // Highlight lowest scores in rendered history
    if (lowestScoreDisplayForMessage && roundLowestScore !== 1000) {
        actualLowestPlayerIdsForPenalty.forEach(playerId => {
            const playerHistorySpan = resultatenScoresDiv.querySelector(`.throw-history[data-player-id="${playerId}"] .final-throw`);
            if (playerHistorySpan && playerHistorySpan.textContent === lowestScoreDisplayForMessage && playerHistorySpan.dataset.scoreType === 'normal') {
                playerHistorySpan.classList.add('lowest-score-highlight');
            }
        });
    }
    
    // Lowest score announcement banner
    const announcementDiv = document.getElementById('lowest-score-announcement');
    if (actualLowestPlayerIdsForPenalty.length > 0 && playerRoundData[actualLowestPlayerIdsForPenalty[0]].drinksToTake > 0) {
         const loserNames = actualLowestPlayerIdsForPenalty.map(id => playerRoundData[id].name).join(' en ');
         const penaltyDrinks = 1 * drinksMultiplier; // Base penalty before other additions
         announcementDiv.textContent = `${loserNames} laag - ${penaltyDrinks} ${pluralizeSlok(penaltyDrinks)}!`;
    } else {
        announcementDiv.textContent = ""; // Clear if no one drinks for lowest
    }
    rondeResultatenDiv.classList.add('showing-results');


    // Prepare for Next Round: store IDs of players who will start next, if any.
    // These are the players who were penalized for the lowest score (and not overtaken).
    lastRoundLoserIds = [...actualLowestPlayerIdsForPenalty];


    // Show results
    rondeResultatenDiv.style.display = 'block';
    nextRoundBtn.style.display = 'block'; // Ensure button is part of flow
    nextRoundBtn.disabled = false;
    rondeResultatenDiv.insertBefore(nextRoundBtn, resultsHeader.nextSibling); // Place button appropriately
    saveGameState();
}