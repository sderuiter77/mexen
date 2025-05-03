function finishRoll() {
    clearInterval(animationInterval);
    animationInterval = null;
    die1Div.classList.remove('shaking');
    die2Div.classList.remove('shaking');
    handleRollResultLogic();
}

function getRandomDieValue() {
    return Math.floor(Math.random() * 6) + 1;
}

function updateDiceDisplay(isAnimating = false) {
    const dieElements = [die1Div, die2Div];
    dieElements.forEach((el, index) => {
        const valueToShow = (heldDice[index] && !isAnimating) ? el.getAttribute('data-value') : currentDice[index].toString();
        el.setAttribute('data-value', valueToShow);
        el.classList.toggle('held', heldDice[index]);
    });
}

function handleRollResultLogic() {
    const heldIndexBeforeRoll = heldDice.findIndex(h => h);

    if (heldIndexBeforeRoll !== 0) currentDice[0] = getRandomDieValue();
    if (heldIndexBeforeRoll !== 1) currentDice[1] = getRandomDieValue();
    updateDiceDisplay();

    currentScoreResult = calculateScore(currentDice[0], currentDice[1]);
    scoreDisplayDiv.textContent = `Score: ${currentScoreResult.display}`;
    const actualPlayerIndex = roundTurnOrder[currentPlayerIndex];
    const currentPlayer = playerRoundData[actualPlayerIndex];

     currentPlayer.throwsHistory.push({
         scoreResult: { ...currentScoreResult }
     });

    if (currentScoreResult.type === 'special') {
         const drinksNow = 1 * Math.pow(2, mexCountThisRound);
         const slokText = pluralizeSlok(drinksNow);
         if (currentScoreResult.value === 31) {
            showTemporaryMessage(`31! Deel ${drinksNow} ${slokText} uit.`);
            currentPlayer.drinksGivenFrom31 += drinksNow;
        } else if (currentScoreResult.value === 32) {
            showTemporaryMessage(`32! Drink ${drinksNow} ${slokText} zelf.`);
            currentPlayer.drinksTakenFrom32 += drinksNow;
        }
        heldDice = [false, false];
        lockedDieIndex = null;
        allowHolding = false;
        die1Div.classList.remove('held', 'clickable');
        die2Div.classList.remove('held', 'clickable');
        mainActionBtn.disabled = false; // Re-enable main button
        showLowestBtn.disabled = false;
        return;
    }

    throwsThisTurn++;
    worpTellerSpan.textContent = throwsThisTurn;

     currentPlayer.finalThrowValue = currentScoreResult.value;
     currentPlayer.scoreDisplay = currentScoreResult.display;

     if (currentScoreResult.type === 'normal') {
         onlyMexRolledSoFar = false;
     }

    heldDice = [false, false]; // Reset logical hold
    die1Div.classList.remove('held'); // Remove visual hold
    die2Div.classList.remove('held');


    if (heldIndexBeforeRoll !== -1) {
         lockedDieIndex = heldIndexBeforeRoll; // Lock the held die
         console.log(`Die ${lockedDieIndex} is now locked for next hold.`);
     } else {
         lockedDieIndex = null;
         console.log("No die locked for next hold.");
     }


    if (currentScoreResult.type === 'mex') {
         mexCountThisRound++;
         const multiplier = Math.pow(2, mexCountThisRound);
         let mexMsg = `MEX! ${currentPlayer.name} stopt direct.`;
         if (currentPlayerIndex === 0 && throwsThisTurn < roundThrowsLimit) {
             roundThrowsLimit = throwsThisTurn;
             maxWorpenSpan.textContent = roundThrowsLimit;
             mexMsg += ` Nieuwe limiet: ${roundThrowsLimit} worp${roundThrowsLimit === 1 ? '' : 'en'}.`;
         }
         mexMsg += ` ${pluralizeSlok(2)} x${multiplier}!`;
         showTemporaryMessage(mexMsg, 'special');
         endPlayerTurn();
         return;
    }

    if (throwsThisTurn >= roundThrowsLimit) {
         endPlayerTurn();
    } else {
         mainActionBtn.disabled = false; // Re-enable main button
         showLowestBtn.disabled = false;
         allowHolding = true;

         const dieElements = [die1Div, die2Div];
         dieElements.forEach((dieEl) => {
             dieEl.classList.add('clickable'); // Always add clickable class visually
         });
         console.log("Turn continues. Both dice visually clickable.");
    }
}


function calculateScore(d1, d2) {
    if (d1 === 0 || d2 === 0) return { value: 0, display: "-", type: 'none'};
    if ((d1 === 2 && d2 === 1) || (d1 === 1 && d2 === 2)) return { value: 1000, display: "Mex", type: 'mex' };
    if ((d1 === 3 && d2 === 1) || (d1 === 1 && d2 === 3)) return { value: 31, display: "31", type: 'special' };
    if ((d1 === 3 && d2 === 2) || (d1 === 2 && d2 === 3)) return { value: 32, display: "32", type: 'special' };
    if (d1 === d2) return { value: d1 * 100, display: `${d1}00`, type: 'normal' };
    const high = Math.max(d1, d2);
    const low = Math.min(d1, d2);
    return { value: high * 10 + low, display: `${high}${low}`, type: 'normal' };
}

// --- Die Holding Logic ---
function handleDieClick(index) {
    if (!allowHolding) return;

    const dieElement = document.getElementById(`die${index + 1}`);
    const dieValue = currentDice[index];
    const otherIndex = 1 - index;

    if (index === lockedDieIndex) {
        showTemporaryMessage(`Je mag een dobbelsteen maar één keer vasthouden`);
        return;
    }

    if (dieValue > 3) {
         showTemporaryMessage(`Je kunt ${dieValue} niet vasthouden`);
         return;
    }

    if (!heldDice[index] && heldDice[otherIndex]) {
         showTemporaryMessage("Je kunt maar één dobbelsteen vasthouden.");
         return;
    }

    heldDice[index] = !heldDice[index];
    dieElement.classList.toggle('held', heldDice[index]); // Only toggle visual held class

     if (heldDice[index]) {
        console.log(`Held die ${index}.`);
    } else {
        console.log(`Released die ${index}.`);
    }
}

function startRollAnimation() {
    playSound(soundDiceRoll);
    mainActionBtn.disabled = true; // Disable main button during roll
    showLowestBtn.disabled = true;
    allowHolding = false;
    die1Div.classList.remove('clickable', 'held');
    die2Div.classList.remove('clickable', 'held');
    hideMessage();
    if (!heldDice[0]) die1Div.classList.add('shaking');
    if (!heldDice[1]) die2Div.classList.add('shaking');

    let animationDuration = 350;
    let intervalTime = 40;
    let elapsed = 0;

    animationInterval = setInterval(() => {
        if (!heldDice[0]) currentDice[0] = getRandomDieValue();
        if (!heldDice[1]) currentDice[1] = getRandomDieValue();
        updateDiceDisplay(true);
        elapsed += intervalTime;
        if (elapsed >= animationDuration) {
            finishRoll();
        }
    }, intervalTime);
}
