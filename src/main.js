function startGame() {
    if (players.length < 2) return;
    lastRoundLowestIndices = [];
    setupFaseDiv.style.display = 'none';
    spelFaseDiv.style.display = 'flex';
    hideMessage();
    startNewRound();
}

function showSettingsMenu() {
    // Clear existing player list items
    settingsPlayerList.innerHTML = '';

    // Populate player list with current players
    const activePlayers = players.filter(player => player.active);
    activePlayers.forEach((player, index) => {
        const li = document.createElement('li');

        const playerNameSpan = document.createElement('span');
        playerNameSpan.classList.add('player-name');
        playerNameSpan.textContent = player.name;

        const removeButton = document.createElement('img');
        removeButton.src = 'images/red-cross.png';
        removeButton.classList.add('remove-player-button');
        removeButton.addEventListener('click', () => removePlayerFromSettings(index));

        li.appendChild(playerNameSpan);
        li.appendChild(removeButton);
        settingsPlayerList.appendChild(li);
    });

    // Set the title of the settings menu
    settingsMenu.querySelector('h2').textContent = 'Instellingen';

    settingsPlayerList.id = 'player-list';

    // Add the 'player-input' id to the settingsPlayerInput
    settingsPlayerInput.id = 'player-input';
    settingsMenu.classList.add('visible');
}

function hideSettingsMenu() {
    settingsMenu.classList.remove('visible');
    // Future: Add logic here to save settings if needed
}

function addPlayerFromSettings() {
    const playerName = settingsPlayerInput.value.trim();
    if (playerName !== '') {
        players.push({ name: playerName, active: true });
         // Add the new player's index to the roundTurnOrder for the current round
        roundTurnOrder.push(players.length - 1);

          // Also add a playerRoundData entry
        playerRoundData.push({
            name: playerName,
            id: players.length - 1, // Use the correct index
            scoreDisplay: null,
            drinksToTake: 0,
            finalThrowValue: null,
            throwsHistory: [],
            drinksGivenFrom31: 0,
            drinksTakenFrom32: 0,
            isActive: true //Marked Active in Round
        });

         // Check if currentPlayerIndex is out of bounds
        if (currentPlayerIndex >= roundTurnOrder.length) {
            currentPlayerIndex = 0;
        }

        settingsPlayerInput.value = ''; // Clear the input
        showSettingsMenu(); // Refresh the list
        checkStartGameButton(); //update start game button
    }
}

function removePlayerFromSettings(index) {
    const removedPlayerIndex = index;

    if (index === currentPlayerIndex) {
        // Remove the player from roundTurnOrder
        const roundTurnOrderIndex = roundTurnOrder.indexOf(removedPlayerIndex);
        if (roundTurnOrderIndex !== -1) {
            roundTurnOrder.splice(roundTurnOrderIndex, 1);
        }

        players.splice(index, 1);
        playerRoundData.splice(index, 1);

        // Update roundTurnOrder indices
        for (let i = 0; i < roundTurnOrder.length; i++) {
            if (roundTurnOrder[i] > index) {
                roundTurnOrder[i]--;
            }
        }


        if (players.length > 0) {
            currentPlayerIndex %= players.length;
        } else {
            currentPlayerIndex = 0; // Reset if no players left
        }

        setupPlayerTurn(); // Adjust to the next player
    } else {
         // Remove the player from roundTurnOrder
        const hasTakenTurn = roundTurnOrder.slice(0, currentPlayerIndex).includes(removedPlayerIndex);
        if (hasTakenTurn){       
             players[index].active = false; // Mark the player as inactive
             console.log("Player set to inactive but remains in this round.");
        } else {
                 const roundTurnOrderIndex = roundTurnOrder.indexOf(removedPlayerIndex);
                 if (roundTurnOrderIndex !== -1) {
                   roundTurnOrder.splice(roundTurnOrderIndex, 1);
               }
               players.splice(index, 1);
               playerRoundData.splice(index, 1);

                // Update roundTurnOrder indices
                for (let i = 0; i < roundTurnOrder.length; i++) {
                    if (roundTurnOrder[i] > index) {
                        roundTurnOrder[i]--;
                    }
                }

                   if (index < currentPlayerIndex) {
                    currentPlayerIndex--;
                }
                     if (currentPlayerIndex >= players.length && players.length > 0) {
                    currentPlayerIndex = 0; // Or handle differently based on desired behavior
                }
       }

       setupPlayerTurn(); // Adjust to the next player
    }

    showSettingsMenu(); // Refresh the list
    checkStartGameButton();
}

checkStartGameButton();
hideMessage();

function updateLongestTurnDrinkEnabled() {
    const checkbox = document.getElementById('longest-turn-drink-enabled');
    longestTurnDrinkEnabled = checkbox.checked;
}
