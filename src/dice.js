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

const setupFaseDiv = document.getElementById('setup-fase');
spelFaseDiv.addEventListener('click', handleBackgroundClick);

function handleBackgroundClick() {
    // Only trigger roll if game is in 'playing' state AND main button is enabled
    if (gameState === 'playing' && !mainActionBtn.disabled) {
        const target = event.target;
        const isDie = target.closest('.die');
        const isMainActionButton = target.closest('#main-action-btn'); // Check main button
        const isShowLowestButton = target.closest('#show-lowest-btn');
        const isResultsArea = target.closest('#ronde-resultaten');

        // Trigger roll only if not clicking on interactive elements
        if (!isDie && !isMainActionButton && !isShowLowestButton && !isResultsArea) {
            console.log("Background click triggered roll");
            startRollAnimation();
        }
    }
    // Background click no longer advances turn
}