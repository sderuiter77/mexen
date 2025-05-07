function addPlayerFromSetup() {
    const playerName = playerInput.value.trim();
    if (playerName) {
        const newPlayerId = generateGUID();
        players.push({ id: newPlayerId, name: playerName, active: true });
        playerInput.value = ''; // Clear input
        updatePlayerListForSetup();
        checkStartGameButtonState();
        saveGameState();
    }
    playerInput.focus(); // Keep focus on input for easy multi-add
}

function removePlayerFromSetup(playerIdToRemove) {
    players = players.filter(player => player.id !== playerIdToRemove);
    updatePlayerListForSetup();
    checkStartGameButtonState();
    saveGameState();
}

function updatePlayerListForSetup() {
    playerListUl.innerHTML = ''; // Clear existing list
    players.forEach(player => {
        const li = document.createElement('li');
        li.id = player.id; // Use GUID for ID
        li.classList.add('dropzone'); // For dragging
        li.draggable = true;

        const playerNameSpan = document.createElement('span');
        playerNameSpan.classList.add('player-name');
        playerNameSpan.textContent = player.name;

        const removeButton = document.createElement('img');
        removeButton.src = 'images/red-cross.png';
        removeButton.alt = 'Verwijder';
        removeButton.classList.add('remove-player-button');
        removeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent drag start if clicking remove button
            removePlayerFromSetup(player.id);
        });

        li.appendChild(playerNameSpan);
        li.appendChild(removeButton);
        playerListUl.appendChild(li);
    });
}