import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import https from 'https';
import path from 'path';

function valorantStatusPlugin() {
  return {
    name: 'valorant-status-plugin',
    configureServer(server) {
      server.middlewares.use('/api/valorant-status', async (_req, res) => {
        const localAppData = process.env.LOCALAPPDATA || '';
        const lockPath = path.join(localAppData, 'Riot Games/Riot Client/Config/lockfile');

        let status = {
          running: false,
          inDeathmatch: false,
          isInGame: false,
          state: 'MENUS',
          player: '',
          queueId: ''
        };

        if (fs.existsSync(lockPath)) {
          try {
            const raw = fs.readFileSync(lockPath, 'utf8');
            const parts = raw.split(':');
            if (parts.length >= 5) {
              const port = parseInt(parts[2], 10);
              const password = parts[3];
              const auth = Buffer.from(`riot:${password}`).toString('base64');

              const json = await new Promise((resolve) => {
                const r = https.request({
                  host: '127.0.0.1',
                  port,
                  path: '/chat/v4/presences',
                  method: 'GET',
                  headers: { Authorization: `Basic ${auth}` },
                  rejectUnauthorized: false,
                  timeout: 1500
                }, (resp) => {
                  let d = '';
                  resp.on('data', chunk => { d += chunk; });
                  resp.on('end', () => {
                    try { resolve(JSON.parse(d)); } catch { resolve(null); }
                  });
                });
                r.on('error', () => resolve(null));
                r.on('timeout', () => { r.destroy(); resolve(null); });
                r.end();
              });

              if (json && json.presences) {
                const val = json.presences.find(p => p.product === 'valorant');
                if (val) {
                  status.running = true;
                  if (val.game_name && val.game_tag) {
                    status.player = `${val.game_name}#${val.game_tag}`;
                  }
                  if (val.private) {
                    try {
                      const decoded = JSON.parse(Buffer.from(val.private, 'base64').toString('utf8'));
                      status.queueId = decoded.matchPresenceData?.queueId || decoded.queueId || '';
                      status.state = decoded.matchPresenceData?.sessionLoopState || decoded.sessionLoopState || 'MENUS';
                    } catch {}
                  }
                }
              }
            }
          } catch {}
        }

        status.inDeathmatch = status.queueId?.toLowerCase() === 'deathmatch';
        status.isInGame = status.state === 'INGAME';

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(status));
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: './', // Crucial for Overwolf / Electron extension protocol
  plugins: [
    react(),
    tailwindcss(),
    valorantStatusPlugin()
  ],
});
