import React from 'react';
import { X, Keyboard, Target, Skull, ArrowRight, RotateCcw, Monitor, Scan, VideoOff } from 'lucide-react';
import { getTranslation } from '../i18n/translations';

export default function ShortcutsModal({ isOpen, onClose, language = 'en' }) {
  if (!isOpen) return null;
  const t = getTranslation(language);

  const shortcuts = [
    {
      key: 'F6',
      desc: t.shortcutF6Desc,
      icon: <Scan className="w-4 h-4 text-[#00f59b]" />
    },
    {
      key: 'F7',
      desc: t.shortcutF7Desc,
      icon: <Monitor className="w-4 h-4 text-[#00f59b]" />
    },
    {
      key: 'F8',
      desc: t.shortcutF8Desc,
      icon: <VideoOff className="w-4 h-4 text-amber-400" />
    },
    {
      key: 'F9 / PageDown / Num +',
      desc: t.shortcutF9Desc,
      icon: <Target className="w-4 h-4 text-[#ff4655]" />
    },
    {
      key: 'F10 / PageUp / Num -',
      desc: t.shortcutF10Desc,
      icon: <Skull className="w-4 h-4 text-rose-400" />
    },
    {
      key: 'F11 / End / Num Enter',
      desc: t.shortcutF11Desc,
      icon: <ArrowRight className="w-4 h-4 text-[#00f59b]" />
    },
    {
      key: 'Ctrl + Z',
      desc: t.shortcutUndoDesc,
      icon: <RotateCcw className="w-4 h-4 text-slate-300" />
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#101923] border border-[#233544] rounded-xl max-w-md w-full overflow-hidden shadow-2xl text-white">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#182635] border-b border-[#233544] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#ff4655]" />
            <h3 className="font-bold text-base uppercase tracking-wider text-white">
              {t.shortcutsTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#233544] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            {t.shortcutsIntro}
          </p>

          <div className="space-y-2.5">
            {shortcuts.map((s) => (
              <div
                key={s.key}
                className="bg-[#142230] p-3 rounded-lg border border-[#233544] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-[#0e1620] rounded border border-[#233544]">
                    {s.icon}
                  </div>
                  <span className="text-xs text-slate-200">{s.desc}</span>
                </div>
                <span className="font-mono text-xs font-bold text-white bg-black/40 px-2 py-1 rounded border border-white/10 whitespace-nowrap">
                  {s.key}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#14212e] border-t border-[#233544] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-[#ff4655] hover:bg-[#ff5a67] text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
}
