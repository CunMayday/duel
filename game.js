/*
Version: 2.0
Latest changes: Converted from Realtime Database to Firestore with real-time listeners
*/

class Game {
    constructor() {
        this.gameId = null;
        this.playerId = this.generatePlayerId();
        this.playerNumber = null; // 1 or 2
        this.gameState = null;
        this.gameDoc = null;
        this.unsubscribe = null;
        this.selectedCards = [];
        this.isAdvanceAttack = false;
        this.advanceCard = null;
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9);
    }

    generateGameId() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }

    async createGame() {
        this.gameId = this.generateGameId();
        this.playerNumber = 1;

        const initialState = this.createInitialGameState();
        this.gameDoc = db.collection('games').doc(this.gameId);

        await this.gameDoc.set(initialState);
        this.setupGameListener();

        return this.gameId;
    }

    async joinGame(gameId) {
        this.gameId = gameId;
        this.gameDoc = db.collection('games').doc(gameId);

        const snapshot = await this.gameDoc.get();
        if (!snapshot.exists) {
            throw new Error('Game not found');
        }

        const gameData = snapshot.data();
        if (gameData.player2) {
            throw new Error('Game is full');
        }

        this.playerNumber = 2;
        await this.gameDoc.update({
            player2: this.playerId,
            gameStarted: true,
            currentTurn: 1
        });

        this.setupGameListener();
    }

    createInitialGameState() {
        return {
            player1: this.playerId,
            player2: null,
            gameStarted: false,
            currentTurn: 1,
            round: 1,
            player1Score: 0,
            player2Score: 0,
            player1Position: 0,
            player2Position: 22,
            deck: this.createDeck(),
            player1Hand: [],
            player2Hand: [],
            actionLog: [],
            gamePhase: 'waiting', // waiting, playing, attacking, parrying, gameOver
            attackData: null,
            lastCardPlayed: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
    }

    createDeck() {
        const deck = [];
        // 5 cards each of values 1-5
        for (let value = 1; value <= 5; value++) {
            for (let i = 0; i < 5; i++) {
                deck.push(value);
            }
        }
        return this.shuffleDeck(deck);
    }

    shuffleDeck(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    setupGameListener() {
        this.unsubscribe = this.gameDoc.onSnapshot((snapshot) => {
            if (!snapshot.exists) return;

            this.gameState = snapshot.data();
            if (this.gameState && this.gameState.gameStarted && this.gameState.player1Hand.length === 0) {
                this.startNewRound();
            }
            this.onGameStateChanged();
        });
    }

    async startNewRound() {
        if (!this.isMyTurn()) return; // Only one player should initialize

        const updates = {};
        updates.player1Position = 0;
        updates.player2Position = 22;
        updates.gamePhase = 'playing';
        updates.attackData = null;
        updates.lastCardPlayed = null;

        // Deal 5 cards to each player
        const deck = [...this.gameState.deck];
        const player1Hand = [];
        const player2Hand = [];

        for (let i = 0; i < 5; i++) {
            if (deck.length > 0) player1Hand.push(deck.pop());
            if (deck.length > 0) player2Hand.push(deck.pop());
        }

        updates.deck = deck;
        updates.player1Hand = player1Hand;
        updates.player2Hand = player2Hand;

        this.addLog(`Round ${this.gameState.round} started!`);
        updates.actionLog = this.gameState.actionLog;

        await this.gameDoc.update(updates);
    }

    async playCard(cardValue, action) {
        if (!this.isMyTurn()) return;

        const myHand = this.getMyHand();
        const cardIndex = myHand.indexOf(cardValue);
        if (cardIndex === -1) return;

        // Remove card from hand
        const newHand = [...myHand];
        newHand.splice(cardIndex, 1);

        const updates = {};
        this.setMyHand(updates, newHand);
        updates.lastCardPlayed = { player: this.playerNumber, value: cardValue, action: action };

        switch (action) {
            case 'move':
                await this.handleMove(cardValue, updates);
                break;
            case 'attack':
                await this.handleAttack(cardValue, updates);
                break;
            case 'advance':
                await this.handleAdvance(cardValue, updates);
                break;
        }
    }

    async handleMove(cardValue, updates) {
        const myPos = this.getMyPosition();
        const opponentPos = this.getOpponentPosition();

        // Determine direction - move toward opponent
        let newPos;
        if (this.playerNumber === 1) {
            newPos = myPos + cardValue;
            if (newPos >= opponentPos || newPos > 22) {
                this.addLog('Invalid move - cannot move onto or past opponent');
                return;
            }
        } else {
            newPos = myPos - cardValue;
            if (newPos <= opponentPos || newPos < 0) {
                this.addLog('Invalid move - cannot move onto or past opponent');
                return;
            }
        }

        this.setMyPosition(updates, newPos);
        this.addLog(`Player ${this.playerNumber} moved ${cardValue} spaces (card ${cardValue})`);

        await this.drawCards(updates);
        this.switchTurn(updates);

        updates.actionLog = this.gameState.actionLog;
        await this.gameDoc.update(updates);
    }

    async handleAttack(cardValue, updates) {
        const distance = this.getDistance();
        if (distance !== cardValue) {
            this.addLog('Invalid attack - distance does not match card value');
            return;
        }

        this.addLog(`Player ${this.playerNumber} attacks with card ${cardValue}!`);
        updates.gamePhase = 'attacking';
        updates.attackData = {
            attacker: this.playerNumber,
            cards: [cardValue],
            totalValue: cardValue,
            cardCount: 1
        };
        updates.actionLog = this.gameState.actionLog;

        await this.gameDoc.update(updates);
    }

    async handleAdvance(cardValue, updates) {
        const myPos = this.getMyPosition();
        let newPos;

        if (this.playerNumber === 1) {
            newPos = myPos + cardValue;
        } else {
            newPos = myPos - cardValue;
        }

        this.setMyPosition(updates, newPos);
        this.addLog(`Player ${this.playerNumber} advances ${cardValue} spaces (card ${cardValue})`);

        updates.gamePhase = 'advanceAttack';
        updates.actionLog = this.gameState.actionLog;

        await this.gameDoc.update(updates);
    }

    async strengthenAttack(cardValue) {
        if (this.gameState.gamePhase !== 'attacking') return;
        if (!this.isMyTurn()) return;

        const attackData = this.gameState.attackData;
        if (cardValue !== attackData.cards[0]) {
            this.addLog('Can only strengthen with same value card');
            return;
        }

        const myHand = this.getMyHand();
        const cardIndex = myHand.indexOf(cardValue);
        if (cardIndex === -1) return;

        const newHand = [...myHand];
        newHand.splice(cardIndex, 1);

        const updates = {};
        this.setMyHand(updates, newHand);

        attackData.cards.push(cardValue);
        attackData.totalValue += cardValue;
        attackData.cardCount++;

        updates.attackData = attackData;
        this.addLog(`Player ${this.playerNumber} strengthens attack with card ${cardValue} (total: ${attackData.totalValue})`);
        updates.actionLog = this.gameState.actionLog;

        await this.gameDoc.update(updates);
    }

    async finishAttack() {
        if (this.gameState.gamePhase !== 'attacking') return;
        if (!this.isMyTurn()) return;

        const updates = {};
        await this.drawCards(updates);

        updates.gamePhase = 'parrying';
        this.switchTurn(updates);
        updates.actionLog = this.gameState.actionLog;

        await this.gameDoc.update(updates);
    }

    async parry(selectedCards) {
        if (this.gameState.gamePhase !== 'parrying') return;
        if (!this.isMyTurn()) return;

        const attackData = this.gameState.attackData;
        const totalValue = selectedCards.reduce((sum, card) => sum + card, 0);

        if (selectedCards.length !== attackData.cardCount || totalValue !== attackData.totalValue) {
            this.addLog('Invalid parry - must match card count and total value');
            return;
        }

        // Remove cards from hand
        const myHand = this.getMyHand();
        const newHand = [...myHand];
        selectedCards.forEach(card => {
            const idx = newHand.indexOf(card);
            if (idx !== -1) newHand.splice(idx, 1);
        });

        const updates = {};
        this.setMyHand(updates, newHand);

        this.addLog(`Player ${this.playerNumber} parries successfully!`);
        updates.gamePhase = 'playing';
        updates.attackData = null;
        updates.actionLog = this.gameState.actionLog;

        await this.gameDoc.update(updates);
    }

    async failParry() {
        if (this.gameState.gamePhase !== 'parrying') return;
        if (!this.isMyTurn()) return;

        const attackData = this.gameState.attackData;
        this.addLog(`Player ${this.playerNumber} fails to parry. Player ${attackData.attacker} scores a hit!`);

        await this.scoreHit(attackData.attacker);
    }

    async advanceAttackCard(cardValue) {
        if (this.gameState.gamePhase !== 'advanceAttack') return;
        if (!this.isMyTurn()) return;

        const distance = this.getDistance();
        if (distance !== cardValue) {
            this.addLog('Invalid attack - distance does not match card value');
            return;
        }

        const myHand = this.getMyHand();
        const cardIndex = myHand.indexOf(cardValue);
        if (cardIndex === -1) return;

        const newHand = [...myHand];
        newHand.splice(cardIndex, 1);

        const updates = {};
        this.setMyHand(updates, newHand);

        this.addLog(`Player ${this.playerNumber} attacks with card ${cardValue} (Advance and Attack)!`);
        updates.gamePhase = 'attacking';
        updates.attackData = {
            attacker: this.playerNumber,
            cards: [cardValue],
            totalValue: cardValue,
            cardCount: 1,
            isAdvanceAttack: true
        };
        updates.actionLog = this.gameState.actionLog;

        await this.gameDoc.update(updates);
    }

    async retreatFromAdvanceAttack() {
        if (this.gameState.gamePhase !== 'parrying') return;
        if (!this.isMyTurn()) return;

        const attackData = this.gameState.attackData;
        if (!attackData.isAdvanceAttack) {
            this.addLog('Can only retreat from advance attacks');
            return;
        }

        // Move backward
        const myPos = this.getMyPosition();
        let newPos;
        if (this.playerNumber === 1) {
            newPos = Math.max(0, myPos - 1);
        } else {
            newPos = Math.min(22, myPos + 1);
        }

        const updates = {};
        this.setMyPosition(updates, newPos);
        this.addLog(`Player ${this.playerNumber} retreats from advance attack`);

        updates.gamePhase = 'playing';
        updates.attackData = null;
        this.switchTurn(updates);
        updates.actionLog = this.gameState.actionLog;

        await this.gameDoc.update(updates);
    }

    async scoreHit(winnerNumber) {
        const updates = {};
        const scoreKey = `player${winnerNumber}Score`;
        updates[scoreKey] = this.gameState[scoreKey] + 1;

        if (updates[scoreKey] >= 5) {
            this.addLog(`Player ${winnerNumber} wins the game!`);
            updates.gamePhase = 'gameOver';
        } else {
            this.addLog(`Player ${winnerNumber} wins the round! Score: Player 1: ${winnerNumber === 1 ? updates[scoreKey] : this.gameState.player1Score}, Player 2: ${winnerNumber === 2 ? updates[scoreKey] : this.gameState.player2Score}`);
            updates.round = this.gameState.round + 1;
            updates.deck = this.createDeck();
            updates.player1Hand = [];
            updates.player2Hand = [];
            updates.gamePhase = 'playing';
            updates.attackData = null;
        }

        updates.actionLog = this.gameState.actionLog;
        await this.gameDoc.update(updates);
    }

    async drawCards(updates) {
        const myHand = this.getMyHand();
        const cardsNeeded = 5 - myHand.length;

        if (cardsNeeded > 0) {
            const deck = [...this.gameState.deck];
            const newHand = [...myHand];

            for (let i = 0; i < cardsNeeded && deck.length > 0; i++) {
                newHand.push(deck.pop());
            }

            this.setMyHand(updates, newHand);
            updates.deck = deck;
        }
    }

    getMyHand() {
        return this.playerNumber === 1 ? this.gameState.player1Hand : this.gameState.player2Hand;
    }

    setMyHand(updates, hand) {
        updates[`player${this.playerNumber}Hand`] = hand;
    }

    getMyPosition() {
        return this.playerNumber === 1 ? this.gameState.player1Position : this.gameState.player2Position;
    }

    getOpponentPosition() {
        return this.playerNumber === 1 ? this.gameState.player2Position : this.gameState.player1Position;
    }

    setMyPosition(updates, position) {
        updates[`player${this.playerNumber}Position`] = position;
    }

    getDistance() {
        return Math.abs(this.getMyPosition() - this.getOpponentPosition());
    }

    isMyTurn() {
        return this.gameState && this.gameState.currentTurn === this.playerNumber;
    }

    switchTurn(updates) {
        updates.currentTurn = this.gameState.currentTurn === 1 ? 2 : 1;
    }

    addLog(message) {
        const timestamp = new Date().toLocaleTimeString();
        this.gameState.actionLog.push({
            timestamp: timestamp,
            message: message,
            player: this.playerNumber
        });
    }

    canMoveForward(cardValue) {
        const myPos = this.getMyPosition();
        const opponentPos = this.getOpponentPosition();

        if (this.playerNumber === 1) {
            const newPos = myPos + cardValue;
            return newPos < opponentPos && newPos <= 22;
        } else {
            const newPos = myPos - cardValue;
            return newPos > opponentPos && newPos >= 0;
        }
    }

    canAttack(cardValue) {
        return this.getDistance() === cardValue;
    }

    canAdvanceAndAttack(advanceCard, attackCard) {
        const myPos = this.getMyPosition();
        const opponentPos = this.getOpponentPosition();

        let newPos;
        if (this.playerNumber === 1) {
            newPos = myPos + advanceCard;
        } else {
            newPos = myPos - advanceCard;
        }

        const newDistance = Math.abs(newPos - opponentPos);
        return newDistance === attackCard;
    }

    onGameStateChanged() {
        // This will be called by UI
    }

    async leaveGame() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        if (this.gameDoc) {
            await this.gameDoc.delete();
        }
    }
}
