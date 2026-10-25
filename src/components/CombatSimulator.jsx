import React, { useState } from 'react';
import { Play, RotateCcw, FastForward, Activity, ShieldAlert, Terminal, Radio, Monitor, Sparkles, Scan, Eye } from 'lucide-react';
import VisualKillfeedModal from './VisualKillfeedModal';

export default function CombatSimulator({
  onAddKill,
  onAddDeath,
  onFastForwardStage,
  onResetRun,
  onTestToast,
  onCalibrateKillfeed,
  history,
  currentStage,
  onSimulateOverwolfDeathmatch,
  onSimulateOverwolfKill,
  onSimulateOverwolfDeath,
  isOverwolfActive,
  isOverlayActive,
  onToggleOverlay
}) {
  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);
  return (
    <div className="bg-[#121c26] border border-[#233544] rounded-lg shadow-xl overflow-hidden flex flex-col h-full">
      
      {/* Header */}
      <div className="bg-[#192635] px-4 py-3 border-b border-[#233544] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#5bb2d6]" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
            Simulador de Pruebas &amp; Historial
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-[#0e1620] px-2 py-0.5 rounded border border-[#233544]">
          Sandbox Mode
        </span>
      </div>

      <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
        
        {/* In-Game Overlay Controls */}
        <div className="bg-[#0e1823] border border-[#1f3347] rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-[#00f59b]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Overlay In-Game (UI Flotante)
              </span>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
              isOverlayActive
                ? 'bg-[#00f59b]/15 text-[#00f59b] border-[#00f59b]/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {isOverlayActive ? 'Activo (F7)' : 'Cerrado'}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-tight mb-2.5">
            Aparece automáticamente durante <strong>3 segundos</strong> en tu monitor al sumar una baja o muerte, mostrando tu arma y racha.
          </p>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={onToggleOverlay}
              className={`py-1.5 px-1.5 rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors border ${
                isOverlayActive
                  ? 'bg-[#152e25] text-[#00f59b] border-[#00f59b]/40 hover:bg-[#1b3d31]'
                  : 'bg-[#13202c] text-slate-300 border-[#233544] hover:bg-[#1a2b3b]'
              }`}
            >
              <Monitor className="w-3 h-3" />
              <span>{isOverlayActive ? 'Cerrar (F7)' : 'Abrir (F7)'}</span>
            </button>

            <button
              onClick={onTestToast}
              className="py-1.5 px-1.5 bg-[#1b2b3b] hover:bg-[#25394d] text-[#5bb2d6] border border-[#2a4561] rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title="Prueba el HUD de arma de 3 segundos"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>HUD 3s</span>
            </button>

            <button
              onClick={onCalibrateKillfeed}
              className="py-1.5 px-1.5 bg-[#142922] hover:bg-[#1b382f] text-[#00f59b] border border-[#00f59b]/40 rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title="Muestra los recuadros de calibración (Killfeed y Calentamiento) en Pantalla 2 durante 4s (Atajo: F6)"
            >
              <Scan className="w-3 h-3 text-[#00f59b]" />
              <span>Calibrar Zonas (F6)</span>
            </button>
          </div>
        </div>

        {/* Visual Killfeed Simulation Trigger */}
        <div className="bg-[#101e2b] border border-[#1d354a] rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#00f59b] animate-pulse" />
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider">
                Simulador Visual Killfeed
              </div>
              <div className="text-[10px] text-slate-400">
                Partida en vivo: trades, muertes simultáneas y slots
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsVisualModalOpen(true)}
            className="px-3 py-1.5 bg-[#00f59b] hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded flex items-center gap-1 cursor-pointer transition-colors shadow"
          >
            <span>Ver Partida</span>
          </button>
        </div>

        {/* Quick Testing Actions */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            Acciones Rápidas (Atajos sin conflicto con Medal):
          </span>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onAddKill}
              className="px-3 py-2 text-xs font-bold rounded bg-[#162534] hover:bg-[#1f3347] text-white border border-[#25394d] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 text-[#ff4655]" />
              <span>+1 Kill (F9)</span>
            </button>

            <button
              onClick={onAddDeath}
              className="px-3 py-2 text-xs font-bold rounded bg-[#162534] hover:bg-[#1f3347] text-white border border-[#25394d] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3 h-3 text-rose-400" />
              <span>+1 Muerte (F10)</span>
            </button>

            <button
              onClick={onFastForwardStage}
              className="px-3 py-2 text-xs font-bold rounded bg-[#132d29] hover:bg-[#1a3d37] text-[#00f59b] border border-[#00f59b]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Completa la racha de esta arma al instante"
            >
              <FastForward className="w-3 h-3" />
              <span>Completar Racha</span>
            </button>

            <button
              onClick={onResetRun}
              className="px-3 py-2 text-xs font-bold rounded bg-[#162534] hover:bg-rose-950/40 text-slate-300 hover:text-white border border-[#25394d] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              title="Reinicia la partida con armas aleatorias nuevas"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Nueva Ruleta</span>
            </button>
          </div>
        </div>

        {/* Live Feed / Activity Log */}
        <div className="flex-1 flex flex-col mt-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Activity className="w-3 h-3 text-[#5bb2d6]" />
              Registro de Combate:
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {history.length} eventos
            </span>
          </div>

          <div className="bg-[#0b1219] border border-[#1e2d3b] rounded p-2.5 h-44 overflow-y-auto space-y-1.5 font-mono text-xs">
            {history.length === 0 ? (
              <div className="text-slate-500 italic text-[11px] py-6 text-center">
                El combate a muerte acaba de comenzar. ¡Consigue tu primera baja con {currentStage?.weapon?.name}!
              </div>
            ) : (
              history.map((item, i) => (
                <div
                  key={i}
                  className={`p-1.5 rounded flex items-center justify-between text-[11px] border ${
                    item.type === 'kill'
                      ? 'bg-[#152331]/60 text-slate-200 border-[#233544]'
                      : item.type === 'ready'
                      ? 'bg-[#0f2c25]/80 text-[#00f59b] border-[#00f59b]/40 font-bold'
                      : item.type === 'switch'
                      ? 'bg-[#183147] text-[#5bb2d6] border-[#5bb2d6]/30'
                      : item.type === 'death'
                      ? 'bg-rose-950/40 text-rose-300 border-rose-900/60'
                      : item.type === 'demote'
                      ? 'bg-rose-900/80 text-white border-rose-500 font-bold'
                      : item.type === 'victory'
                      ? 'bg-amber-950/60 text-amber-300 border-amber-600 font-bold'
                      : 'bg-[#162330] text-slate-300 border-[#233544]'
                  }`}
                >
                  <span className="truncate pr-2">{item.text}</span>
                  <span className="text-[9px] text-slate-400 shrink-0">{item.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Visual Killfeed Modal */}
      <VisualKillfeedModal
        isOpen={isVisualModalOpen}
        onClose={() => setIsVisualModalOpen(false)}
        onAddKill={onAddKill}
        onAddDeath={onAddDeath}
        currentStage={currentStage}
      />

    </div>
  );
}
