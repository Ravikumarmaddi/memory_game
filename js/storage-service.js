(function (ns) {
  'use strict';

  class StorageService {
    constructor(config) {
      this.config = config;
      this.prefix = `${config.storage.namespace}.`;
    }

    _key(name) { return this.prefix + name; }

    _read(name, fallback) {
      try {
        const raw = localStorage.getItem(this._key(name));
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) {
        return fallback;
      }
    }

    _write(name, value) {
      try { localStorage.setItem(this._key(name), JSON.stringify(value)); } catch (_) {}
    }

    getPreferences() { return this._read('preferences', null); }
    savePreferences(preferences) { this._write('preferences', preferences); }

    getPlayerScores() { return this._read('playerScores', {}); }
    getTopScoresBySize() { return this._read('topScoresBySize', {}); }
    getHistory() { return this._read('history', []); }

    saveCompletedGame(summary) {
      const playerScores = this.getPlayerScores();
      summary.players.forEach(player => {
        const key = player.name.trim() || 'Player';
        const previous = playerScores[key] || { topScore: 0, games: 0, wins: 0 };
        previous.topScore = Math.max(previous.topScore || 0, player.score || 0);
        previous.games = (previous.games || 0) + 1;
        if (summary.winners.includes(key)) previous.wins = (previous.wins || 0) + 1;
        playerScores[key] = previous;
      });
      this._write('playerScores', playerScores);

      const topBySize = this.getTopScoresBySize();
      const sizeKey = String(summary.pairSize);
      if (!topBySize[sizeKey] || summary.gameScore > topBySize[sizeKey].score) {
        topBySize[sizeKey] = {
          score: summary.gameScore,
          date: summary.date,
          theme: summary.theme,
          players: summary.players.map(p => p.name),
          winners: summary.winners,
          timeSeconds: summary.timeSeconds,
          moves: summary.moves
        };
      }
      this._write('topScoresBySize', topBySize);

      const history = this.getHistory();
      history.unshift(summary);
      history.splice(this.config.storage.historyLimit);
      this._write('history', history);
    }

    resetAll() {
      Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
        .forEach(key => localStorage.removeItem(key));
    }
  }

  ns.StorageService = StorageService;
})(window.MemoryGame);
