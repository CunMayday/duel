/*
Version: 1.0
Latest changes: UI management and rendering logic with action log and turn indicators
*/

class UI {
    constructor(game) {
        this.game = game;
        this.selectedCards = [];
        this.initializeElements();
    }

    initializeElements() {
        // Screens
        this.menuScreen = document.getElementById('menu-screen');
        this.gameScreen = document.getElementById('game-screen');

        // Menu elements
        this.createGameBtn = document.getElementById('create-game-btn');
        this.joinGameBtn = document.getElementById('join-game-btn');
        this.joinGameForm = document.getElementById('join-game-form');
        this.gameIdInput = document.getElementById('game-id-input');
        this.joinSubmitBtn = document.getElementById('join-submit-btn');
        this.gameCreatedInfo = document.getElementById('game-created-info');
        this.createdGameId = document.getElementById('created-game-id');
        this.copyGameIdBtn = document.getElementById('copy-game-id-btn');

        // Game elements
        this.currentGameId = document.getElementById('current-game-id');
        this.turnIndicator = document.getElementById('turn-indicator');
        this.leaveGameBtn = document.getElementById('leave-game-btn');
        this.piste = document.getElementById('piste');
        this.playerHand = document.getElementById('player-hand');
        this.cardsRemaining = document.getElementById('cards-remaining');
        this.actionLog = document.getElementById('action-log');
        this.playerScoreMarker = document.getElementById('player-score-marker');
        this.opponentScoreMarker = document.getElementById('opponent-score-marker');

        // Action areas
        this.attackStrengthener = document.getElementById('attack-strengthener');
        this.strengthenCards = document.getElementById('strengthen-cards');
        this.finishAttackBtn = document.getElementById('finish-attack-btn');
        this.parryArea = document.getElementById('parry-area');
        this.parryCards = document.getElementById('parry-cards');
        this.attackValue = document.getElementById('attack-value');
        this.parryCardCount = document.getElementById('parry-card-count');
        this.parryRequiredValue = document.getElementById('parry-required-value');
        this.finishParryBtn = document.getElementById('finish-parry-btn');
        this.advanceAttackArea = document.getElementById('advance-attack-area');
        this.attackCards = document.getElementById('attack-cards');

        this.setupEventListeners();
        this.renderPiste();
    }

    setupEventListeners() {
        this.createGameBtn.addEventListener('click', () => this.handleCreateGame());
        this.joinGameBtn.addEventListener('click', () => this.showJoinForm());
        this.joinSubmitBtn.addEventListener('click', () => this.handleJoinGame());
        this.copyGameIdBtn.addEventListener('click', () => this.copyGameId());
        this.leaveGameBtn.addEventListener('click', () => this.handleLeaveGame());
        this.finishAttackBtn.addEventListener('click', () => this.handleFinishAttack());
        this.finishParryBtn.addEventListener('click', () => this.handleFinishParry());
    }

    async handleCreateGame() {
        try {
            const gameId = await this.game.createGame();
            this.createdGameId.textContent = gameId;
            this.gameCreatedInfo.classList.remove('hidden');
            this.createGameBtn.disabled = true;
            this.joinGameBtn.disabled = true;
        } catch (error) {
            alert('Error creating game: ' + error.message);
        }
    }

    showJoinForm() {
        this.joinGameForm.classList.remove('hidden');
        this.joinGameBtn.disabled = true;
    }

    async handleJoinGame() {
        const gameId = this.gameIdInput.value.trim().toUpperCase();
        if (!gameId) {
            alert('Please enter a game ID');
            return;
        }

        try {
            await this.game.joinGame(gameId);
            this.showGameScreen();
        } catch (error) {
            alert('Error joining game: ' + error.message);
        }
    }

    copyGameId() {
        const gameId = this.createdGameId.textContent;
        navigator.clipboard.writeText(gameId).then(() => {
            this.copyGameIdBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyGameIdBtn.textContent = 'Copy';
            }, 2000);
        });
    }

    showGameScreen() {
        this.menuScreen.classList.remove('active');
        this.gameScreen.classList.add('active');
        this.currentGameId.textContent = this.game.gameId;
    }

    handleLeaveGame() {
        if (confirm('Are you sure you want to leave the game?')) {
            this.game.leaveGame();
            location.reload();
        }
    }

    renderPiste() {
        this.piste.innerHTML = '';
        for (let i = 0; i < 23; i++) {
            const space = document.createElement('div');
            space.className = 'space';
            space.dataset.position = i;
            if (i === 0 || i === 22) {
                space.classList.add('end-space');
            }
            this.piste.appendChild(space);
        }
    }

    updateGame(gameState) {
        if (!gameState) return;

        // Update turn indicator
        const isMyTurn = this.game.isMyTurn();
        this.turnIndicator.textContent = isMyTurn ? 'Your Turn' : "Opponent's Turn";
        this.turnIndicator.className = isMyTurn ? 'your-turn' : '';

        // Update scores
        this.updateScores(gameState);

        // Update positions
        this.updatePositions(gameState);

        // Update hand
        this.updateHand(gameState);

        // Update deck count
        this.cardsRemaining.textContent = gameState.deck.length;

        // Update action log
        this.updateActionLog(gameState);

        // Update game phase UI
        this.updateGamePhaseUI(gameState);

        // Check if game just started
        if (gameState.gameStarted && this.menuScreen.classList.contains('active')) {
            this.showGameScreen();
        }
    }

    updateScores(gameState) {
        const playerScore = this.game.playerNumber === 1 ? gameState.player1Score : gameState.player2Score;
        const opponentScore = this.game.playerNumber === 1 ? gameState.player2Score : gameState.player1Score;

        this.playerScoreMarker.textContent = playerScore;
        this.opponentScoreMarker.textContent = opponentScore;

        // Update hit dots
        document.querySelectorAll('#player-score-marker').forEach(marker => {
            marker.parentElement.querySelectorAll('.hit-dot').forEach((dot, idx) => {
                dot.classList.toggle('active', idx <= playerScore);
            });
        });

        document.querySelectorAll('#opponent-score-marker').forEach(marker => {
            marker.parentElement.querySelectorAll('.hit-dot').forEach((dot, idx) => {
                dot.classList.toggle('active', idx <= opponentScore);
            });
        });
    }

    updatePositions(gameState) {
        // Remove all swordsmen
        document.querySelectorAll('.swordsman').forEach(s => s.remove());

        // Add player swordsman
        const playerPos = this.game.playerNumber === 1 ? gameState.player1Position : gameState.player2Position;
        const playerSpace = this.piste.querySelector(`[data-position="${playerPos}"]`);
        if (playerSpace) {
            const playerSwordsman = document.createElement('div');
            playerSwordsman.className = 'swordsman player';
            playerSwordsman.textContent = 'P';
            playerSpace.appendChild(playerSwordsman);
        }

        // Add opponent swordsman
        const opponentPos = this.game.playerNumber === 1 ? gameState.player2Position : gameState.player1Position;
        const opponentSpace = this.piste.querySelector(`[data-position="${opponentPos}"]`);
        if (opponentSpace) {
            const opponentSwordsman = document.createElement('div');
            opponentSwordsman.className = 'swordsman opponent';
            opponentSwordsman.textContent = 'O';
            opponentSpace.appendChild(opponentSwordsman);
        }
    }

    updateHand(gameState) {
        const hand = this.game.getMyHand();
        this.playerHand.innerHTML = '';

        hand.forEach(cardValue => {
            const card = this.createCard(cardValue);
            this.playerHand.appendChild(card);
        });
    }

    createCard(value, selectable = true) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.value = value;

        const cardValueEl = document.createElement('div');
        cardValueEl.className = 'card-value';
        cardValueEl.textContent = value;

        const cardLabel = document.createElement('div');
        cardLabel.className = 'card-label';
        cardLabel.textContent = 'Move';

        card.appendChild(cardValueEl);
        card.appendChild(cardLabel);

        if (selectable && this.game.isMyTurn()) {
            card.addEventListener('click', () => this.handleCardClick(card, value));
        } else if (!selectable) {
            card.classList.add('disabled');
        }

        return card;
    }

    handleCardClick(cardElement, cardValue) {
        const gameState = this.game.gameState;

        if (gameState.gamePhase === 'playing') {
            this.handleNormalCardClick(cardValue);
        } else if (gameState.gamePhase === 'attacking') {
            this.handleStrengthenClick(cardValue);
        } else if (gameState.gamePhase === 'parrying') {
            this.handleParryCardClick(cardElement, cardValue);
        } else if (gameState.gamePhase === 'advanceAttack') {
            this.handleAdvanceAttackCardClick(cardValue);
        }
    }

    handleNormalCardClick(cardValue) {
        const canMove = this.game.canMoveForward(cardValue);
        const canAttack = this.game.canAttack(cardValue);

        if (!canMove && !canAttack) {
            alert('This card cannot be played - invalid move and not an attack');
            return;
        }

        let action;
        if (canAttack && canMove) {
            // Show choice dialog
            action = prompt('Choose action:\n1. Move\n2. Attack\n3. Advance and Attack', '1');
            if (action === '1') {
                this.game.playCard(cardValue, 'move');
            } else if (action === '2') {
                this.game.playCard(cardValue, 'attack');
            } else if (action === '3') {
                this.game.playCard(cardValue, 'advance');
            }
        } else if (canAttack) {
            action = prompt('Choose action:\n1. Attack\n2. Advance and Attack', '1');
            if (action === '1') {
                this.game.playCard(cardValue, 'attack');
            } else if (action === '2') {
                this.game.playCard(cardValue, 'advance');
            }
        } else {
            this.game.playCard(cardValue, 'move');
        }
    }

    handleStrengthenClick(cardValue) {
        this.game.strengthenAttack(cardValue);
    }

    handleParryCardClick(cardElement, cardValue) {
        const attackData = this.game.gameState.attackData;
        if (!attackData) return;

        // Toggle selection
        if (cardElement.classList.contains('selected')) {
            cardElement.classList.remove('selected');
            const idx = this.selectedCards.indexOf(cardValue);
            if (idx !== -1) this.selectedCards.splice(idx, 1);
        } else {
            if (this.selectedCards.length < attackData.cardCount) {
                cardElement.classList.add('selected');
                this.selectedCards.push(cardValue);
            }
        }
    }

    handleAdvanceAttackCardClick(cardValue) {
        this.game.advanceAttackCard(cardValue);
    }

    handleFinishAttack() {
        this.game.finishAttack();
    }

    handleFinishParry() {
        if (this.selectedCards.length === 0) {
            if (confirm('No cards selected. Fail to parry?')) {
                this.game.failParry();
            }
        } else {
            this.game.parry(this.selectedCards);
        }
        this.selectedCards = [];
    }

    updateGamePhaseUI(gameState) {
        // Hide all action areas
        this.attackStrengthener.classList.add('hidden');
        this.parryArea.classList.add('hidden');
        this.advanceAttackArea.classList.add('hidden');

        if (gameState.gamePhase === 'attacking' && this.game.isMyTurn()) {
            this.attackStrengthener.classList.remove('hidden');
        } else if (gameState.gamePhase === 'parrying' && this.game.isMyTurn()) {
            this.parryArea.classList.remove('hidden');
            const attackData = gameState.attackData;
            this.attackValue.textContent = attackData.totalValue;
            this.parryCardCount.textContent = attackData.cardCount;
            this.parryRequiredValue.textContent = attackData.totalValue;

            // Show retreat option for advance attacks
            if (attackData.isAdvanceAttack) {
                const retreatBtn = document.createElement('button');
                retreatBtn.textContent = 'Retreat Instead';
                retreatBtn.addEventListener('click', () => this.game.retreatFromAdvanceAttack());
                this.parryArea.appendChild(retreatBtn);
            }
        } else if (gameState.gamePhase === 'advanceAttack' && this.game.isMyTurn()) {
            this.advanceAttackArea.classList.remove('hidden');
        } else if (gameState.gamePhase === 'gameOver') {
            const winner = gameState.player1Score >= 5 ? 1 : 2;
            const message = winner === this.game.playerNumber ? 'You won the game!' : 'You lost the game!';
            alert(message);
        }
    }

    updateActionLog(gameState) {
        // Only show last 10 entries
        const entries = gameState.actionLog.slice(-10).reverse();
        this.actionLog.innerHTML = '';

        entries.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            if (entry.player !== this.game.playerNumber) {
                logEntry.classList.add('opponent-action');
            }

            const timestamp = document.createElement('span');
            timestamp.className = 'timestamp';
            timestamp.textContent = entry.timestamp;

            const message = document.createElement('span');
            message.textContent = entry.message;

            logEntry.appendChild(timestamp);
            logEntry.appendChild(message);
            this.actionLog.appendChild(logEntry);
        });
    }
}
