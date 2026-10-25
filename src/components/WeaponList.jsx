import React from 'react';
import { CheckCircle2, Lock, ArrowRight, Skull, Target, AlertTriangle } from 'lucide-react';
import { getTranslation } from '../i18n/translations';

export default function WeaponList({
  stages,
  currentTierIndex,
  onSelectTier,
  language = 'en'
}) {
  const t = getTranslation(language);

  return (
    <div className="bg-[#121c26] border border-[#233544] rounded-lg shadow-2xl overflow-hidden flex flex-col">
      {/* Header matching Valorant Tracker */}
      <div className="bg-[#192635] px-5 py-3 border-b border-[#233544] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm tracking-wider uppercase text-slate-200">
            {t.challengeProgression}
          </span>
          <span className="text-xs bg-[#0b131a] px-2 py-0.5 rounded text-[#5bb2d6] border border-[#233544] font-mono">
            {t.tiersBadge(stages.length)}
          </span>
        </div>
        <span className="text-[11px] text-[#5bb2d6] uppercase tracking-wider font-semibold">
          {t.trackerStyle}
        </span>
      </div>

      {/* Weapons List */}
      <div className="divide-y divide-[#1e2d3b] overflow-y-auto max-h-[620px]">
        {stages.map((stage, idx) => {
          const isActive = idx === currentTierIndex;
          const isReadyToSwitch = stage.status === 'ready_to_switch';
          const isCompleted = stage.status === 'completed';
          const isUpcoming = idx > currentTierIndex;
          const isDemoted = stage.status === 'demoted';

          // Row background styling
          let rowBg = 'bg-[#121c26] hover:bg-[#162330]';
          let borderAccent = 'border-l-4 border-l-transparent';

          if (isReadyToSwitch) {
            rowBg = 'bg-[#0f2c25]/50 animate-glow-ready';
            borderAccent = 'border-l-4 border-l-[#00f59b]';
          } else if (isActive) {
            rowBg = 'bg-[#1a2838] shadow-inner';
            borderAccent = 'border-l-4 border-l-[#ff4655]';
          } else if (isCompleted) {
            rowBg = 'bg-[#0e161f]/70 opacity-60';
            borderAccent = 'border-l-4 border-l-[#00f59b]/40';
          } else if (isUpcoming) {
            rowBg = 'bg-[#101923]/40 opacity-40';
          }

          const categoryTitle = language === 'es'
            ? stage.categoryName
            : (t.categories[stage.categoryId] || stage.categoryDisplay);

          return (
            <div
              key={stage.id}
              onClick={() => onSelectTier && onSelectTier(idx)}
              className={`p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${rowBg} ${borderAccent}`}
            >
              {/* Left Column: Weapon Render + Name & Category exactly as Tracker.gg */}
              <div className="flex items-center gap-4 min-w-[200px]">
                {/* Silhouette Container */}
                <div className="w-24 sm:w-28 h-12 flex items-center justify-center relative p-1 bg-[#090e13]/60 rounded border border-[#1e2d3b]">
                  <img
                    src={stage.weapon.icon}
                    alt={stage.weapon.name}
                    onError={(e) => {
                      if (stage.weapon.fallbackIcon && e.currentTarget.src !== stage.weapon.fallbackIcon) {
                        e.currentTarget.src = stage.weapon.fallbackIcon;
                      }
                    }}
                    className="max-h-full max-w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  />
                </div>

                <div>
                  <div className="text-[12px] font-semibold text-[#5bb2d6] tracking-wide uppercase">
                    {stage.categoryDisplay}
                  </div>
                  <div className="text-base sm:text-lg font-black text-white tracking-wide leading-tight">
                    {stage.weapon.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>{categoryTitle}</span>
                  </div>
                </div>
              </div>

              {/* Middle: Challenge Progress Numbers */}
              <div className="flex items-center gap-4 text-xs font-mono">
                {/* Kills chip */}
                <div className={`px-2.5 py-1 rounded flex items-center gap-1.5 border ${
                  isReadyToSwitch || isCompleted
                    ? 'bg-[#00f59b]/10 text-[#00f59b] border-[#00f59b]/30'
                    : isActive
                    ? 'bg-[#ff4655]/10 text-white border-[#ff4655]/40'
                    : 'bg-[#162330] text-slate-400 border-[#233544]'
                }`}>
                  <Target className="w-3.5 h-3.5 text-[#ff4655]" />
                  <span>{language === 'es' ? 'Racha:' : 'Streak:'}</span>
                  <span className="font-bold text-white">
                    {stage.currentKills} / {stage.targetKills}
                  </span>
                </div>

                {/* Deaths limit chip */}
                <div className={`px-2.5 py-1 rounded flex items-center gap-1.5 border ${
                  stage.currentDeaths > 0 && !isCompleted
                    ? 'bg-rose-950/40 text-rose-300 border-rose-700/50'
                    : 'bg-[#162330] text-slate-400 border-[#233544]'
                }`}>
                  <Skull className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'es' ? 'Muertes:' : 'Deaths:'}</span>
                  <span className={`font-bold ${stage.currentDeaths >= stage.maxAllowedDeaths ? 'text-red-400' : 'text-slate-200'}`}>
                    {stage.currentDeaths} / {stage.maxAllowedDeaths} max
                  </span>
                </div>
              </div>

              {/* Right: Status Pill */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {isReadyToSwitch ? (
                  <span className="px-3 py-1 rounded text-xs font-black uppercase tracking-wider bg-[#00f59b] text-[#081812] flex items-center gap-1.5 shadow-lg shadow-[#00f59b]/30 animate-pulse">
                    <ArrowRight className="w-3.5 h-3.5" />
                    {language === 'es' ? 'EQUIPAR AL MORIR' : 'EQUIP ON RESPAWN'}
                  </span>
                ) : isActive ? (
                  <span className="px-3 py-1 rounded text-xs font-extrabold uppercase tracking-wider bg-[#ff4655] text-white flex items-center gap-1.5 shadow-lg shadow-[#ff4655]/30">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    {language === 'es' ? 'EN CURSO' : 'ACTIVE'}
                  </span>
                ) : isCompleted ? (
                  <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-[#0f2c25] text-[#00f59b] border border-[#00f59b]/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {language === 'es' ? 'SUPERADO' : 'CLEARED'}
                  </span>
                ) : isDemoted ? (
                  <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-rose-950/60 text-rose-300 border border-rose-800 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {language === 'es' ? 'DESCENDIDO' : 'DEMOTED'}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    {language === 'es' ? 'BLOQUEADO' : 'LOCKED'}
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Footer tips */}
      <div className="bg-[#0e1620] px-4 py-2.5 border-t border-[#233544] text-[11px] text-slate-400 flex items-center justify-between">
        <span>
          {language === 'es' 
            ? '💡 Si mueres antes de completar las bajas requeridas, tu racha vuelve a 0 y consumes 1 intento.' 
            : '💡 If you die before reaching target kills, your streak resets to 0 and you consume 1 life.'}
        </span>
        <span className="font-mono text-[#5bb2d6] hidden md:inline">Deathmatch Rules</span>
      </div>
    </div>
  );
}
