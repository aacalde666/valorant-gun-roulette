import React, { useEffect, useState, useRef } from 'react';
import { Target, Scan, CheckCircle2, Flame, PauseCircle } from 'lucide-react';

/**
 * KillfeedCalibrationBox:
 * Highlights both the Warmup Area (top-center) and the Killfeed Area (top-right)
 * on Monitor 2 for 3 seconds upon activating calibration, then smoothly fades out.
 * Updated to cover the full killfeed height from top: 18px (optimized for when FPS graphs are disabled).
 */
export default function KillfeedCalibrationBox({ isCalibrating, playerName, onClose }) {
  const [visible, setVisible] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(3);

  // Stable ref for onClose to avoid interval restart loops
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isCalibrating) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setSecondsLeft(4);

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setVisible(false);
          if (onCloseRef.current) onCloseRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCalibrating]);

  if (!visible) return null;

  return (
    <>
      {/* 1. TOP-CENTER: WARMUP (CALENTAMIENTO) SCANNING AREA */}
      {/* X: 540..1380 (centrado en 960), Y: 0..260 */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[9998] w-[840px] h-[260px] pointer-events-none transition-all duration-300 animate-fade-in select-none">
        <div className="w-full h-full bg-slate-950/80 backdrop-blur-md border-2 border-dashed border-amber-400/90 rounded-xl p-3.5 shadow-2xl shadow-amber-500/20 flex flex-col justify-between text-white relative overflow-hidden ring-1 ring-amber-400/20">
          
          {/* Animated Amber Radar Scanning Line */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-pulse opacity-90" />

          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-amber-400/30 pb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
              <span className="font-mono text-xs font-black uppercase tracking-wider text-amber-400">
                Zona de Calentamiento • Pausa Automática
              </span>
            </div>
            <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/40 font-bold">
              {secondsLeft}s
            </span>
          </div>

          {/* Center Target Info */}
          <div className="text-center my-auto space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold font-mono">
              <Scan className="w-4 h-4 text-amber-400 animate-spin" />
              <span>[ ZONA DE ESCANEO: CALENTAMIENTO / WARMUP ]</span>
            </div>
            <p className="text-[11px] text-slate-200 max-w-md mx-auto leading-tight">
              Aquí el detector vigila el cartel central de <b>CALENTAMIENTO</b>. Mientras esté en pantalla, la ruleta se mantendrá en pausa para no contar bajas no oficiales.
            </p>
          </div>

          {/* Corner Reticles */}
          <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-amber-400" />
          <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-amber-400" />
          <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-amber-400" />
          <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-amber-400" />

          {/* Bottom Banner */}
          <div className="text-center pt-1.5 border-t border-slate-800 text-[10px] text-amber-300/80 font-mono flex items-center justify-center gap-1.5">
            <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Filtro de caracteres acentuados activo (•ELÉNTAMIENÍO)</span>
          </div>

        </div>
      </div>

      {/* 2. TOP-RIGHT: KILLFEED SCANNING AREA */}
      {/* X: 1400..1910, Y: 18..358 (Optimizado desde arriba para cuando no hay gráfica de FPS) */}
      <div className="fixed top-[18px] right-[10px] z-[9998] w-[510px] h-[340px] pointer-events-none transition-all duration-300 animate-fade-in select-none">
        <div className="w-full h-full bg-slate-950/80 backdrop-blur-md border-2 border-dashed border-[#00f59b]/90 rounded-xl p-3.5 shadow-2xl shadow-[#00f59b]/20 flex flex-col justify-between text-white relative overflow-hidden ring-1 ring-[#00f59b]/20">
          
          {/* Animated Emerald Radar Scanning Line */}
          <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-[#00f59b] to-transparent animate-pulse opacity-90" />

          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-[#00f59b]/30 pb-2">
            <div className="flex items-center gap-2">
              <Scan className="w-4 h-4 text-[#00f59b] animate-spin" />
              <span className="font-mono text-xs font-black uppercase tracking-wider text-[#00f59b]">
                Área de Killfeed • Cobertura Total
              </span>
            </div>
            <span className="text-[10px] font-mono bg-[#00f59b]/20 text-[#00f59b] px-2 py-0.5 rounded border border-[#00f59b]/40 font-bold">
              {secondsLeft}s
            </span>
          </div>

          {/* Center Target Info */}
          <div className="text-center my-auto space-y-1">
            <div className="flex items-center justify-center gap-1.5 text-[#00f59b] text-xs font-bold font-mono">
              <Target className="w-4 h-4 text-[#00f59b] animate-pulse" />
              <span>[ ENCUADRE ÓPTICO: KILLFEED (SLOTS 1 AL 6) ]</span>
            </div>
            <p className="text-[11px] text-slate-200 max-w-sm mx-auto leading-tight">
              Abarca desde la primera tarjeta arriba hasta la sexta. Escaneado con nitidez aumentada 1.5x.
            </p>
          </div>

          {/* Corner Reticles */}
          <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#00f59b]" />
          <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#00f59b]" />
          <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#00f59b]" />
          <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#00f59b]" />

          {/* Bottom Banner */}
          <div className="text-center pt-1.5 border-t border-slate-800 text-[10px] text-[#00f59b]/80 font-mono flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00f59b]" />
            <span>Memoria temporal JSON (10s) • Sin duplicados al subir</span>
          </div>

        </div>
      </div>
    </>
  );
}
