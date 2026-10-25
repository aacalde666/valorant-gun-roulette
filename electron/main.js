import { app, BrowserWindow, globalShortcut, ipcMain, screen } from 'electron';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import { riotService } from './riotService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let overlayWindow = null;
let isOverlayEnabled = true;
let targetDisplayId = null; // Auto-targets Monitor 2 where Valorant is running
let localBridgeServer = null;
let isCalibratingActive = false;
let calibratingTimeout = null;
let isWarmupActive = false;
let detectorProcess = null;

function startDetectorProcess() {
  if (detectorProcess) return;
  const scriptPath = path.join(__dirname, '../killfeed_detector.py');
  try {
    detectorProcess = spawn('python', [scriptPath], {
      cwd: path.join(__dirname, '..'),
      stdio: 'ignore',
      windowsHide: true
    });

    detectorProcess.on('error', (err) => {
      console.log('Detector process notice:', err.message);
    });

    detectorProcess.on('exit', () => {
      detectorProcess = null;
    });
  } catch (err) {
    console.log('Error launching detector:', err.message);
  }
}

function stopDetectorProcess() {
  if (detectorProcess) {
    try {
      const pid = detectorProcess.pid;
      if (process.platform === 'win32' && pid) {
        exec(`taskkill /pid ${pid} /T /F`, () => {});
      } else {
        detectorProcess.kill();
      }
    } catch {}
    detectorProcess = null;
  }
}

function startLocalBridgeServer() {
  if (localBridgeServer) return;

  localBridgeServer = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url, 'http://127.0.0.1:48888');

    if (url.pathname === '/api/warmup' || url.pathname === '/warmup') {
      const state = url.searchParams.get('state');
      isWarmupActive = (state === 'active');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('warmup-state', { active: isWarmupActive });
      }
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.webContents.send('warmup-state', { active: isWarmupActive });
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, isWarmup: isWarmupActive }));
      return;
    }

    if (url.pathname === '/api/kill' || url.pathname === '/kill') {
      if (isCalibratingActive || isWarmupActive) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ignored: true, reason: isWarmupActive ? 'warmup' : 'calibrating' }));
        return;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-key', 'kill');
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, action: 'kill' }));
      return;
    }

    if (url.pathname === '/api/death' || url.pathname === '/death') {
      if (isCalibratingActive || isWarmupActive) {
        // Prevent accidental death triggers during killfeed calibration or warmup
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ignored: true, reason: isWarmupActive ? 'warmup' : 'calibrating' }));
        return;
      }
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-key', 'death');
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, action: 'death' }));
      return;
    }

    if (url.pathname === '/api/respawn' || url.pathname === '/respawn') {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-key', 'respawn');
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, action: 'respawn' }));
      return;
    }

    if (url.pathname === '/api/status' || url.pathname === '/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        running: true,
        player: riotService.status.playerName,
        isDeathmatch: riotService.status.isDeathmatch,
        isInGame: riotService.status.isInGame,
        isCalibrating: isCalibratingActive,
        isWarmup: isWarmupActive
      }));
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  localBridgeServer.listen(48888, '127.0.0.1', () => {
    console.log('Killfeed Python Bridge API listening on http://127.0.0.1:48888');
  });

  localBridgeServer.on('error', (err) => {
    console.log('Bridge server error:', err.message);
  });
}

function formatValorantStatus(s) {
  return {
    running: s.isValorantRunning,
    inDeathmatch: s.isDeathmatch,
    isInGame: s.isInGame,
    state: s.sessionLoopState,
    player: s.playerName,
    queueId: s.queueId
  };
}

function getTargetDisplay() {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();

  if (targetDisplayId) {
    const found = displays.find(d => d.id === targetDisplayId);
    if (found) return found;
  }

  // By default, auto-target secondary display (bounds.x !== 0 or non-primary)
  const secondary = displays.find(d => d.bounds.x !== 0 || d.id !== primary.id);
  if (secondary) {
    targetDisplayId = secondary.id;
    return secondary;
  }

  targetDisplayId = primary.id;
  return primary;
}

function getDisplaysPayload() {
  const displays = screen.getAllDisplays();
  const primary = screen.getPrimaryDisplay();
  const activeTarget = getTargetDisplay();

  return {
    displays: displays.map((d, i) => {
      const isPrimary = d.id === primary.id;
      const isValorantScreen = d.bounds.x !== 0 || !isPrimary;
      return {
        index: i,
        id: d.id,
        name: isValorantScreen ? 'Pantalla 2 [VALORANT]' : 'Pantalla 1 (Principal)',
        isValorant: isValorantScreen,
        isPrimary,
        width: d.bounds.width,
        height: d.bounds.height,
        x: d.bounds.x,
        y: d.bounds.y
      };
    }),
    selectedId: activeTarget.id,
    selectedIndex: displays.findIndex(d => d.id === activeTarget.id)
  };
}

function positionOverlayWindow() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  const targetDisplay = getTargetDisplay();
  const { x: dx, y: dy, width: dWidth, height: dHeight } = targetDisplay.bounds;

  overlayWindow.setBounds({
    x: dx,
    y: dy,
    width: dWidth,
    height: dHeight
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 420,
    minHeight: 280,
    icon: path.join(__dirname, '../app.ico'),
    backgroundColor: '#090e13',
    frame: true,
    transparent: false,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const distPath = path.join(__dirname, '../dist/index.html');
  mainWindow.loadFile(distPath);
  mainWindow.setMenuBarVisibility(false);

  // Send initial statuses immediately on page finish load
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.send('valorant-status', formatValorantStatus(riotService.status));
    mainWindow.webContents.send('overlay-state', { enabled: isOverlayEnabled });
    mainWindow.webContents.send('displays-info', getDisplaysPayload());
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.close();
    }
    stopDetectorProcess();
    app.quit();
  });
}

function createOverlayWindow() {
  const targetDisplay = getTargetDisplay();
  const { x: dx, y: dy, width: dWidth, height: dHeight } = targetDisplay.bounds;

  overlayWindow = new BrowserWindow({
    width: dWidth,
    height: dHeight,
    x: dx,
    y: dy,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    hasShadow: false,
    show: true,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  // Mouse clicks and aim pass directly through to Valorant
  overlayWindow.setIgnoreMouseEvents(true, { forward: true });

  const distPath = path.join(__dirname, '../dist/index.html');
  overlayWindow.loadFile(distPath, { hash: 'overlay' });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

function toggleOverlay(forceState) {
  if (typeof forceState === 'boolean') {
    isOverlayEnabled = forceState;
  } else {
    isOverlayEnabled = !isOverlayEnabled;
  }

  if (overlayWindow && !overlayWindow.isDestroyed()) {
    if (isOverlayEnabled) {
      overlayWindow.showInactive();
    } else {
      overlayWindow.hide();
    }
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('overlay-state', { enabled: isOverlayEnabled });
  }
}

// Trigger visual calibration boxes on Monitor 2
function triggerCalibrationVisual() {
  isCalibratingActive = true;
  if (calibratingTimeout) clearTimeout(calibratingTimeout);
  calibratingTimeout = setTimeout(() => {
    isCalibratingActive = false;
  }, 4500);

  const payload = {
    type: 'calibrate_killfeed',
    playerName: riotService.status.playerName || 'aacal666#6666'
  };
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    positionOverlayWindow();
    overlayWindow.showInactive();
    overlayWindow.webContents.send('game-toast', payload);
  }
}

// Register Global In-Game Hotkeys (Conflict-Free with Medal.tv)
function registerShortcuts() {
  // F6: Calibrar Zonas de Pantalla (Killfeed y Calentamiento) durante 4s
  globalShortcut.register('F6', () => {
    triggerCalibrationVisual();
  });

  // F7: Toggle in-game overlay HUD visibility (open/close)
  globalShortcut.register('F7', () => {
    toggleOverlay();
  });

  // NOTE: F8 is intentionally UNBOUND to avoid conflicts with Medal.tv!

  // F9: +1 Kill (Moved here per user request)
  globalShortcut.register('F9', () => {
    if (isCalibratingActive || isWarmupActive) return;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-key', 'kill');
    }
  });

  // F10: +1 Death
  globalShortcut.register('F10', () => {
    if (isCalibratingActive || isWarmupActive) return;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-key', 'death');
    }
  });

  // F11: Confirm Respawn Switch
  globalShortcut.register('F11', () => {
    if (isCalibratingActive || isWarmupActive) return;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('global-key', 'respawn');
    }
  });

  // Toggle Main Window visibility
  globalShortcut.register('CommandOrControl+Shift+X', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// IPC Handlers
ipcMain.on('toggle-always-on-top', (_event, enable) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setAlwaysOnTop(enable, 'screen-saver');
  }
});

ipcMain.on('toggle-overlay', (_event, state) => {
  toggleOverlay(state);
});

ipcMain.on('calibrate-killfeed', (_event) => {
  triggerCalibrationVisual();
});

ipcMain.on('switch-overlay-display', (_event, displayId) => {
  const displays = screen.getAllDisplays();
  if (typeof displayId === 'number' || typeof displayId === 'string') {
    const found = displays.find(d => d.id === displayId || d.id === Number(displayId));
    if (found) targetDisplayId = found.id;
  } else {
    // Toggle to next display
    const activeTarget = getTargetDisplay();
    const currentIndex = displays.findIndex(d => d.id === activeTarget.id);
    const nextIndex = (currentIndex + 1) % displays.length;
    targetDisplayId = displays[nextIndex].id;
  }
  positionOverlayWindow();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('displays-info', getDisplaysPayload());
  }
});

ipcMain.on('get-displays-info', (event) => {
  event.reply('displays-info', getDisplaysPayload());
});

ipcMain.on('get-valorant-status', (event) => {
  event.reply('valorant-status', formatValorantStatus(riotService.status));
});

ipcMain.on('get-overlay-state', (event) => {
  event.reply('overlay-state', { enabled: isOverlayEnabled });
});

ipcMain.on('game-toast', (_event, payload) => {
  if (overlayWindow && !overlayWindow.isDestroyed() && isOverlayEnabled) {
    overlayWindow.webContents.send('game-toast', payload);
  }
});

// Broadcast live Riot Client status changes
riotService.on('status-changed', (status) => {
  const formatted = formatValorantStatus(status);
  if (!status.isInGame) {
    isWarmupActive = false;
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('valorant-status', formatted);
  }
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('valorant-status', formatted);
  }
});

// Auto-trigger when player enters a live Deathmatch match
riotService.on('deathmatch-started', (status) => {
  const formatted = formatValorantStatus(status);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('deathmatch-started', formatted);
  }
});

app.whenReady().then(() => {
  createMainWindow();
  createOverlayWindow();
  registerShortcuts();
  startLocalBridgeServer();
  startDetectorProcess();

  // Start polling Riot Client lockfile & processes
  riotService.start(2000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createOverlayWindow();
    }
  });
});

app.on('will-quit', () => {
  stopDetectorProcess();
  riotService.stop();
  globalShortcut.unregisterAll();
  if (localBridgeServer) {
    try { localBridgeServer.close(); } catch {}
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
