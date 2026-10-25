import React, { useEffect, useState, useRef } from 'react';
import { Target, Skull } from 'lucide-react';
import { getTranslation } from '../i18n/translations';

/**
 * InGameToastHUD:
 * Tactical Valorant notification banner that pops up for 3 seconds
 * upon Kills, Deaths, and Weapon switches, then smoothly vanishes.
 * Immune to parent re-render loops using stable ref & toast.id.
 */
export default function InGameToastHUD({ toast, onClose, language = 'en' }) {
  const t = getTranslation(language);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  
  // Stable ref for onClose callback to prevent effect restart loops
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!toast || !toast.id) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setProgress(100);

    const startTime = Date.now();
    const duration = toast.duration || (toast.type === 'game_start' ? 4500 : 3000);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPct);

      if (elapsed >= duration) {
        clearInterval(interval);
        setVisible(false);
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      }
    }, 30);

    return () => clearInterval(interval);
  }, [toast?.id]);

  if (!toast || !visible) return null;

  const isKill = toast.type === 'kill';
  const isDeath = toast.type === 'death';
  const isReady = toast.type === 'ready_to_switch';
  const isSwitch = toast.type === 'switch';
  const isDemote = toast.type === 'demote';
  const isVictory = toast.type === 'victory';
  const isGameStart = toast.type === 'game_start';

  // Border & Glow Accents
  let borderColor = 'border-[#233544]';
  let glowColor = 'shadow-black/50';
  let badgeBg = 'bg-[#142331] text-[#5bb2d6] border-[#233544]';
  let headerText = t.toastUpdate;

  if (isGameStart) {
    borderColor = 'border-[#00f59b]';
    glowColor = 'shadow-[#00f59b]/50';
    badgeBg = 'bg-[#00f59b]/25 text-[#00f59b] border-[#00f59b]/60';
    headerText = t.toastMatchStart;
  } else if (isKill) {
    borderColor = 'border-[#ff4655]';
    glowColor = 'shadow-[#ff4655]/30';
    badgeBg = 'bg-[#ff4655]/20 text-[#ff4655] border-[#ff4655]/40';
    headerText = toast.isStreakComplete ? t.toastStreakAchieved : t.toastKillRegistered;
  } else if (isDeath) {
    borderColor = 'border-rose-600';
    glowColor = 'shadow-rose-600/30';
    badgeBg = 'bg-rose-600/20 text-rose-400 border-rose-600/40';
    headerText = t.toastDeathRegistered;
  } else if (isReady || isSwitch) {
    borderColor = 'border-[#00f59b]';
    glowColor = 'shadow-[#00f59b]/40';
    badgeBg = 'bg-[#00f59b]/20 text-[#00f59b] border-[#00f59b]/50';
    headerText = t.toastWeaponSwitchReady;
  } else if (isDemote) {
    borderColor = 'border-amber-500';
    glowColor = 'shadow-amber-500/40';
    badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    headerText = t.toastTierDemotion;
  } else if (isVictory) {
    borderColor = 'border-yellow-400';
    glowColor = 'shadow-yellow-400/50';
    badgeBg = 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50';
    headerText = t.toastVictory;
  }

  const weapon = toast.weapon || {};
  const currentKills = toast.currentKills ?? 0;
  const targetKills = toast.targetKills ?? 3;
  const currentDeaths = toast.currentDeaths ?? 0;
  const maxAllowedDeaths = toast.maxAllowedDeaths ?? 3;
  const remainingLives = Math.max(0, maxAllowedDeaths - currentDeaths);

  return (
    <aside 
      aria-label="In-Game HUD Notification"
      className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-[9999] w-[460px] max-w-[92vw] pointer-events-none transition-all duration-300 ease-out select-none ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95'
      }`}
    >
      <div className={`bg-[#0a1118]/95 backdrop-blur-xl border-2 ${borderColor} rounded-xl shadow-2xl ${glowColor} overflow-hidden text-white`}>
        
        {/* Top Header & 3-Second Counter */}
        <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#0e1722]/90 border-b border-[#1c2c3b] text-[11px] font-mono">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
            <span className={`px-2 py-0.5 rounded border text-[10px] font-extrabold ${badgeBg}`}>
              {headerText}
            </span>
          </div>
          <div className="text-slate-400 flex items-center gap-1 text-[10px]">
            <span>{t.toastHudBadge}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00f59b] animate-ping" />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3.5 flex items-center gap-4">
          
          {/* Weapon Silhouette */}
          <div className="w-24 h-12 flex-shrink-0 bg-[#060a0e] rounded-lg border border-[#1b2b3b] p-1.5 flex items-center justify-center relative overflow-hidden">
            {weapon.icon ? (
              <img
                src={weapon.icon}
                alt={weapon.name || 'Weapon'}
                onError={(e) => {
                  if (weapon.fallbackIcon && e.currentTarget.src !== weapon.fallbackIcon) {
                    e.currentTarget.src = weapon.fallbackIcon;
                  }
                }}
                className="max-h-full max-w-full object-contain filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <Target className="w-6 h-6 text-slate-500" />
            )}
          </div>

          {/* Weapon Name & Tier Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#101b26] text-[#5bb2d6] border border-[#1f3347]">
                {toast.categoryDisplay || (weapon.category || 'TIER')}
              </span>
              <h4 className="text-base font-black uppercase tracking-wide truncate text-white">
                {weapon.name || 'Arma'}
              </h4>
            </div>

            {/* Status explanation */}
            <div className="mt-1 text-xs text-slate-300">
              {toast.subtitle ? (
                <span>{toast.subtitle}</span>
              ) : isVictory ? (
                <span className="text-yellow-300 font-bold">{language === 'es' ? '¡Todas las armas conquistadas!' : 'All weapons conquered!'}</span>
              ) : isReady || isSwitch ? (
                <span className="text-[#00f59b] font-bold">
                  {language === 'es' ? 'Equipa esta arma al reaparecer' : 'Equip this weapon on respawn'}
                </span>
              ) : isDeath ? (
                <span className="text-rose-300 font-semibold flex items-center gap-1.5">
                  <Skull className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.toastLivesRemaining(remainingLives)}</span>
                </span>
              ) : isKill ? (
                <span className="text-emerald-300 font-semibold flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-[#ff4655]" />
                  <span>
                    {currentKills >= targetKills
                      ? t.streakGoalReached
                      : t.toastKillsToAdvance(targetKills - currentKills, weapon.name || '')}
                  </span>
                </span>
              ) : (
                <span>{weapon.name}</span>
              )}
            </div>
          </div>

          {/* Right Counters */}
          <div className="text-right flex flex-col items-end justify-center pl-2 border-l border-[#1c2c3b]">
            <div className="text-xs font-mono font-bold text-white flex items-center gap-1">
              <span className="text-[#ff4655] font-black text-sm">{currentKills}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-300">{targetKills}</span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
              <span>{language === 'es' ? 'Vidas:' : 'Lives:'}</span>
              <span className={`font-bold ${remainingLives <= 1 ? 'text-rose-400 font-black' : 'text-slate-200'}`}>
                {remainingLives}
              </span>
            </div>
          </div>

        </div>

        {/* 3-Second Visual Progress Bar */}
        <div className="w-full bg-[#0a1017] h-1 overflow-hidden">
          <div 
            className={`h-full transition-all ease-linear ${
              isKill ? 'bg-[#ff4655]' : isDeath ? 'bg-rose-500' : isReady || isSwitch ? 'bg-[#00f59b]' : 'bg-[#5bb2d6]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

      </div>
    </aside>
  );
}
