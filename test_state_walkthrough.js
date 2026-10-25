import assert from 'assert';
import { WEAPON_CATEGORIES, generateFullRun } from './src/data/weaponsData.js';

console.log("=================================================================");
console.log("🛠️ RECORRIDO EXHAUSTIVO DE ESTADO (WALKTHROUGH: LIVES & KILLS)");
console.log("=================================================================\n");

// Mock soundFX
const soundFX = {
  playKill: () => {},
  playDeath: () => {},
  playObjectiveComplete: () => {},
  playDemote: () => {},
  playVictory: () => {}
};

// Simulation Environment reproducing App.jsx logic
function createTestApp() {
  const activeCategoryIds = ['sidearms', 'smgs', 'shotguns', 'rifles', 'snipers', 'heavy'];
  const config = { minKills: 3, maxKills: 3, minDeaths: 3, maxDeaths: 3 };
  const cats = WEAPON_CATEGORIES.filter(c => activeCategoryIds.includes(c.id));
  
  let stages = generateFullRun(cats, config);
  // Force 3 kills and 3 lives for deterministic test
  stages[0].targetKills = 3;
  stages[0].maxAllowedDeaths = 3;
  
  let currentTierIndex = 0;
  let stats = { completedRuns: 0, totalKills: 0, totalDeaths: 0, demotions: 0 };
  let isWarmup = false;
  let lastToast = null;
  let logs = [];

  const stagesRef = { current: stages };
  const currentTierIndexRef = { current: currentTierIndex };
  const statsRef = { current: stats };
  const isWarmupRef = { current: isWarmup };

  const triggerToast = (payload) => {
    lastToast = { ...payload };
  };

  const addLog = (text, type) => {
    logs.push({ text, type });
  };

  const handleAddKill = () => {
    if (isWarmupRef.current) return;
    const currentStages = stagesRef.current;
    const tierIdx = currentTierIndexRef.current;
    const stage = currentStages[tierIdx];
    if (!stage || stage.status === 'ready_to_switch') return;

    const newKills = stage.currentKills + 1;
    const isTargetMet = newKills >= stage.targetKills;
    const currentDeaths = stage.currentDeaths; // strictly preserved!

    const copy = [...stagesRef.current];
    copy[tierIdx] = {
      ...stage,
      currentKills: newKills,
      currentDeaths: currentDeaths,
      status: isTargetMet ? 'ready_to_switch' : 'active'
    };
    stagesRef.current = copy;
    stages = copy;

    statsRef.current = { ...statsRef.current, totalKills: statsRef.current.totalKills + 1 };

    if (isTargetMet) {
      triggerToast({
        type: 'ready_to_switch',
        currentKills: newKills,
        targetKills: stage.targetKills,
        currentDeaths: currentDeaths,
        maxAllowedDeaths: stage.maxAllowedDeaths
      });
    } else {
      triggerToast({
        type: 'kill',
        currentKills: newKills,
        targetKills: stage.targetKills,
        currentDeaths: currentDeaths,
        maxAllowedDeaths: stage.maxAllowedDeaths
      });
    }
  };

  const handleAddDeath = () => {
    if (isWarmupRef.current) return;
    const currentStages = stagesRef.current;
    const tierIdx = currentTierIndexRef.current;
    const stage = currentStages[tierIdx];
    if (!stage) return;

    if (stage.status === 'ready_to_switch') {
      // Transition Death: switch weapon
      handleConfirmRespawnSwitch();
      return;
    }

    const newDeaths = stage.currentDeaths + 1;
    statsRef.current = { ...statsRef.current, totalDeaths: statsRef.current.totalDeaths + 1 };

    if (newDeaths >= stage.maxAllowedDeaths) {
      if (tierIdx > 0) {
        // Demote
      } else {
        // Pistol swap to different pistol
        const sidearmsCategory = WEAPON_CATEGORIES.find(c => c.id === 'sidearms') || WEAPON_CATEGORIES[0];
        const otherPistols = sidearmsCategory.weapons.filter(w => w.id !== stage.weapon.id);
        const nextPistol = otherPistols.length > 0
          ? otherPistols[Math.floor(Math.random() * otherPistols.length)]
          : sidearmsCategory.weapons[0];

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

        const copy = [...stagesRef.current];
        copy[0] = newTier0Stage;
        stagesRef.current = copy;
        stages = copy;

        triggerToast({
          type: 'demote',
          weapon: nextPistol,
          currentKills: 0,
          targetKills: newTargetKills,
          currentDeaths: 0,
          maxAllowedDeaths: 3
        });
      }
    } else {
      // Died, lives remain
      const copy = [...stagesRef.current];
      copy[tierIdx] = {
        ...copy[tierIdx],
        currentKills: 0,
        currentDeaths: newDeaths
      };
      stagesRef.current = copy;
      stages = copy;
      triggerToast({
        type: 'death',
        currentKills: 0,
        currentDeaths: newDeaths,
        maxAllowedDeaths: stage.maxAllowedDeaths
      });
    }
  };

  const handleConfirmRespawnSwitch = () => {
    const currentStages = stagesRef.current;
    const tierIdx = currentTierIndexRef.current;
    const nextIndex = tierIdx + 1;

    const copy = [...stagesRef.current];
    copy[tierIdx] = { ...copy[tierIdx], status: 'completed' };
    copy[nextIndex] = { ...copy[nextIndex], status: 'active', currentKills: 0, currentDeaths: 0 };
    stagesRef.current = copy;
    stages = copy;
    currentTierIndexRef.current = nextIndex;
    currentTierIndex = nextIndex;

    triggerToast({
      type: 'switch',
      currentKills: 0,
      currentDeaths: 0,
      maxAllowedDeaths: copy[nextIndex].maxAllowedDeaths
    });
  };

  return {
    getStage: () => stagesRef.current[currentTierIndexRef.current],
    getLastToast: () => lastToast,
    getStats: () => statsRef.current,
    handleAddKill,
    handleAddDeath,
    handleConfirmRespawnSwitch
  };
}

const app = createTestApp();

// PASO 0: Estado Inicial
let s = app.getStage();
console.log(`[Paso 0 - Inicio] Arma: ${s.weapon.name} | Kills: ${s.currentKills}/${s.targetKills} | Muertes: ${s.currentDeaths}/${s.maxAllowedDeaths} (Vidas restantes: ${s.maxAllowedDeaths - s.currentDeaths})`);
assert.strictEqual(s.currentKills, 0, "Kills deben iniciar en 0");
assert.strictEqual(s.currentDeaths, 0, "Muertes deben iniciar en 0");

// PASO 1: Jugador muere (Death 1)
console.log("\n⚡ EVENTO: El rival elimina a aacal666 (+1 Muerte)");
app.handleAddDeath();
s = app.getStage();
let t = app.getLastToast();
console.log(`[Paso 1 - Tras Muerte 1] Kills: ${s.currentKills}/${s.targetKills} | Muertes: ${s.currentDeaths}/${s.maxAllowedDeaths} (Vidas: ${s.maxAllowedDeaths - s.currentDeaths})`);
console.log(`                       HUD Toast: type=${t.type}, kills=${t.currentKills}, deaths=${t.currentDeaths}, vidasRestantes=${t.maxAllowedDeaths - t.currentDeaths}`);
assert.strictEqual(s.currentDeaths, 1, "Debe tener 1 muerte sufrida");
assert.strictEqual(t.currentDeaths, 1, "Toast HUD debe reportar 1 muerte");
assert.strictEqual(t.maxAllowedDeaths - t.currentDeaths, 2, "Toast HUD debe reportar 2 vidas restantes");

// PASO 2: Jugador elimina a un rival (+1 Kill) -> CRÍTICO: NO DEBE REINICIAR LAS VIDAS
console.log("\n⚡ EVENTO: aacal666 elimina a Reyna (+1 Kill) [COMPROBACIÓN CRÍTICA]");
app.handleAddKill();
s = app.getStage();
t = app.getLastToast();
console.log(`[Paso 2 - Tras Kill 1] Kills: ${s.currentKills}/${s.targetKills} | Muertes: ${s.currentDeaths}/${s.maxAllowedDeaths} (Vidas: ${s.maxAllowedDeaths - s.currentDeaths})`);
console.log(`                     HUD Toast: type=${t.type}, kills=${t.currentKills}, deaths=${t.currentDeaths}, vidasRestantes=${t.maxAllowedDeaths - t.currentDeaths}`);
assert.strictEqual(s.currentKills, 1, "Kills deben subir a 1");
assert.strictEqual(s.currentDeaths, 1, "¡ESTRICTO! Las muertes deben permanecer en 1 (NO resetear a 0)");
assert.strictEqual(t.currentDeaths, 1, "Toast HUD debe conservar 1 muerte consumida");
assert.strictEqual(t.maxAllowedDeaths - t.currentDeaths, 2, "Toast HUD debe mostrar 2 vidas restantes (NO 3)");

// PASO 3: Jugador elimina a otro rival en rápida sucesión (+1 Kill) -> Debe subir a 2
console.log("\n⚡ EVENTO: aacal666 elimina a Jett en racha rápida (+1 Kill)");
app.handleAddKill();
s = app.getStage();
t = app.getLastToast();
console.log(`[Paso 3 - Tras Kill 2] Kills: ${s.currentKills}/${s.targetKills} | Muertes: ${s.currentDeaths}/${s.maxAllowedDeaths} (Vidas: ${s.maxAllowedDeaths - s.currentDeaths})`);
console.log(`                     HUD Toast: type=${t.type}, kills=${t.currentKills}, deaths=${t.currentDeaths}, vidasRestantes=${t.maxAllowedDeaths - t.currentDeaths}`);
assert.strictEqual(s.currentKills, 2, "Kills deben subir a 2 sin trabarse");
assert.strictEqual(s.currentDeaths, 1, "Muertes deben seguir en 1");
assert.strictEqual(t.maxAllowedDeaths - t.currentDeaths, 2, "Vidas siguen en 2");

// PASO 4: Jugador muere (Death 2) -> Racha se pierde a 0, muertes suben a 2
console.log("\n⚡ EVENTO: Omen elimina a aacal666 (+1 Muerte)");
app.handleAddDeath();
s = app.getStage();
t = app.getLastToast();
console.log(`[Paso 4 - Tras Muerte 2] Kills: ${s.currentKills}/${s.targetKills} | Muertes: ${s.currentDeaths}/${s.maxAllowedDeaths} (Vidas: ${s.maxAllowedDeaths - s.currentDeaths})`);
console.log(`                       HUD Toast: type=${t.type}, kills=${t.currentKills}, deaths=${t.currentDeaths}, vidasRestantes=${t.maxAllowedDeaths - t.currentDeaths}`);
assert.strictEqual(s.currentKills, 0, "Racha de kills vuelve a 0 tras morir");
assert.strictEqual(s.currentDeaths, 2, "Muertes suben a 2");
assert.strictEqual(t.maxAllowedDeaths - t.currentDeaths, 1, "Queda 1 vida de margen");

// PASO 5: Kill 1 de la nueva racha
console.log("\n⚡ EVENTO: aacal666 elimina a Sova (+1 Kill)");
app.handleAddKill();
s = app.getStage();
t = app.getLastToast();
console.log(`[Paso 5 - Tras Kill 1] Kills: ${s.currentKills}/${s.targetKills} | Muertes: ${s.currentDeaths}/${s.maxAllowedDeaths} (Vidas: ${s.maxAllowedDeaths - s.currentDeaths})`);
assert.strictEqual(s.currentKills, 1, "Kills = 1");
assert.strictEqual(s.currentDeaths, 2, "Muertes siguen en 2 (1 vida restante)");
assert.strictEqual(t.maxAllowedDeaths - t.currentDeaths, 1, "Toast HUD muestra 1 vida restante");

// PASO 6: Kill 2 de la nueva racha
console.log("\n⚡ EVENTO: aacal666 elimina a Chamber (+1 Kill)");
app.handleAddKill();
s = app.getStage();
console.log(`[Paso 6 - Tras Kill 2] Kills: ${s.currentKills}/${s.targetKills} | Muertes: ${s.currentDeaths}/${s.maxAllowedDeaths} (Vidas: ${s.maxAllowedDeaths - s.currentDeaths})`);
assert.strictEqual(s.currentKills, 2, "Kills = 2");
assert.strictEqual(s.currentDeaths, 2, "Muertes siguen en 2");

// PASO 7: Kill 3 (¡Meta Alcanzada!)
console.log("\n⚡ EVENTO: aacal666 elimina a Fade (+1 Kill) -> ¡OBJETIVO ALCANZADO!");
app.handleAddKill();
s = app.getStage();
t = app.getLastToast();
console.log(`[Paso 7 - Racha Completa] Kills: ${s.currentKills}/${s.targetKills} | Status: ${s.status} | Muertes: ${s.currentDeaths}`);
assert.strictEqual(s.currentKills, 3, "Kills = 3/3");
assert.strictEqual(s.status, 'ready_to_switch', "Status = ready_to_switch");
assert.strictEqual(t.type, 'ready_to_switch', "Toast es ready_to_switch");

// PASO 8: Muerte de Transición en Combate a Muerte (Equipa siguiente arma sin penalizar)
console.log("\n⚡ EVENTO: Muerte de transición en Combate a Muerte (Sin penalizar)");
app.handleAddDeath();
s = app.getStage();
t = app.getLastToast();
console.log(`[Paso 8 - Nueva Arma] Siguiente Arma: ${s.weapon.name} | Kills: ${s.currentKills}/${s.targetKills} | Muertes: ${s.currentDeaths}/${s.maxAllowedDeaths}`);
assert.strictEqual(s.currentKills, 0, "Nueva arma empieza con 0 kills");
assert.strictEqual(s.currentDeaths, 0, "Nueva arma empieza con vidas restauradas (0 muertes)");
assert.strictEqual(t.type, 'switch', "Toast es switch de arma");

// PASO 9: Comprobación de Fallo en Ronda de Pistolas (Agotar vidas en Tier 0)
console.log("\n=================================================================");
console.log("🔫 TEST ESPECÍFICO: AGOTAR VIDAS EN TIER 0 (ROTACIÓN DE PISTOLA)");
console.log("=================================================================");
const appPistols = createTestApp();
const initialPistol = appPistols.getStage().weapon.name;
console.log(`Pistola inicial: ${initialPistol} (Vidas permitidas: 3)`);

console.log("-> Muerte 1 en pistolas...");
appPistols.handleAddDeath();
assert.strictEqual(appPistols.getStage().currentDeaths, 1);

console.log("-> Muerte 2 en pistolas...");
appPistols.handleAddDeath();
assert.strictEqual(appPistols.getStage().currentDeaths, 2);

console.log("-> Muerte 3 en pistolas (¡Vidas agotadas!)...");
appPistols.handleAddDeath();
const postDemoteStage = appPistols.getStage();
const newPistol = postDemoteStage.weapon.name;
const postToast = appPistols.getLastToast();

console.log(`[Tras Agotar Vidas] Nueva Pistola asignada: ${newPistol} | Meta: ${postDemoteStage.targetKills} kills | Muertes: ${postDemoteStage.currentDeaths}/3`);
console.log(`                   HUD Toast: type=${postToast.type}, weapon=${postToast.weapon.name}, meta=${postToast.targetKills}`);

assert.notStrictEqual(newPistol, initialPistol, "La pistola DEBE cambiar a una pistola diferente");
assert.strictEqual(postDemoteStage.currentDeaths, 0, "Las vidas se restauran a 3 (0 muertes)");
assert.strictEqual(postDemoteStage.currentKills, 0, "La racha de bajas empieza en 0 con la nueva pistola");
assert.strictEqual(postToast.type, 'demote', "El toast notifica el cambio por demote");
assert.strictEqual(postToast.weapon.name, newPistol, "El toast muestra el nombre de la nueva pistola");

console.log("\n=================================================================");
console.log("✅ ¡TODAS LAS COMPROBACIONES PASARON AL 100%! CERO ERRORES.");
console.log("   - Las vidas jamás se reinician al matar.");
console.log("   - Las bajas suben consecutivamente 1 -> 2 -> 3 sin trabarse.");
console.log("   - Al agotar vidas en pistolas, ROTA obligatoriamente a otra pistola.");
console.log("   - El Toast HUD y la App muestran exactamente los mismos valores.");
console.log("=================================================================");
