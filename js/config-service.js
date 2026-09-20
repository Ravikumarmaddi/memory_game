(function (ns) {
  'use strict';

  class ConfigService {
    static async load() {
      if (window.location.protocol !== 'file:') {
        try {
          const response = await fetch('config/game-config.json', { cache: 'no-store' });
          if (response.ok) return await response.json();
        } catch (error) {
          console.warn('Using bundled configuration fallback.', error);
        }
      }
      return window.MEMORY_GAME_CONFIG;
    }

    static async loadThemeManifest(themeId) {
      if (window.location.protocol !== 'file:') {
        try {
          const response = await fetch(`assets/cards/${themeId}/manifest.json`, { cache: 'no-store' });
          if (response.ok) return await response.json();
        } catch (error) {
          console.warn('Using bundled theme manifest fallback.', error);
        }
      }
      return (window.MEMORY_GAME_CARD_MANIFESTS || {})[themeId] || [];
    }
  }

  ns.ConfigService = ConfigService;
})(window.MemoryGame);
