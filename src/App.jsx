import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { WEAPON_CATEGORIES, generateFullRun, generateRandomStage } from './data/weaponsData';
import { soundFX } from './utils/audio';
import { overwolfService } from './services/overwolfService';

import Header from './components/Header';
import WeaponList from './components/WeaponList';
import ActiveWeaponCard from './components/ActiveWeaponCard';
import CombatSimulator from './components/CombatSimulator';
import CompactOverlay from './components/CompactOverlay';
import SettingsModal from './components/SettingsModal';
import ShortcutsModal from './components/ShortcutsModal';
import AllWeaponsBoard from './components/AllWeaponsBoard';
import InGameToastHUD from './components/InGameToastHUD';
import KillfeedCalibrationBox from './components/KillfeedCalibrationBox';

export default function App() {
  // Configuration
  const [config, setConfig] = useState({
    minKills: 2,
    maxKills: 5,
    minDeaths: 1,
    maxDeaths: 3
  });

  const [activeCategoryIds, setActiveCategoryIds] = useState(
    WEAPON_CATEGORIES.map(c => c.id)
  );

  // Sound preferences (Only synthesizer effects/chimes, NO voice announcer)
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Overwolf Status
  const [overwolfStatus, setOverwolfStatus] = useState(overwolfService.status);

  // Live VALORANT and Game Mode Status (via Riot Client lockfile & processes)
  const [valorantStatus, setValorantStatus] = useState({
    running: false,
    inDeathmatch: false,
    isInGame: false,
    state: 'MENUS',
    player: '',
    queueId: ''
  });

  // In-Game Transparent Overlay Status (F7)
  const [isOverlayActive, setIsOverlayActive] = useState(true);

  // Multi-Monitor Info (Monitor 1 vs Monitor 2 for Overlay)
  const [displaysInfo, setDisplaysInfo] = useState({ displays: [], selectedIndex: 1 });

  // 3-Second Tactical Toast Notification State
  const [toast, setToast] = useState(null);

  // 3-Second Gray Killfeed Calibration Box State
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Warmup Phase (Calentamiento) Detection
  const [isWarmup, setIsWarmup] = useState(false);

  // UI Modals and Modes
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Game Run Progression
  const [stages, setStages] = useState(() => {
    const cats = WEAPON_CATEGORIES.filter(c => activeCategoryIds.includes(c.id));
    return generateFullRun(cats, config);
  });
  const [currentTierIndex, setCurrentTierIndex] = useState(0);

  // Overall Statistics
  const [stats, setStats] = useState({
    completedRuns: 0,
    totalKills: 0,
    totalDeaths: 0,
    demotions: 0
  });

  // Dynamic Synchronization Refs (Guarantees zero stale closures across rapid kills/deaths)
  const stagesRef = useRef(stages);
  stagesRef.current = stages;

  const currentTierIndexRef = useRef(currentTierIndex);
  currentTierIndexRef.current = currentTierIndex;

  const statsRef = useRef(stats);
  statsRef.current = stats;

  const isWarmupRef = useRef(isWarmup);
  isWarmupRef.current = isWarmup;

  // Action / Combat Log
  const [history, setHistory] = useState([
    {
      text: 'Partida iniciada. ¡Buena suerte en Combate a Muerte!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type: 'info'
    }
  ]);

  // Undo Stack
  const [undoStack, setUndoStack] = useState([]);

  // Log an event helper
  const addLog = useCallback((text, type = 'info') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setHistory(prev => [{ text, time, type }, ...prev.slice(0, 40)]);
  }, []);

  // Dispatch 3-Second HUD Toast to overlay window on Monitor 2 (Valorant)
  const triggerToast = useCallback((payload) => {
    const toastData = {
      ...payload,
      id: Date.now()
    };

    // In browser preview mode, show toast locally.
    // In Electron mode, the toast renders directly over Valorant on Monitor 2 via OverlayApp!
    if (typeof window !== 'undefined' && !window.electronAPI) {
      setToast(toastData);
      try {
        const channel = new BroadcastChannel('valorant_gun_roulette_events');
        channel.postMessage(toastData);
        channel.close();
      } catch {
        // ignore
      }
    } else if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.sendGameToast) {
      window.electronAPI.sendGameToast(toastData);
    }
  }, []);

  // Save state snapshot for undo
  const saveSnapshot = useCallback(() => {
    setUndoStack(prev => [
      {
        stages: JSON.parse(JSON.stringify(stagesRef.current)),
        currentTierIndex: currentTierIndexRef.current,
        stats: { ...statsRef.current }
      },
      ...prev.slice(0, 15)
    ]);
  }, []);

  // Current and next stages
  const currentStage = stages[currentTierIndex];
  const nextStage = currentTierIndex < stages.length - 1 ? stages[currentTierIndex + 1] : null;

  // Toggle In-Game Overlay (F7)
  const handleToggleOverlay = useCallback(() => {
    setIsOverlayActive(prev => {
      const nextState = !prev;
      if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.toggleOverlay) {
        window.electronAPI.toggleOverlay(nextState);
      }
      return nextState;
    });
  }, []);

  // Switch Monitor for Overlay (Pantalla 1 / Pantalla 2)
  const handleSwitchDisplay = useCallback(() => {
    if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.switchOverlayDisplay) {
      window.electronAPI.switchOverlayDisplay();
    }
  }, []);

  // Trigger 3-Second Gray Killfeed Calibration Box on Monitor 2
  const handleCalibrateKillfeed = useCallback(() => {
    if (typeof window !== 'undefined' && !window.electronAPI) {
      setIsCalibrating(true);
      try {
        const channel = new BroadcastChannel('valorant_gun_roulette_events');
        channel.postMessage({
          type: 'calibrate_killfeed',
          playerName: valorantStatus.player || 'aacal666#6666'
        });
        channel.close();
      } catch {
        // ignore
      }
    } else if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.calibrateKillfeed) {
      window.electronAPI.calibrateKillfeed();
      addLog('🎯 Recuadro de calibración de Killfeed (3s) mostrado en Pantalla 2 (Valorant).', 'info');
    }
  }, [valorantStatus.player, addLog]);

  // Handle +1 Kill
  const handleAddKill = useCallback(() => {
    if (isWarmupRef.current) {
      addLog('⏳ Kill ignorada: Calentamiento en curso.', 'info');
      return;
    }

    const currentStages = stagesRef.current;
    const tierIdx = currentTierIndexRef.current;
    const stage = currentStages[tierIdx];
    if (!stage || stage.status === 'ready_to_switch') return;

    saveSnapshot();

    const newKills = stage.currentKills + 1;
    const isTargetMet = newKills >= stage.targetKills;
    const currentDeaths = stage.currentDeaths; // strictly preserved!

    setStages(prev => {
      const pTier = currentTierIndexRef.current;
      const pStage = prev[pTier];
      if (!pStage || pStage.status === 'ready_to_switch') return prev;

      const updatedKills = pStage.currentKills + 1;
      const targetMet = updatedKills >= pStage.targetKills;

      const copy = [...prev];
      copy[pTier] = {
        ...pStage,
        currentKills: updatedKills,
        // ESTRICTO: Las vidas consumidas (currentDeaths) se preservan intactas. Jamás se reinician al matar.
        currentDeaths: pStage.currentDeaths,
        status: targetMet ? 'ready_to_switch' : 'active'
      };
      stagesRef.current = copy;
      return copy;
    });

    setStats(prev => {
      const nextStats = { ...prev, totalKills: prev.totalKills + 1 };
      statsRef.current = nextStats;
      return nextStats;
    });

    if (isTargetMet) {
      if (soundEnabled) soundFX.playObjectiveComplete();
      const nextStageObj = currentStages[tierIdx + 1];
      const nextWeaponName = nextStageObj ? nextStageObj.weapon.name : 'Victoria Final';
      addLog(`🎯 ¡Reto de bajas superado con ${stage.weapon.name}! Al morir en Combate a Muerte, equipa: ${nextWeaponName}.`, 'ready');

      // Trigger 3-Second HUD Alert
      triggerToast({
        type: 'ready_to_switch',
        isStreakComplete: true,
        weapon: stage.weapon,
        categoryDisplay: stage.categoryDisplay,
        currentKills: newKills,
        targetKills: stage.targetKills,
        currentDeaths: currentDeaths,
        maxAllowedDeaths: stage.maxAllowedDeaths,
        nextWeaponName,
        submessage: `¡Reto superado! Al morir, equipa: ${nextWeaponName}`
      });
    } else {
      if (soundEnabled) soundFX.playKill(newKills);
      addLog(`+1 Kill con ${stage.weapon.name} (Racha: ${newKills}/${stage.targetKills})`, 'kill');

      // Trigger 3-Second HUD Alert
      triggerToast({
        type: 'kill',
        weapon: stage.weapon,
        categoryDisplay: stage.categoryDisplay,
        currentKills: newKills,
        targetKills: stage.targetKills,
        currentDeaths: currentDeaths,
        maxAllowedDeaths: stage.maxAllowedDeaths,
        submessage: `Racha de ${newKills} / ${stage.targetKills} bajas consecutivas`
      });
    }
  }, [soundEnabled, saveSnapshot, addLog, triggerToast]);

  // Handle Confirm Respawn Switch (After killing enough with current weapon, player died in Deathmatch and equipped next)
  const handleConfirmRespawnSwitch = useCallback(() => {
    if (isWarmupRef.current) return;
    const currentStages = stagesRef.current;
    const tierIdx = currentTierIndexRef.current;
    const stage = currentStages[tierIdx];
    if (!stage) return;

    saveSnapshot();

    // Check if this was the last weapon of the run!
    if (tierIdx >= currentStages.length - 1) {
      // VICTORY!
      if (soundEnabled) soundFX.playVictory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      addLog(`🏆 ¡VICTORIA TOTAL! Superaste todas las ramas de armas en Combate a Muerte.`, 'victory');

      setStats(prev => {
        const nextStats = {
          ...prev,
          completedRuns: prev.completedRuns + 1
        };
        statsRef.current = nextStats;
        return nextStats;
      });

      triggerToast({
        type: 'victory',
        weapon: stage.weapon,
        categoryDisplay: 'VICTORIA TOTAL',
        currentKills: stage.targetKills,
        targetKills: stage.targetKills,
        currentDeaths: stage.currentDeaths,
        maxAllowedDeaths: stage.maxAllowedDeaths,
        submessage: '¡Superaste todas las armas en Combate a Muerte!'
      });

      // Generate a brand new run from pistols!
      const cats = WEAPON_CATEGORIES.filter(c => activeCategoryIds.includes(c.id));
      const freshStages = generateFullRun(cats, config);
      setStages(freshStages);
      stagesRef.current = freshStages;
      setCurrentTierIndex(0);
      currentTierIndexRef.current = 0;
      return;
    }

    // Advance to next tier
    const nextIndex = tierIdx + 1;
    setStages(prev => {
      const copy = [...prev];
      copy[tierIdx] = { ...copy[tierIdx], status: 'completed' };
      copy[nextIndex] = { ...copy[nextIndex], status: 'active', currentKills: 0, currentDeaths: 0 };
      stagesRef.current = copy;
      return copy;
    });

    setCurrentTierIndex(nextIndex);
    currentTierIndexRef.current = nextIndex;

    if (soundEnabled) soundFX.playObjectiveComplete();

    const upcomingStage = currentStages[nextIndex];
    addLog(`🔄 Arma equipada: ${upcomingStage.weapon.name} (Meta: ${upcomingStage.targetKills} kills seguidas, ${upcomingStage.maxAllowedDeaths} vidas max).`, 'switch');

    triggerToast({
      type: 'switch',
      weapon: upcomingStage.weapon,
      categoryDisplay: upcomingStage.categoryDisplay,
      currentKills: 0,
      targetKills: upcomingStage.targetKills,
      currentDeaths: 0,
      maxAllowedDeaths: upcomingStage.maxAllowedDeaths,
      submessage: `Equipada: ${upcomingStage.weapon.name} (Meta: ${upcomingStage.targetKills} kills)`
    });
  }, [activeCategoryIds, config, soundEnabled, saveSnapshot, addLog, triggerToast]);

  // Handle +1 Death
  const handleAddDeath = useCallback(() => {
    if (isWarmupRef.current) {
      addLog('⏳ Muerte ignorada: Calentamiento en curso.', 'info');
      return;
    }

    const currentStages = stagesRef.current;
    const tierIdx = currentTierIndexRef.current;
    const stage = currentStages[tierIdx];
    if (!stage) return;

    // In Deathmatch: if player already met kill requirements, this death triggers the weapon switch without penalty!
    if (stage.status === 'ready_to_switch') {
      addLog(`💀 Muerte de transición en Combate a Muerte (No penaliza). Cambiando de arma...`, 'switch');
      handleConfirmRespawnSwitch();
      return;
    }

    saveSnapshot();

    const newDeaths = stage.currentDeaths + 1;
    setStats(prev => {
      const nextStats = { ...prev, totalDeaths: prev.totalDeaths + 1 };
      statsRef.current = nextStats;
      return nextStats;
    });

    // Check if reached allowed deaths limit -> DEMOTION or PISTOL SWAP!
    if (newDeaths >= stage.maxAllowedDeaths) {
      if (soundEnabled) soundFX.playDemote();

      setStats(prev => {
        const nextStats = { ...prev, demotions: prev.demotions + 1 };
        statsRef.current = nextStats;
        return nextStats;
      });

      if (tierIdx > 0) {
        // Demote to previous tier!
        const prevIndex = tierIdx - 1;
        setStages(prev => {
          const copy = [...prev];
          // Current tier fails and resets
          copy[tierIdx] = {
            ...copy[tierIdx],
            currentKills: 0,
            currentDeaths: 0,
            status: 'pending'
          };
          // Previous tier is reactivated and resets kills/deaths so player re-clears it
          copy[prevIndex] = {
            ...copy[prevIndex],
            currentKills: 0,
            currentDeaths: 0,
            status: 'active'
          };
          stagesRef.current = copy;
          return copy;
        });

        setCurrentTierIndex(prevIndex);
        currentTierIndexRef.current = prevIndex;

        const prevTierStage = currentStages[prevIndex];
        addLog(`⚠️ ¡DESCENSO DE RANGO! Has muerto ${newDeaths} veces. Vuelves a ${prevTierStage.weapon.name}.`, 'demote');

        triggerToast({
          type: 'demote',
          weapon: prevTierStage.weapon,
          categoryDisplay: prevTierStage.categoryDisplay,
          currentKills: 0,
          targetKills: prevTierStage.targetKills,
          currentDeaths: 0,
          maxAllowedDeaths: prevTierStage.maxAllowedDeaths,
          submessage: `Descenso: Vuelves a ${prevTierStage.weapon.name}`
        });
      } else {
        // RONDA DE PISTOLAS (Tier 0): No se puede descender de categoría.
        // Al agotar todas las vidas en pistolas, se cambia obligatoriamente a OTRA pistola diferente
        // y se genera una nueva meta de bajas para que el jugador no quede atascado.
        const sidearmsCategory = WEAPON_CATEGORIES.find(c => c.id === 'sidearms') || WEAPON_CATEGORIES[0];
        const otherPistols = sidearmsCategory.weapons.filter(w => w.id !== stage.weapon.id);
        const nextPistol = otherPistols.length > 0
          ? otherPistols[Math.floor(Math.random() * otherPistols.length)]
          : sidearmsCategory.weapons[Math.floor(Math.random() * sidearmsCategory.weapons.length)];

        const newTargetKills = Math.floor(Math.random() * (config.maxKills - config.minKills + 1)) + config.minKills;

        const newTier0Stage = {
          ...stage,
          id: `sidearms-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          weapon: nextPistol,
          targetKills: newTargetKills,
          maxAllowedDeaths: 3,
          currentKills: 0,
          currentDeaths: 0,
          status: 'active'
        };

        setStages(prev => {
          const copy = [...prev];
          copy[0] = newTier0Stage;
          stagesRef.current = copy;
          return copy;
        });

        addLog(`⚠️ Agotaste tus vidas con ${stage.weapon.name}. ¡Cambias de pistola! Equipa: ${nextPistol.name} (Meta: ${newTargetKills} kills).`, 'demote');

        triggerToast({
          type: 'demote',
          weapon: nextPistol,
          categoryDisplay: stage.categoryDisplay,
          currentKills: 0,
          targetKills: newTargetKills,
          currentDeaths: 0,
          maxAllowedDeaths: 3,
          submessage: `¡Vidas agotadas! Nueva pistola: ${nextPistol.name} (Meta: ${newTargetKills} kills)`
        });
      }
    } else {
      // Died, but still has lives remaining:
      const killsLost = stage.currentKills;
      setStages(prev => {
        const copy = [...prev];
        copy[tierIdx] = {
          ...copy[tierIdx],
          currentKills: 0, // Killstreak resets to 0
          currentDeaths: newDeaths
        };
        stagesRef.current = copy;
        return copy;
      });

      if (soundEnabled) soundFX.playDeath();
      const remainingLives = stage.maxAllowedDeaths - newDeaths;

      if (killsLost > 0) {
        addLog(`💀 Muerte con ${stage.weapon.name}. Racha de ${killsLost} bajas perdida (se reinicia a 0/${stage.targetKills}). Vidas restantes: ${remainingLives}/${stage.maxAllowedDeaths}`, 'death');
      } else {
        addLog(`💀 Muerte con ${stage.weapon.name} (0/${stage.targetKills} kills). Vidas restantes: ${remainingLives}/${stage.maxAllowedDeaths}`, 'death');
      }

      triggerToast({
        type: 'death',
        weapon: stage.weapon,
        categoryDisplay: stage.categoryDisplay,
        currentKills: 0,
        targetKills: stage.targetKills,
        currentDeaths: newDeaths,
        maxAllowedDeaths: stage.maxAllowedDeaths,
        submessage: killsLost > 0 ? `Racha de ${killsLost} bajas perdida • ${remainingLives} vidas restantes` : `${remainingLives} vidas restantes`
      });
    }
  }, [soundEnabled, saveSnapshot, addLog, handleConfirmRespawnSwitch, triggerToast]);

  // Fast forward current stage (Sandbox test helper)
  const handleFastForwardStage = useCallback(() => {
    const currentStages = stagesRef.current;
    const tierIdx = currentTierIndexRef.current;
    const stage = currentStages[tierIdx];
    if (!stage) return;

    saveSnapshot();
    setStages(prev => {
      const copy = [...prev];
      copy[tierIdx] = {
        ...copy[tierIdx],
        currentKills: copy[tierIdx].targetKills,
        status: 'ready_to_switch'
      };
      stagesRef.current = copy;
      return copy;
    });
    if (soundEnabled) soundFX.playObjectiveComplete();
    const nextStageObj = currentStages[tierIdx + 1];
    const nextWeaponName = nextStageObj ? nextStageObj.weapon.name : 'Victoria Final';
    addLog(`⚡ Sandbox: Racha de ${stage.weapon.name} autocompletada para pruebas.`, 'ready');

    triggerToast({
      type: 'ready_to_switch',
      isStreakComplete: true,
      weapon: stage.weapon,
      categoryDisplay: stage.categoryDisplay,
      currentKills: stage.targetKills,
      targetKills: stage.targetKills,
      currentDeaths: stage.currentDeaths,
      maxAllowedDeaths: stage.maxAllowedDeaths,
      nextWeaponName,
      submessage: 'Sandbox: Racha completada'
    });
  }, [soundEnabled, saveSnapshot, addLog, triggerToast]);

  const lastRunResetTime = useRef(0);

  // Reset / Reroll entire run
  const handleResetRun = useCallback((showHUD = false, force = false) => {
    const now = Date.now();
    // Prevenir reinicios duplicados accidentales en ráfaga (< 2.5s) que desincronicen el arma
    if (!force && (now - lastRunResetTime.current) < 2500) {
      return;
    }
    lastRunResetTime.current = now;

    saveSnapshot();
    const cats = WEAPON_CATEGORIES.filter(c => activeCategoryIds.includes(c.id));
    const freshStages = generateFullRun(cats, config);
    setStages(freshStages);
    stagesRef.current = freshStages;
    setCurrentTierIndex(0);
    currentTierIndexRef.current = 0;
    addLog('🎲 Nueva ruleta de armas generada aleatoriamente.', 'info');

    // Al finalizar el calentamiento o inicio oficial, lanzar el HUD táctico en Pantalla 2 (Valorant)
    if (showHUD && freshStages.length > 0) {
      const initialStage = freshStages[0];
      if (soundEnabled) soundFX.playObjectiveComplete();
      triggerToast({
        type: 'game_start',
        weapon: initialStage.weapon,
        categoryDisplay: initialStage.categoryDisplay,
        currentKills: 0,
        targetKills: initialStage.targetKills,
        currentDeaths: 0,
        maxAllowedDeaths: initialStage.maxAllowedDeaths,
        submessage: `¡INICIO DE PARTIDA! Equipa: ${initialStage.weapon.name} (Meta: ${initialStage.targetKills} kills)`
      });
    }
  }, [activeCategoryIds, config, soundEnabled, saveSnapshot, addLog, triggerToast]);

  // Start or synchronize active match without unexpected re-rolls
  const handleStartMatch = useCallback(() => {
    const currentStages = stagesRef.current;
    const tierIdx = currentTierIndexRef.current;
    const stage = currentStages[tierIdx];

    // Si la partida ya está en curso (el jugador ya tiene kills o ya ha muerto en esta partida),
    // NUNCA reiniciar la ruleta ni restaurar vidas durante el combate activo.
    if (tierIdx > 0 || (stage && (stage.currentKills > 0 || stage.currentDeaths > 0))) {
      return;
    }

    // Si la ruleta ya está en Tier 0 sin bajas ni muertes, conservamos el arma actual
    // para que NO cambie sorpresivamente el arma que el jugador ya tiene en la pantalla o en la mano.
    if (tierIdx === 0 && stage && stage.currentKills === 0 && stage.currentDeaths === 0) {
      if (soundEnabled) soundFX.playObjectiveComplete();
      triggerToast({
        type: 'game_start',
        weapon: stage.weapon,
        categoryDisplay: stage.categoryDisplay,
        currentKills: 0,
        targetKills: stage.targetKills,
        currentDeaths: 0,
        maxAllowedDeaths: stage.maxAllowedDeaths,
        submessage: `¡INICIO DE PARTIDA! Equipa: ${stage.weapon.name} (Meta: ${stage.targetKills} kills)`
      });
      addLog(`🎯 ¡Comienza la partida! Equipa tu arma inicial: ${stage.weapon.name}.`, 'ready');
    }
  }, [soundEnabled, triggerToast, addLog]);

  // Manual test trigger for 3-Second HUD Toast
  const handleTestToast = useCallback(() => {
    const currentStages = stagesRef.current;
    const tierIdx = currentTierIndexRef.current;
    const stage = currentStages[tierIdx];
    if (!stage) return;
    triggerToast({
      type: 'kill',
      weapon: stage.weapon,
      categoryDisplay: stage.categoryDisplay,
      currentKills: stage.currentKills,
      targetKills: stage.targetKills,
      currentDeaths: stage.currentDeaths,
      maxAllowedDeaths: stage.maxAllowedDeaths,
      submessage: 'Notificación de prueba del HUD táctico (3 segundos)'
    });
    addLog('📺 HUD Táctico (3s) mostrado en Pantalla 2 (Valorant).', 'info');
  }, [triggerToast, addLog]);

  // Undo last action
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const [lastState, ...remainingStack] = undoStack;
    setStages(lastState.stages);
    stagesRef.current = lastState.stages;
    setCurrentTierIndex(lastState.currentTierIndex);
    currentTierIndexRef.current = lastState.currentTierIndex;
    setStats(lastState.stats);
    statsRef.current = lastState.stats;
    setUndoStack(remainingStack);
    addLog('↩️ Última acción deshecha.', 'info');
  }, [undoStack, addLog]);

  const handleAddKillRef = useRef(handleAddKill);
  handleAddKillRef.current = handleAddKill;

  const handleAddDeathRef = useRef(handleAddDeath);
  handleAddDeathRef.current = handleAddDeath;

  const handleConfirmRespawnSwitchRef = useRef(handleConfirmRespawnSwitch);
  handleConfirmRespawnSwitchRef.current = handleConfirmRespawnSwitch;

  const handleResetRunRef = useRef(handleResetRun);
  handleResetRunRef.current = handleResetRun;

  const handleStartMatchRef = useRef(handleStartMatch);
  handleStartMatchRef.current = handleStartMatch;

  // Overwolf Hook: Listen for live Valorant events (Clean unsubscription prevents stacked callbacks)
  useEffect(() => {
    const handleOwKill = () => {
      handleAddKillRef.current();
    };
    const handleOwDeath = () => {
      handleAddDeathRef.current();
    };
    const handleOwDmStart = () => {
      addLog('🎮 ¡Partida de Combate a Muerte detectada por Overwolf! Iniciando reto de armas...', 'ready');
      handleResetRunRef.current();
    };
    const handleOwStatus = (status) => {
      setOverwolfStatus(status);
    };

    overwolfService.on('onKill', handleOwKill);
    overwolfService.on('onDeath', handleOwDeath);
    overwolfService.on('onDeathmatchStart', handleOwDmStart);
    overwolfService.on('onStatusChange', handleOwStatus);

    return () => {
      overwolfService.off('onKill', handleOwKill);
      overwolfService.off('onDeath', handleOwDeath);
      overwolfService.off('onDeathmatchStart', handleOwDmStart);
      overwolfService.off('onStatusChange', handleOwStatus);
    };
  }, [addLog]);

  // Electron IPC Listeners: Global Shortcuts & Process Status (Mounted ONCE)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.onGlobalKey((action) => {
        if (action === 'kill') handleAddKillRef.current();
        if (action === 'death') handleAddDeathRef.current();
        if (action === 'respawn') handleConfirmRespawnSwitchRef.current();
      });

      if (window.electronAPI.onValorantStatus) {
        window.electronAPI.onValorantStatus((status) => {
          setValorantStatus(prev => {
            if (
              prev.running === status.running &&
              prev.inDeathmatch === status.inDeathmatch &&
              prev.isInGame === status.isInGame &&
              prev.state === status.state &&
              prev.player === status.player &&
              prev.queueId === status.queueId
            ) {
              return prev;
            }
            return status;
          });
        });
      }

      if (window.electronAPI.onDeathmatchStart) {
        window.electronAPI.onDeathmatchStart((status) => {
          setValorantStatus(prev => {
            if (
              prev.running === status.running &&
              prev.inDeathmatch === status.inDeathmatch &&
              prev.isInGame === status.isInGame &&
              prev.state === status.state &&
              prev.player === status.player &&
              prev.queueId === status.queueId
            ) {
              return prev;
            }
            return status;
          });
          if (!isWarmupRef.current) {
            handleStartMatchRef.current();
          }
        });
      }

      if (window.electronAPI.onWarmupState) {
        window.electronAPI.onWarmupState((state) => {
          setIsWarmup(state.active);
          if (state.active) {
            addLog('⏳ Calentamiento en Combate a Muerte detectado. Bajas y muertes pausadas.', 'info');
          } else {
            handleStartMatchRef.current();
          }
        });
      }

      // Request status immediately upon mount
      if (window.electronAPI.getValorantStatus) {
        window.electronAPI.getValorantStatus();
      }

      if (window.electronAPI.onDisplaysInfo) {
        window.electronAPI.onDisplaysInfo((info) => {
          setDisplaysInfo(info);
        });
      }

      if (window.electronAPI.getDisplaysInfo) {
        window.electronAPI.getDisplaysInfo();
      }

      if (window.electronAPI.onOverlayState) {
        window.electronAPI.onOverlayState((state) => {
          setIsOverlayActive(state.enabled);
        });
      }
    }
  }, [addLog]);

  // Sync Always on Top with Compact Mode
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      window.electronAPI.toggleAlwaysOnTop(isCompactMode);
    }
  }, [isCompactMode]);

  // Fallback for Browser Mode (Banco de Pruebas): Poll local dev server for Valorant status
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.electronAPI) {
      let isSubscribed = true;
      const pollBrowser = async () => {
        try {
          const res = await fetch('/api/valorant-status');
          if (res.ok && isSubscribed) {
            const data = await res.json();
            setValorantStatus(prev => {
              if (
                prev.running === data.running &&
                prev.inDeathmatch === data.inDeathmatch &&
                prev.isInGame === data.isInGame &&
                prev.state === data.state &&
                prev.player === data.player &&
                prev.queueId === data.queueId
              ) {
                return prev;
              }
              return data;
            });
          }
        } catch {
          // ignore in standalone static build
        }
      };
      pollBrowser();
      const interval = setInterval(pollBrowser, 2500);
      return () => {
        isSubscribed = false;
        clearInterval(interval);
      };
    }
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // F7: Toggle in-game overlay
      if (e.key === 'F7') {
        e.preventDefault();
        handleToggleOverlay();
        return;
      }

      // Safe hotkeys for Kills: F9, PageUp or Numpad + (F8 is free for Medal.tv!)
      if (e.key === 'F9' || e.key === 'PageUp' || e.code === 'NumpadAdd') {
        e.preventDefault();
        handleAddKill();
        return;
      }

      // Safe hotkeys for Deaths: F10, PageDown or Numpad -
      if (e.key === 'F10' || e.key === 'PageDown' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        handleAddDeath();
        return;
      }

      // Confirm Respawn: F11, End or Numpad Enter
      if (e.key === 'F11' || e.key === 'End' || e.code === 'NumpadEnter') {
        if (currentStage && currentStage.status === 'ready_to_switch') {
          e.preventDefault();
          handleConfirmRespawnSwitch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleAddKill, handleAddDeath, handleConfirmRespawnSwitch, handleUndo, handleToggleOverlay, currentStage]);

  return (
    <div className="min-h-screen bg-[#090e13] text-[#ece8e1] flex flex-col font-sans selection:bg-[#ff4655] selection:text-white">
      
      {/* 3-Second Tactical Toast Notification */}
      {/* In Electron mode, toast renders directly on Pantalla 2 (Valorant). Render here only in browser preview or compact mode */}
      {((typeof window !== 'undefined' && !window.electronAPI) || isCompactMode) && (
        <InGameToastHUD toast={toast} onClose={() => setToast(null)} />
      )}

      {/* 3-Second Gray Killfeed Calibration Box (Top Right) */}
      {typeof window !== 'undefined' && !window.electronAPI && (
        <KillfeedCalibrationBox
          isCalibrating={isCalibrating}
          playerName={valorantStatus.player}
          onClose={() => setIsCalibrating(false)}
        />
      )}

      {/* Top Tactical Header */}
      <Header
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        isCompactMode={isCompactMode}
        setIsCompactMode={setIsCompactMode}
        stats={stats}
        currentTierIndex={currentTierIndex}
        totalTiers={stages.length}
        overwolfStatus={overwolfStatus}
        valorantStatus={valorantStatus}
        isOverlayActive={isOverlayActive}
        onToggleOverlay={handleToggleOverlay}
        displaysInfo={displaysInfo}
        onSwitchDisplay={handleSwitchDisplay}
        isWarmup={isWarmup}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Top Active Combat Hero Card */}
        <ActiveWeaponCard
          currentStage={currentStage}
          nextStage={nextStage}
          onAddKill={handleAddKill}
          onAddDeath={handleAddDeath}
          onConfirmRespawnSwitch={handleConfirmRespawnSwitch}
          onUndo={handleUndo}
          canUndo={undoStack.length > 0}
          currentTierIndex={currentTierIndex}
          totalTiers={stages.length}
        />

        {/* 2-Column Section: Valorant Tracker Weapon List + Sandbox Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Valorant Tracker Weapon List */}
          <div className="lg:col-span-8">
            <WeaponList
              stages={stages}
              currentTierIndex={currentTierIndex}
            />
          </div>

          {/* Sandbox & Live Feed */}
          <div className="lg:col-span-4 h-full">
            <CombatSimulator
              onAddKill={handleAddKill}
              onAddDeath={handleAddDeath}
              onFastForwardStage={handleFastForwardStage}
              onResetRun={() => handleResetRun(false, true)}
              onTestToast={handleTestToast}
              onCalibrateKillfeed={handleCalibrateKillfeed}
              history={history}
              currentStage={currentStage}
              onSimulateOverwolfDeathmatch={() => overwolfService.simulateDeathmatchStart()}
              onSimulateOverwolfKill={() => overwolfService.simulateKill()}
              onSimulateOverwolfDeath={() => overwolfService.simulateDeath()}
              isOverwolfActive={overwolfService.isInDeathmatch}
              isOverlayActive={isOverlayActive}
              onToggleOverlay={handleToggleOverlay}
            />
          </div>

        </div>

        {/* Arsenal Completo - Tablón inferior de todas las armas */}
        <AllWeaponsBoard
          stages={stages}
          currentStage={currentStage}
        />

      </main>

      {/* Compact Mini-HUD Overlay (can be toggled or kept floating) */}
      {isCompactMode && (
        <CompactOverlay
          currentStage={currentStage}
          nextStage={nextStage}
          onAddKill={handleAddKill}
          onAddDeath={handleAddDeath}
          onConfirmRespawnSwitch={handleConfirmRespawnSwitch}
          onCloseCompact={() => setIsCompactMode(false)}
          currentTierIndex={currentTierIndex}
          totalTiers={stages.length}
        />
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={(newConfig) => {
          setConfig(newConfig);
          const cats = WEAPON_CATEGORIES.filter(c => activeCategoryIds.includes(c.id));
          setStages(generateFullRun(cats, newConfig));
          setCurrentTierIndex(0);
          addLog('⚙️ Configuración actualizada y nueva partida generada.', 'info');
        }}
        activeCategories={activeCategoryIds}
        onChangeActiveCategories={(newCats) => {
          setActiveCategoryIds(newCats);
          const cats = WEAPON_CATEGORIES.filter(c => newCats.includes(c.id));
          setStages(generateFullRun(cats, config));
          setCurrentTierIndex(0);
        }}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

    </div>
  );
}
