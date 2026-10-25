import React from 'react';
import { Target, Skull, ArrowRight, Maximize2, ShieldAlert } from 'lucide-react';

export default function CompactOverlay({
  currentStage,
  nextStage,
  onAddKill,
  onAddDeath,
  onConfirmRespawnSwitch,
  onCloseCompact,
  currentTierIndex,
  totalTiers
}) {
  if (!currentStage) return null;

  const isReadyToSwitch = currentStage.status === 'ready_to_switch';
  const killsNeeded = Math.max(0, currentStage.targetKills - currentStage.currentKills);
  const deathsLeft = Math.max(0, currentStage.maxAllowedDeaths - currentStage.currentDeaths);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-[#0c141c]/95 backdrop-blur-md border-2 border-[#25394d] rounded-xl shadow-2xl p-4 text-white overflow-hidden animate-fade-in ring-1 ring-black/50">
      
      {/* Top bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#233544] text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#ff4655] animate-ping" />
          <span className="font-extrabold font-mono text-[#5bb2d6] uppercase">
            HUD • RANGO {currentTierIndex + 1}/{totalTiers}
          </span>
        </div>
        <button
          onClick={onCloseCompact}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#1a2b3c] transition-colors"
          title="Volver a vista completa"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main weapon visual */}
      <div className="flex items-center gap-3 bg-[#13202d] p-2.5 rounded-lg border border-[#233544]">
        <div className="w-20 h-10 flex items-center justify-center bg-[#090f14] rounded p-1">
          <img
            src={currentStage.weapon.icon}
            alt={currentStage.weapon.name}
            onError={(e) => {
              if (currentStage.weapon.fallbackIcon && e.currentTarget.src !== currentStage.weapon.fallbackIcon) {
                e.currentTarget.src = currentStage.weapon.fallbackIcon;
              }
            }}
            className="max-h-full max-w-full object-contain filter drop-shadow"
          />
        </div>
        <div className="flex-1">
          <div className="text-[10px] text-[#5bb2d6] uppercase font-mono">{currentStage.categoryDisplay}</div>
          <div className="text-base font-black uppercase text-white leading-tight">{currentStage.weapon.name}</div>
        </div>
        <div className="text-right">
          <div className="text-xs font-mono font-bold text-white">
            <span className="text-[#ff4655]">{currentStage.currentKills}</span> / {currentStage.targetKills} Racha
          </div>
          <div className="text-[10px] font-mono text-slate-400">
            {currentStage.currentDeaths} / {currentStage.maxAllowedDeaths} vidas
          </div>
        </div>
      </div>

      {/* Switch Alert in Mini-HUD */}
      {isReadyToSwitch && (
        <div className="mt-2 p-2 bg-[#00f59b]/15 border border-[#00f59b] rounded text-center">
          <div className="text-xs font-black text-[#00f59b] uppercase">
            ¡Objetivo Conseguido!
          </div>
          <div className="text-[11px] text-white mt-0.5">
            Al morir, equipa: <strong className="text-[#00f59b]">{nextStage ? nextStage.weapon.name : 'Victoria'}</strong>
          </div>
          <button
            onClick={onConfirmRespawnSwitch}
            className="mt-2 w-full py-1.5 bg-[#00f59b] hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Confirmar Reaparición (F11 / Fin)</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Action buttons */}
      {!isReadyToSwitch && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={onAddKill}
            className="py-2.5 bg-[#ff4655] hover:bg-[#ff5a67] text-white font-black text-xs uppercase tracking-wider rounded flex items-center justify-center gap-1.5 shadow cursor-pointer active:scale-95"
          >
            <Target className="w-3.5 h-3.5" />
            <span>+1 Kill (F9)</span>
          </button>

          <button
            onClick={onAddDeath}
            className="py-2.5 bg-[#172533] hover:bg-rose-950/60 text-rose-300 border border-[#2d4052] font-bold text-xs uppercase tracking-wider rounded flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Skull className="w-3.5 h-3.5 text-rose-400" />
            <span>+1 Muerte (F10)</span>
          </button>
        </div>
      )}

    </div>
  );
}
