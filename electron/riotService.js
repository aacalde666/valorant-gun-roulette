import fs from 'fs';
import https from 'https';
import path from 'path';
import { EventEmitter } from 'events';
import { exec } from 'child_process';

class RiotClientService extends EventEmitter {
  constructor() {
    super();
    this.pollInterval = null;
    this.status = {
      isValorantRunning: false,
      playerName: '',
      queueId: '',
      sessionLoopState: 'MENUS',
      isDeathmatch: false,
      isInGame: false
    };
    this.previousState = 'MENUS';
    this.previousQueue = '';
  }

  getLockfilePath() {
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || '', 'AppData/Local');
    return path.join(localAppData, 'Riot Games/Riot Client/Config/lockfile');
  }

  // Fast check if process is running (using /FO CSV to prevent Windows 25-char truncation!)
  checkProcess() {
    return new Promise((resolve) => {
      exec('tasklist /FO CSV /NH /FI "IMAGENAME eq VALORANT*"', (err, stdout) => {
        if (!err && stdout && stdout.toLowerCase().includes('valorant')) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  // Query Riot Client local HTTPS API via lockfile
  queryPresences() {
    return new Promise((resolve) => {
      const lockPath = this.getLockfilePath();
      if (!fs.existsSync(lockPath)) {
        return resolve(null);
      }

      try {
        const raw = fs.readFileSync(lockPath, 'utf8');
        const parts = raw.split(':');
        if (parts.length < 5) return resolve(null);

        const port = parseInt(parts[2], 10);
        const password = parts[3];
        const auth = Buffer.from(`riot:${password}`).toString('base64');

        const req = https.request({
          host: '127.0.0.1',
          port,
          path: '/chat/v4/presences',
          method: 'GET',
          headers: {
            Authorization: `Basic ${auth}`
          },
          rejectUnauthorized: false,
          timeout: 2500
        }, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve(json);
            } catch {
              resolve(null);
            }
          });
        });

        req.on('error', () => resolve(null));
        req.on('timeout', () => {
          req.destroy();
          resolve(null);
        });
        req.end();
      } catch {
        resolve(null);
      }
    });
  }

  async poll() {
    const processRunning = await this.checkProcess();
    const presencesData = await this.queryPresences();

    let isValRunning = processRunning;
    let playerName = this.status.playerName;
    let queueId = '';
    let sessionLoopState = 'MENUS';

    if (presencesData && presencesData.presences) {
      const valPresence = presencesData.presences.find(p => p.product === 'valorant');
      if (valPresence) {
        isValRunning = true;
        if (valPresence.game_name && valPresence.game_tag) {
          playerName = `${valPresence.game_name}#${valPresence.game_tag}`;
        }

        if (valPresence.private) {
          try {
            const decoded = JSON.parse(Buffer.from(valPresence.private, 'base64').toString('utf8'));
            queueId = decoded.matchPresenceData?.queueId || decoded.queueId || '';
            sessionLoopState = decoded.matchPresenceData?.sessionLoopState || decoded.sessionLoopState || 'MENUS';
          } catch {
            // private decode error
          }
        }
      }
    }

    const isDeathmatch = queueId.toLowerCase() === 'deathmatch';
    const isInGame = sessionLoopState === 'INGAME';

    const newStatus = {
      isValorantRunning: isValRunning,
      playerName,
      queueId,
      sessionLoopState,
      isDeathmatch,
      isInGame
    };

    // Detect if entered Deathmatch match
    if (isDeathmatch && isInGame && (this.previousState !== 'INGAME' || this.previousQueue !== 'deathmatch')) {
      this.emit('deathmatch-started', newStatus);
    }

    // Detect status changes
    const hasChanged = 
      newStatus.isValorantRunning !== this.status.isValorantRunning ||
      newStatus.isDeathmatch !== this.status.isDeathmatch ||
      newStatus.sessionLoopState !== this.status.sessionLoopState ||
      newStatus.playerName !== this.status.playerName;

    this.previousState = sessionLoopState;
    this.previousQueue = queueId;
    this.status = newStatus;

    if (hasChanged) {
      this.emit('status-changed', newStatus);
    }
  }

  start(intervalMs = 2000) {
    if (this.pollInterval) return;
    this.poll(); // Initial immediate poll
    this.pollInterval = setInterval(() => this.poll(), intervalMs);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

export const riotService = new RiotClientService();
