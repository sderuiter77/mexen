function setupPlayerTurn() {
     // --- Safety Check: Ensure currentPlayerIndex is within bounds ---
    if (currentPlayerIndex < 0 || currentPlayerIndex >= roundTurnOrder.length) {
        console.error("currentPlayerIndex is out of bounds!");
        // Corrective action: Reset to 0 or start new round. Adjust as needed.
        currentPlayerIndex = 0;
        if (roundTurnOrder.length === 0) {
             console.warn("No players in roundTurnOrder, starting new round.");
             startNewRound();
             return; // Exit to prevent further errors
        }
    }


    gameState = 'playing';
    const actualPlayerIndex = roundTurnOrder[currentPlayerIndex];

     // --- Additional Safety Check: Ensure actualPlayerIndex is within playerRoundData bounds ---
    if (!playerRoundData || actualPlayerIndex < 0 || actualPlayerIndex >= playerRoundData.length) {
        console.error("actualPlayerIndex is out of bounds for playerRoundData!");
        console.error("actualPlayerIndex:", actualPlayerIndex, "currentPlayerIndex:", currentPlayerIndex, "roundTurnOrder:", roundTurnOrder, "playerRoundData", playerRoundData);
         // Corrective action:  Try to recover by adjusting currentPlayerIndex or starting a new round
         if (playerRoundData && playerRoundData.length > 0) {
              currentPlayerIndex = 0; // Reset to the first player if possible
              setupPlayerTurn(); // Re-run the setup with corrected index
         } else {
              console.warn("No player data available. Starting a new round.");
              startNewRound();
         }
        return;
    }

    const currentPlayer = playerRoundData[actualPlayerIndex];
     // --- Skip Inactive Players ---
    if (!currentPlayer.isActive) {
        console.log("Skipping inactive player.");
        advanceToNext();
        return; // Skip the rest of the function
    }

    
     if (!currentPlayer) {
          console.error("currentPlayer is undefined. actualPlayerIndex:", actualPlayerIndex, "currentPlayerIndex:", currentPlayerIndex, "roundTurnOrder:", roundTurnOrder, "playerRoundData", playerRoundData);
          return; // Exit if currentPlayer is undefined
     }

    spelerAanZetH3.textContent = `${currentPlayer.name}`;
    throwsThisTurn = 0;
    currentScoreResult = {};
    currentDice = [0, 0];
    heldDice = [false, false];
    lockedDieIndex = null;
    allowHolding = false;

    updateDiceDisplay();
    scoreDisplayDiv.textContent = "Score: -";
    worpTellerSpan.textContent = throwsThisTurn;
    maxWorpenSpan.textContent = roundThrowsLimit;
    mainActionBtn.disabled = false; // Enable main button
    mainActionBtn.textContent = "Gooi"; // Set text
    showLowestBtn.disabled = false;
    hideMessage();

    // Reset visual state
    die1Div.classList.remove('held', 'clickable', 'shaking');
    die2Div.classList.remove('held', 'clickable', 'shaking');

    // Start the timer
    currentPlayer.turnStartTime = Date.now();
    
}


function endPlayerTurn() {
    gameState = 'turnOver';
    mainActionBtn.textContent = 'Volgende Speler'; // Set button text
    mainActionBtn.disabled = false; // Ensure button is clickable to advance
    showLowestBtn.disabled = true;
    allowHolding = false;
    die1Div.classList.remove('shaking', 'held', 'clickable'); // Clean UI
    die2Div.classList.remove('shaking', 'held', 'clickable');
    heldDice = [false, false];
    lockedDieIndex = null;

    const actualPlayerIndex = roundTurnOrder[currentPlayerIndex];
    const finalScoreValue = playerRoundData[actualPlayerIndex].finalThrowValue;
    const currentPlayerName = playerRoundData[actualPlayerIndex].name;
    const currentScoreDisplay = playerRoundData[actualPlayerIndex].scoreDisplay;
    const currentPlayer = playerRoundData[actualPlayerIndex];

    // Calculate turn duration
    const turnEndTime = Date.now();
    const turnDuration = turnEndTime - currentPlayer.turnStartTime;
    currentPlayer.turnDuration = turnDuration;
    console.log("Turn duration for " + currentPlayerName + ": " + turnDuration + "ms");

    // --- Lowest Score & Overtake Logic ---
    if (finalScoreValue !== null && finalScoreValue !== 31 && finalScoreValue !== 32) {
         const scoreToCompare = finalScoreValue;
         const canMexBeLowest = onlyMexRolledSoFar && scoreToCompare === 1000;

         if (scoreToCompare < roundLowestScore || (canMexBeLowest && roundLowestScore === Infinity)) {
             roundLowestScore = scoreToCompare;
             roundLowestPlayerIndices = [actualPlayerIndex];
             console.log(`New lowest score: ${currentScoreDisplay} by ${currentPlayerName}`);
         }
         else if (scoreToCompare === roundLowestScore) {
             if (!roundLowestPlayerIndices.includes(actualPlayerIndex)) {
                 const previousLowestPlayerIndex = roundLowestPlayerIndices[0];

                 const drinksForThisOvertake = 1 * Math.pow(2, mexCountThisRound);
                 const currentOvertakeDrinks = overtakenPlayersMap.get(previousLowestPlayerIndex) || 0;
                 overtakenPlayersMap.set(previousLowestPlayerIndex, currentOvertakeDrinks + drinksForThisOvertake);
                 console.log(`Player ${previousLowestPlayerIndex} overtaken, owes ${overtakenPlayersMap.get(previousLowestPlayerIndex)} drinks`);

                 roundLowestPlayerIndices = [actualPlayerIndex]; // Current player takes over

                 showTemporaryMessage(`${currentPlayerName} neemt laag over!  ${playerRoundData[previousLowestPlayerIndex]?.name || 'Iemand'} moet ${1 * Math.pow(2, mexCountThisRound)} drinken!`, 'special');
                 console.log(`${currentPlayerName} overtakes/ties lowest score ${currentScoreDisplay} from ${playerRoundData[previousLowestPlayerIndex]?.name || 'Previous'}`);
             }
         }
    }

    // --- End Turn Message ---
    if (!messageAreaDiv.classList.contains('visible')) {
         const displayScore = currentScoreDisplay || "Geen score";
         // Keep message simple, button handles advance
        showTemporaryMessage(`Beurt van ${currentPlayerName} is klaar.`);
    }
     // State is set at the top of the function now
}


function advanceToNext() {
    // Called by the main action button when in 'turnOver' state
    hideMessage(); // Hide the "turn over" message
   currentPlayerIndex++;
   if (currentPlayerIndex < roundTurnOrder.length) {
       setupPlayerTurn();
   } else {
       endRound();
   }
}
