function initializeGame() {
  if (players.length < 1) {
      alert("Voeg minimaal één speler toe om het spel te starten.");
      return;
  }
  lastRoundLoserIds = []; // Reset losers from previous game (if any)
  currentRound = 0; // Reset round counter
  
  // Initialize playerRoundData for all players who will start the game
  playerRoundData = {};
  players.forEach(player => {
      if (player.active) { // Ensure only active players are set up for the first round
          playerRoundData[player.id] = createNewPlayerRoundData(player.name);
      }
  });

  setupFaseDiv.style.display = 'none';
  spelFaseDiv.style.display = 'flex';
  hideMessage();
  startNewRound(); // This will increment currentRound to 1 and set up the first turn
}

// Listener for the main start game button (from setup phase)
// startGameBtn.addEventListener('click', initializeGame); // Moved to listeners.js

function showSettingsMenu() {
  settingsPlayerList.innerHTML = ''; // Clear existing list items

  // Rule 4: Hide inactive players from the settings menu.
  const visiblePlayers = players.filter(player => player.active);

  visiblePlayers.forEach(player => { // Iterate over globally active players
      const li = document.createElement('li');
      li.id = player.id;
      li.classList.add('dropzone');
      li.draggable = true;

      const playerNameSpan = document.createElement('span');
      playerNameSpan.classList.add('player-name');
      playerNameSpan.textContent = player.name; // No need for "(inactief)" as they are filtered

      const removeButton = document.createElement('img');
      removeButton.src = 'images/red-cross.png';
      removeButton.alt = 'Verwijder';
      removeButton.classList.add('remove-player-button');
      removeButton.addEventListener('click', (e) => {
          e.stopPropagation();
          removePlayerFromSettings(player.id);
      });

      li.appendChild(playerNameSpan);
      li.appendChild(removeButton);
      settingsPlayerList.appendChild(li);
  });
  settingsPlayerList.id = 'player-list';
  document.getElementById('longest-turn-drink-enabled').checked = longestTurnDrinkEnabled;
  settingsMenu.classList.add('visible');
}


function hideSettingsMenuAndSave() {
  settingsMenu.classList.remove('visible');
  // Save settings
  longestTurnDrinkEnabled = document.getElementById('longest-turn-drink-enabled').checked;
  // Potentially update player order if drag-drop happened and game is not mid-round
  // The dragging.js should update the `players` array directly.
  // If a round is in progress, changes to player order via settings drag-drop
  // should ideally take effect from the *next* round.
  // `startNewRound` will use the current `players` array order.
}

function addPlayerFromSettings() {
  const playerName = settingsPlayerInput.value.trim();
  if (playerName) {
      const newPlayerId = generateGUID();
      const newPlayer = { id: newPlayerId, name: playerName, active: true };
      
      // Rule 3: Add to the end of `players` array.
      players.push(newPlayer);

      // Initialize playerRoundData for the new player
      if (!playerRoundData[newPlayerId]) {
          playerRoundData[newPlayerId] = createNewPlayerRoundData(playerName);
          playerRoundData[newPlayerId].isActive = true; // Active for the current round if added mid-game
      }

      // Rule 3: If a game is in progress, add to the end of current `roundTurnOrder`.
      if ((gameState === 'playing' || gameState === 'turnOver') && !roundTurnOrder.includes(newPlayerId)) {
          roundTurnOrder.push(newPlayerId);
      }
      
      settingsPlayerInput.value = '';
      showSettingsMenu(); // Refresh list
      if (gameState === 'setup') checkStartGameButtonState();
  }
}

function removePlayerFromSettings(playerIdToRemove) {
  const playerGlobalIndex = players.findIndex(p => p.id === playerIdToRemove);
  if (playerGlobalIndex === -1) return; // Player not found

  // Rule 4: Determine if player has had their turn in the current round.
  let playerHasTakenTurnThisRound = false;
  if (playerRoundData[playerIdToRemove] && playerRoundData[playerIdToRemove].finalThrowValue !== null) {
      playerHasTakenTurnThisRound = true; // Score is set, turn completed.
  } else if ((gameState === 'playing' || gameState === 'turnOver') && roundTurnOrder.includes(playerIdToRemove)) {
      // Check based on position in roundTurnOrder relative to currentPlayerId
      const playerIndexInTurnOrder = roundTurnOrder.indexOf(playerIdToRemove);
      const currentIndexInTurnOrder = roundTurnOrder.indexOf(currentPlayerId);

      if (playerIdToRemove === currentPlayerId && throwsThisTurn > 0) {
          playerHasTakenTurnThisRound = true; // Is current player and has started rolling.
      } else if (currentIndexInTurnOrder !== -1 && playerIndexInTurnOrder < currentIndexInTurnOrder) {
          // Their designated turn slot has already passed in the sequence.
          playerHasTakenTurnThisRound = true;
      }
      // If playerIndexInTurnOrder === currentIndexInTurnOrder and throwsThisTurn === 0, they haven't started.
  }


  if (playerHasTakenTurnThisRound) {
      // Inactivate if they already had their turn.
      players[playerGlobalIndex].active = false; // Mark globally inactive
      if (playerRoundData[playerIdToRemove]) {
          playerRoundData[playerIdToRemove].isActive = false; // Mark inactive for the current round's data processing
      }
      // They remain in `roundTurnOrder` for history, `advanceToNextPlayer` will skip them.
  } else {
      // Remove fully if they haven't had their turn yet.
      players.splice(playerGlobalIndex, 1);
      roundTurnOrder = roundTurnOrder.filter(id => id !== playerIdToRemove);
      delete playerRoundData[playerIdToRemove];
  }

  showSettingsMenu(); // Refresh the settings list (will automatically hide inactive ones)
  if (gameState === 'setup') checkStartGameButtonState();

  // Handle game state implications (e.g., if currentPlayer was removed)
  if (gameState !== 'setup' && gameState !== 'roundOver') {
      const activePlayersInGame = players.filter(p => p.active).length;
      if (activePlayersInGame === 0) {
          // Handle game over or reset
          alert("Alle spelers zijn verwijderd of inactief. Spel stopt.");
          setupFaseDiv.style.display = 'flex';
          spelFaseDiv.style.display = 'none';
          gameState = 'setup';
          players = []; // Full reset
          playerRoundData = {};
          roundTurnOrder = [];
          currentRound = 0;
          return;
      }

      if (!playerHasTakenTurnThisRound && playerIdToRemove === currentPlayerId) {
          // Current player was removed *before* completing their turn. Advance.
           hideMessage();
           // `advanceToNextPlayer` will find the next valid player.
           // No need to manually set gameState to 'turnOver', advanceToNextPlayer will handle it.
           advanceToNextPlayer();
      } else if (checkRoundEnd()) {
          // Removing a player (or marking them inactive) might complete the round.
          endRound();
      }
      // If current player was marked inactive (playerHasTakenTurnThisRound = true),
      // their turn effectively ends. If it was their go, advanceToNextPlayer will be called by endPlayerTurn/main button.
  }
}


// Initial checks
checkStartGameButtonState();
hideMessage();