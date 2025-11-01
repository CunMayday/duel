/*
Version: 6.0
Latest changes: Reduced piste from 23 to 19 spaces, removed Advance and Attack feature
*/

class UI {
    constructor(game) {
        this.game = game;
        this.selectedCards = [];
        this.selectedCardForAction = null;
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
        this.cardActions = document.getElementById('card-actions');

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

        // Round result modal
        this.roundResultModal = document.getElementById('round-result-modal');
        this.resultTitle = document.getElementById('result-title');
        this.resultMessage = document.getElementById('result-message');
        this.continueBtn = document.getElementById('continue-btn');

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
        this.continueBtn.addEventListener('click', () => this.hideRoundResult());
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
        for (let i = 0; i < 19; i++) {
            const space = document.createElement('div');
            space.className = 'space';
            space.dataset.position = i;
            space.textContent = i; // Add space number
            if (i === 0 || i === 18) {
                space.classList.add('end-space');
            }
            this.piste.appendChild(space);
        }
    }

    updateGame(gameState) {
        if (!gameState) return;

        // Check for round end and show modal
        if (gameState.roundEnded && !this.roundResultModal.classList.contains('hidden')) {
            // Modal is already showing
        } else if (gameState.roundEnded) {
            this.showRoundResult(gameState);
            return; // Don't update other UI while modal is showing
        }

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

    showRoundResult(gameState) {
        const playerScore = this.game.playerNumber === 1 ? gameState.player1Score : gameState.player2Score;
        const opponentScore = this.game.playerNumber === 1 ? gameState.player2Score : gameState.player1Score;
        const lastLog = gameState.actionLog[gameState.actionLog.length - 1];

        const modal = this.roundResultModal.querySelector('.modal');

        if (gameState.gamePhase === 'gameOver') {
            const youWon = playerScore >= 5;
            this.resultTitle.textContent = youWon ? 'VICTORY!' : 'DEFEAT';
            modal.className = 'modal ' + (youWon ? 'victory' : 'defeat');
            this.resultMessage.innerHTML = `
                <p>${youWon ? 'You won the game!' : 'You lost the game.'}</p>
                <p>Final Score: You ${playerScore} - ${opponentScore} Opponent</p>
            `;
            this.continueBtn.textContent = 'New Game';
        } else {
            const youWon = lastLog && lastLog.message.includes(`Player ${this.game.playerNumber} wins`);
            this.resultTitle.textContent = youWon ? 'Round Won!' : 'Round Lost';
            modal.className = 'modal ' + (youWon ? 'victory' : 'defeat');
            this.resultMessage.innerHTML = `
                <p>${lastLog ? lastLog.message : ''}</p>
                <p>Score: You ${playerScore} - ${opponentScore} Opponent</p>
            `;
            this.continueBtn.textContent = 'Next Round';
        }

        this.roundResultModal.classList.remove('hidden');
    }

    async hideRoundResult() {
        this.roundResultModal.classList.add('hidden');

        if (this.game.gameState.gamePhase === 'gameOver') {
            // Reload for new game
            this.game.leaveGame();
            location.reload();
        } else {
            // Clear the roundEnded flag
            await this.game.gameDoc.update({ roundEnded: false });
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

        // Add player 1 swordsman (always on left side)
        const player1Space = this.piste.querySelector(`[data-position="${gameState.player1Position}"]`);
        if (player1Space) {
            const p1Swordsman = document.createElement('div');
            p1Swordsman.className = 'swordsman left-fighter';
            player1Space.appendChild(p1Swordsman);
        }

        // Add player 2 swordsman (always on right side)
        const player2Space = this.piste.querySelector(`[data-position="${gameState.player2Position}"]`);
        if (player2Space) {
            const p2Swordsman = document.createElement('div');
            p2Swordsman.className = 'swordsman right-fighter';
            player2Space.appendChild(p2Swordsman);
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
        cardLabel.textContent = 'Card';

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
            this.handleNormalCardClick(cardElement, cardValue);
        } else if (gameState.gamePhase === 'attacking') {
            this.handleStrengthenClick(cardValue);
        } else if (gameState.gamePhase === 'parrying') {
            this.handleParryCardClick(cardElement, cardValue);
        } else if (gameState.gamePhase === 'riposte') {
            this.handleRiposteClick(cardValue);
        }
    }

    handleNormalCardClick(cardElement, cardValue) {
        // Highlight selected card
        document.querySelectorAll('.card').forEach(c => c.classList.remove('selected'));
        cardElement.classList.add('selected');
        this.selectedCardForAction = cardValue;

        // Show available actions for this card
        this.showCardActions(cardValue);
    }

    showCardActions(cardValue) {
        this.cardActions.innerHTML = '';
        this.cardActions.classList.remove('hidden');

        const canMoveForward = this.game.canMoveForward(cardValue);
        const canMoveBackward = this.game.canMoveBackward(cardValue);
        const canAttack = this.game.canAttack(cardValue);

        if (canMoveForward) {
            const btn = document.createElement('button');
            btn.className = 'move-forward-btn';
            btn.textContent = `Move Forward ${cardValue}`;
            btn.addEventListener('click', () => {
                this.game.playCard(cardValue, 'move');
                this.cardActions.classList.add('hidden');
            });
            this.cardActions.appendChild(btn);
        }

        if (canMoveBackward) {
            const btn = document.createElement('button');
            btn.className = 'move-backward-btn';
            btn.textContent = `Move Backward ${cardValue}`;
            btn.addEventListener('click', () => {
                this.game.playCard(cardValue, 'moveBackward');
                this.cardActions.classList.add('hidden');
            });
            this.cardActions.appendChild(btn);
        }

        if (canAttack) {
            const btn = document.createElement('button');
            btn.className = 'attack-btn';
            btn.textContent = `Attack! (${cardValue})`;
            btn.addEventListener('click', () => {
                this.game.playCard(cardValue, 'attack');
                this.cardActions.classList.add('hidden');
            });
            this.cardActions.appendChild(btn);
        }

        if (!canMoveForward && !canMoveBackward && !canAttack) {
            const msg = document.createElement('p');
            msg.textContent = 'This card cannot be played (invalid move and distance)';
            msg.style.color = '#dc3545';
            this.cardActions.appendChild(msg);
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


    handleRiposteClick(cardValue) {
        const distance = this.game.getDistance();
        if (distance === cardValue) {
            this.game.riposte(cardValue);
        } else {
            alert(`Cannot riposte with this card. Distance is ${distance}.`);
        }
    }

    handleFinishAttack() {
        this.game.finishAttack();
    }

    handleFinishParry() {
        if (this.selectedCards.length === 0) {
            this.game.failParry();
        } else {
            this.game.parry(this.selectedCards);
        }
        this.selectedCards = [];
    }

    updateGamePhaseUI(gameState) {
        // Hide all action areas by default
        this.attackStrengthener.classList.add('hidden');
        this.parryArea.classList.add('hidden');
        this.cardActions.classList.add('hidden');

        if (gameState.gamePhase === 'attacking' && this.game.isMyTurn()) {
            // Only show strengthen option if cards are available
            if (this.game.hasStrengthenCards()) {
                this.attackStrengthener.classList.remove('hidden');
                const attackData = gameState.attackData;
                const strengthenP = this.attackStrengthener.querySelector('p');
                strengthenP.textContent = `Attack declared with card ${attackData.cards[0]}! Click matching cards to strengthen, or finish attack.`;
            } else {
                // Auto-finish if no strengthen cards available
                const attackData = gameState.attackData;
                this.attackStrengthener.classList.remove('hidden');
                const strengthenP = this.attackStrengthener.querySelector('p');
                strengthenP.textContent = `Attack declared with card ${attackData.cards[0]}! No cards available to strengthen. Click Finish Attack.`;
            }
        } else if (gameState.gamePhase === 'parrying' && this.game.isMyTurn()) {
            const attackData = gameState.attackData;

            // Check if player can parry
            if (!this.game.canParry(attackData)) {
                // Auto-fail parry
                this.parryArea.classList.remove('hidden');
                this.parryArea.innerHTML = `
                    <p style="color: #dc3545; font-weight: bold;">
                        You are being attacked with total value ${attackData.totalValue}!
                        You don't have the cards to defend yourself. You will be hit.
                    </p>
                    <button id="accept-hit-btn" style="background: #dc3545;">Accept Hit</button>
                `;
                document.getElementById('accept-hit-btn').addEventListener('click', () => {
                    this.game.failParry();
                });
            } else {
                this.parryArea.classList.remove('hidden');
                this.attackValue.textContent = attackData.totalValue;
                this.parryCardCount.textContent = attackData.cardCount;
                this.parryRequiredValue.textContent = attackData.totalValue;
            }
        } else if (gameState.gamePhase === 'riposte' && this.game.isMyTurn()) {
            this.cardActions.classList.remove('hidden');
            this.cardActions.innerHTML = `
                <div class="riposte-message">
                    🎯 Riposte Opportunity! Click a card matching the distance (${this.game.getDistance()}) to score an immediate hit!
                </div>
            `;
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
