function addPlayer() {
    const playerName = playerInput.value.trim();
    if (playerName && players.length < 10) {
        players.push({ name: playerName, active: true });
        playerInput.value = '';
        updatePlayerList();
        checkStartGameButton();
    } else if (players.length >= 10) {
         showTemporaryMessage("Max 10 spelers toegestaan.", 'special');
    } else {
    }
    playerInput.focus();
}

function updatePlayerList() {
     playerListUl.innerHTML = '';
    players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = player.name;
        playerListUl.appendChild(li);
    });
}
