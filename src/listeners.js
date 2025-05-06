const fullscreenButton = document.getElementById('fullscreen-button');

// --- Event Listeners ---
addPlayerBtn.addEventListener('click', addPlayer);
playerInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addPlayer(); });
startGameBtn.addEventListener('click', startGame);
mainActionBtn.addEventListener('click', handleMainButtonClick); // Restored listener
nextRoundBtn.addEventListener('click', startNewRound);
showLowestBtn.addEventListener('click', showLowestScoreInfo); // Sound added in function
die1Div.addEventListener('click', () => handleDieClick(0));
die2Div.addEventListener('click', () => handleDieClick(1));
spelFaseDiv.addEventListener('click', handleBackgroundClick);

// Settings Listeners
const settingsButtons = document.querySelectorAll('.settings-button');
settingsButtons.forEach(button => {
    button.addEventListener('click', showSettingsMenu);
});
saveSettingsButton.addEventListener('click', () => {hideSettingsMenu(); updateLongestTurnDrinkEnabled();});
settingsAddPlayerBtn.addEventListener('click', addPlayerFromSettings);

fullscreenButton.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
});

document.addEventListener('fullscreenchange', () => {fullscreenButton.classList.toggle('invisible', document.fullscreenElement !== null)});