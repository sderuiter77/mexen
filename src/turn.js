function setupPlayerTurn() {
    // Ensure currentPlayerId is set, find the first valid player if not
    if (!currentPlayerId || !playerRoundData[currentPlayerId] || !playerRoundData[currentPlayerId].isActive || !players.find(p=>p.id===currentPlayerId)?.active) {
        const firstValidPlayerInOrder = roundTurnOrder.find(id =>
            players.find(p => p.id === id)?.active &&
            playerRoundData[id]?.isActive &&
            playerRoundData[id]?.finalThrowValue === null
        );
        if (firstValidPlayerInOrder) {
            currentPlayerId = firstValidPlayerInOrder;
        } else {
            // No valid player to start a turn (e.g., all have played or are inactive)
            console.warn("setupPlayerTurn: No valid player found to start a turn. Checking round end.");
            if (checkRoundEnd()) {
                endRound();
            } else {
                // This is an unexpected state - game should have ended or advanced.
                console.error("setupPlayerTurn: Stuck! No valid player and round not ended.");
                alert("Fout: Kan geen speler vinden voor de volgende beurt.");
            }
            return;
        }
    }
    
    gameState = 'playing';
    const currentPlayerGlobalData = players.find(p => p.id === currentPlayerId);
    const currentPlayerDataForRound = playerRoundData[currentPlayerId];

    // If somehow currentPlayerId points to an invalid/inactive player, try to recover.
    if (!currentPlayerGlobalData || !currentPlayerGlobalData.active || !currentPlayerDataForRound || !currentPlayerDataForRound.isActive) {
        console.error(`setupPlayerTurn: currentPlayerId ${currentPlayerId} is invalid or inactive. Advancing.`);
        advanceToNextPlayer();
        return;
    }

    spelerAanZetH3.textContent = `${currentPlayerGlobalData.name}`;

    // Reset turn-specific state
    throwsThisTurn = 0;
    currentScoreResult = {};
    currentDice = [0, 0];
    heldDice = [false, false];
    lockedDieIndex = null;
    allowHolding = true;

    updateDiceDisplay();
    scoreDisplayDiv.textContent = "Score: -";
    worpTellerSpan.textContent = throwsThisTurn;
    maxWorpenSpan.textContent = roundThrowsLimit;

    mainActionBtn.disabled = false;
    mainActionBtn.textContent = "Gooi";
    showLowestBtn.disabled = false;
    hideMessage();

    die1Div.classList.remove('held', 'clickable', 'shaking');
    die2Div.classList.remove('held', 'clickable', 'shaking');

    // Start the turn timer
    currentPlayerDataForRound.turnStartTime = Date.now();
    
    // Check if this setup immediately leads to round end (e.g. last player, all conditions met)
    // This is less likely here if currentPlayerId is correctly selected above.
    if (checkRoundEnd()) {
        endRound();
    }
}


function endPlayerTurn() {
    gameState = 'turnOver';
    mainActionBtn.textContent = 'Volgende Speler';
    mainActionBtn.disabled = false; // Enable to advance
    showLowestBtn.disabled = true;
    allowHolding = false;

    die1Div.classList.remove('shaking', 'held', 'clickable');
    die2Div.classList.remove('shaking', 'held', 'clickable');
    // heldDice and lockedDieIndex are reset at start of next setupPlayerTurn

    const endedPlayerRoundData = playerRoundData[currentPlayerId];
    if (!endedPlayerRoundData) {
        console.error("endPlayerTurn: Current player data not found for ID:", currentPlayerId);
        if (checkRoundEnd()) endRound(); else advanceToNextPlayer(); // Attempt recovery
        return;
    }
    const endedPlayerGlobalData = players.find(p => p.id === currentPlayerId);
    const playerName = endedPlayerGlobalData ? endedPlayerGlobalData.name : "Onbekende Speler";


    // Calculate and store turn duration
    const turnEndTime = Date.now();
    endedPlayerRoundData.turnDuration = turnEndTime - (endedPlayerRoundData.turnStartTime || turnEndTime); // Fallback for startTime

    // Lowest Score & Overtake Logic
    const finalScoreValue = endedPlayerRoundData.finalThrowValue;
    const finalScoreDisplay = endedPlayerRoundData.scoreDisplay;

    if (finalScoreValue !== null && finalScoreValue !== 31 && finalScoreValue !== 32) {
        const scoreToCompare = finalScoreValue;

        if (scoreToCompare < roundLowestScore || (onlyMexRolledSoFar && scoreToCompare === 1000 && roundLowestScore === Infinity)) {
            roundLowestScore = scoreToCompare;
            currentRoundLowestPlayerIds = [currentPlayerId];
            // console.log(`New lowest score: ${finalScoreDisplay} by ${playerName}`);
        } else if (scoreToCompare === roundLowestScore) {
            if (!currentRoundLowestPlayerIds.includes(currentPlayerId)) { // Overtake situation
                const drinksForOvertake = 1 * Math.pow(2, mexCountThisRound);
                currentRoundLowestPlayerIds.forEach(previousLowestId => {
                    const prevPlayerRoundData = playerRoundData[previousLowestId];
                    if (prevPlayerRoundData) {
                        const currentOvertakeDrinks = overtakenPlayersMap.get(previousLowestId) || 0;
                        overtakenPlayersMap.set(previousLowestId, currentOvertakeDrinks + drinksForOvertake);
                        const prevPlayerGlobal = players.find(p=>p.id === previousLowestId);
                        // console.log(`Player ${prevPlayerGlobal?.name || previousLowestId} overtaken, owes ${overtakenPlayersMap.get(previousLowestId)} drinks`);
                    }
                });
                currentRoundLowestPlayerIds = [currentPlayerId]; // New player "takes" the lowest spot from those they overtook
                showTemporaryMessage(`${playerName} neemt laag over! Vorige laagste (${drinksForOvertake} ${pluralizeSlok(drinksForOvertake)})!`, 'special');
            } else {
                // Re-rolled the same lowest score, already in the list, no overtake.
            }
        }
    }

    if (!messageAreaDiv.classList.contains('visible') || messageAreaDiv.style.visibility === 'hidden') {
        showTemporaryMessage(`Beurt van ${playerName} is klaar. Score: ${finalScoreDisplay || "-"}.`);
    }

    if (checkRoundEnd()) {
        endRound();
    }
    // Otherwise, mainActionBtn click will call advanceToNextPlayer when state is 'turnOver'
}

function advanceToNextPlayer() {
    hideMessage();

    if (roundTurnOrder.length === 0) {
        console.log("advanceToNextPlayer: roundTurnOrder is empty. Ending round.");
        endRound();
        return;
    }

    const currentLogicalIndexInOrder = roundTurnOrder.indexOf(currentPlayerId);
    // If currentPlayerId is null or not in order, start search from beginning.
    const searchStartIndex = (currentPlayerId === null || currentLogicalIndexInOrder === -1) ? 0 : (currentLogicalIndexInOrder + 1);

    let nextPlayerIdToPlay = null;

    // Iterate through the roundTurnOrder to find the next valid player
    for (let i = 0; i < roundTurnOrder.length; i++) {
        const potentialNextPlayerIndex = (searchStartIndex + i) % roundTurnOrder.length;
        const potentialPlayerId = roundTurnOrder[potentialNextPlayerIndex];
        
        const pGlobal = players.find(p => p.id === potentialPlayerId);
        const pData = playerRoundData[potentialPlayerId];

        // Rule 6: Check if this player is active globally, active for this round, AND hasn't finished their turn
        if (pGlobal && pGlobal.active && pData && pData.isActive && pData.finalThrowValue === null) {
            nextPlayerIdToPlay = potentialPlayerId;
            break; // Found the next player
        }
    }

    if (nextPlayerIdToPlay) {
        currentPlayerId = nextPlayerIdToPlay;
        setupPlayerTurn();
    } else {
        // No player found in the current roundTurnOrder who is active and hasn't played.
        // This implies the round should be over.
        console.log("advanceToNextPlayer: No next valid player found in roundTurnOrder. All active players have likely played. Ending round.");
        endRound();
    }
}