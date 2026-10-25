import React, { useState } from 'react';
import { Volume2, Volume1, VolumeX, Settings, Keyboard, Trophy, Flame, Layers, Maximize2, Minimize2, Radio, Monitor, Gamepad2, Swords, Crosshair, Tv } from 'lucide-react';
import { soundFX } from '../utils/audio';

export default function Header({
  soundEnabled,
  setSoundEnabled,
  onOpenSettings,
  onOpenShortcuts,
  isCompactMode,
  setIsCompactMode,
  stats,
  currentTierIndex,
  totalTiers,
  overwolfStatus,
  valorantStatus,
  isOverlayActive,
  onToggleOverlay,
  displaysInfo,
  onSwitchDisplay,
  isWarmup
}) {
  const isValRunning = valorantStatus?.running;
  const isDeathmatch = valorantStatus?.inDeathmatch;
  const isInGame = valorantStatus?.isInGame;
  const playerName = valorantStatus?.player;

  const [volume, setVolume] = useState(() => soundFX.getVolume());

  return (
    <header className="border-b border-[#233544] bg-[#0c131a]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-lg overflow-hidden border-2 border-[#ff4655]/60 shadow-lg shadow-[#ff4655]/20 flex items-center justify-center bg-[#0b1218] group">
            <img 
              src="./logo.png" 
              alt="Valorant Gun Roulette Logo" 
              onError={(e) => { e.currentTarget.src = './logo.svg'; }}
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300" 
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-white text-lg font-mono uppercase">
                GUN <span className="text-[#ff4655]">ROULETTE</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#ff4655]/15 text-[#ff4655] border border-[#ff4655]/30">
                Deathmatch Tracker
              </span>
            </div>
            <p className="text-xs text-[#5bb2d6] hidden sm:block">
              {playerName ? (
                <span>Conectado: <strong className="text-white font-mono">{playerName}</strong></span>
              ) : (
                'Progresión de Armas • In-Game Challenge'
              )}
            </p>
          </div>
        </div>

        {/* Live Run Badges */}
        <div className="flex items-center gap-3 bg-[#111c26] border border-[#233544] px-3 py-1.5 rounded-md">
          {/* Tiers Progress */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 pr-3 border-r border-[#233544]">
            <Layers className="w-3.5 h-3.5 text-[#5bb2d6]" />
            <span>Fase:</span>
            <span className="font-mono font-bold text-white">{currentTierIndex + 1} / {totalTiers}</span>
          </div>

          {/* Racha de Victorias */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 pr-3 border-r border-[#233544]">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Rachas:</span>
            <span className="font-mono font-bold text-amber-300">{stats.completedRuns}</span>
          </div>

          {/* K/D Global */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Flame className="w-3.5 h-3.5 text-[#ff4655]" />
            <span>K/D:</span>
            <span className="font-mono font-bold text-white">
              {stats.totalDeaths === 0 ? stats.totalKills : (stats.totalKills / stats.totalDeaths).toFixed(2)}
            </span>
          </div>
        </div>

        {/* VALORANT & Mode Live Detection Badges */}
        <div className="flex items-center gap-2">
          {/* Live Game Status Badge */}
          <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono border transition-all ${
              isWarmup
                ? 'bg-amber-950/50 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/40'
                : isValRunning
                ? isDeathmatch && isInGame
                  ? 'bg-[#0b3323] border-[#00f59b] text-[#00f59b] shadow-lg shadow-[#00f59b]/25 ring-1 ring-[#00f59b]'
                  : isDeathmatch
                  ? 'bg-[#0f281e] border-[#00f59b]/60 text-[#00f59b]'
                  : 'bg-[#152331] border-[#5bb2d6]/40 text-[#5bb2d6]'
                : 'bg-[#101b26] border-[#233544] text-slate-400'
            }`}
            title={
              isWarmup
                ? 'Fase de CALENTAMIENTO activa en Valorant. El reto y conteo de bajas están pausados.'
                : isValRunning 
                ? isDeathmatch
                  ? isInGame ? '¡Combate a Muerte en curso! La ruleta está sincronizada con tu partida.' : 'Combate a Muerte seleccionado (En Lobby o buscando partida)'
                  : `VALORANT en ejecución • Modo: ${valorantStatus?.queueId || 'Menú'}`
                : 'VALORANT no está detectado en segundo plano'
            }
          >
            {isWarmup ? (
              <span className="text-amber-400 font-bold animate-pulse text-xs">⏳</span>
            ) : isDeathmatch && isInGame ? (
              <Crosshair className="w-3.5 h-3.5 text-[#00f59b] animate-spin" />
            ) : isDeathmatch ? (
              <Swords className="w-3.5 h-3.5 text-[#00f59b]" />
            ) : (
              <Gamepad2 className={`w-3.5 h-3.5 ${isValRunning ? 'text-[#00f59b]' : 'text-slate-500'}`} />
            )}

            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isWarmup ? 'bg-amber-400 animate-pulse' : isValRunning ? 'bg-[#00f59b] animate-ping' : 'bg-slate-600'}`} />
              <span className="font-bold">
                {isWarmup ? (
                  'DM: Calentamiento (Pausado)'
                ) : !isValRunning ? (
                  'VALORANT: Cerrado'
                ) : isDeathmatch && isInGame ? (
                  'DM: En Partida'
                ) : isDeathmatch ? (
                  'DM: Listo en Menú'
                ) : valorantStatus?.queueId ? (
                  `Val: ${valorantStatus.queueId}`
                ) : (
                  'VALORANT: En Juego'
                )}
              </span>
            </div>
          </div>

          {/* Monitor Selector (Pantalla 1 / Pantalla 2) */}
          {displaysInfo && displaysInfo.displays && displaysInfo.displays.length > 1 && (() => {
            const currentDisp = displaysInfo.displays.find(d => d.id === displaysInfo.selectedId) || displaysInfo.displays[displaysInfo.selectedIndex] || displaysInfo.displays[0];
            const isValScreen = currentDisp?.isValorant;
            return (
              <button
                onClick={onSwitchDisplay}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono font-bold bg-[#121f2c] border border-[#23384c] text-slate-200 hover:border-[#5bb2d6] transition-all cursor-pointer"
                title="Cambiar monitor donde aparece el overlay in-game (Monitor 1 o Pantalla 2 Valorant)"
              >
                <Tv className={`w-3.5 h-3.5 ${isValScreen ? 'text-[#00f59b]' : 'text-[#5bb2d6]'}`} />
                <span>{isValScreen ? 'Pantalla 2' : 'Pantalla 1'}</span>
                {isValScreen ? (
                  <span className="text-[9px] bg-[#00f59b]/20 text-[#00f59b] px-1 py-0.2 rounded border border-[#00f59b]/40 font-mono">
                    Valorant
                  </span>
                ) : (
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded border border-slate-700 font-mono">
                    Principal
                  </span>
                )}
              </button>
            );
          })()}

          {/* In-Game Overlay Toggle Button (F7) */}
          <button
            onClick={onToggleOverlay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold border transition-all cursor-pointer ${
              isOverlayActive
                ? 'bg-[#00f59b]/20 border-[#00f59b] text-[#00f59b] shadow-lg shadow-[#00f59b]/20'
                : 'bg-[#111c26] border-[#233544] text-slate-400 hover:text-white hover:border-slate-500'
            }`}
            title="Abrir o cerrar la UI Flotante / Overlay transparente en pantalla (Tecla F7)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Overlay {isOverlayActive ? 'ON' : 'OFF'}</span>
            <span className="text-[10px] bg-black/40 px-1.5 py-0.2 rounded text-slate-300">F7</span>
          </button>
        </div>

        {/* Controls / Options */}
        <div className="flex items-center gap-2">
          {/* Sound Control & Volume Slider */}
          <div className="flex items-center gap-1.5 bg-[#111c26] border border-[#233544] px-2 py-1 rounded">
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next && volume === 0) {
                  setVolume(0.5);
                  soundFX.setVolume(0.5);
                }
              }}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}
            >
              {!soundEnabled || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-slate-500" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-4 h-4 text-[#5bb2d6]" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#00f59b]" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={soundEnabled ? volume : 0}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setVolume(v);
                soundFX.setVolume(v);
                if (!soundEnabled && v > 0) setSoundEnabled(true);
              }}
              className="w-14 sm:w-16 h-1.5 bg-[#0c141c] rounded-lg appearance-none cursor-pointer accent-[#00f59b]"
              title={`Volumen: ${Math.round((soundEnabled ? volume : 0) * 100)}%`}
            />
          </div>

          {/* Mini-HUD / Compact Mode Toggle */}
          <button
            onClick={() => setIsCompactMode(!isCompactMode)}
            className="p-2 rounded border bg-[#111c26] text-slate-300 border-[#233544] hover:border-[#5bb2d6] hover:text-white transition-colors cursor-pointer"
            title={isCompactMode ? 'Modo Normal (Pantalla completa)' : 'Modo Mini-HUD / Flotante'}
          >
            {isCompactMode ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>

          {/* Shortcuts Info */}
          <button
            onClick={onOpenShortcuts}
            className="p-2 rounded border bg-[#111c26] text-slate-300 border-[#233544] hover:border-[#ff4655] hover:text-white transition-colors cursor-pointer"
            title="Ver atajos de teclado para jugar (F7, F8, F9, F10)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded border bg-[#111c26] text-slate-300 border-[#233544] hover:border-[#00f59b] hover:text-white transition-colors cursor-pointer"
            title="Configuración de reto"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
