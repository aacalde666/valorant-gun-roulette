import React from 'react';
import { X, Keyboard, Target, Skull, ArrowRight, RotateCcw, Monitor } from 'lucide-react';

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    {
      key: 'F7',
      desc: 'Abrir / Cerrar la UI flotante en pantalla (Overlay transparente in-game)',
      icon: <Monitor className="w-4 h-4 text-[#00f59b]" />
    },
    {
      key: 'F9 / AvPág / Num +',
      desc: 'Registrar +1 Kill (Muestra el HUD táctico 3 segundos)',
      icon: <Target className="w-4 h-4 text-[#ff4655]" />
    },
    {
      key: 'F10 / RePág / Num -',
      desc: 'Registrar +1 Muerte sufrida (Avisa de vidas restantes y descensos)',
      icon: <Skull className="w-4 h-4 text-rose-400" />
    },
    {
      key: 'F11 / Fin / Num Enter',
      desc: 'Confirmar reaparición con la siguiente arma (al cumplir el reto)',
      icon: <ArrowRight className="w-4 h-4 text-[#00f59b]" />
    },
    {
      key: 'Ctrl + Z',
      desc: 'Deshacer la última acción (por si pulsas por error)',
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
              Atajos de Teclado In-Game
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
            Estos atajos funcionan globalmente mientras estás dentro de VALORANT sin minimizar el juego:
          </p>

          <div className="space-y-2.5">
            {shortcuts.map((s, idx) => (
              <div
                key={idx}
                className="bg-[#14212e] border border-[#233544] rounded-lg p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0c131a] rounded border border-[#1e2d3b]">
                    {s.icon}
                  </div>
                  <span className="text-xs text-slate-200">{s.desc}</span>
                </div>
                <kbd className="px-2.5 py-1 bg-[#090e13] border border-[#2c4053] rounded font-mono font-bold text-xs text-[#5bb2d6] shadow-inner shrink-0">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="bg-[#0b1219] p-3 rounded border border-[#1f2f3e] text-[11px] text-[#5bb2d6]">
            💡 <strong>Overlay Táctico de 3 Segundos:</strong> Al pulsar <code className="text-white bg-[#142331] px-1 py-0.5 rounded">F9</code> (Kill) o <code className="text-white bg-[#142331] px-1 py-0.5 rounded">F10</code> (Muerte), la UI aparecerá durante 3 segundos en tu pantalla con tu arma y racha. La tecla <strong>F8 se ha dejado totalmente libre</strong> para tus clips de Medal.tv.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0d151e] border-t border-[#1b2b3b] text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#ff4655] hover:bg-[#ff5a67] text-white font-bold text-xs uppercase tracking-wider rounded cursor-pointer transition-colors"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
