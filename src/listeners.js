// --- Event Listeners ---

// Setup Phase
addPlayerBtn.addEventListener('click', addPlayerFromSetup);
playerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addPlayerFromSetup(); });
startGameBtn.addEventListener('click', initializeGame); // Changed from startGame

// Game Phase
mainActionBtn.addEventListener('click', handleMainButtonClick);
nextRoundBtn.addEventListener('click', startNewRound);
showLowestBtn.addEventListener('click', showLowestScoreInfo);
die1Div.addEventListener('click', () => handleDieClick(0));
die2Div.addEventListener('click', () => handleDieClick(1));

// Use event delegation on a common ancestor for background click if spelFaseDiv is too broad
// For example, if 'spel-fase' itself has many clickable children not intended for rolling.
// document.body.addEventListener('click', handleBackgroundClick); // Or a more specific game area container
spelFaseDiv.addEventListener('click', handleBackgroundClick); // Keeping original target

// Settings Menu
const settingsButtons = document.querySelectorAll('.settings-button'); // Selects all buttons with this class
settingsButtons.forEach(button => {
    button.addEventListener('click', showSettingsMenu);
});
saveSettingsButton.addEventListener('click', hideSettingsMenuAndSave);
settingsAddPlayerBtn.addEventListener('click', addPlayerFromSettings);
settingsPlayerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addPlayerFromSettings(); });


// Fullscreen Button
const fullscreenButton = document.getElementById('fullscreen-button');
if (fullscreenButton) { // Gracefully handle if button is not present
    fullscreenButton.addEventListener('click', () => {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) docEl.requestFullscreen();
        else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen(); // Safari
        else if (docEl.mozRequestFullScreen) docEl.mozRequestFullScreen(); // Firefox (note capital S)
        else if (docEl.msRequestFullscreen) docEl.msRequestFullscreen(); // IE/Edge
        // iOS Safari might need webkitEnterFullscreen for video, but for document:
        else if (docEl.webkitEnterFullscreen && !document.fullscreenElement && !document.webkitFullscreenElement) { // Check if not already fullscreen
             docEl.webkitEnterFullscreen(); // Older iOS Safari
        }
    });

    document.addEventListener('fullscreenchange', () => {
        fullscreenButton.classList.toggle('invisible', !!document.fullscreenElement);
    });
    document.addEventListener('webkitfullscreenchange', () => { // For Safari
        fullscreenButton.classList.toggle('invisible', !!document.webkitFullscreenElement);
    });
    document.addEventListener('mozfullscreenchange', () => { // For Firefox
        fullscreenButton.classList.toggle('invisible', !!document.mozFullScreenElement);
    });
    document.addEventListener('MSFullscreenChange', () => { // For IE/Edge
        fullscreenButton.classList.toggle('invisible', !!document.msFullscreenElement);
    });
}

const resetGameBtn = document.getElementById('reset-game-btn');
if (resetGameBtn) {
    resetGameBtn.addEventListener('click', () => {
        if (confirm("Weet je zeker dat je het huidige spel (inclusief opgeslagen voortgang) wilt wissen en opnieuw wilt beginnen?")) {
            clearSavedGameStateAndResetApp(); // From persistence.js
        }
    });
}