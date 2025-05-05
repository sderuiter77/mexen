function addPlayer() {
    const playerName = playerInput.value.trim();
    if (playerName) {
        players.push({ name: playerName, active: true });
        playerInput.value = '';
        updatePlayerList();
        checkStartGameButton();
    }
    playerInput.focus();
}

function removePlayer(index) {
    players.splice(index, 1);
    updatePlayerList();
    checkStartGameButton();
}


function updatePlayerList() {
     playerListUl.innerHTML = '';
    players.forEach((player, index) => {
        const li = document.createElement('li');

        const playerNameSpan = document.createElement('span');
        playerNameSpan.classList.add('player-name');
        playerNameSpan.textContent = player.name;

        const removeButton = document.createElement('img');
        removeButton.src = 'images/red-cross.png';
        removeButton.classList.add('remove-player-button');
        removeButton.addEventListener('click', () => removePlayer(index));

        li.appendChild(playerNameSpan);
        li.appendChild(removeButton);
        playerListUl.appendChild(li);
    });
}
