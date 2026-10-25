import React from 'react';
import { WEAPON_CATEGORIES } from '../data/weaponsData';
import { ShieldCheck, Eye, Layers } from 'lucide-react';

export default function AllWeaponsBoard({ stages, currentStage }) {
  // Collect all weapons across all categories
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
              Arsenal Completo de Valorant (20 Armas Oficiales)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprobador visual de siluetas • Incluye las armas recientes: <strong>Outlaw</strong>, <strong>Bandit</strong> y <strong>Warden</strong>
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          {/* Yellow - Active */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-400/10 border border-amber-400/50 text-amber-300">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold">Amarillo:</span>
            <span>En Combate Ahora</span>
          </div>

          {/* Green - In Run */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#00f59b]/10 border border-[#00f59b]/40 text-[#00f59b]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f59b]" />
            <span className="font-bold">Verde:</span>
            <span>En la Ruleta Activa</span>
          </div>

          {/* Gray - In Reserve */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#162330] border border-[#25394d] text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="font-bold">Gris:</span>
            <span>En Reserva</span>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="p-5 sm:p-6 space-y-6">
        {WEAPON_CATEGORIES.map((category) => {
          return (
            <div key={category.id} className="space-y-2.5">
              {/* Category Header */}
              <div className="flex items-center justify-between border-b border-[#1f2f3e] pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#5bb2d6] font-mono uppercase bg-[#142230] px-2 py-0.5 rounded border border-[#233544]">
                    T{category.tier}
                  </span>
                  <span className="text-sm font-extrabold uppercase tracking-wider text-slate-200">
                    {category.name}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    ({category.categoryDisplay})
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {category.weapons.length} armas en categoría
                </span>
              </div>

              {/* Weapons in this Category */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {category.weapons.map((weapon) => {
                  const isActive = weapon.id === activeWeaponId;
                  const isAvailableInRun = stagesWeaponIds.has(weapon.id) && !isActive;
                  const isNotInRun = !isActive && !isAvailableInRun;

                  let cardStyle = '';
                  let badge = null;

                  if (isActive) {
                    // AMARILLO: Actualmente en uso
                    cardStyle = 'bg-amber-400/10 border-2 border-amber-400 shadow-lg shadow-amber-400/20 ring-1 ring-amber-400/50';
                    badge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                        EN USO AHORA
                      </span>
                    );
                  } else if (isAvailableInRun) {
                    // VERDE: Disponible en la ronda / partida
                    cardStyle = 'bg-[#0f2c25]/30 border-2 border-[#00f59b]/50 shadow-md shadow-[#00f59b]/10';
                    badge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#0f2c25] text-[#00f59b] border border-[#00f59b]/40">
                        EN LA RULETA
                      </span>
                    );
                  } else {
                    // GRIS: No disponible / En reserva
                    cardStyle = 'bg-[#0b131a]/60 border border-[#1e2d3b] opacity-45 hover:opacity-85 transition-opacity';
                    badge = (
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-[#14202c] text-slate-400 border border-[#233544]">
                        EN RESERVA
                      </span>
                    );
                  }

                  return (
                    <div
                      key={weapon.id}
                      className={`p-3 rounded-lg flex flex-col justify-between min-h-[140px] transition-all duration-200 group relative overflow-hidden ${cardStyle}`}
                    >
                      {/* Top badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-slate-400 font-semibold uppercase">
                          {weapon.category}
                        </span>
                        {badge}
                      </div>

                      {/* Weapon Silhouette */}
                      <div className="h-16 flex items-center justify-center p-1 relative">
                        <img
                          src={weapon.icon}
                          alt={weapon.name}
                          onError={(e) => {
                            if (weapon.fallbackIcon && e.currentTarget.src !== weapon.fallbackIcon) {
                              e.currentTarget.src = weapon.fallbackIcon;
                            }
                          }}
                          className={`max-h-full max-w-full object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] transform group-hover:scale-105 transition-transform duration-200 ${
                            isNotInRun ? 'grayscale contrast-75' : ''
                          }`}
                          loading="lazy"
                        />
                      </div>

                      {/* Bottom Weapon Name */}
                      <div className="mt-2 text-center pt-1 border-t border-white/5">
                        <span className={`text-xs font-black tracking-wider uppercase font-mono ${
                          isActive
                            ? 'text-amber-300'
                            : isAvailableInRun
                            ? 'text-white'
                            : 'text-slate-400'
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

      {/* Riot Legal Disclaimer Footer */}
      <div className="bg-[#0b1219] px-5 py-3 border-t border-[#1e2d3b] text-[11px] text-slate-400 leading-relaxed flex flex-col sm:flex-row items-center justify-between gap-3">
        <span>
          🛡️ <strong>Aviso Legal de Riot Games:</strong> Valorant Roulette es un proyecto de fan sin fines de lucro y no está respaldado por Riot Games ni refleja las opiniones de Riot Games, Inc. VALORANT y todas las propiedades asociadas son marcas registradas de Riot Games, Inc.
        </span>
        <span className="font-mono text-[#5bb2d6] text-xs shrink-0">
          Overwolf &amp; Riot API Compliant
        </span>
      </div>

    </div>
  );
}
