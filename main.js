/*
Version: 1.0
Latest changes: Main entry point connecting game logic and UI
*/

// Initialize the game when the page loads
let game;
let ui;

document.addEventListener('DOMContentLoaded', () => {
    game = new Game();
    ui = new UI(game);

    // Set up game state change listener
    game.onGameStateChanged = () => {
        ui.updateGame(game.gameState);
    };
});
