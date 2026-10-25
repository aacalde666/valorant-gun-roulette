import React, { useState } from 'react';
import { X, Check, Sliders, RefreshCw, Volume2, Volume1, VolumeX } from 'lucide-react';
import { WEAPON_CATEGORIES } from '../data/weaponsData';
import { soundFX } from '../utils/audio';

export default function SettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  activeCategories,
  onChangeActiveCategories
}) {
  if (!isOpen) return null;

  const [minKills, setMinKills] = useState(config.minKills);
  const [maxKills, setMaxKills] = useState(config.maxKills);
  const [minDeaths, setMinDeaths] = useState(config.minDeaths);
  const [maxDeaths, setMaxDeaths] = useState(config.maxDeaths);
  const [selectedCats, setSelectedCats] = useState([...activeCategories]);
  const [volume, setVolume] = useState(() => soundFX.getVolume());

  const handleVolumeChange = (newVal) => {
    setVolume(newVal);
    soundFX.setVolume(newVal);
  };

  const toggleCategory = (catId) => {
    if (selectedCats.includes(catId)) {
      if (selectedCats.length <= 2) {
        alert('Debes mantener al menos 2 categorías activas para la progresión.');
        return;
      }
      setSelectedCats(selectedCats.filter(id => id !== catId));
    } else {
      setSelectedCats([...selectedCats, catId]);
    }
  };

  const handleSave = () => {
    if (minKills > maxKills) {
      alert('Las bajas mínimas no pueden superar a las máximas.');
      return;
    }
    if (minDeaths > maxDeaths) {
      alert('Las muertes mínimas no pueden superar a las máximas.');
      return;
    }

    onSaveConfig({
      minKills: Number(minKills),
      maxKills: Number(maxKills),
      minDeaths: Number(minDeaths),
      maxDeaths: Number(maxDeaths)
    });
    onChangeActiveCategories(selectedCats);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#101923] border border-[#233544] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl text-white">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#182635] border-b border-[#233544] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#5bb2d6]" />
            <h3 className="font-bold text-base uppercase tracking-wider text-white">
              Reglas del Reto de Valorant
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#233544] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Sound Volume Slider */}
          <div className="bg-[#142230] p-4 rounded-xl border border-[#233544] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-slate-500" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-5 h-5 text-[#5bb2d6]" />
                ) : (
                  <Volume2 className="w-5 h-5 text-[#00f59b]" />
                )}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200 block">
                    Volumen de Efectos de Sonido
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Campanillas de bajas, cambio de arma y victoria
                  </span>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                {Math.round(volume * 100)}%
              </span>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-[#0c141c] rounded-lg appearance-none cursor-pointer accent-[#00f59b]"
              />
              <button
                type="button"
                onClick={() => soundFX.playKill(3)}
                className="px-3 py-1 bg-[#1a2c3d] hover:bg-[#233c54] text-[#5bb2d6] border border-[#233544] rounded text-[11px] font-bold cursor-pointer transition-colors"
                title="Probar sonido de kill"
              >
                Probar
              </button>
            </div>
          </div>

          {/* Kills Range */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              Rango Aleatorio de Bajas por Arma (Min / Max):
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#142230] p-3 rounded border border-[#233544]">
                <span className="text-[11px] text-slate-400 block mb-1">Mínimo de Kills:</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={minKills}
                  onChange={(e) => setMinKills(Number(e.target.value))}
                  className="w-full bg-[#0c141c] border border-[#233544] rounded px-3 py-1.5 text-white font-mono font-bold focus:border-[#ff4655] outline-none"
                />
              </div>
              <div className="bg-[#142230] p-3 rounded border border-[#233544]">
                <span className="text-[11px] text-slate-400 block mb-1">Máximo de Kills:</span>
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={maxKills}
                  onChange={(e) => setMaxKills(Number(e.target.value))}
                  className="w-full bg-[#0c141c] border border-[#233544] rounded px-3 py-1.5 text-white font-mono font-bold focus:border-[#ff4655] outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Por defecto: entre 2 y 5 bajas aleatorias en cada arma.
            </p>
          </div>

          {/* Deaths Range */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              Límite de Muertes Permitidas antes de bajar de rango:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#142230] p-3 rounded border border-[#233544]">
                <span className="text-[11px] text-slate-400 block mb-1">Mínimo de Muertes (1 = Hardcore):</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={minDeaths}
                  onChange={(e) => setMinDeaths(Number(e.target.value))}
                  className="w-full bg-[#0c141c] border border-[#233544] rounded px-3 py-1.5 text-white font-mono font-bold focus:border-rose-500 outline-none"
                />
              </div>
              <div className="bg-[#142230] p-3 rounded border border-[#233544]">
                <span className="text-[11px] text-slate-400 block mb-1">Máximo de Muertes:</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={maxDeaths}
                  onChange={(e) => setMaxDeaths(Number(e.target.value))}
                  className="w-full bg-[#0c141c] border border-[#233544] rounded px-3 py-1.5 text-white font-mono font-bold focus:border-rose-500 outline-none"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              En la ronda de pistolas la tolerancia siempre se fija en <strong>3 muertes</strong> para darte 3 intentos antes del cambio de pistola.
            </p>
          </div>

          {/* Active Categories */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              Categorías de Armas Incluidas en la Carrera:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WEAPON_CATEGORIES.map(cat => {
                const isSelected = selectedCats.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-2.5 rounded border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#152a3d] border-[#5bb2d6] text-white'
                        : 'bg-[#101822] border-[#233544] text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold font-mono">T{cat.tier} - {cat.name}</div>
                      <div className="text-[10px] text-slate-400">{cat.categoryDisplay}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#00f59b]" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#14212e] border-t border-[#233544] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded bg-[#ff4655] hover:bg-[#ff5a67] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#ff4655]/20 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Guardar y Aplicar Nueva Ruleta</span>
          </button>
        </div>

      </div>
    </div>
  );
}
