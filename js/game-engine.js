(function (ns) {
  'use strict';

  class GameEngine {
    constructor(config, callbacks = {}) {
      this.config = config;
      this.callbacks = callbacks;
      this.timerId = null;
      this.gameToken = 0;
      this.resetState();
    }

    resetState() {
      this.cards = [];
      this.selected = [];
      this.locked = false;
      this.started = false;
      this.completed = false;
      this.startTime = null;
      this.elapsedSeconds = 0;
      this.moves = 0;
      this.misses = 0;
      this.matches = 0;
      this.currentPlayer = 0;
      this.players = [];
      this.settings = null;
    }

    shuffle(items) {
      const copy = items.slice();
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }

    async newGame(settings, manifest) {
      this.stopTimer();
      this.resetState();
      this.gameToken += 1;
      this.settings = settings;
      this.players = settings.playerNames.slice(0, settings.playerCount).map((name, index) => ({
        id: index,
        name: (name || `Player ${index + 1}`).trim(),
        color: settings.playerColors?.[index] || this.config.defaults.playerColors?.[index] || '#3b82f6',
        pairs: 0,
        score: 0,
        streak: 0,
        bestStreak: 0
      }));

      const chosen = this.shuffle(manifest).slice(0, settings.pairSize);
      const deck = [];
      chosen.forEach(item => {
        for (let copy = 0; copy < 2; copy++) {
          deck.push({
            uid: `${item.id}-${copy}-${Math.random().toString(36).slice(2)}`,
            pairId: item.id,
            name: item.name,
            image: `assets/cards/${settings.theme}/${item.file}`,
            matched: false,
            faceUp: false
          });
        }
      });
      this.cards = this.shuffle(deck);
      this.callbacks.onStateChange?.(this.getSnapshot());
    }

    async beginAfterPreview() {
      this.started = true;
      this.startTime = Date.now();
      this.startTimer();
      this.callbacks.onStateChange?.(this.getSnapshot());
    }

    startTimer() {
      this.stopTimer();
      this.timerId = setInterval(() => {
        if (!this.started || this.completed) return;
        this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        this.callbacks.onTick?.(this.elapsedSeconds, this.getSnapshot());
      }, 1000);
    }

    stopTimer() {
      if (this.timerId) clearInterval(this.timerId);
      this.timerId = null;
    }

    selectCard(uid) {
      if (!this.started || this.completed || this.locked || this.selected.length >= 2) return;
      const card = this.cards.find(c => c.uid === uid);
      if (!card || card.matched || card.faceUp) return;

      card.faceUp = true;
      this.selected.push(card);
      this.callbacks.onStateChange?.(this.getSnapshot());

      if (this.selected.length === 2) this.evaluatePair();
    }

    evaluatePair() {
      this.locked = true;
      this.moves += 1;
      const [a, b] = this.selected;
      const player = this.players[this.currentPlayer];

      if (a.pairId === b.pairId) {
        a.matched = b.matched = true;
        this.matches += 1;
        player.pairs += 1;
        player.streak += 1;
        player.bestStreak = Math.max(player.bestStreak, player.streak);
        const scoring = this.config.scoring;
        const streakBonus = Math.min(scoring.maxStreakBonus, Math.max(0, player.streak - 1) * scoring.streakBonusStep);
        player.score += scoring.matchPoints + streakBonus;
        this.selected = [];
        this.locked = false;
        this.callbacks.onMatch?.(a, player, this.getSnapshot());
        this.callbacks.onStateChange?.(this.getSnapshot());
        if (this.matches === this.settings.pairSize) this.completeGame();
      } else {
        this.misses += 1;
        player.streak = 0;
        player.score = Math.max(0, player.score - this.config.scoring.missPenalty);
        this.callbacks.onMiss?.(a, b, player, this.getSnapshot());
        const token = this.gameToken;
        setTimeout(() => {
          if (token !== this.gameToken) return;
          a.faceUp = false;
          b.faceUp = false;
          this.selected = [];
          this.locked = false;
          if (this.players.length > 1) this.currentPlayer = (this.currentPlayer + 1) % this.players.length;
          this.callbacks.onStateChange?.(this.getSnapshot());
        }, Number(this.settings.mismatchDelayMs));
      }
    }

    completeGame() {
      this.completed = true;
      this.stopTimer();
      this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      const scoring = this.config.scoring;
      const targetSeconds = Math.max(30, this.settings.pairSize * 8);
      const speedRatio = Math.max(0, 1 - (this.elapsedSeconds / (targetSeconds * 2)));
      const speedBonus = Math.round(scoring.speedBonusMax * speedRatio);
      const completionBonus = scoring.completionBonusBase + speedBonus;
      const playerTotal = this.players.reduce((sum, p) => sum + p.score, 0);
      const gameScore = playerTotal + completionBonus;
      const maxPairs = Math.max(...this.players.map(p => p.pairs));
      const winners = this.players.filter(p => p.pairs === maxPairs).map(p => p.name);
      this.callbacks.onComplete?.({ ...this.getSnapshot(), gameScore, completionBonus, winners });
    }

    getSnapshot() {
      const attempts = this.matches + this.misses;
      const accuracy = attempts === 0 ? 100 : Math.round((this.matches / attempts) * 100);
      return {
        cards: this.cards.map(c => ({ ...c })),
        players: this.players.map(p => ({ ...p })),
        currentPlayer: this.currentPlayer,
        moves: this.moves,
        misses: this.misses,
        matches: this.matches,
        accuracy,
        elapsedSeconds: this.elapsedSeconds,
        started: this.started,
        completed: this.completed,
        locked: this.locked,
        settings: this.settings ? { ...this.settings, playerNames: [...this.settings.playerNames], playerColors: [...(this.settings.playerColors || [])] } : null
      };
    }
  }

  ns.GameEngine = GameEngine;
})(window.MemoryGame);
