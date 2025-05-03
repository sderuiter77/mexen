      
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
settingsButton.addEventListener('click', showSettingsMenu);
saveSettingsButton.addEventListener('click', hideSettingsMenu);
settingsAddPlayerBtn.addEventListener('click', addPlayerFromSettings);
