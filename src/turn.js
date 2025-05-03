function setupPlayerTurn() {
    gameState = 'playing';
    const actualPlayerIndex = roundTurnOrder[currentPlayerIndex];
    const currentPlayer = playerRoundData[actualPlayerIndex];
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
