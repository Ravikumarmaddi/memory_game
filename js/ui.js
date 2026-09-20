(function (ns) {
  'use strict';

  class UI {
    constructor(config) {
      this.config = config;
      this.board = document.getElementById('gameBoard');
      this.playerStatus = document.getElementById('playerStatus');
      this.previewMask = document.getElementById('previewMask');
      this.storage = null;
    }

    formatTime(seconds) {
      const min = Math.floor(seconds / 60).toString().padStart(2, '0');
      const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
      return `${min}:${sec}`;
    }

    setText(id, value) {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    }

    showSection(sectionId) {
      ['setupSection', 'gameSection', 'statsSection'].forEach(id => {
        document.getElementById(id).classList.toggle('d-none', id !== sectionId);
      });
      const navbar = document.querySelector('.app-navbar');
      if (navbar) navbar.classList.toggle('d-none', sectionId === 'gameSection');
      document.querySelectorAll('[data-nav-section]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.navSection === sectionId);
      });
    }

    populateSetup(preferences) {
      const pairSelect = document.getElementById('pairSize');
      pairSelect.innerHTML = this.config.pairSizes.map(v => `<option value="${v}">${v} pairs · ${v * 2} cards</option>`).join('');
      pairSelect.value = String(preferences.pairSize);

      const playerSelect = document.getElementById('playerCount');
      playerSelect.innerHTML = this.config.playerCounts.map(p => `<option value="${p.value}">${p.label}</option>`).join('');
      playerSelect.value = String(preferences.playerCount);

      const themeSelect = document.getElementById('theme');
      themeSelect.innerHTML = this.config.themes.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
      themeSelect.value = preferences.theme;

      const preview = document.getElementById('previewSeconds');
      preview.innerHTML = this.config.previewSeconds.map(v => `<option value="${v}">${v === 0 ? 'Off' : v + ' seconds'}</option>`).join('');
      preview.value = String(preferences.previewSeconds);

      document.getElementById('mismatchDelayMs').value = String(preferences.mismatchDelayMs);
      document.getElementById('showPositionNumbers').checked = !!preferences.showPositionNumbers;

      const colorOptions = this.config.playerColors.map(c => `<option value="${c.value}">${c.label}</option>`).join('');
      [1,2,3].forEach(i => {
        const nameInput = document.getElementById(`playerName${i}`);
        if (nameInput) nameInput.value = preferences.playerNames?.[i - 1] || `Player ${i}`;
        const colorSelect = document.getElementById(`playerColor${i}`);
        if (colorSelect) {
          colorSelect.innerHTML = colorOptions;
          colorSelect.value = preferences.playerColors?.[i - 1] || this.config.defaults.playerColors?.[i - 1] || this.config.playerColors[0].value;
        }
      });
      this.updatePlayerNameFields(preferences.playerCount);
      this.updatePairSizeAvailability(preferences.theme);
      this.updateSetupSummary(this.readSetup());
    }

    readSetup() {
      return {
        pairSize: Number(document.getElementById('pairSize').value),
        playerCount: Number(document.getElementById('playerCount').value),
        theme: document.getElementById('theme').value,
        previewSeconds: Number(document.getElementById('previewSeconds').value),
        mismatchDelayMs: Number(document.getElementById('mismatchDelayMs').value),
        showPositionNumbers: document.getElementById('showPositionNumbers').checked,
        playerNames: [1,2,3].map(i => document.getElementById(`playerName${i}`).value.trim() || `Player ${i}`),
        playerColors: [1,2,3].map(i => document.getElementById(`playerColor${i}`).value || this.config.playerColors[0].value)
      };
    }

    updatePlayerNameFields(count) {
      [1,2,3].forEach(i => {
        const show = i <= Number(count);
        document.getElementById(`playerGroup${i}`).classList.toggle('d-none', !show);
        document.getElementById(`playerColorGroup${i}`).classList.toggle('d-none', !show);
      });
    }

    updatePairSizeAvailability(themeId) {
      const pairSelect = document.getElementById('pairSize');
      const maximum = Math.max(...this.config.pairSizes);
      Array.from(pairSelect.options).forEach(option => {
        option.disabled = Number(option.value) > maximum;
      });
      if (Number(pairSelect.value) > maximum) pairSelect.value = String(maximum);
    }

    colorLabel(color) {
      return this.config.playerColors.find(c => c.value === color)?.label || color;
    }

    updateSetupSummary(settings) {
      const theme = this.config.themes.find(t => t.id === settings.theme)?.label || settings.theme;
      const mode = this.config.playerCounts.find(p => p.value === Number(settings.playerCount))?.label || '';
      this.setText('summaryBoard', `${settings.pairSize} pairs · ${settings.pairSize * 2} cards`);
      this.setText('summaryTheme', theme);
      this.setText('summaryPlayers', mode);
      this.setText('summaryPreview', settings.previewSeconds ? `${settings.previewSeconds}s` : 'Off');
      const colorText = (settings.playerColors || []).slice(0, settings.playerCount).map(c => this.colorLabel(c)).join(', ');
      this.setText('summaryColors', colorText || '-');
    }

    applyTurnTheme(snapshot) {
      const active = snapshot.players?.[snapshot.currentPlayer];
      const turnColor = active?.color || '#eaf2fb';
      document.documentElement.style.setProperty('--turn-accent', turnColor);
      const gameShell = document.querySelector('.game-shell-main');
      if (gameShell) gameShell.style.setProperty('--active-player-color', turnColor);
      if (this.board) this.board.style.setProperty('--active-player-color', turnColor);
    }

    renderGame(snapshot) {
      if (!snapshot.settings) return;
      this.applyTurnTheme(snapshot);
      const pairSize = snapshot.settings.pairSize;
      this.board.dataset.size = pairSize;
      this.board.innerHTML = snapshot.cards.map((card, index) => {
        const isUp = card.faceUp || card.matched;
        return `<button class="memory-card ${isUp ? 'is-flipped' : ''} ${card.matched ? 'is-matched' : ''}" data-card-id="${card.uid}" aria-label="${card.matched ? 'Matched ' + card.name : isUp ? card.name : 'Hidden memory card ' + (index + 1)}" ${card.matched ? 'disabled' : ''}>
          <span class="memory-card-inner">
            <span class="memory-card-side memory-card-back">
              ${snapshot.settings.showPositionNumbers ? `<span class="position-number">${index + 1}</span>` : ''}
            </span>
            <span class="memory-card-side memory-card-front">
              <span class="card-image-frame">
                <img src="${card.image}" alt="${card.name}" loading="eager">
              </span>
              ${['flowers', 'animals'].includes(snapshot.settings.theme) ? '' : `<span class="card-name-label" aria-hidden="true">${card.name}</span>`}
            </span>
          </span>
        </button>`;
      }).join('');

      this.setText('statTurns', snapshot.moves);
      this.setText('statTime', this.formatTime(snapshot.elapsedSeconds));

      this.playerStatus.innerHTML = snapshot.players.map((p, index) => {
        const isActive = index === snapshot.currentPlayer && !snapshot.completed;
        const color = p.color || '#3b82f6';
        const bg = this.hexToRgba(color, isActive ? 0.18 : 0.08);
        const outline = this.hexToRgba(color, isActive ? 0.38 : 0.18);
        const nameText = this.contrastTextColor(color);
        return `
        <div class="player-chip ${isActive ? 'active-turn' : ''}" style="--player-color:${color}; border-color:${color}; background:${bg}; box-shadow:0 0 0 3px ${outline};">
          <div class="player-chip-name" style="background:${color}; color:${nameText};">${this.escapeHtml(p.name)}${isActive ? '<span class="turn-label">TURN</span>' : ''}</div>
          <div class="player-score-line"><span>Score</span><strong class="player-score-value">${p.pairs}</strong></div>
          <div class="player-chip-meta">Total Turns <strong>${snapshot.moves}</strong> <span class="player-meta-divider">•</span> Best streak <strong>${p.bestStreak}</strong></div>
        </div>`;
      }).join('');

    }

    renderGameSidebarScores(storage) {
      const players = storage.getPlayerScores();
      const playerRows = Object.entries(players).sort((a,b) => (b[1].topScore || 0) - (a[1].topScore || 0)).slice(0, 7);
      document.getElementById('miniPlayerScores').innerHTML = playerRows.length ? playerRows.map(([name, data]) => `
        <div class="mini-score-row"><span>${this.escapeHtml(name)}</span><strong>${data.topScore || 0}</strong></div>`).join('') : '<div class="text-muted small">No scores yet.</div>';

      const top = storage.getTopScoresBySize();
      document.getElementById('miniSizeScores').innerHTML = this.config.pairSizes.map(size => {
        const d = top[String(size)];
        return d
          ? `<div class="mini-score-row"><span>${size} pairs <span class="mini-muted">${this.escapeHtml((d.winners || []).join(', '))}</span></span><strong>${d.score}</strong></div>`
          : `<div class="mini-score-row"><span>${size} pairs</span><span class="mini-muted">-</span></div>`;
      }).join('');
    }

    renderStats(storage) {
      const players = storage.getPlayerScores();
      const playerRows = Object.entries(players).sort((a,b) => (b[1].topScore || 0) - (a[1].topScore || 0));
      document.getElementById('playerScoreTableBody').innerHTML = playerRows.length ? playerRows.map(([name, data]) => `
        <tr><td>${this.escapeHtml(name)}</td><td>${data.topScore || 0}</td><td>${data.games || 0}</td><td>${data.wins || 0}</td></tr>`).join('') : '<tr><td colspan="4" class="text-muted text-center py-4">No completed games yet.</td></tr>';

      const top = storage.getTopScoresBySize();
      document.getElementById('sizeScoreTableBody').innerHTML = this.config.pairSizes.map(size => {
        const d = top[String(size)];
        return d ? `<tr><td>${size} pairs</td><td>${d.score}</td><td>${this.escapeHtml((d.winners || []).join(', '))}</td><td>${this.escapeHtml(d.theme)}</td><td>${this.formatTime(d.timeSeconds)}</td></tr>`
          : `<tr><td>${size} pairs</td><td colspan="4" class="text-muted">No score yet</td></tr>`;
      }).join('');

      const history = storage.getHistory();
      document.getElementById('historyTableBody').innerHTML = history.length ? history.map(g => `
        <tr>
          <td>${new Date(g.date).toLocaleString()}</td>
          <td>${g.pairSize}</td>
          <td>${this.escapeHtml(g.theme)}</td>
          <td>${this.escapeHtml(g.players.map(p => p.name).join(', '))}</td>
          <td>${this.escapeHtml(g.winners.join(', '))}</td>
          <td>${g.moves}</td><td>${g.misses}</td><td>${g.accuracy}%</td><td>${this.formatTime(g.timeSeconds)}</td><td>${g.gameScore}</td>
        </tr>`).join('') : '<tr><td colspan="10" class="text-muted text-center py-4">No game history yet.</td></tr>';

    }

    showPreview(seconds, cards) {
      if (!seconds) return Promise.resolve();
      this.previewMask.classList.remove('d-none');
      let remaining = seconds;
      const label = document.getElementById('previewCountdown');
      label.textContent = `Memorize! ${remaining}`;
      document.querySelectorAll('.memory-card').forEach(c => c.classList.add('is-flipped'));
      return new Promise(resolve => {
        const id = setInterval(() => {
          remaining -= 1;
          if (remaining <= 0) {
            clearInterval(id);
            this.previewMask.classList.add('d-none');
            document.querySelectorAll('.memory-card').forEach((c, idx) => {
              if (!cards[idx]?.matched) c.classList.remove('is-flipped');
            });
            resolve();
          } else label.textContent = `Memorize! ${remaining}`;
        }, 1000);
      });
    }

    showCompletion(summary) {
      const winners = summary.winners.join(', ');
      document.getElementById('resultTitle').textContent = summary.winners.length > 1 ? 'It’s a tie!' : `${winners} wins!`;
      document.getElementById('resultBody').innerHTML = `
        <div class="result-score">${summary.gameScore}</div>
        <div class="text-muted mb-3">Complete Game Score</div>
        <div class="row g-2 text-center">
          <div class="col-4"><div class="result-mini"><strong>${summary.moves}</strong><span>Moves</span></div></div>
          <div class="col-4"><div class="result-mini"><strong>${summary.misses}</strong><span>Misses</span></div></div>
          <div class="col-4"><div class="result-mini"><strong>${summary.accuracy}%</strong><span>Accuracy</span></div></div>
        </div>
        <div class="mt-3">Time: <strong>${this.formatTime(summary.elapsedSeconds)}</strong></div>`;
      new bootstrap.Modal(document.getElementById('resultModal')).show();
    }

    hexToRgba(hex, alpha) {
      const value = String(hex || '').replace('#', '');
      const normalized = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
      const int = parseInt(normalized, 16);
      if (Number.isNaN(int)) return `rgba(59,130,246,${alpha})`;
      const r = (int >> 16) & 255;
      const g = (int >> 8) & 255;
      const b = int & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    contrastTextColor(hex) {
      const value = String(hex || '').replace('#', '');
      const normalized = value.length === 3 ? value.split('').map(c => c + c).join('') : value;
      const int = parseInt(normalized, 16);
      if (Number.isNaN(int)) return '#ffffff';
      const r = (int >> 16) & 255;
      const g = (int >> 8) & 255;
      const b = int & 255;
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
      return luminance > 170 ? '#172033' : '#ffffff';
    }

    escapeHtml(value) {
      return String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
    }
  }

  ns.UI = UI;
})(window.MemoryGame);
