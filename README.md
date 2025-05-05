# Penguin Mex: A Web-Based Dice Game

Welcome to Penguin Mex, a fun and engaging web-based dice game! This README provides information about the game, its files, how to run it, and how to get started.

## Purpose

Penguin Mex is a dice game where players take turns rolling dice and strategically managing their scores. The game involves risk, chance, and a little bit of luck. The main goal is to get the lowest score possible by the end of a set amount of rounds, or until a player has lost all of their lives.

## Getting Started

To start playing Penguin Mex, follow these simple steps:

1.  **Open `index.html`**: Navigate to the root directory of the project and open the `index.html` file in your web browser.
2.  **Setup**: The game will start by asking for the amount of players and lives that will be used.
3. **Playing**: Follow the game instructions to roll dice, show your score and select the result of the rolls.

## Project Files

Here's a breakdown of the project's files and their purpose:

*   **`index.html`**: The main HTML file that structures the game's user interface.
*   **`.vscode/settings.json`**: VS Code-specific settings for the project.
*   **`images/`**: Contains image assets.
    *   `gear-icon.png`: Settings icon.
    *   `red-cross.png`: Life lost icon.
*   **`sounds/`**: Contains sound assets.
    *   `DiceRoll.wav`: Sound effect for dice rolling.
    *   `ShowLowestScore.wav`: Sound effect when showing score.
*   **`src/`**: Contains all Javascript Logic.
    *   `dice.js`: Contains logic related to the dice.
    *   `globals.js`: Contains global variables and constants.
    *   `helpers.js`: Contains helper function.
    *   `listeners.js`: Contains event listener logic.
    *   `main.js`: The main entry point of the application.
    *   `round.js`: Contains logic for handling the game round.
    *   `score.js`: Contains logic for scoring.
    *   `setup.js`: Contains the logic to setup the game.
    *   `turn.js`: Contains logic for handling a turn.
*   **`styles/style.css`**: Contains the CSS rules for styling the game.
