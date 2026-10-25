import React from 'react';
import { WEAPON_CATEGORIES } from '../data/weaponsData';
import { Layers } from 'lucide-react';
import { getTranslation } from '../i18n/translations';

export default function AllWeaponsBoard({ stages, currentStage, language = 'en' }) {
  const t = getTranslation(language);
  const activeWeaponId = currentStage?.weapon?.id;
  const stagesWeaponIds = new Set(stages.map(s => s.weapon.id));

  return (
    <div className="bg-[#101923] border border-[#233544] rounded-xl shadow-2xl overflow-hidden mt-8 transition-all">
      
      {/* Board Header & Color Legend */}
      <div className="bg-[#182635] px-5 py-4 border-b border-[#233544] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#5bb2d6]" />
            <h3 className="font-extrabold text-base tracking-wider text-white uppercase font-mono">
              {t.fullArsenal}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.arsenalSubtitle}
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Yellow - Active */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-400/10 border border-amber-400/50 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold">{t.legendYellowTitle}</span>
            <span>{t.legendYellowDesc}</span>
          </div>

          {/* Green - In Run */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00f59b]/10 border border-[#00f59b]/40 text-[#00f59b]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f59b]" />
            <span className="font-bold">{t.legendGreenTitle}</span>
            <span>{t.legendGreenDesc}</span>
          </div>

          {/* Gray - In Reserve */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#162330] border border-[#25394d] text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="font-bold">{t.legendGrayTitle}</span>
            <span>{t.legendGrayDesc}</span>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="p-5 sm:p-6 space-y-6">
        {WEAPON_CATEGORIES.map((category) => {
          const categoryTitle = language === 'es' ? category.name : (t.categories[category.id] || category.categoryDisplay);

          return (
            <div key={category.id} className="space-y-2.5">
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-[#1f2f3e] pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5bb2d6] font-mono uppercase bg-[#142230] px-2 py-0.5 rounded border border-[#233544]">
                    Tier {category.tier}
                  </span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    {categoryTitle}
                  </span>
                  <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
                    • {category.categoryDisplay}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  {category.weapons.length} {language === 'es' ? 'armas' : 'weapons'}
                </span>
              </div>

              {/* Weapons in Category */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {category.weapons.map((weapon) => {
                  const isActiveNow = weapon.id === activeWeaponId;
                  const isInRun = stagesWeaponIds.has(weapon.id);

                  let cardBorder = 'border-[#223446] hover:border-[#384f66]';
                  let cardBg = 'bg-[#121c27]';
                  let badge = null;

                  if (isActiveNow) {
                    cardBorder = 'border-amber-400 shadow-lg shadow-amber-400/20 ring-1 ring-amber-400';
                    cardBg = 'bg-gradient-to-b from-[#242617] to-[#121c27]';
                    badge = (
                      <span className="absolute top-2 right-2 text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded bg-amber-400 text-black shadow">
                        {language === 'es' ? 'ACTIVA' : 'ACTIVE'}
                      </span>
                    );
                  } else if (isInRun) {
                    cardBorder = 'border-[#00f59b]/50 shadow-md shadow-[#00f59b]/10';
                    cardBg = 'bg-gradient-to-b from-[#0f251d] to-[#121c27]';
                    badge = (
                      <span className="absolute top-2 right-2 text-[9px] font-bold font-mono uppercase px-1.5 py-0.5 rounded bg-[#00f59b]/20 text-[#00f59b] border border-[#00f59b]/40">
                        {language === 'es' ? 'EN RULETA' : 'IN RUN'}
                      </span>
                    );
                  }

                  return (
                    <div
                      key={weapon.id}
                      className={`relative p-3 rounded-lg border transition-all duration-200 flex flex-col items-center justify-between min-h-[115px] group ${cardBg} ${cardBorder}`}
                    >
                      {badge}

                      {/* Silhouette */}
                      <div className="w-full h-14 flex items-center justify-center my-1 relative">
                        <img
                          src={weapon.icon}
                          alt={weapon.name}
                          onError={(e) => {
                            if (weapon.fallbackIcon && e.currentTarget.src !== weapon.fallbackIcon) {
                              e.currentTarget.src = weapon.fallbackIcon;
                            }
                          }}
                          className={`max-h-full max-w-full object-contain filter drop-shadow transition-transform duration-200 group-hover:scale-105 ${
                            !isActiveNow && !isInRun ? 'opacity-70 group-hover:opacity-100' : 'opacity-100'
                          }`}
                        />
                      </div>

                      {/* Name */}
                      <div className="text-center w-full">
                        <span className={`text-xs font-bold font-mono tracking-wide block truncate ${
                          isActiveNow ? 'text-amber-300' : isInRun ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        }`}>
                          {weapon.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
