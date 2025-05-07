// --- Sound Playback Helper ---
function playSound(audioElement) {
    if (audioElement && typeof audioElement.play === 'function') {
        audioElement.currentTime = 0;
        audioElement.play().catch(error => {
            // console.error("Error playing sound:", error); // Avoid log noise for user interactions
        });
    } else {
        // console.warn("Attempted to play an invalid audio element.");
    }
}

// --- Text Helpers ---
function pluralizeSlok(count) {
    return count === 1 ? "slok" : "slokken";
}

function numberToWord(num) {
    const words = ["nul", "één", "twee", "drie", "vier", "vijf", "zes"]; // Assuming up to 6 for dice/mex counts
    return words[num] || num.toString();
}

// --- GUID Generator ---
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// --- Duration Formatter ---
function formatDuration(totalMilliseconds) {
    if (isNaN(totalMilliseconds) || totalMilliseconds < 0) return "0s";
    const totalSeconds = Math.round(totalMilliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let formattedDuration = "";
    if (hours > 0) formattedDuration += `${hours}u `;
    if (minutes > 0) formattedDuration += `${minutes}m `;
    if (seconds > 0 || formattedDuration === "") formattedDuration += `${seconds}s`;
    
    return formattedDuration.trim() || "0s";
}

// --- UI Message Helpers ---
function showTemporaryMessage(msg, type = 'info') {
    messageAreaDiv.innerHTML = msg; // Assuming msg is safe or sanitized if from user input
    messageAreaDiv.className = 'message-area visible'; // Reset classes then add
    if (type === 'special') {
        messageAreaDiv.classList.add('special');
    }
    // Ensure the wrapper has a defined min-height or the message area itself.
    // messageAreaDiv.style.visibility = 'visible'; // Already handled by 'visible' class
}

function hideMessage() {
    messageAreaDiv.style.visibility = 'hidden';
    messageAreaDiv.classList.remove('visible', 'special');
    messageAreaDiv.innerHTML = ''; // Clear content
}

// --- Game Flow Helpers ---
function checkStartGameButtonState() {
    // A game needs at least one player to start.
    startGameBtn.disabled = players.length < 1;
}

function handleMainButtonClick() {
    switch (gameState) {
        case 'playing':
            startRollAnimation();
            break;
        case 'turnOver':
            advanceToNextPlayer();
            break;
        case 'roundOver': // This case might not be hit if nextRoundBtn is primary
            console.warn("Main action button clicked in 'roundOver' state. This should typically be handled by 'Next Round' button.");
            // endRound(); // Not typical, endRound is usually called by game logic
            break;
        default:
            console.warn(`Main action button clicked in unhandled state: ${gameState}`);
    }
}

function showLowestScoreInfo() {
    playSound(soundShowLowest);
    if (roundLowestScore === Infinity || currentRoundLowestPlayerIds.length === 0) {
        showTemporaryMessage("Nog geen laagste score bepaald in deze ronde.");
        return;
    }

    let lowestScoreDisplay = "";
    if (roundLowestScore === 1000) { // Mex score
        lowestScoreDisplay = "Mex";
    } else {
        // Try to find the display value from one of the players who achieved this lowest score
        const firstLowestPlayerId = currentRoundLowestPlayerIds[0];
        const playerData = playerRoundData[firstLowestPlayerId];
        if (playerData && playerData.throwsHistory) {
            const lastValidThrow = playerData.throwsHistory
                .slice()
                .reverse()
                .find(t => t.scoreResult.value === roundLowestScore && t.scoreResult.type !== 'special');
            if (lastValidThrow) {
                lowestScoreDisplay = lastValidThrow.scoreResult.display;
            }
        }
        if (!lowestScoreDisplay) { // Fallback if display not found
            lowestScoreDisplay = roundLowestScore.toString();
        }
    }

    const lowestPlayerNames = currentRoundLowestPlayerIds
        .map(id => playerRoundData[id]?.name || 'Onbekende speler')
        .join(', ');
    showTemporaryMessage(`Huidige laagste score: ${lowestScoreDisplay} (van ${lowestPlayerNames})`);
}

// --- Event Delegation for Background Click ---
function handleBackgroundClick(event) {
    if (gameState === 'playing' && !mainActionBtn.disabled) {
        const target = event.target;
        // Check if the click is on an interactive element that shouldn't trigger a roll
        const isDie = target.closest('.die');
        const isButton = target.closest('button'); // General check for any button
        const isInput = target.closest('input');
        const isSelect = target.closest('select');
        const isLink = target.closest('a');
        const isSettingsMenu = target.closest('.settings-menu-content'); // Prevent roll if settings menu is open & clicked inside

        if (!isDie && !isButton && !isInput && !isSelect && !isLink && !isSettingsMenu) {
            startRollAnimation();
        }
    }
}