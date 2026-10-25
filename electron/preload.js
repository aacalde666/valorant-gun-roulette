const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  // Global Hotkeys (F7, F9, F10, F11) - F8 left untouched for Medal.tv!
  onGlobalKey: (callback) => {
    ipcRenderer.removeAllListeners('global-key');
    ipcRenderer.on('global-key', (_event, action) => callback(action));
  },
  // Always on top for main window
  toggleAlwaysOnTop: (enable) => {
    ipcRenderer.send('toggle-always-on-top', enable);
  },
  // Open / Close in-game transparent overlay window
  toggleOverlay: (enable) => {
    ipcRenderer.send('toggle-overlay', enable);
  },
  onOverlayState: (callback) => {
    ipcRenderer.removeAllListeners('overlay-state');
    ipcRenderer.on('overlay-state', (_event, state) => callback(state));
  },
  // Multi-Monitor Support (Choose Screen 1 or Screen 2 for Overlay)
  switchOverlayDisplay: (index) => {
    ipcRenderer.send('switch-overlay-display', index);
  },
  onDisplaysInfo: (callback) => {
    ipcRenderer.removeAllListeners('displays-info');
    ipcRenderer.on('displays-info', (_event, info) => callback(info));
  },
  getDisplaysInfo: () => {
    ipcRenderer.send('get-displays-info');
  },
  // Trigger 3-Second Gray Killfeed Calibration Box on Monitor 2
  calibrateKillfeed: () => {
    ipcRenderer.send('calibrate-killfeed');
  },
  // Live VALORANT process and game-mode status
  onValorantStatus: (callback) => {
    ipcRenderer.removeAllListeners('valorant-status');
    ipcRenderer.on('valorant-status', (_event, status) => callback(status));
  },
  getValorantStatus: () => {
    ipcRenderer.send('get-valorant-status');
  },
  // Auto-detect when entering live Deathmatch match
  onDeathmatchStart: (callback) => {
    ipcRenderer.removeAllListeners('deathmatch-started');
    ipcRenderer.on('deathmatch-started', (_event, data) => callback(data));
  },
  // Send 3-second toast HUD update across windows
  sendGameToast: (payload) => {
    ipcRenderer.send('game-toast', payload);
  },
  onGameToast: (callback) => {
    ipcRenderer.removeAllListeners('game-toast');
    ipcRenderer.on('game-toast', (_event, payload) => callback(payload));
  },
  // Warmup state (calentamiento en curso)
  onWarmupState: (callback) => {
    ipcRenderer.removeAllListeners('warmup-state');
    ipcRenderer.on('warmup-state', (_event, state) => callback(state));
  }
});
