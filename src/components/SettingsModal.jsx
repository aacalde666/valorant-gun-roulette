import React, { useState } from 'react';
import { X, Check, Sliders, Volume2, Volume1, VolumeX, Globe } from 'lucide-react';
import { WEAPON_CATEGORIES } from '../data/weaponsData';
import { soundFX } from '../utils/audio';
import { getTranslation } from '../i18n/translations';

export default function SettingsModal({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  activeCategories,
  onChangeActiveCategories,
  language = 'en',
  onLanguageChange
}) {
  if (!isOpen) return null;

  const t = getTranslation(language);

  const [minKills, setMinKills] = useState(config.minKills);
  const [maxKills, setMaxKills] = useState(config.maxKills);
  const [minDeaths, setMinDeaths] = useState(config.minDeaths);
  const [maxDeaths, setMaxDeaths] = useState(config.maxDeaths);
  const [selectedCats, setSelectedCats] = useState([...activeCategories]);
  const [selectedLang, setSelectedLang] = useState(config.language || language || 'en');
  const [volume, setVolume] = useState(() => soundFX.getVolume());

  const handleVolumeChange = (newVal) => {
    setVolume(newVal);
    soundFX.setVolume(newVal);
  };

  const toggleCategory = (catId) => {
    if (selectedCats.includes(catId)) {
      if (selectedCats.length <= 2) {
        alert(selectedLang === 'es' 
          ? 'Debes mantener al menos 2 categorías activas para la progresión.' 
          : 'You must keep at least 2 active categories for challenge progression.');
        return;
      }
      setSelectedCats(selectedCats.filter(id => id !== catId));
    } else {
      setSelectedCats([...selectedCats, catId]);
    }
  };

  const handleSave = () => {
    if (minKills > maxKills) {
      alert(selectedLang === 'es'
        ? 'Las bajas mínimas no pueden superar a las máximas.'
        : 'Minimum kills cannot exceed maximum kills.');
      return;
    }
    if (minDeaths > maxDeaths) {
      alert(selectedLang === 'es'
        ? 'Las muertes mínimas no pueden superar a las máximas.'
        : 'Minimum deaths cannot exceed maximum deaths.');
      return;
    }

    onSaveConfig({
      language: selectedLang,
      minKills: Number(minKills),
      maxKills: Number(maxKills),
      minDeaths: Number(minDeaths),
      maxDeaths: Number(maxDeaths)
    });
    if (onLanguageChange && selectedLang !== language) {
      onLanguageChange(selectedLang);
    }
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
              {t.settingsTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#233544] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Language Selector */}
          <div className="bg-[#142230] p-4 rounded-xl border border-[#233544] space-y-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-[#5bb2d6]" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                {t.languageSectionTitle}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedLang('en')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                  selectedLang === 'en'
                    ? 'bg-[#1b3a4b] border-[#5bb2d6] text-white shadow-sm'
                    : 'bg-[#0f1720] border-[#233544] text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>English (Default)</span>
                {selectedLang === 'en' && <Check className="w-4 h-4 text-[#00f59b]" />}
              </button>
              <button
                type="button"
                onClick={() => setSelectedLang('es')}
                className={`py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                  selectedLang === 'es'
                    ? 'bg-[#1b3a4b] border-[#5bb2d6] text-white shadow-sm'
                    : 'bg-[#0f1720] border-[#233544] text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Español</span>
                {selectedLang === 'es' && <Check className="w-4 h-4 text-[#00f59b]" />}
              </button>
            </div>
          </div>

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
                    {t.soundVolumeTitle}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {t.soundVolumeSub}
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
                title={t.testSound}
              >
                {t.testSound}
              </button>
            </div>
          </div>

          {/* Kills Range */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              {t.killsRangeTitle}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#142230] p-3 rounded border border-[#233544]">
                <span className="text-[11px] text-slate-400 block mb-1">{t.minKillsLabel}</span>
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
                <span className="text-[11px] text-slate-400 block mb-1">{t.maxKillsLabel}</span>
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
              {t.killsRangeHelp}
            </p>
          </div>

          {/* Deaths Range */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              {t.deathsRangeTitle}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#142230] p-3 rounded border border-[#233544]">
                <span className="text-[11px] text-slate-400 block mb-1">{t.minDeathsLabel}</span>
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
                <span className="text-[11px] text-slate-400 block mb-1">{t.maxDeathsLabel}</span>
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
              {t.deathsRangeHelp}
            </p>
          </div>

          {/* Active Categories */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
              {t.categoriesTitle}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {WEAPON_CATEGORIES.map(cat => {
                const isSelected = selectedCats.includes(cat.id);
                const categoryTitle = selectedLang === 'es' ? cat.name : (t.categories[cat.id] || cat.categoryDisplay);
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
                      <div className="text-xs font-bold font-mono">T{cat.tier} - {categoryTitle}</div>
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
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded bg-[#ff4655] hover:bg-[#ff5a67] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#ff4655]/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{t.saveSettings}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
