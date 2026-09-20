(async function () {
  'use strict';

  const config = await MemoryGame.ConfigService.load();
  const storage = new MemoryGame.StorageService(config);
  const ui = new MemoryGame.UI(config);
  ui.storage = storage;

  const defaults = JSON.parse(JSON.stringify(config.defaults));
  const saved = storage.getPreferences();
  const preferences = { ...defaults, ...(saved || {}) };
  preferences.playerNames = [...((saved && saved.playerNames) || []), ...defaults.playerNames].slice(0, 3);
  preferences.playerColors = [...(saved?.playerColors || []), ...defaults.playerColors].slice(0, 3);

  const engine = new MemoryGame.GameEngine(config, {
    onStateChange: snapshot => ui.renderGame(snapshot),
    onTick: seconds => ui.setText('statTime', ui.formatTime(seconds)),
    onComplete: summary => completeGame(summary)
  });

  ui.populateSetup(preferences);
  ui.renderStats(storage);

  function getSetupAndSave() {
    const settings = ui.readSetup();
    storage.savePreferences(settings);
    return settings;
  }

  async function startGame(settings) {
    settings = { ...config.defaults, ...(settings || {}) };
    settings.playerNames = [...((settings && settings.playerNames) || []), ...config.defaults.playerNames].slice(0, 3);
    settings.playerColors = [...((settings && settings.playerColors) || []), ...config.defaults.playerColors].slice(0, 3);
    const manifest = await MemoryGame.ConfigService.loadThemeManifest(settings.theme);
    if (manifest.length < settings.pairSize) {
      settings.pairSize = Math.max(...config.pairSizes.filter(size => size <= manifest.length));
    }
    storage.savePreferences(settings);
    await engine.newGame(settings, manifest);
    ui.showSection('gameSection');
    ui.renderGame(engine.getSnapshot());
    await ui.showPreview(settings.previewSeconds, engine.getSnapshot().cards);
    engine.beginAfterPreview();
  }

  function completeGame(summary) {
    const friendlyTheme = config.themes.find(t => t.id === summary.settings.theme)?.label || summary.settings.theme;
    const record = {
      date: new Date().toISOString(),
      pairSize: summary.settings.pairSize,
      theme: friendlyTheme,
      playerCount: summary.settings.playerCount,
      players: summary.players,
      winners: summary.winners,
      moves: summary.moves,
      misses: summary.misses,
      accuracy: summary.accuracy,
      timeSeconds: summary.elapsedSeconds,
      gameScore: summary.gameScore
    };
    storage.saveCompletedGame(record);
    ui.renderStats(storage);
    ui.showCompletion(summary);
  }

  document.getElementById('startGameBtn').addEventListener('click', () => startGame(getSetupAndSave()));
  document.getElementById('quickPlayBtn').addEventListener('click', () => startGame(ui.readSetup()));

  document.getElementById('newGameBtn').addEventListener('click', () => {
    const last = storage.getPreferences() || config.defaults;
    startGame(last);
  });

  document.getElementById('restartGameBtn').addEventListener('click', () => {
    if (confirm('Restart this game with the same setup?')) startGame(engine.getSnapshot().settings || storage.getPreferences() || config.defaults);
  });

  document.getElementById('resultPlayAgainBtn').addEventListener('click', () => {
    bootstrap.Modal.getInstance(document.getElementById('resultModal'))?.hide();
    startGame(storage.getPreferences() || config.defaults);
  });

  document.getElementById('resultSetupBtn').addEventListener('click', () => {
    bootstrap.Modal.getInstance(document.getElementById('resultModal'))?.hide();
    ui.showSection('setupSection');
  });

  document.getElementById('gameBoard').addEventListener('click', event => {
    const card = event.target.closest('.memory-card');
    if (card) engine.selectCard(card.dataset.cardId);
  });

  document.getElementById('playerCount').addEventListener('change', e => {
    ui.updatePlayerNameFields(Number(e.target.value));
    ui.updateSetupSummary(ui.readSetup());
  });

  document.getElementById('theme').addEventListener('change', event => {
    ui.updatePairSizeAvailability(event.target.value);
    ui.updateSetupSummary(ui.readSetup());
  });

  ['pairSize','previewSeconds','mismatchDelayMs','showPositionNumbers','playerColor1','playerColor2','playerColor3'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => ui.updateSetupSummary(ui.readSetup()));
  });
  ['playerName1','playerName2','playerName3'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => ui.updateSetupSummary(ui.readSetup()));
  });

  document.getElementById('resetSetupBtn').addEventListener('click', () => {
    if (!confirm('Reset setup fields to the default configuration?')) return;
    ui.populateSetup(JSON.parse(JSON.stringify(config.defaults)));
  });

  document.getElementById('resetAllBtn').addEventListener('click', () => {
    if (!confirm('Reset ALL saved names, scores, history, and preferences? This cannot be undone.')) return;
    storage.resetAll();
    ui.populateSetup(JSON.parse(JSON.stringify(config.defaults)));
    ui.renderStats(storage);
    alert('All saved game data has been reset.');
  });

  document.querySelectorAll('[data-nav-section]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.navSection === 'statsSection') ui.renderStats(storage);
      if (btn.dataset.navSection === 'gameSection') ui.renderGame(engine.getSnapshot());
      ui.showSection(btn.dataset.navSection);
    });
  });

  document.getElementById('backToSetupBtn').addEventListener('click', () => ui.showSection('setupSection'));
  document.getElementById('statsFromGameBtn').addEventListener('click', () => { ui.renderStats(storage); ui.showSection('statsSection'); });

  document.getElementById('fullscreenBtn').addEventListener('click', async () => {
    const target = document.documentElement;
    try {
      if (!document.fullscreenElement) {
        await target.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (_) {
      alert('Full screen is not available in this browser.');
    }
  });
})();
