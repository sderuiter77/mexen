let draggedElement = null; // The DOM element being dragged
let draggedPlayerId = null; // The ID of the player corresponding to the dragged element

document.addEventListener("dragstart", (event) => {
    // Only allow dragging for elements with 'dropzone' class (our player LIs)
    if (event.target.classList.contains('dropzone')) {
        draggedElement = event.target;
        draggedPlayerId = event.target.id; // Assuming LI elements have player ID as their DOM id
        
        // Optional: Styling for visual feedback
        // draggedElement.style.opacity = 0.5;

        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedPlayerId); // Set data to transfer (player ID)
    } else {
        // event.preventDefault(); // Prevent dragging other elements if not 'dropzone'
    }
});

document.addEventListener("dragover", (event) => {
    event.preventDefault(); // Necessary to allow dropping
    event.dataTransfer.dropEffect = 'move';
    // Optional: Add styling to the element being dragged over
    // const targetLi = event.target.closest('.dropzone');
    // if (targetLi) {
    //     targetLi.classList.add('drag-over-active'); // Example class
    // }
});

document.addEventListener("dragleave", (event) => {
    // Optional: Remove styling when leaving a potential drop target
    // const targetLi = event.target.closest('.dropzone');
    // if (targetLi) {
    //     targetLi.classList.remove('drag-over-active');
    // }
});

document.addEventListener("drop", (event) => {
    event.preventDefault();
    const targetLi = event.target.closest('.dropzone'); // The LI being dropped ON
    const droppedOnPlayerId = targetLi ? targetLi.id : null;
    const draggedLiIdFromData = event.dataTransfer.getData('text/plain'); // ID of the LI being dragged (from dataTransfer)
    
    // It's more reliable to use the ID stored in dragstart if draggedElement is still valid
    const actualDraggedPlayerId = draggedPlayerId || draggedLiIdFromData;
    const actualDraggedElement = draggedElement || document.getElementById(actualDraggedPlayerId);


    if (actualDraggedElement && targetLi && droppedOnPlayerId !== actualDraggedPlayerId) {
        const parentUl = actualDraggedElement.parentNode; // Should be settingsPlayerList or playerListUl

        // DOM Reordering:
        const targetRect = targetLi.getBoundingClientRect();
        // Determine if dragging before or after the target based on mouse position
        if (event.clientY < targetRect.top + targetRect.height / 2) {
            parentUl.insertBefore(actualDraggedElement, targetLi);
        } else {
            parentUl.insertBefore(actualDraggedElement, targetLi.nextSibling);
        }

        // Synchronize the `players` array with the new DOM order from this list
        const newVisualOrderIdsInList = Array.from(parentUl.children)
                                           .map(li => li.id)
                                           .filter(id => id); // Filter out any undefined IDs

        if (newVisualOrderIdsInList.length > 0) {
            // Reorder the global `players` array.
            // Create a new array: first, players in the new visual order from the list,
            // then, any other players not in this list (maintaining their relative order).
            const reorderedGlobalPlayers = [];
            newVisualOrderIdsInList.forEach(id => {
                const player = players.find(p => p.id === id);
                if (player) {
                    reorderedGlobalPlayers.push(player);
                }
            });

            // Add players from the global `players` array that were NOT in the dragged list,
            // maintaining their original relative order among themselves.
            players.forEach(globalPlayer => {
                if (!newVisualOrderIdsInList.includes(globalPlayer.id)) {
                    reorderedGlobalPlayers.push(globalPlayer);
                }
            });
            players = reorderedGlobalPlayers; // Update the global players array

            // Update `roundTurnOrder` if a round is in progress (Rule 5)
            if ((gameState === 'playing' || gameState === 'turnOver') && roundTurnOrder.length > 0) {
                // Identify players who have completed their turn or are inactive for the round.
                // Their order should remain fixed at the beginning of roundTurnOrder.
                let playedOrInactiveCount = 0;
                for (const pId of roundTurnOrder) {
                    const pData = playerRoundData[pId];
                    const pGlobal = players.find(player => player.id === pId);
                    if ((pData && pData.finalThrowValue !== null) || // Turn completed
                        (pId === currentPlayerId && throwsThisTurn > 0) || // Is current player and has started
                        (pData && !pData.isActive) || // Marked inactive for the round
                        (pGlobal && !pGlobal.active) // Marked globally inactive
                    ) {
                        playedOrInactiveCount++;
                    } else {
                        // This is the first player in original order who hasn't finished and is active
                        break;
                    }
                }
                const fixedPrefixPlayerIds = roundTurnOrder.slice(0, playedOrInactiveCount);

                // Get the remaining players (yet to play and active) from the original roundTurnOrder.
                let yetToPlayAndActiveIds = roundTurnOrder.slice(playedOrInactiveCount)
                    .filter(id => {
                        const pData = playerRoundData[id];
                        const pGlobal = players.find(player => player.id === id);
                        return pGlobal && pGlobal.active && pData && pData.isActive && pData.finalThrowValue === null;
                    });

                // Sort these `yetToPlayAndActiveIds` based on their new order in the global `players` array
                yetToPlayAndActiveIds.sort((aId, bId) => {
                    const indexA = players.findIndex(p => p.id === aId);
                    const indexB = players.findIndex(p => p.id === bId);
                    return indexA - indexB;
                });

                // Reconstruct `roundTurnOrder`
                roundTurnOrder = [...fixedPrefixPlayerIds, ...yetToPlayAndActiveIds];

                // If currentPlayerId is no longer valid or findable in the new order, advance.
                // This check ensures the game doesn't get stuck if the current player's status changes.
                const currentPlayerStillValidAndNext = roundTurnOrder.includes(currentPlayerId) &&
                                                     playerRoundData[currentPlayerId]?.isActive &&
                                                     players.find(p=>p.id===currentPlayerId)?.active &&
                                                     playerRoundData[currentPlayerId]?.finalThrowValue === null;

                if (gameState === 'playing' && !currentPlayerStillValidAndNext && roundTurnOrder.slice(playedOrInactiveCount).length > 0) {
                    console.warn("Current player position/status changed after drag. Attempting to find next valid player.");
                    // This could be complex. If the current player was in 'yetToPlay' and their turn was active,
                    // ideally their turn should continue if they are still the 'next' according to the new order.
                    // For simplicity now, if current player becomes invalid for turn, advance.
                    // A more robust solution might try to re-validate currentPlayerId against the new yetToPlayAndActiveIds[0].
                    const nextPlayerAfterDrag = roundTurnOrder.find((id, idx) => idx >= playedOrInactiveCount && playerRoundData[id]?.isActive && playerRoundData[id]?.finalThrowValue === null);
                    if (nextPlayerAfterDrag && nextPlayerAfterDrag !== currentPlayerId) {
                        currentPlayerId = nextPlayerAfterDrag; // Set to the new 'next'
                        setupPlayerTurn(); // Reset for this new current player
                    } else if (!nextPlayerAfterDrag) {
                        endRound(); // No one left to play
                    }
                    // If nextPlayerAfterDrag IS currentPlayerId, their turn continues as is.
                } else if (gameState === 'playing' && roundTurnOrder.slice(playedOrInactiveCount).length === 0 && checkRoundEnd()){
                    endRound(); // All reordered players have played
                }
            }
        }
    }

    // Optional: Cleanup styling
    // if (targetLi) targetLi.classList.remove('drag-over-active');
    // if (actualDraggedElement) actualDraggedElement.style.opacity = "";

    // Reset dragged state variables
    draggedElement = null;
    draggedPlayerId = null;
});

document.addEventListener("dragend", () => {
    // Cleanup visual styles if any were applied directly (like opacity)
    if (draggedElement) {
        // draggedElement.style.opacity = "";
    }
    // Reset dragged state variables, just in case drop didn't fire properly
    draggedElement = null;
    draggedPlayerId = null;
});