// Overwolf Game Events Provider (GEP) Integration for Valorant
// Game ID for Valorant in Overwolf: 21640

const VALORANT_GAME_ID = 21640;
const REQUIRED_FEATURES = ['match_info', 'kill', 'death', 'match'];

class OverwolfService {
  constructor() {
    this.isOverwolf = typeof window !== 'undefined' && Boolean(window.overwolf);
    this.listeners = {
      onDeathmatchStart: [],
      onDeathmatchEnd: [],
      onKill: [],
      onDeath: [],
      onStatusChange: []
    };
    this.isInDeathmatch = false;
    this.currentMode = null;
    this.status = this.isOverwolf ? 'Overwolf Detectado (Esperando Valorant)' : 'Modo Navegador / Simulación';

    if (this.isOverwolf) {
      this.initOverwolf();
    }
  }

  // Subscribe to internal events
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  // Unsubscribe from internal events
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  initOverwolf() {
    try {
      const ow = window.overwolf;

      // Check if Valorant is currently running
      ow.games.getRunningGameInfo((gameInfo) => {
        if (gameInfo && Math.floor(gameInfo.id / 10) === Math.floor(VALORANT_GAME_ID / 10)) {
          this.setFeatures();
        }
      });

      // Listen for game launches
      ow.games.onGameLaunched.addListener((game) => {
        if (game && Math.floor(game.id / 10) === Math.floor(VALORANT_GAME_ID / 10)) {
          this.status = 'Valorant detectado. Conectando eventos...';
          this.emit('onStatusChange', this.status);
          this.setFeatures();
        }
      });

      // Listen for game events (kills, deaths)
      ow.games.events.onNewEvents.addListener((info) => {
        if (!info || !info.events) return;

        info.events.forEach((ev) => {
          if (ev.name === 'kill') {
            // Kill detected automatically from Valorant via Overwolf
            let weapon = null;
            try {
              if (ev.data) {
                const parsed = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
                weapon = parsed.weapon_name || parsed.weapon || null;
              }
            } catch (e) {}
            this.emit('onKill', { weapon, raw: ev });
          } else if (ev.name === 'death') {
            // Death detected automatically
            this.emit('onDeath', { raw: ev });
          } else if (ev.name === 'match_start') {
            this.checkMatchMode();
          } else if (ev.name === 'match_end') {
            this.isInDeathmatch = false;
            this.emit('onDeathmatchEnd');
          }
        });
      });

      // Listen for game info updates (mode, presence, round)
      ow.games.events.onInfoUpdates2.addListener((info) => {
        if (info && info.info && info.info.match_info) {
          const matchInfo = info.info.match_info;
          const mode = (matchInfo.game_mode || '').toLowerCase();
          this.currentMode = mode;

          // Check if it's Deathmatch (Combate a muerte)
          if (mode.includes('deathmatch') || mode.includes('duel') || mode.includes('combat')) {
            if (!this.isInDeathmatch) {
              this.isInDeathmatch = true;
              this.status = '🎮 Combate a Muerte Activo';
              this.emit('onStatusChange', this.status);
              this.emit('onDeathmatchStart');
            }
          }
        }
      });

    } catch (err) {
      console.warn('Overwolf init error:', err);
    }
  }

  setFeatures() {
    if (!this.isOverwolf) return;
    window.overwolf.games.events.setRequiredFeatures(REQUIRED_FEATURES, (info) => {
      if (info.status === 'success') {
        this.status = 'Listo: Escuchando eventos de Valorant';
        this.emit('onStatusChange', this.status);
      } else {
        this.status = 'Esperando inicio de partida de Valorant...';
        this.emit('onStatusChange', this.status);
      }
    });
  }

  // Simulation helpers for testing without Overwolf installed
  simulateDeathmatchStart() {
    this.isInDeathmatch = true;
    this.status = '🎮 Combate a Muerte Activo (Simulado)';
    this.emit('onStatusChange', this.status);
    this.emit('onDeathmatchStart');
  }

  simulateDeathmatchEnd() {
    this.isInDeathmatch = false;
    this.status = 'Partida Finalizada (En espera)';
    this.emit('onStatusChange', this.status);
    this.emit('onDeathmatchEnd');
  }

  simulateKill(weaponName = null) {
    this.emit('onKill', { weapon: weaponName });
  }

  simulateDeath() {
    this.emit('onDeath', {});
  }
}

export const overwolfService = new OverwolfService();
