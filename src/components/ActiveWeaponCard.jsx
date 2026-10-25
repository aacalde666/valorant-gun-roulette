import React from 'react';
import { Target, Skull, ArrowRight, RotateCcw, CheckCircle2, AlertOctagon, Sparkles, AlertTriangle } from 'lucide-react';
import { getTranslation } from '../i18n/translations';

export default function ActiveWeaponCard({
  currentStage,
  nextStage,
  onAddKill,
  onAddDeath,
  onConfirmRespawnSwitch,
  onUndo,
  canUndo,
  currentTierIndex,
  totalTiers,
  language = 'en'
}) {
  const t = getTranslation(language);

  if (!currentStage) {
    return (
      <div className="bg-[#121c26] border border-[#233544] rounded-lg p-8 text-center text-slate-400">
        {t.allStagesCompleted}
      </div>
    );
  }

  const isReadyToSwitch = currentStage.status === 'ready_to_switch';
  const killsNeeded = Math.max(0, currentStage.targetKills - currentStage.currentKills);
  const deathsLeft = Math.max(0, currentStage.maxAllowedDeaths - currentStage.currentDeaths);
  const killProgress = Math.min(100, (currentStage.currentKills / currentStage.targetKills) * 100);

  const categoryName = language === 'es'
    ? currentStage.categoryName
    : (t.categories[currentStage.categoryId] || currentStage.categoryDisplay);

  return (
    <div className={`bg-[#121c26] border rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
      isReadyToSwitch
        ? 'border-[#00f59b] shadow-[#00f59b]/20 ring-1 ring-[#00f59b]'
        : 'border-[#233544] hover:border-[#384f66]'
    }`}>
      
      {/* Top Status Bar */}
      <div className={`px-6 py-3 flex items-center justify-between border-b ${
        isReadyToSwitch
          ? 'bg-[#0f2c25] border-[#00f59b]/40 text-[#00f59b]'
          : 'bg-[#182533] border-[#233544] text-slate-300'
      }`}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff4655] animate-pulse" />
          <span className="font-extrabold uppercase tracking-wider text-xs font-mono">
            {t.tierProgress(currentTierIndex + 1, totalTiers)} : {categoryName}
          </span>
        </div>

        {isReadyToSwitch ? (
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#00f59b] animate-bounce">
            <Sparkles className="w-4 h-4" />
            {t.streakGoalReached}
          </div>
        ) : (
          <div className="text-xs font-mono text-slate-400 flex items-center gap-1">
            <span>{t.deathsAllowedBeforeDemotion}</span>
            <strong className="text-white bg-[#0e1620] px-1.5 py-0.5 rounded border border-[#233544]">
              {deathsLeft}
            </strong>
          </div>
        )}
      </div>

      {/* Main Body */}
      <div className="p-6">
        
        {/* Weapon Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          
          {/* Silhouette Preview */}
          <div className="relative bg-gradient-to-br from-[#0c131a] to-[#15222e] rounded-lg p-6 border border-[#233544] flex flex-col items-center justify-center min-h-[190px] overflow-hidden group">
            <div className="absolute top-3 left-3 text-[11px] font-mono uppercase tracking-wider text-[#5bb2d6] font-bold">
              {currentStage.categoryDisplay}
            </div>

            {/* Background glowing watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 font-black text-6xl tracking-widest uppercase text-white">
              {currentStage.weapon.name}
            </div>

            <img
              src={currentStage.weapon.icon}
              alt={currentStage.weapon.name}
              onError={(e) => {
                if (currentStage.weapon.fallbackIcon && e.currentTarget.src !== currentStage.weapon.fallbackIcon) {
                  e.currentTarget.src = currentStage.weapon.fallbackIcon;
                }
              }}
              className="max-h-28 w-auto object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.9)] transform group-hover:scale-105 transition-transform duration-300"
            />

            <div className="mt-3 text-center">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wider uppercase font-mono">
                {currentStage.weapon.name}
              </h2>
            </div>
          </div>

          {/* Goals & Counters */}
          <div className="space-y-4">
            
            {/* Kills Box */}
            <div className={`p-4 rounded-lg border transition-all ${
              isReadyToSwitch
                ? 'bg-[#0f2c25]/40 border-[#00f59b]/50'
                : 'bg-[#15222f] border-[#25394d]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#ff4655]" />
                  {t.streakLabel}
                </span>
                <span className="text-xl font-mono font-black text-white">
                  {currentStage.currentKills} / {currentStage.targetKills}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#0c141c] h-3 rounded-full overflow-hidden p-0.5 border border-[#233544]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isReadyToSwitch
                      ? 'bg-gradient-to-r from-[#00f59b] to-emerald-400'
                      : 'bg-gradient-to-r from-[#ff4655] to-rose-400'
                  }`}
                  style={{ width: `${killProgress}%` }}
                />
              </div>

              <div className="mt-2 text-xs flex justify-between items-center text-slate-400 font-mono">
                {isReadyToSwitch ? (
                  <span className="text-[#00f59b] font-bold">{t.streakGoalReached}</span>
                ) : (
                  <span>{t.needConsecutiveKills(killsNeeded)}</span>
                )}
                <span className="text-[10px] text-amber-400 font-sans font-semibold">
                  {isReadyToSwitch ? '' : t.ifYouDieResets}
                </span>
              </div>
            </div>

            {/* Allowed Deaths Box */}
            <div className={`p-4 rounded-lg border transition-all ${
              currentStage.currentDeaths > 0
                ? 'bg-rose-950/20 border-rose-800/60'
                : 'bg-[#15222f] border-[#25394d]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Skull className="w-4 h-4 text-slate-400" />
                  {t.livesLabel}
                </span>
                <span className="text-lg font-mono font-black text-white">
                  {currentStage.currentDeaths} / {currentStage.maxAllowedDeaths}
                </span>
              </div>

              {/* Death Pips / Hearts */}
              <div className="flex items-center gap-2">
                {Array.from({ length: currentStage.maxAllowedDeaths }).map((_, i) => {
                  const isLost = i < currentStage.currentDeaths;
                  return (
                    <div
                      key={i}
                      className={`flex-1 h-3 rounded-sm border transition-all ${
                        isLost
                          ? 'bg-rose-600/80 border-rose-500 shadow-sm shadow-rose-900'
                          : 'bg-[#0f1922] border-[#2a3c4e]'
                      }`}
                      title={isLost ? (language === 'es' ? 'Muerte consumida' : 'Life lost') : (language === 'es' ? 'Vida restante' : 'Life remaining')}
                    />
                  );
                })}
              </div>

              <div className="mt-2 text-[11px] text-slate-400 font-mono">
                {currentStage.maxAllowedDeaths === 1 ? (
                  <span className="text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t.strictMode}
                  </span>
                ) : deathsLeft === 1 ? (
                  <span className="text-rose-400 font-bold flex items-center gap-1">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    {t.dangerNextDeathDemote}
                  </span>
                ) : (
                  <span>{t.canDieMore(deathsLeft)}</span>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* READY TO SWITCH ALERT BANNER */}
        {isReadyToSwitch && (
          <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-[#00f59b]/15 via-[#00f59b]/25 to-[#00f59b]/15 border-2 border-[#00f59b] shadow-xl shadow-[#00f59b]/10 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#00f59b] rounded-md text-[#091510] mt-0.5">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-wide">
                    {t.missionAccomplished(currentStage.weapon.name)}
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-200 mt-0.5">
                    {t.deathmatchRespawnNotice}{' '}
                    <strong className="text-white text-base bg-[#0e1f18] px-2 py-0.5 rounded border border-[#00f59b]/40 font-mono">
                      {nextStage ? nextStage.weapon.name : t.lastWeaponCleared}
                    </strong>
                  </p>
                </div>
              </div>

              {/* Confirm transition button */}
              <button
                onClick={onConfirmRespawnSwitch}
                className="w-full sm:w-auto px-6 py-3 rounded bg-[#00f59b] hover:bg-emerald-400 text-[#091510] font-black uppercase tracking-wider text-sm shadow-lg shadow-[#00f59b]/30 flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <span>{t.alreadyDiedAndEquipped(nextStage ? nextStage.weapon.name : null)}</span>
                <ArrowRight className="w-4 h-4" />
                <span className="text-[10px] bg-[#091510]/20 px-1.5 py-0.5 rounded font-mono">F11 / End</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-6 pt-5 border-t border-[#1e2d3b] flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Add Kill Button */}
            <button
              onClick={onAddKill}
              disabled={isReadyToSwitch}
              className={`px-5 py-3 rounded font-black uppercase tracking-wider text-sm flex items-center gap-2 shadow-lg transition-all transform active:scale-95 cursor-pointer ${
                isReadyToSwitch
                  ? 'bg-[#1b2836] text-slate-500 border border-[#233544] cursor-not-allowed'
                  : 'bg-[#ff4655] hover:bg-[#ff5a67] text-white shadow-[#ff4655]/30 hover:scale-105'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>{t.addKill}</span>
              <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono">F9 / Num +</span>
            </button>

            {/* Add Death Button */}
            <button
              onClick={onAddDeath}
              className="px-4 py-3 rounded font-bold uppercase tracking-wider text-sm bg-[#162330] hover:bg-rose-950/40 text-rose-300 border border-[#2d4052] hover:border-rose-600 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <Skull className="w-4 h-4 text-rose-400" />
              <span>{t.addDeath}</span>
              <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-mono text-slate-400">F10 / Num -</span>
            </button>
          </div>

          {/* Undo Action */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider border flex items-center gap-1.5 transition-all ${
              canUndo
                ? 'bg-[#142331] text-slate-300 border-[#233544] hover:border-[#5bb2d6] hover:text-white cursor-pointer'
                : 'bg-transparent text-slate-600 border-transparent cursor-not-allowed opacity-40'
            }`}
            title={t.undoTitle}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.undo}</span>
            <span className="text-[9px] font-mono text-slate-500">Ctrl+Z</span>
          </button>

        </div>

      </div>

    </div>
  );
}
