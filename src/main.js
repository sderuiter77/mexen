
        function startGame() {
            if (players.length < 2) return;
            lastRoundLowestIndices = [];
            setupFaseDiv.style.display = 'none';
            spelFaseDiv.style.display = 'flex';
            hideMessage();
            startNewRound();
        }

        checkStartGameButton();
        hideMessage();
    

