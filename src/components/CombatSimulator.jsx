import React, { useState } from 'react';
import { Play, RotateCcw, FastForward, Activity, ShieldAlert, Terminal, Monitor, Sparkles, Scan, Eye } from 'lucide-react';
import VisualKillfeedModal from './VisualKillfeedModal';
import { getTranslation } from '../i18n/translations';

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
  onToggleOverlay,
  language = 'en'
}) {
  const t = getTranslation(language);
  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);

  return (
    <div className="bg-[#121c26] border border-[#233544] rounded-lg shadow-xl overflow-hidden flex flex-col h-full">
      
      {/* Header */}
      <div className="bg-[#192635] px-4 py-3 border-b border-[#233544] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#5bb2d6]" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
            {t.testBench}
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
                {t.overlayControlTitle}
              </span>
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono border ${
              isOverlayActive
                ? 'bg-[#00f59b]/15 text-[#00f59b] border-[#00f59b]/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {isOverlayActive ? (language === 'es' ? 'Activo (F7)' : 'Active (F7)') : (language === 'es' ? 'Cerrado' : 'Closed')}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-tight mb-2.5">
            {t.overlayDesc}
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
              <span>{isOverlayActive ? t.closeOverlay : t.openOverlay}</span>
            </button>

            <button
              onClick={onTestToast}
              className="py-1.5 px-1.5 bg-[#1b2b3b] hover:bg-[#25394d] text-[#5bb2d6] border border-[#2a4561] rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title={t.hud3sTitle}
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{t.hud3s}</span>
            </button>

            <button
              onClick={onCalibrateKillfeed}
              className="py-1.5 px-1.5 bg-[#142922] hover:bg-[#1b382f] text-[#00f59b] border border-[#00f59b]/40 rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
              title={t.calibrateZonesTitle}
            >
              <Scan className="w-3 h-3 text-[#00f59b]" />
              <span>{t.calibrateZones}</span>
            </button>
          </div>
        </div>

        {/* Visual Killfeed Simulation Trigger */}
        <div className="bg-[#101e2b] border border-[#1d354a] rounded-lg p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#00f59b] animate-pulse" />
            <div>
              <div className="text-xs font-black text-white uppercase tracking-wider">
                {t.visualSimulatorTitle}
              </div>
              <div className="text-[10px] text-slate-400">
                {t.visualSimulatorSub}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsVisualModalOpen(true)}
            className="px-3 py-1.5 bg-[#00f59b] hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded flex items-center gap-1 cursor-pointer transition-colors shadow"
          >
            <span>{t.viewMatch}</span>
          </button>
        </div>

        {/* Quick Testing Actions */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
            {t.quickActionsTitle}
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
              <span>{language === 'es' ? '+1 Muerte (F10)' : '+1 Death (F10)'}</span>
            </button>

            <button
              onClick={onFastForwardStage}
              className="px-3 py-2 text-xs font-bold rounded bg-[#132d29] hover:bg-[#1a3d37] text-[#00f59b] border border-[#00f59b]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FastForward className="w-3 h-3" />
              <span>{t.completeStreak}</span>
            </button>

            <button
              onClick={onResetRun}
              className="px-3 py-2 text-xs font-bold rounded bg-[#162534] hover:bg-rose-950/40 text-slate-300 hover:text-white border border-[#25394d] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t.resetRun}</span>
            </button>
          </div>
        </div>

        {/* Real-time Activity Log */}
        <div className="bg-[#0b1219] border border-[#1d2d3d] rounded-lg p-3 flex-1 min-h-[140px] flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#1c2c3b] pb-1.5 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#5bb2d6]" />
              {t.liveActivityLog}
            </span>
            <span className="text-[9px] font-mono text-slate-400">
              {history.length} {language === 'es' ? 'eventos' : 'events'}
            </span>
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1 font-mono text-[11px]">
            {history.length === 0 ? (
              <span className="text-slate-400 italic block py-4 text-center">
                {language === 'es' ? 'Esperando eventos de combate...' : 'Waiting for combat events...'}
              </span>
            ) : (
              history.slice(0, 8).map((item) => (
                <div
                  key={item.id}
                  className={`px-2 py-1 rounded flex items-center justify-between ${
                    item.type === 'kill'
                      ? 'bg-emerald-950/30 text-emerald-300 border-l-2 border-emerald-500'
                      : item.type === 'death'
                      ? 'bg-rose-950/30 text-rose-300 border-l-2 border-rose-500'
                      : item.type === 'switch'
                      ? 'bg-amber-950/30 text-amber-300 border-l-2 border-amber-500'
                      : 'bg-[#121e2a] text-slate-300'
                  }`}
                >
                  <span className="truncate">{item.message}</span>
                  <span className="text-[9px] text-slate-400 ml-2 flex-shrink-0">{item.timestamp}</span>
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
      />
    </div>
  );
}
