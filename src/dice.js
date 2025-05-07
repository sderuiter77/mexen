function startRollAnimation() {
    if (gameState !== 'playing') return;

    playSound(soundDiceRoll);
    mainActionBtn.disabled = true;
    showLowestBtn.disabled = true;
    allowHolding = false; // Disallow holding during animation
    // Visual reset for dice not held
    if (!heldDice[0]) die1Div.classList.remove('clickable', 'held'); else die1Div.classList.remove('clickable');
    if (!heldDice[1]) die2Div.classList.remove('clickable', 'held'); else die2Div.classList.remove('clickable');

    hideMessage();

    // Add shaking class only to dice that are not held
    if (!heldDice[0]) die1Div.classList.add('shaking');
    if (!heldDice[1]) die2Div.classList.add('shaking');

    const animationDuration = 350; // ms
    const intervalTime = 40; // ms
    let elapsed = 0;

    animationInterval = setInterval(() => {
        elapsed += intervalTime;
        if (!heldDice[0]) currentDice[0] = getRandomDieValue();
        if (!heldDice[1]) currentDice[1] = getRandomDieValue();
        updateDiceDisplay(true); // Pass true for animating state

        if (elapsed >= animationDuration) {
            finishRoll();
        }
    }, intervalTime);
}

function finishRoll() {
    clearInterval(animationInterval);
    animationInterval = null;
    if (!heldDice[0]) die1Div.classList.remove('shaking');
    if (!heldDice[1]) die2Div.classList.remove('shaking');
    
    // Final dice values after animation (ensure they are set if not held)
    if (!heldDice[0]) currentDice[0] = getRandomDieValue();
    if (!heldDice[1]) currentDice[1] = getRandomDieValue();
    updateDiceDisplay(false); // Update with final values, not animating

    handleRollResultLogic();
}

function getRandomDieValue() {
    return Math.floor(Math.random() * 6) + 1;
}

function updateDiceDisplay(isAnimating = false) {
    const dieElements = [die1Div, die2Div];
    dieElements.forEach((el, index) => {
        // If animating, show random values. If not, show currentDice.
        // The 'held' status visually freezes a die, but its underlying currentDice[index] should be its actual value.
        const valueToShow = currentDice[index];
        el.setAttribute('data-value', valueToShow.toString());
        // Visual 'held' class is managed by handleDieClick and start of roll
    });
}

function handleRollResultLogic() {
    const player = playerRoundData[currentPlayerId];
    if (!player) {
        console.error("handleRollResultLogic: Player data not found for currentPlayerId:", currentPlayerId);
        return; // Critical error
    }

    currentScoreResult = calculateScore(currentDice[0], currentDice[1]);
    scoreDisplayDiv.textContent = `Score: ${currentScoreResult.display}`;

    player.throwsHistory.push({
        dice: [...currentDice], // Store the dice values for this throw
        scoreResult: { ...currentScoreResult }
    });

    if (currentScoreResult.type === 'special') { // 31 or 32
        const drinksNow = 1 * Math.pow(2, mexCountThisRound);
        const slokText = pluralizeSlok(drinksNow);
        if (currentScoreResult.value === 31) { // 31 (Uitdelen)
            showTemporaryMessage(`31! Deel ${drinksNow} ${slokText} uit.`, 'special');
            player.drinksGivenFrom31 += drinksNow;
        } else { // 32 (Zelf drinken)
            showTemporaryMessage(`32! Drink ${drinksNow} ${slokText} zelf.`, 'special');
            player.drinksTakenFrom32 += drinksNow;
        }
        // Special rolls usually mean turn continues or resets, but doesn't end turn with this score
        // The original logic implies the turn does not end here automatically.
        // Player gets another roll or can choose to stop if that's a game rule (not implemented here).
        // For this implementation, a special roll resets held dice and allows another throw.
        heldDice = [false, false];
        die1Div.classList.remove('held');
        die2Div.classList.remove('held');
        lockedDieIndex = null;
        allowHolding = true; // Allow holding for next throw
        die1Div.classList.add('clickable');
        die2Div.classList.add('clickable');
        mainActionBtn.disabled = false;
        showLowestBtn.disabled = false;
        // Note: throwsThisTurn does NOT increment for special 31/32 based on original logic
        return; // Turn does not end, player can roll again
    }

    throwsThisTurn++;
    worpTellerSpan.textContent = throwsThisTurn;

    // Update player's final score for the round if this throw is not special
    player.finalThrowValue = currentScoreResult.value;
    player.scoreDisplay = currentScoreResult.display;

    if (currentScoreResult.type === 'normal') {
        onlyMexRolledSoFar = false;
    }
    
    const previouslyHeldIndex = heldDice.findIndex(h => h); // Find if a die was held *before* this roll
    
    // Reset logical and visual hold state for next potential throw
    heldDice = [false, false];
    die1Div.classList.remove('held');
    die2Div.classList.remove('held');

    if (previouslyHeldIndex !== -1) {
        lockedDieIndex = previouslyHeldIndex; // Lock the die that was just un-held from being re-held immediately
    } else {
        lockedDieIndex = null;
    }


    if (currentScoreResult.type === 'mex') {
        mexCountThisRound++;
        const multiplier = Math.pow(2, mexCountThisRound);
        let mexMsg = `MEX!`;

        // If current player is the first in turn order and rolls Mex, set roundThrowsLimit
        if (roundTurnOrder.indexOf(currentPlayerId) === 0 && throwsThisTurn < roundThrowsLimit) {
            roundThrowsLimit = throwsThisTurn;
            maxWorpenSpan.textContent = roundThrowsLimit; // Update display
            mexMsg += ` Limiet naar ${roundThrowsLimit} worpen!`;
        }
        mexMsg += ` Drankjes x${multiplier}!`;
        showTemporaryMessage(mexMsg, 'special');
        endPlayerTurn(); // Mex ends the turn
        return;
    }

    if (throwsThisTurn >= roundThrowsLimit) {
        endPlayerTurn();
    } else {
        // Turn continues
        mainActionBtn.disabled = false;
        showLowestBtn.disabled = false;
        allowHolding = true;
        die1Div.classList.add('clickable'); // Make dice clickable for holding
        die2Div.classList.add('clickable');
    }
}

function calculateScore(d1, d2) {
    if (d1 === 0 || d2 === 0) return { value: 0, display: "-", type: 'none' }; // Initial or invalid state

    // Check for Mex (21)
    if ((d1 === 2 && d2 === 1) || (d1 === 1 && d2 === 2)) return { value: 1000, display: "Mex", type: 'mex' };
    // Check for 31 (Pils)
    if ((d1 === 3 && d2 === 1) || (d1 === 1 && d2 === 3)) return { value: 31, display: "31", type: 'special' };
    // Check for 32 (Ook Pils?) - or other special meaning
    if ((d1 === 3 && d2 === 2) || (d1 === 2 && d2 === 3)) return { value: 32, display: "32", type: 'special' };
    // Check for doubles (Sochs)
    if (d1 === d2) return { value: d1 * 100, display: `${d1}00`, type: 'normal' }; // e.g., 66 is 600

    // Regular scores (higher die first)
    const high = Math.max(d1, d2);
    const low = Math.min(d1, d2);
    return { value: high * 10 + low, display: `${high}${low}`, type: 'normal' }; // e.g., 5 and 3 is 53
}

function handleDieClick(index) { // index is 0 for die1, 1 for die2
    if (!allowHolding || gameState !== 'playing') return;

    const dieElement = (index === 0) ? die1Div : die2Div;
    const dieValue = currentDice[index]; // Current value of the clicked die

    if (index === lockedDieIndex) {
        showTemporaryMessage(`Je mag een dobbelsteen maar één keer per beurt vasthouden.`);
        return;
    }

    // Game rule: Cannot hold 4, 5, or 6 (unless this is a house rule not specified)
    // The original code checks `dieValue > 3`. Assuming this means 1, 2, 3 can be held.
    if (dieValue > 3) {
        showTemporaryMessage(`Je kunt ${dieValue} niet vasthouden.`);
        return;
    }

    // Toggle hold status for the clicked die
    // Can only hold one die at a time
    if (!heldDice[index] && (heldDice[0] || heldDice[1])) {
        // A die is already held, and we are trying to hold another one
        showTemporaryMessage("Je kunt maar één dobbelsteen tegelijk vasthouden.");
        return;
    }

    heldDice[index] = !heldDice[index];
    dieElement.classList.toggle('held', heldDice[index]);

    // If a die is held, the other becomes un-clickable for holding (but can still roll)
    // This part is implicitly handled by the "only one die at a time" logic above
    // and by `allowHolding` during roll animation.
    // No need to toggle 'clickable' here, as `startRollAnimation` will manage it.
}