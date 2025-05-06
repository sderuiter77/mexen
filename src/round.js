function startNewRound() {
    // --- START: Clear announcement and class ---
    const announcementDiv = document.getElementById('lowest-score-announcement');
        // Get the messageWrapper element
    const messageWrapper = document.getElementById('message-wrapper');
    messageWrapper.style.display = '';
    if (announcementDiv) announcementDiv.textContent = '';
    rondeResultatenDiv.classList.remove('showing-results');
    // --- END: Clear announcement and class ---
   rondeResultatenDiv.style.display = 'none'; // Hide results (existing line)
   nextRoundBtn.disabled = true;
   hideMessage();

   // --- Show Game Elements ---
   diceContainer.style.display = 'flex';
   spelInfoDiv.style.display = 'flex';
   scoreDisplayDiv.style.display = 'block';
   actieKnoppenDiv.style.display = 'flex'; // Show container for buttons

   currentRound++;
   rondeTitel.textContent = `Ronde ${currentRound}`;
   roundThrowsLimit = 3;
   mexCountThisRound = 0;
   roundLowestScore = Infinity;
   roundLowestPlayerIndices = [];
   onlyMexRolledSoFar = true;
   overtakenPlayersMap = new Map();
   lockedDieIndex = null;

    // Filter out inactive players
    const activePlayers = players.filter(player => player.active);

    // Update the players array with only active players
    players = activePlayers;

    // Update playerRoundData to only include active players
        playerRoundData = activePlayers.map((p, index) => ({
            name: p.name,
            id: index,
            scoreDisplay: null,
            drinksToTake: 0,
            finalThrowValue: null,
            throwsHistory: [],
            drinksGivenFrom31: 0,
            drinksTakenFrom32: 0,
            isActive: true // All players are active at the start of the round
        }));

   // Determine Turn Order with active players only
   roundTurnOrder = [];
   if (lastRoundLowestIndices.length > 0) {
       // Filter out any indices that are no longer active players
       const activeLowestIndices = lastRoundLowestIndices.filter(idx => 
           players[idx] && players[idx].active !== false);
       
       if (activeLowestIndices.length > 0) {
           const startingPlayerIndex = activeLowestIndices[0];
           roundTurnOrder.push(startingPlayerIndex);
           
           // Add remaining active players in circular order
           let addedCount = 1;
           let currentIndex = (startingPlayerIndex + 1) % players.length;
           
           while (addedCount < players.length) {
               // Skip inactive players
               if (players[currentIndex] && players[currentIndex].active !== false) {
                   if (!activeLowestIndices.includes(currentIndex) || 
                       (activeLowestIndices.includes(currentIndex) && !roundTurnOrder.includes(currentIndex))) {
                       roundTurnOrder.push(currentIndex);
                       addedCount++;
                   }
               }
               
               // Check if we need to add remaining lowest players
               if (currentIndex === startingPlayerIndex && addedCount < players.length) {
                   activeLowestIndices.slice(1).forEach(idx => {
                       if (!roundTurnOrder.includes(idx)) {
                           roundTurnOrder.push(idx);
                           addedCount++;
                       }
                   });
               }
               
               currentIndex = (currentIndex + 1) % players.length;
               
               // Safety check to prevent infinite loops
               if (addedCount >= players.length) break;
           }
       } else {
           // If no active lowest indices, just use all active player indices
           roundTurnOrder = [...Array(players.length).keys()];
       }
   } else {
       // Initial round: just use all active player indices
        roundTurnOrder = [...Array(players.length).keys()];
   }
   
   // Ensure all active players are included in the turn order
   if (roundTurnOrder.length !== players.length) {
       console.warn("Turn order correction: Adding missing active players");
        for (let i = 0; i < players.length; i++) {
            if (!roundTurnOrder.includes(i)) {
                roundTurnOrder.push(i);
            }
        }
   }
   
   console.log("New Round Turn Order (indices):", roundTurnOrder);

   // If no active players remain, handle the edge case
   if (roundTurnOrder.length === 0) {
       console.warn("No active players remain in the game!");
       // You might want to add handling for this case - perhaps end the game?
       return;
   }

   currentPlayerIndex = 0;
   setupPlayerTurn();
}

function endRound() {
    gameState = 'roundOver';
    mainActionBtn.disabled = true; // Disable the main button
    mainActionBtn.textContent = "Ronde Klaar"; // Update text
    showLowestBtn.disabled = true;
    // Get the messageWrapper element
    const messageWrapper = document.getElementById('message-wrapper');
    messageWrapper.style.display = 'none';
    hideMessage();

    // --- Hide Game Elements ---
    diceContainer.style.display = 'none';
    spelInfoDiv.style.display = 'none';
    scoreDisplayDiv.style.display = 'none';
    actieKnoppenDiv.style.display = 'none'; // Hide the button container

    let drinksMultiplier = Math.pow(2, mexCountThisRound);
    let actionMessages = [];
    let scoreHTML = "<strong>Worp details</strong><br>";
    let actualRoundLowestNormalScoreValue = Infinity;
    let lowestScoreDisplayValue = null;
    let drinksForLowest = 0; // Initialize drinks for lowest score penalty
    let lowestPlayersForPenalty = []; // Initialize list of players taking penalty
    let lowestPlayerIndicesForPenalty = []; // Initialize list of player indices taking penalty

     // --- Calculate Drinks & Actions ---
    // 1. Process 31/32 drinks
    playerRoundData.forEach((data, playerIndex) => {
        if (data.drinksGivenFrom31 > 0) actionMessages.push(`<strong>${data.name}</strong> deelt ${data.drinksGivenFrom31} ${pluralizeSlok(data.drinksGivenFrom31)} uit (31)`);
        if (data.drinksTakenFrom32 > 0) actionMessages.push(`<strong>${data.name}</strong> drinkt ${data.drinksTakenFrom32} ${pluralizeSlok(data.drinksTakenFrom32)} (32)`);

    });

    // 2. Process Accumulated Overtake Drinks
    if (overtakenPlayersMap.size > 0) {
        overtakenPlayersMap.forEach((totalOvertakeDrinks, playerIndex) => {
            if (playerRoundData[playerIndex]) {
                const overtakenPlayerName = playerRoundData[playerIndex].name;
                const overtakenScoreApprox = playerRoundData[playerIndex].scoreDisplay || '?';
                actionMessages.push(`<strong>${overtakenPlayerName}</strong> drinkt ${totalOvertakeDrinks} ${pluralizeSlok(totalOvertakeDrinks)} (${overtakenScoreApprox} laag overgenomen)`);
                playerRoundData[playerIndex].drinksToTake += totalOvertakeDrinks;
            } else {
                 console.error("Overtaken player index out of bounds:", playerIndex);
            }
        });
    }

    // 3. Process Lowest Score Penalty
    if (roundLowestPlayerIndices.length > 0 && roundLowestScore !== Infinity) {
         drinksForLowest = 1 * drinksMultiplier; // Calculate penalty drinks here

         let displayScoreForMsg = "";
          if (roundLowestScore === 1000) {
              displayScoreForMsg = "Mex";
          } else {
               for(let i = 0; i < playerRoundData.length; i++) {
                   const pData = playerRoundData[i];
                   const finalThrow = pData.throwsHistory.slice().reverse().find(t => t.scoreResult.type !== 'special');
                   if(finalThrow && finalThrow.scoreResult.type === 'normal' && finalThrow.scoreResult.value === roundLowestScore) {
                       lowestScoreDisplayValue = finalThrow.scoreResult.display;
                       displayScoreForMsg = lowestScoreDisplayValue;
                       break;
                   }
               }
               if (!displayScoreForMsg) displayScoreForMsg = roundLowestScore.toString();
           }


         roundLowestPlayerIndices.forEach(index => {
             if (!overtakenPlayersMap.has(index)) { // Only apply penalty if not already penalized for being overtaken
                 if (playerRoundData[index]) {
                     playerRoundData[index].drinksToTake += drinksForLowest;
                     lowestPlayersForPenalty.push(`<strong>${playerRoundData[index].name}</strong>`);
                     lowestPlayerIndicesForPenalty.push(index);
                 }
             }
         });

         if (lowestPlayersForPenalty.length > 0) {
             if (lowestPlayersForPenalty.length === 1) {
                 actionMessages.push(`${lowestPlayersForPenalty[0]} laagste score (${displayScoreForMsg}), ${drinksForLowest} ${pluralizeSlok(drinksForLowest)}`);
             } else {
                 actionMessages.push(`Gelijkspel laagste score (${displayScoreForMsg}): ${lowestPlayersForPenalty.join(', ')} drinken elk ${drinksForLowest} ${pluralizeSlok(drinksForLowest)}`);
             }
         }
    }
    else if (roundLowestScore === Infinity && overtakenPlayersMap.size === 0) {
         actionMessages.push("Geen geldige laagste score bepaald deze ronde.");
    }

    // 4. Find player with maximum turn duration
    let maxDuration = 0;
    let maxDurationPlayerIndex = null;

    playerRoundData.forEach((playerData, index) => {
        if (playerData.turnDuration > maxDuration) {
            maxDuration = playerData.turnDuration;
            maxDurationPlayerIndex = index;
        }
    });

    // 5. Apply penalty to player with maximum turn duration
    if (longestTurnDrinkEnabled && maxDurationPlayerIndex !== null) {
        playerRoundData[maxDurationPlayerIndex].drinksToTake += drinksForLowest;
        const duration = formatDuration(playerRoundData[maxDurationPlayerIndex].turnDuration);
        actionMessages.push(`<strong>${playerRoundData[maxDurationPlayerIndex].name}</strong> atje des (${duration}), ${drinksForLowest} ${pluralizeSlok(drinksForLowest)}!`);
    }

    // --- Add logic for longest turn announcement ---
    const longestTurnAnnouncementDiv = document.getElementById('longest-turn-announcement');
    if (longestTurnDrinkEnabled && maxDurationPlayerIndex !== null) {
        const longestTurnPlayerName = playerRoundData[maxDurationPlayerIndex].name;
        const duration = formatDuration(playerRoundData[maxDurationPlayerIndex].turnDuration);
        longestTurnAnnouncementDiv.textContent = `${longestTurnPlayerName} atje des, ${drinksForLowest} ${pluralizeSlok(drinksForLowest)}!`;
    }

    // --- Build Action Display HTML ---
     let actionsHTML = "<strong class='actions-section'>Acties</strong><br>";
     actionsHTML += '<div class="actions-section">';
     actionsHTML += actionMessages.length > 0 ? actionMessages.join('<br>') : "Geen speciale acties deze ronde.";
     if (mexCountThisRound > 0) {
          const mexWord = numberToWord(mexCountThisRound);
         actionsHTML += `<br><em>(${pluralizeSlok(2)} x${drinksMultiplier} door ${mexWord} Mex worp${mexCountThisRound > 1 ? 'en' : ''})</em>`;
     }
     actionsHTML += '</div>';
    resultatenActiesDiv.innerHTML = actionsHTML; // RENDER ACTIONS FIRST


    // --- Build and Render Score History HTML (in Turn Order) ---
    for (let i = 0; i < roundTurnOrder.length; i++) {
         const actualPlayerIndex = roundTurnOrder[i];
         const data = playerRoundData[actualPlayerIndex];

         scoreHTML += `<div class="score-section">`;
         
        if (longestTurnDrinkEnabled) {
            scoreHTML += `<div class="player-name-score"> <strong>${data.name}</strong> (${formatDuration(data.turnDuration)}):</div>`;
        } else {
            scoreHTML += `<div class="player-name-score"> <strong>${data.name}</strong>:</div>`;
        }
         scoreHTML += `<span class="throw-history" data-player-index="${data.id}">`; // Use original ID

         let finalThrowIndex = -1;
         if (data.throwsHistory.length > 0) {
             for(let j = data.throwsHistory.length - 1; j >= 0; j--) {
                 if(data.throwsHistory[j].scoreResult.type !== 'special') {
                     finalThrowIndex = j;
                     break;
                 }
             }

             data.throwsHistory.forEach((throwData, index) => {
                 const scoreStr = throwData.scoreResult.display;
                 let classes = [];
                 if (index === finalThrowIndex) classes.push('final-throw');
                 if (throwData.scoreResult.type === 'special') classes.push('special-throw');
                 scoreHTML += `<span class="${classes.join(' ')}" data-score-value="${throwData.scoreResult.value}" data-score-type="${throwData.scoreResult.type}">${scoreStr}</span>`;
             });
         } else {
             scoreHTML += ` (Geen geldige worpen)`;
         }
         scoreHTML += `</span></div>`;
     }
    resultatenScoresDiv.innerHTML = scoreHTML; // RENDER HISTORY SECOND


     // --- Highlight Lowest Scores in Rendered History ---
     if (lowestScoreDisplayValue !== null && roundLowestScore !== 1000) {
          // Use lowestPlayerIndicesForPenalty to ensure only those who actually drink are highlighted
          lowestPlayerIndicesForPenalty.forEach(playerIndex => {
              const playerHistorySpan = resultatenScoresDiv.querySelector(`.throw-history[data-player-index="${playerIndex}"]`);
              if (playerHistorySpan) {
                  const finalThrowSpan = playerHistorySpan.querySelector('.final-throw');
                  // Double-check if the final throw actually matches the lowest display value
                  if (finalThrowSpan && finalThrowSpan.textContent === lowestScoreDisplayValue && finalThrowSpan.dataset.scoreType === 'normal') {
                      finalThrowSpan.classList.add('lowest-score-highlight');
                  } else {
                      // Fallback or alternative highlighting if needed, e.g., if the final throw was special
                      console.log(`Could not highlight final throw for ${playerRoundData[playerIndex]?.name} with score ${lowestScoreDisplayValue}`)
                  }
              }
          });
     }


    // --- START: Add logic for lowest score announcement ---
    const announcementDiv = document.getElementById('lowest-score-announcement');
    let announcementMsg = "";

    // Use the already calculated lowest player penalty info
    if (lowestPlayersForPenalty.length > 0 && drinksForLowest > 0) {
        // Get clean names (remove the <strong> tags used elsewhere)
        const loserNames = lowestPlayersForPenalty.map(p => p.replace(/<\/?strong>/g, '')).join(' en ');
        const slokText = pluralizeSlok(drinksForLowest);
        announcementMsg = `${loserNames} laag - ${drinksForLowest} ${slokText}!`;
    } else {
         // Optionally display a message if no one has the lowest penalty (e.g., only overtakes)
         // announcementMsg = "Geen directe laagste score straf.";
    }

    if (announcementDiv) {
        announcementDiv.textContent = announcementMsg; // Use textContent for safety
    }

    // Add a class to the parent to control visibility via CSS
    rondeResultatenDiv.classList.add('showing-results');
    // --- END: Add logic for lowest score announcement ---

    // --- Insert and show Next Round Button ---
    rondeResultatenDiv.insertBefore(nextRoundBtn, resultsHeader); // Insert before score details
    nextRoundBtn.style.display = 'block'; // Make the button visible
    nextRoundBtn.disabled = false; // Enable the button


    // --- Prepare for Next Round ---
    lastRoundLowestIndices = roundLowestPlayerIndices.length > 0 ? [...lowestPlayerIndicesForPenalty] : []; // Use the indices of those actually penalized


    // Show results container (existing line)
    rondeResultatenDiv.style.display = 'block';
} // End of endRound function

