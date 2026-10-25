import React, { useState, useEffect } from 'react';
import InGameToastHUD from './components/InGameToastHUD';
import KillfeedCalibrationBox from './components/KillfeedCalibrationBox';

/**
 * OverlayApp:
 * The ultralight transparent view that stays loaded over VALORANT on Monitor 2.
 * It listens for kills, deaths, or switches and triggers the 3-second HUD,
 * and displays the 3-second gray Killfeed Calibration Box when toggled.
 */
export default function OverlayApp() {
  const [toast, setToast] = useState(null);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [playerName, setPlayerName] = useState('aacal666#6666');

  useEffect(() => {
    // 1. Electron IPC listener (preferred when running in Electron)
    if (typeof window !== 'undefined' && window.electronAPI) {
      if (window.electronAPI.onGameToast) {
        window.electronAPI.onGameToast((payload) => {
          if (payload.type === 'calibrate_killfeed') {
            setIsCalibrating(true);
            if (payload.playerName) setPlayerName(payload.playerName);
          } else {
            setToast({ ...payload, id: payload.id || Date.now() });
          }
        });
      }
      if (window.electronAPI.onValorantStatus) {
        window.electronAPI.onValorantStatus((status) => {
          if (status?.player) setPlayerName(status.player);
        });
      }
      return; // Skip BroadcastChannel when in Electron to prevent duplicate events
    }

    // 2. BroadcastChannel fallback only when in browser / tab mode
    const channel = new BroadcastChannel('valorant_gun_roulette_events');
    channel.onmessage = (event) => {
      if (event.data) {
        if (event.data.type === 'calibrate_killfeed') {
          setIsCalibrating(true);
          if (event.data.playerName) setPlayerName(event.data.playerName);
        } else if (event.data.type) {
          setToast({ ...event.data, id: event.data.id || Date.now() });
        }
      }
    };

    return () => {
      channel.close();
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden select-none pointer-events-none p-4 relative">
      {/* 3-Second Tactical Toast HUD */}
      <InGameToastHUD toast={toast} onClose={() => setToast(null)} />

      {/* 3-Second Gray Killfeed Calibration Box (Top Right) */}
      <KillfeedCalibrationBox
        isCalibrating={isCalibrating}
        playerName={playerName}
        onClose={() => setIsCalibrating(false)}
      />
    </div>
  );
}
