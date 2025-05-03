// --- Sound Playback Helper ---
function playSound(audioElement) {
    if (audioElement) {
        audioElement.currentTime = 0;
        audioElement.play().catch(error => {
            console.error("Error playing sound:", error);
        });
    } else {
        console.warn("Attempted to play a null audio element.");
    }
}

 // --- Helper Functions ---
 function pluralizeSlok(count) {
    return count === 1 ? "slok" : "slokken";
}

function numberToWord(num) {
    const words = ["nul", "één", "twee", "drie", "vier", "vijf", "zes"];
    return words[num] || num.toString();
}

function showTemporaryMessage(msg, type = 'info') {
    messageAreaDiv.innerHTML = msg;
    messageAreaDiv.className = 'message-area visible';
    if (type === 'special') {
        messageAreaDiv.classList.add('special');
    }
}

function hideMessage() {
    messageAreaDiv.className = 'message-area';
}

function handleBackgroundClick(event) {
    // Only trigger roll if game is in 'playing' state AND main button is enabled
    if (gameState === 'playing' && !mainActionBtn.disabled) {
        const target = event.target;
        const isDie = target.closest('.die');
        const isMainActionButton = target.closest('#main-action-btn'); // Check main button
        const isShowLowestButton = target.closest('#show-lowest-btn');
        const isResultsArea = target.closest('#ronde-resultaten');
        const isSettingsButton = target.closest('.settings-button'); // Check settings button

        // Trigger roll only if not clicking on interactive elements
        if (!isDie && !isMainActionButton && !isShowLowestButton && !isResultsArea && !isSettingsButton) {
            console.log("Background click triggered roll");
            startRollAnimation();
        }
    }
    // Background click no longer advances turn
}

function showLowestScoreInfo() {
    playSound(soundShowLowest); // Play specific sound
    if (roundLowestScore === Infinity) {
       showTemporaryMessage("Nog geen laagste score bepaald in deze ronde.");
   } else {
        let lowestScoreDisplay;
        if (roundLowestScore === 1000) {
            lowestScoreDisplay = "Mex";
        } else if (roundLowestPlayerIndices.length > 0 && playerRoundData[roundLowestPlayerIndices[0]]) {
            const firstLowestPlayer = playerRoundData[roundLowestPlayerIndices[0]];
            const lastValidThrow = firstLowestPlayer.throwsHistory.slice().reverse().find(t => t.scoreResult.type !== 'special');
             if(lastValidThrow && lastValidThrow.scoreResult.value === roundLowestScore){
                 lowestScoreDisplay = lastValidThrow.scoreResult.display;
             } else {
                  // Attempt to find display value from *any* player with that score
                  let foundDisplay = null;
                  for (let idx of roundLowestPlayerIndices) {
                      const pData = playerRoundData[idx];
                      const throwWithScore = pData?.throwsHistory.slice().reverse().find(t => t.scoreResult.value === roundLowestScore && t.scoreResult.type === 'normal');
                      if (throwWithScore) {
                          foundDisplay = throwWithScore.scoreResult.display;
                          break;
                      }
                  }
                  lowestScoreDisplay = foundDisplay || roundLowestScore.toString();
             }
        } else {
             lowestScoreDisplay = roundLowestScore.toString();
        }

        const lowestPlayerNames = roundLowestPlayerIndices.map(i => playerRoundData[i]?.name || 'Onbekend').join(', ');
       showTemporaryMessage(`Huidige laagste score: ${lowestScoreDisplay} (van ${lowestPlayerNames})`);
   }
}

function handleMainButtonClick() {
   if (gameState === 'playing') {
       startRollAnimation(); // Start dice roll
   } else if (gameState === 'turnOver') {
       advanceToNext(); // Move to next player or end round
   }
}

function checkStartGameButton() {
    startGameBtn.disabled = players.length < 2;
}