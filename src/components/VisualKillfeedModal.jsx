import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, RotateCcw, X, Target, Skull, ShieldAlert, Zap, Radio, Clock, Eye, Sparkles } from 'lucide-react';

/**
 * Generador procedural de 100 rondas para simular un Combate a Muerte completo:
 * - 12 rivales distintos de Valorant
 * - Todo el arsenal de armas
 * - Ritmo dinámico: ráfagas rápidas (0.35s-0.75s), combate normal (1.2s-2.1s), pausas/reposicionamiento (2.8s-4.2s)
 * - aacal666 participa activamente (~20-22 bajas y ~12-14 muertes)
 * - Trades rápidos donde aacal666 mata y 0.4s después le matan
 * - Respeto del tiempo de respawn (3.0s)
 */
function generate100RoundMatch() {
  const rivals = ['Reyna', 'Jett', 'Raze', 'Iso', 'Omen', 'Sova', 'Fade', 'Deadlock', 'Chamber', 'Phoenix', 'Viper', 'Cypher'];
  const weaponsPool = ['VANDAL', 'PHANTOM', 'OPERATOR', 'SHERIFF', 'BANDIT', 'GHOST', 'JUDGE', 'SPECTRE', 'ODIN', 'OUTLAW', 'BULLDOG'];
  const aacalWeapons = ['BANDIT', 'GHOST', 'SPECTRE', 'JUDGE', 'BULLDOG', 'VANDAL', 'OPERATOR'];

  const events = [];
  let t = 1.0;

  // 1. Fase de Calentamiento (6 eventos en lobby)
  const warmupSkirmishes = [
    { k: 'Jett', w: 'VANDAL', v: 'Reyna', d: 'Lobby: Jett elimina a Reyna en Calentamiento' },
    { k: 'aacal666', w: 'BANDIT', v: 'Sova', d: 'TÚ matas en Calentamiento (¡Ignorado correctamente!)' },
    { k: 'Omen', w: 'JUDGE', v: 'aacal666', d: 'Te matan en Calentamiento (¡Ignorado correctamente!)' },
    { k: 'Fade', w: 'SPECTRE', v: 'Chamber', d: 'Lobby: Fade elimina a Chamber' },
    { k: 'Iso', w: 'PHANTOM', v: 'Cypher', d: 'Lobby: Iso elimina a Cypher' },
    { k: 'Raze', w: 'VANDAL', v: 'Deadlock', d: 'Lobby: Raze elimina a Deadlock' }
  ];

  for (const s of warmupSkirmishes) {
    events.push({
      time: Math.round(t * 10) / 10,
      killer: s.k,
      weapon: s.w,
      victim: s.v,
      isWarmup: true,
      desc: s.d,
      pace: '⏳ Calentamiento'
    });
    t += [1.2, 1.8, 2.2][Math.floor(Math.random() * 3)];
  }

  t += 1.5;
  events.push({
    time: Math.round(t * 10) / 10,
    type: 'warmup_end',
    isWarmup: false,
    desc: '🔔 ¡FIN DE CALENTAMIENTO! Comienza el Combate a Muerte oficial (100 rondas)',
    pace: '🔔 Inicio'
  });
  t += 1.5;

  let aacalKills = 0;
  let aacalDeaths = 0;
  let lastAacalDeathT = -10.0;
  let currentWIdx = 0;
  let currentStreak = 0;

  const tradeRounds = new Set([14, 28, 45, 62, 79, 93]);
  const burstRounds = new Set([20, 21, 22, 49, 50, 51, 52, 71, 72, 73]);

  for (let roundNum = 7; roundNum <= 100; roundNum++) {
    let delta = 1.6;
    let paceLabel = '⚔ Combate normal';

    if (burstRounds.has(roundNum)) {
      delta = 0.35 + Math.random() * 0.30;
      paceLabel = '🔥 Ráfaga rápida';
    } else {
      const paceRoll = Math.random();
      if (paceRoll < 0.22) {
        delta = 0.40 + Math.random() * 0.40;
        paceLabel = '🔥 Ráfaga rápida';
      } else if (paceRoll < 0.82) {
        delta = 1.2 + Math.random() * 1.0;
        paceLabel = '⚔ Combate normal';
      } else {
        delta = 2.8 + Math.random() * 1.4;
        paceLabel = '⏳ Reposicionamiento';
      }
    }

    t += delta;
    const canAacal = (t - lastAacalDeathT) > 3.2;

    // Situación de Trade simultáneo
    if (tradeRounds.has(roundNum) && canAacal) {
      const victim = rivals[Math.floor(Math.random() * rivals.length)];
      const w = aacalWeapons[Math.min(currentWIdx, aacalWeapons.length - 1)];
      aacalKills++;
      currentStreak++;
      events.push({
        time: Math.round(t * 10) / 10,
        killer: 'aacal666',
        weapon: w,
        victim: victim,
        isWarmup: false,
        desc: `🎯 ¡TU BAJA! (Ronda ${roundNum}) Matas a ${victim} (${aacalKills} kills)`,
        pace: '🔥 Trade Kill'
      });

      t += 0.42;
      const otherRivals = rivals.filter(r => r !== victim);
      const killer = otherRivals[Math.floor(Math.random() * otherRivals.length)];
      const kw = ['JUDGE', 'VANDAL', 'OPERATOR', 'PHANTOM'][Math.floor(Math.random() * 4)];
      aacalDeaths++;
      lastAacalDeathT = t;
      currentStreak = 0;
      events.push({
        time: Math.round(t * 10) / 10,
        killer: killer,
        weapon: kw,
        victim: 'aacal666',
        isWarmup: false,
        desc: `💀 ¡TE MATAN 0.4s DESPUÉS! ${killer} te tradea (${aacalDeaths} muertes)`,
        pace: '💀 Trade Death'
      });
      continue;
    }

    const probKill = (canAacal && aacalKills < 22) ? 0.24 : 0.0;
    const probDeath = (canAacal && aacalDeaths < 13) ? 0.13 : 0.0;
    const roll = Math.random();

    if (roll < probKill) {
      const victim = rivals[Math.floor(Math.random() * rivals.length)];
      const w = aacalWeapons[Math.min(currentWIdx, aacalWeapons.length - 1)];
      aacalKills++;
      currentStreak++;
      events.push({
        time: Math.round(t * 10) / 10,
        killer: 'aacal666',
        weapon: w,
        victim: victim,
        isWarmup: false,
        desc: `🎯 ¡TU BAJA! (Ronda ${roundNum}) Eliminaste a ${victim} con ${w} (${aacalKills} kills)`,
        pace: paceLabel
      });
      if (currentStreak >= 3) {
        currentWIdx++;
        currentStreak = 0;
      }
    } else if (roll < probKill + probDeath) {
      const killer = rivals[Math.floor(Math.random() * rivals.length)];
      const kw = weaponsPool[Math.floor(Math.random() * weaponsPool.length)];
      aacalDeaths++;
      lastAacalDeathT = t;
      currentStreak = 0;
      events.push({
        time: Math.round(t * 10) / 10,
        killer: killer,
        weapon: kw,
        victim: 'aacal666',
        isWarmup: false,
        desc: `💀 ¡TE MATAN! (Ronda ${roundNum}) ${killer} te eliminó con ${kw} (${aacalDeaths} muertes)`,
        pace: paceLabel
      });
    } else {
      const k = rivals[Math.floor(Math.random() * rivals.length)];
      const otherR = rivals.filter(r => r !== k);
      const v = otherR[Math.floor(Math.random() * otherR.length)];
      const w = weaponsPool[Math.floor(Math.random() * weaponsPool.length)];
      events.push({
        time: Math.round(t * 10) / 10,
        killer: k,
        weapon: w,
        victim: v,
        isWarmup: false,
        desc: `Lobby #${roundNum}: ${k} [${w}] ${v}`,
        pace: paceLabel
      });
    }
  }

  return events;
}

export default function VisualKillfeedModal({
  isOpen,
  onClose,
  onAddKill,
  onAddDeath,
  currentStage
}) {
  const [matchEvents, setMatchEvents] = useState(() => generate100RoundMatch());
  const [simTime, setSimTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [cards, setCards] = useState([]);
  const [isWarmup, setIsWarmup] = useState(true);
  const [eventIndex, setEventIndex] = useState(0);
  const [simLog, setSimLog] = useState([]);
  const [currentPace, setCurrentPace] = useState('⚔ Combate normal');
  const [lastDeathSimTime, setLastDeathSimTime] = useState(-10);

  // Stats simuladas
  const [simKills, setSimKills] = useState(0);
  const [simDeaths, setSimDeaths] = useState(0);

  const timerRef = useRef(null);
  const playerName = 'aacal666';

  const onAddKillRef = useRef(onAddKill);
  onAddKillRef.current = onAddKill;

  const onAddDeathRef = useRef(onAddDeath);
  onAddDeathRef.current = onAddDeath;

  // Reiniciar simulación al abrir
  useEffect(() => {
    if (isOpen) {
      handleReset();
    } else {
      setIsPlaying(false);
    }
  }, [isOpen]);

  const handleReset = () => {
    setIsPlaying(false);
    const freshEvents = generate100RoundMatch();
    setMatchEvents(freshEvents);
    setSimTime(0);
    setEventIndex(0);
    setCards([]);
    setIsWarmup(true);
    setSimKills(0);
    setSimDeaths(0);
    setLastDeathSimTime(-10);
    setCurrentPace('⚔ Combate normal');
    setSimLog([
      { time: '00:00', text: `🏁 Partida de ${freshEvents.length} rondas generada con ritmo variable.`, color: 'text-sky-400' }
    ]);
  };

  const addLog = (text, color = 'text-slate-200') => {
    const mins = Math.floor(simTime / 60);
    const secs = (simTime % 60).toFixed(1).padStart(4, '0');
    setSimLog(prev => [{ time: `${mins}:${secs}`, text, color }, ...prev.slice(0, 30)]);
  };

  // Ejecutar un evento de la simulación
  const triggerEvent = (ev, currentT) => {
    setCurrentPace(ev.pace || '⚔ Combate normal');

    if (ev.type === 'warmup_end') {
      setIsWarmup(false);
      addLog('🔔 ¡FIN DE CALENTAMIENTO! Comienza el Combate a Muerte oficial (100 rondas).', 'text-emerald-400 font-bold');
      return;
    }

    setIsWarmup(ev.isWarmup);

    // Añadir tarjeta en la parte superior (Slot 0)
    const newCard = {
      id: `${ev.killer}-${ev.victim}-${Date.now()}-${Math.random()}`,
      killer: ev.killer,
      weapon: ev.weapon,
      victim: ev.victim,
      spawnTime: currentT,
      isMyKill: ev.killer === playerName,
      isMyDeath: ev.victim === playerName
    };

    setCards(prev => [newCard, ...prev.slice(0, 7)]); // Máximo 8 tarjetas en pantalla

    // Si NO está en calentamiento, procesar bajas y muertes en la App real
    if (!ev.isWarmup) {
      if (ev.killer === playerName) {
        setSimKills(k => k + 1);
        addLog(`🎯 ¡TU BAJA! Eliminaste a ${ev.victim} con ${ev.weapon} (+1 Kill)`, 'text-emerald-400 font-bold');
        if (onAddKillRef.current) onAddKillRef.current();
      } else if (ev.victim === playerName) {
        setSimDeaths(d => d + 1);
        setLastDeathSimTime(currentT);
        addLog(`💀 ¡TE MATAN! ${ev.killer} te eliminó con ${ev.weapon} (+1 Muerte)`, 'text-rose-400 font-bold');
        if (onAddDeathRef.current) onAddDeathRef.current();
      } else {
        addLog(`Lobby: ${ev.killer} [${ev.weapon}] ${ev.victim}`, 'text-slate-400');
      }
    } else {
      addLog(`⏳ Calentamiento: ${ev.killer} [${ev.weapon}] ${ev.victim} (Ignorado)`, 'text-amber-400');
    }
  };

  // Loop de simulación continua
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalMs = 40; // 25 ticks por segundo
    timerRef.current = setInterval(() => {
      setSimTime(prevT => {
        const nextT = prevT + (intervalMs / 1000) * speed;

        // Comprobar si hay eventos que deban ocurrir en este instante
        setEventIndex(prevIdx => {
          let currIdx = prevIdx;
          while (currIdx < matchEvents.length) {
            const ev = matchEvents[currIdx];
            if (nextT >= ev.time) {
              triggerEvent(ev, nextT);
              currIdx++;
            } else {
              break;
            }
          }
          if (currIdx >= matchEvents.length) {
            setIsPlaying(false);
          }
          return currIdx;
        });

        // Purgar tarjetas que hayan cumplido más de 8.5 segundos
        setCards(prevCards => prevCards.filter(c => (nextT - c.spawnTime) < 8.5));

        return nextT;
      });
    }, intervalMs);

    return () => clearInterval(timerRef.current);
  }, [isPlaying, speed, matchEvents]);

  // Avanzar un paso manual al siguiente evento
  const handleStepForward = () => {
    if (eventIndex >= matchEvents.length) return;
    const ev = matchEvents[eventIndex];
    setSimTime(ev.time);
    triggerEvent(ev, ev.time);
    setEventIndex(i => i + 1);
    setCards(prevCards => prevCards.filter(c => (ev.time - c.spawnTime) < 8.5));
  };

  if (!isOpen) return null;

  const mins = Math.floor(simTime / 60);
  const secs = (simTime % 60).toFixed(1).padStart(4, '0');
  const isRespawning = (simTime - lastDeathSimTime) < 3.0 && !isWarmup;
  const respawnRemaining = Math.max(0, 3.0 - (simTime - lastDeathSimTime)).toFixed(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0b1219] border-2 border-[#233544] rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden text-white flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#121c27] border-b border-[#1f3041]">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-[#00f59b]" />
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                Simulador Visual de Killfeed • Partida Completa (100 Rondas)
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#00f59b]/20 text-[#00f59b] border border-[#00f59b]/40">
                  Ritmo Variable
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                100 bajas simuladas con velocidad orgánica: ráfagas rápidas, duelos normales y pausas de reposicionamiento.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a2b3c] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 overflow-y-auto flex-1">
          
          {/* Left Column: Valorant Killfeed Viewport (510x340 px authentic ratio) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-[#ff4655] animate-pulse" />
                Killfeed Pantalla 2 (Top-Right de Valorant)
              </span>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-[#162738] border border-[#233d57] text-[#5bb2d6]">
                  {currentPace}
                </span>
                <span className="text-slate-400">
                  {cards.length} / 8 Tarjetas
                </span>
              </div>
            </div>

            {/* Simulated Valorant Killfeed Screen Box */}
            <div className="w-full max-w-[510px] h-[340px] bg-[#05080c] border-2 border-[#203244] rounded-lg shadow-inner relative overflow-hidden flex flex-col p-3 select-none">
              
              {/* Background grid lines for authenticity */}
              <div className="absolute inset-0 bg-[radial-gradient(#142230_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

              {/* Banner de Calentamiento */}
              {isWarmup && (
                <div className="mb-2 py-1.5 px-3 bg-amber-900/60 border border-amber-500/80 rounded text-center shadow-lg animate-pulse">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-widest font-mono">
                    ⏳ CALENTAMIENTO / WARM UP
                  </span>
                </div>
              )}

              {/* Killfeed Card Slots (Slots 0 to 7) */}
              <div className="space-y-1.5 overflow-hidden flex-1">
                {cards.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-600 italic text-xs">
                    Sin actividad reciente en el killfeed...
                  </div>
                ) : (
                  cards.map((card) => (
                    <div
                      key={card.id}
                      className={`flex items-center justify-between px-3 py-1.5 rounded transition-all duration-300 border ${
                        card.isMyKill
                          ? 'bg-[#122b3b] border-[#00f59b] shadow-[0_0_12px_rgba(0,245,155,0.25)]'
                          : card.isMyDeath
                          ? 'bg-[#3b1219] border-[#ff4655] shadow-[0_0_12px_rgba(255,70,85,0.25)]'
                          : 'bg-[#0f1722]/90 border-[#1c2c3d]'
                      }`}
                    >
                      {/* Killer (Left) */}
                      <span className={`text-xs font-black font-sans truncate max-w-[130px] ${
                        card.isMyKill ? 'text-[#00f59b]' : 'text-slate-100'
                      }`}>
                        {card.killer}
                      </span>

                      {/* Weapon Icon Badge (Center) */}
                      <div className="px-2 py-0.5 rounded bg-[#090f15] border border-[#1b2b3a] text-[10px] font-mono font-bold text-slate-300">
                        {card.weapon}
                      </div>

                      {/* Victim (Right) */}
                      <span className={`text-xs font-black font-sans truncate max-w-[130px] text-right ${
                        card.isMyDeath ? 'text-[#ff4655]' : 'text-slate-100'
                      }`}>
                        {card.victim}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Respawn Countdown HUD Banner (shown during death screen) */}
              {isRespawning && (
                <div className="absolute bottom-10 left-4 right-4 py-2 px-3 bg-rose-950/90 border border-rose-500 rounded-lg text-center shadow-2xl animate-pulse">
                  <span className="text-xs font-black text-rose-300 uppercase tracking-widest font-mono">
                    ⏳ REAPARECIENDO EN {respawnRemaining}s (PANTALLA DE MUERTE)
                  </span>
                </div>
              )}

              {/* Bottom overlay badge */}
              <div className="mt-auto pt-2 border-t border-[#131f2b] flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Ronda {eventIndex} / {matchEvents.length}</span>
                <span>JUGADOR: {playerName}</span>
              </div>
            </div>

            {/* Playback Controls Bar */}
            <div className="w-full max-w-[510px] mt-4 flex items-center justify-between bg-[#111a24] p-2.5 rounded-lg border border-[#1e2e3e]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`px-3.5 py-1.5 rounded text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isPlaying
                      ? 'bg-amber-500 hover:bg-amber-600 text-black'
                      : 'bg-[#00f59b] hover:bg-emerald-400 text-black'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                </button>

                <button
                  onClick={handleStepForward}
                  disabled={eventIndex >= matchEvents.length}
                  className="px-3 py-1.5 bg-[#172533] hover:bg-[#203244] disabled:opacity-40 text-sky-300 border border-[#25394d] rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>Paso a Paso</span>
                </button>

                <button
                  onClick={handleReset}
                  className="p-1.5 bg-[#172533] hover:bg-rose-950/50 text-slate-400 hover:text-white border border-[#25394d] rounded transition-colors cursor-pointer"
                  title="Generar nueva partida de 100 rondas"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1 bg-[#0b1219] p-1 rounded border border-[#1e2d3b]">
                {[0.5, 1, 2].map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      speed === s ? 'bg-[#00f59b] text-black' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Live Inspector & Verification Log */}
          <div className="lg:col-span-5 flex flex-col space-y-3">
            
            {/* Player State Box */}
            <div className="bg-[#121c27] p-3.5 rounded-lg border border-[#203244]">
              <div className="flex items-center justify-between pb-2 border-b border-[#1b2b3b] text-xs">
                <span className="font-bold text-slate-300">ESTADO DEL JUGADOR ({playerName})</span>
                <span className="font-mono text-[#00f59b] font-bold">⏱ {mins}:{secs}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2.5">
                <div className="bg-[#0c141d] p-2 rounded border border-[#1c2c3b] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Target className="w-3.5 h-3.5 text-[#00f59b]" />
                    <span>Kills Partida:</span>
                  </div>
                  <span className="text-base font-black text-[#00f59b] font-mono">{simKills}</span>
                </div>

                <div className="bg-[#0c141d] p-2 rounded border border-[#1c2c3b] flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300">
                    <Skull className="w-3.5 h-3.5 text-rose-400" />
                    <span>Muertes Partida:</span>
                  </div>
                  <span className="text-base font-black text-rose-400 font-mono">{simDeaths}</span>
                </div>
              </div>

              {/* Estado en directo de la App */}
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-[#101b26] p-2 rounded border border-[#23384d] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Racha en App:</span>
                  <span className="text-xs font-black text-white font-mono">
                    {currentStage ? `${currentStage.currentKills} / ${currentStage.targetKills}` : '0 / 3'}
                  </span>
                </div>

                <div className="bg-[#101b26] p-2 rounded border border-[#23384d] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Vidas en App:</span>
                  <span className="text-xs font-black text-rose-400 font-mono">
                    {currentStage ? `${Math.max(0, currentStage.maxAllowedDeaths - currentStage.currentDeaths)} / ${currentStage.maxAllowedDeaths}` : '3 / 3'}
                  </span>
                </div>
              </div>

              <div className="mt-2.5 p-2 bg-[#0a1622] rounded border border-[#183147] text-[11px] text-slate-300 flex items-center justify-between">
                <span>Arma Activa: <strong className="text-white">{currentStage ? currentStage.weapon.name : 'Bandit'}</strong></span>
                <span className="text-emerald-400 font-bold">Vidas Intactas al Matar ✅</span>
              </div>
            </div>

            {/* Live Verification Log */}
            <div className="flex-1 bg-[#0a1118] border border-[#1c2c3b] rounded-lg p-3 flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3 text-sky-400" />
                  Registro de Rondas (100 totales):
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {eventIndex}/{matchEvents.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-xs pr-1 max-h-[220px]">
                {simLog.map((item, idx) => (
                  <div key={idx} className="p-1.5 rounded bg-[#0e1722]/80 border border-[#192736] flex items-start justify-between text-[11px]">
                    <span className={`${item.color} leading-tight`}>{item.text}</span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Helper tip */}
            <div className="bg-[#0f1d2a] p-2.5 rounded border border-[#1f3a52] text-[11px] text-sky-200">
              💡 <strong>Partida completa (100 bajas):</strong> Los eventos se suceden a ritmos dinámicos (ráfagas de 0.4s y pausas de 3.5s). Mientras estás muerto ves la cuenta atrás de 3s y cómo las bajas del lobby empujan tus tarjetas hacia abajo hasta desaparecer limpiamente.
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
