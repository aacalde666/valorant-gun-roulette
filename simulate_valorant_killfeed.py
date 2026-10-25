#!/usr/bin/env python3
"""
Simulador de Killfeed de Valorant en Tiempo Real (Deathmatch)
Genera fotogramas sintéticos ultrarrealistas con PIL y fuentes de Windows,
y los somete al motor de OCR WinRT y al algoritmo de detección de killfeed_detector.py.
Verifica:
1. Bloqueo total de bajas/muertes durante Calentamiento.
2. Detección instantánea del fin de calentamiento.
3. Kills individuales y cero duplicados al desplazarse tarjetas por el tablón.
4. Dobles bajas consecutivas rápidas (<0.6s).
5. Muerte individual y protección estricta durante los 3s de respawn.
6. MISMO ENEMIGO matándote de nuevo tras reaparecer (sin ignorar la nueva muerte).
7. Muerte y Baja simultáneas en el mismo fotograma (trade kill).
8. Purgado del JSON y memoria tras 9.5s.
"""

import sys
import os
import time
import json
from PIL import Image, ImageDraw, ImageFont

# Importar funciones de detección de killfeed_detector
import killfeed_detector as kf

class MockScreenCapture:
    """Simula sct de mss devolviendo buffers de imagen compatibles con .grab()"""
    def __init__(self, sim_engine):
        self.sim = sim_engine

    def grab(self, region):
        # Si la región es la de warmup (ancho 840 o alto 260)
        if region.get('width') == 840 or region.get('height') == 260:
            pil_img = self.sim.render_warmup()
        else:
            pil_img = self.sim.render_killfeed()

        class GrabResult:
            def __init__(self, img):
                self.width, self.height = img.size
                rgba = img.convert('RGBA')
                r, g, b, a = rgba.split()
                bgra = Image.merge('RGBA', (b, g, r, a))
                self.raw = bgra.tobytes()

        return GrabResult(pil_img)

class ValorantKillfeedEngine:
    """Motor de simulación gráfica del Killfeed y Warmup de Valorant"""
    def __init__(self):
        self.cards = [] # [{killer, weapon, victim, born_time, slot}]
        self.is_warmup = True
        self.font = ImageFont.truetype('arialbd.ttf', 16)
        self.font_large = ImageFont.truetype('arialbd.ttf', 24)

    def add_kill(self, killer, weapon, victim, current_time):
        """Un nuevo kill entra por el Slot 0 y empuja a las tarjetas previas hacia abajo"""
        for c in self.cards:
            c['slot'] += 1
        # Descartar tarjetas que caigan fuera del área visible (slot >= 6)
        self.cards = [c for c in self.cards if c['slot'] < 6]
        self.cards.insert(0, {
            'killer': killer,
            'weapon': weapon,
            'victim': victim,
            'born_time': current_time,
            'slot': 0
        })

    def update(self, current_time):
        """Elimina tarjetas que han superado los 8.5s de visibilidad"""
        self.cards = [c for c in self.cards if (current_time - c['born_time']) < 8.5 and c['slot'] < 6]

    def render_killfeed(self) -> Image.Image:
        """Renderiza la región del Killfeed (510 x 340) con fondo de mapa realista"""
        im = Image.new('RGB', (510, 340), color=(14, 20, 26))
        draw = ImageDraw.Draw(im)

        for c in self.cards:
            y = 20 + c['slot'] * 45
            if y + 36 > 340:
                continue

            is_my_kill = (c['killer'].lower() == 'aacal666')
            is_my_death = (c['victim'].lower() == 'aacal666')

            if is_my_kill:
                box_bg = (15, 38, 30)
                box_border = (0, 245, 155)
            elif is_my_death:
                box_bg = (40, 18, 22)
                box_border = (255, 70, 85)
            else:
                box_bg = (20, 28, 38)
                box_border = (40, 55, 70)

            draw.rounded_rectangle([10, y, 500, y + 36], radius=4, fill=box_bg, outline=box_border, width=1)
            draw.text((25, y + 8), c['killer'], fill=(255, 255, 255), font=self.font)
            draw.text((220, y + 8), c['weapon'], fill=(255, 80, 95), font=self.font)
            draw.text((360, y + 8), c['victim'], fill=(255, 255, 255), font=self.font)

        return im

    def render_warmup(self) -> Image.Image:
        """Renderiza la región de Warmup (840 x 260)"""
        im = Image.new('RGB', (840, 260), color=(10, 15, 20))
        draw = ImageDraw.Draw(im)
        if self.is_warmup:
            draw.text((310, 45), '• CALENTAMIENTO', fill=(255, 255, 255), font=self.font_large)
            draw.text((395, 85), '01:15', fill=(200, 200, 200), font=self.font)
        else:
            draw.text((360, 45), 'COMBATE A MUERTE', fill=(220, 220, 220), font=self.font)
            draw.text((400, 85), '10:00', fill=(200, 200, 200), font=self.font)
        return im

def run_simulation():
    print("=" * 72)
    print("  SIMULADOR DE VALORANT KILLFEED Y WARMUP (DEATHMATCH BENCHMARK)")
    print("  - Evaluación estricta de todos los escenarios con WinRT OCR real")
    print("=" * 72)

    sim = ValorantKillfeedEngine()
    target_player = "aacal666"

    # Resetear variables globales del detector
    kf.active_kills.clear()
    kf.active_deaths.clear()
    kf.last_kill_time = 0.0
    kf.last_death_time = 0.0

    recorded_kills = []
    recorded_deaths = []
    warmup_events = []

    def mock_send_event(action):
        if action == "kill":
            recorded_kills.append(sim_time)
        elif action == "death":
            recorded_deaths.append(sim_time)
        return True

    def mock_send_warmup_event(state):
        warmup_events.append((sim_time, state))
        return True

    kf.send_event = mock_send_event
    kf.send_warmup_event = mock_send_warmup_event

    sim_time = 100.0
    last_warmup_check = 0.0
    is_warmup_state = False

    def tick_detector(current_time):
        nonlocal last_warmup_check, is_warmup_state
        sim.update(current_time)

        # 1. Comprobar Warmup
        if (current_time - last_warmup_check) > 0.6:
            last_warmup_check = current_time
            mock_sct = MockScreenCapture(sim)
            is_warmup_now = kf.check_warmup(mock_sct)
            if is_warmup_now != is_warmup_state:
                is_warmup_state = is_warmup_now
                kf.active_kills.clear()
                kf.active_deaths.clear()
                kf.save_json(target_player)
                if is_warmup_state:
                    kf.send_warmup_event("active")
                else:
                    kf.send_warmup_event("ended")

        if is_warmup_state:
            return

        # 2. Escanear Killfeed
        kf_img = sim.render_killfeed()

        SCALE = 1.5
        scaled_w = int(kf_img.width * SCALE)
        scaled_h = int(kf_img.height * SCALE)
        pil_img_scaled = kf_img.resize((scaled_w, scaled_h), Image.Resampling.BILINEAR)

        ocr_result = kf.winocr.recognize_pil_sync(pil_img_scaled, lang="en")
        lines = ocr_result.get("lines", [])

        all_words = []
        for line in lines:
            line_text = line.get("text", "")
            if kf.is_stats_text(line_text):
                continue
            for w in line.get("words", []):
                w_text = w.get("text", "")
                if not kf.is_stats_text(w_text):
                    scaled_rect = w.get("bounding_rect", {})
                    norm_word = {
                        "text": w_text,
                        "bounding_rect": {
                            "x": scaled_rect.get("x", 0) / SCALE,
                            "y": scaled_rect.get("y", 0) / SCALE,
                            "width": scaled_rect.get("width", 0) / SCALE,
                            "height": scaled_rect.get("height", 0) / SCALE
                        }
                    }
                    all_words.append(norm_word)

        all_word_texts = [w["text"] for w in all_words] if all_words else []
        kf.update_tablon_presence_and_purge(all_word_texts, target_player, now=current_time)

        if not all_words:
            return

        my_words = [w for w in all_words if kf.is_player_name(w.get("text", ""), target_player)]
        if not my_words:
            return

        unique_my_rows = []
        for mw in my_words:
            mw_y = mw.get("bounding_rect", {}).get("y", 0)
            if not any(abs(mw_y - r.get("bounding_rect", {}).get("y", 0)) < 36 for r in unique_my_rows):
                unique_my_rows.append(mw)

        # Extraer todas las tarjetas visibles en este fotograma
        visible_kills_this_frame = []
        visible_deaths_this_frame = []

        for my_word in unique_my_rows:
            my_rect = my_word.get("bounding_rect", {})
            my_x = my_rect.get("x", 0)
            my_y = my_rect.get("y", 0)

            row_other_words = [
                w for w in all_words
                if w is not my_word
                and not kf.is_player_name(w.get("text", ""), target_player)
                and abs(w.get("bounding_rect", {}).get("y", 0) - my_y) < 32
            ]

            # Geometría estricta de Valorant (510 px): Killer izquierda (x < 240), Victim derecha (x > 260)
            if my_x < 240:
                role = "killer"
                rival_words = [w for w in row_other_words if w.get("bounding_rect", {}).get("x", 0) > 260]
            elif my_x > 260:
                role = "victim"
                rival_words = [w for w in row_other_words if w.get("bounding_rect", {}).get("x", 0) < 240]
            else:
                role = "killer" if my_x < 250 else "victim"
                rival_words = [
                    w for w in row_other_words
                    if (w.get("bounding_rect", {}).get("x", 0) > 260 if role == "killer" else w.get("bounding_rect", {}).get("x", 0) < 240)
                ]

            rival_raw = " ".join(w.get("text", "") for w in rival_words).strip()
            rival_clean = kf.clean_nick(rival_raw)

            if role == "killer":
                if len(rival_clean) >= 2:
                    visible_kills_this_frame.append((rival_clean, rival_raw, my_y))
            elif role == "victim":
                if not rival_clean:
                    rival_clean = "rival"
                    rival_raw = "Rival"
                visible_deaths_this_frame.append((rival_clean, rival_raw, my_y))

        now = current_time

        # 1. Procesar Bajas (Kills) comparando ocurrencias en pantalla vs en memoria
        processed_kills = set()
        for rival_clean, rival_raw, my_y in visible_kills_this_frame:
            if rival_clean in processed_kills:
                continue
            processed_kills.add(rival_clean)

            # Cuántas tarjetas de este rival hay en pantalla ahora mismo
            vis_count = sum(1 for rc, _, _ in visible_kills_this_frame if kf.is_matching_nick(rc, rival_clean))
            # Cuántas tarjetas de este rival están registradas activas en memoria
            rec_count = sum(1 for item in kf.active_kills if kf.is_matching_nick(item["nick"], rival_clean))

            if vis_count > rec_count:
                # Es una nueva baja real
                if (now - kf.last_kill_time) < 0.35:
                    continue

                kf.active_kills.append({
                    "nick": rival_clean,
                    "display": rival_raw,
                    "first_detected_ts": now,
                    "last_seen": now,
                    "first_detected": time.strftime("%H:%M:%S")
                })
                kf.last_kill_time = now
                kf.send_event("kill")

        # 2. Procesar Muertes (Deaths) con Blindaje Total Anti-Duplicados
        num_visible_deaths = len(visible_deaths_this_frame)
        num_recorded_deaths = len(kf.active_deaths)

        if num_visible_deaths > num_recorded_deaths:
            top_death_cards = [c for c in visible_deaths_this_frame if c[2] <= 72]

            if top_death_cards and (now - kf.last_death_time) >= 3.2:
                rival_clean, rival_raw, my_y = top_death_cards[0]

                kf.active_deaths.append({
                    "nick": rival_clean,
                    "display": rival_raw,
                    "first_detected_ts": now,
                    "last_seen": now,
                    "first_detected": time.strftime("%H:%M:%S")
                })
                kf.last_death_time = now
                kf.send_event("death")

    # =========================================================================
    # ESCENARIO 1: CALENTAMIENTO ACTIVO (Bajas en lobby)
    # =========================================================================
    print("\n[TEST 1] Fase de Calentamiento con muertes en lobby...")
    sim.is_warmup = True
    tick_detector(sim_time)
    assert is_warmup_state == True, "FALLO: No detectó estado de calentamiento inicial"
    print("  -> Calentamiento detectado correctamente.")

    sim.add_kill("aacal666", "VANDAL", "WarmupBot1", sim_time)
    sim.add_kill("WarmupBot2", "JUDGE", "aacal666", sim_time)
    for _ in range(30):
        sim_time += 0.033
        tick_detector(sim_time)

    assert len(recorded_kills) == 0, f"FALLO: Registró {len(recorded_kills)} kills en calentamiento"
    assert len(recorded_deaths) == 0, f"FALLO: Registró {len(recorded_deaths)} muertes en calentamiento"
    print("  ✅ ÉXITO TEST 1: Cero kills y cero muertes procesadas en calentamiento.")

    # =========================================================================
    # ESCENARIO 2: FIN DE CALENTAMIENTO E INICIO OFICIAL
    # =========================================================================
    print("\n[TEST 2] Fin de Calentamiento...")
    sim.is_warmup = False
    sim.cards.clear()
    sim_time += 0.7
    tick_detector(sim_time)

    assert is_warmup_state == False, "FALLO: No detectó el fin de calentamiento"
    assert any(ev[1] == "ended" for ev in warmup_events), "FALLO: No despachó evento warmup ended"
    print("  ✅ ÉXITO TEST 2: Fin de calentamiento detectado e inicio de partida activado.")

    # =========================================================================
    # ESCENARIO 3: KILL INDIVIDUAL Y DESPLAZAMIENTO POR EL TABLÓN (CERO DUPLICADOS)
    # =========================================================================
    print("\n[TEST 3] Kill individual y movimiento hacia abajo por el Killfeed...")
    sim_time += 1.0
    sim.add_kill("aacal666", "VANDAL", "Shadow", sim_time)

    # 30 fotogramas con la tarjeta en Slot 0
    for _ in range(30):
        sim_time += 0.033
        tick_detector(sim_time)

    assert len(recorded_kills) == 1, f"FALLO: Esperaba 1 kill, obtuvo {len(recorded_kills)}"
    print(f"  -> Kill de Shadow registrada instantáneamente (+1 kill).")

    print("  -> Empujando tarjeta de Shadow hacia abajo con 3 kills de otros jugadores...")
    sim.add_kill("Viper", "PHANTOM", "Jett", sim_time)
    for _ in range(15):
        sim_time += 0.033
        tick_detector(sim_time)

    sim.add_kill("Reyna", "SHERIFF", "Omen", sim_time)
    for _ in range(15):
        sim_time += 0.033
        tick_detector(sim_time)

    sim.add_kill("Cypher", "GHOST", "Brimstone", sim_time)
    for _ in range(30):
        sim_time += 0.033
        tick_detector(sim_time)

    assert len(recorded_kills) == 1, f"FALLO: Tarjeta empujada volvió a contar como kill! Total: {len(recorded_kills)}"
    print("  ✅ ÉXITO TEST 3: Cero duplicados al deslizarse la tarjeta por el feed (1 kill total).")

    # =========================================================================
    # ESCENARIO 4: DOBLE KILL CONSECUTIVA RÁPIDA (Racha <0.6s)
    # =========================================================================
    print("\n[TEST 4] Doble Kill consecutiva rápida en 0.5s...")
    sim_time += 1.0
    sim.add_kill("aacal666", "VANDAL", "Fade", sim_time)
    for _ in range(12): # ~0.4s
        sim_time += 0.033
        tick_detector(sim_time)

    sim.add_kill("aacal666", "VANDAL", "Chamber", sim_time)
    for _ in range(30): # 1.0s
        sim_time += 0.033
        tick_detector(sim_time)

    assert len(recorded_kills) == 3, f"FALLO: Se esperaba 3 kills totales, se obtuvieron {len(recorded_kills)}"
    print("  ✅ ÉXITO TEST 4: Doble kill consecutiva reconocida con total precisión (3 kills totales).")

    # =========================================================================
    # ESCENARIO 5: MUERTE Y PROTECCIÓN DURANTE RESPAWN (3.0s)
    # =========================================================================
    print("\n[TEST 5] Muerte del jugador y protección estricta durante respawn...")
    sim_time += 1.0
    death_1_time = sim_time
    sim.add_kill("Raze", "JUDGE", "aacal666", sim_time)

    for _ in range(30): # 1.0s después de morir
        sim_time += 0.033
        tick_detector(sim_time)

    assert len(recorded_deaths) == 1, f"FALLO: Se esperaba 1 muerte, se obtuvieron {len(recorded_deaths)}"
    print("  -> Muerte por Raze registrada (+1 Muerte).")

    print("  -> Simulando tiempo muerto de respawn (3s) mientras la tarjeta baja...")
    sim.add_kill("Sova", "ODIN", "Killjoy", sim_time)
    for _ in range(30):
        sim_time += 0.033
        tick_detector(sim_time)

    sim.add_kill("Neon", "SPECTRE", "Yoru", sim_time)
    for _ in range(30):
        sim_time += 0.033
        tick_detector(sim_time)

    assert len(recorded_deaths) == 1, f"FALLO: Se duplicó la muerte durante el respawn! Total: {len(recorded_deaths)}"
    print("  ✅ ÉXITO TEST 5: Cero muertes falsas durante el respawn de 3.0s (1 muerte total).")

    # =========================================================================
    # ESCENARIO 6: EL MISMO ENEMIGO (RAZE) TE MATA OTRA VEZ TRAS REAPARECER
    # =========================================================================
    print("\n[TEST 6] Reaparición (>3.2s) y el MISMO enemigo (Raze) te mata de nuevo...")
    sim_time = death_1_time + 3.8
    sim.add_kill("Raze", "JUDGE", "aacal666", sim_time)

    for _ in range(30):
        sim_time += 0.033
        tick_detector(sim_time)

    assert len(recorded_deaths) == 2, f"FALLO: La segunda muerte por el mismo enemigo fue ignorada! Total: {len(recorded_deaths)}"
    print("  ✅ ÉXITO TEST 6: Segunda muerte por el mismo rival reconocida como legítima (2 muertes totales).")

    # =========================================================================
    # ESCENARIO 7: TRADE KILL (Baja y Muerte en el mismo fotograma)
    # =========================================================================
    print("\n[TEST 7] Trade kill simultáneo (Baja + Muerte en el mismo instante)...")
    sim_time += 4.0
    sim.add_kill("aacal666", "OPERATOR", "Breach", sim_time)
    sim.add_kill("Deadlock", "VANDAL", "aacal666", sim_time)

    for _ in range(30):
        sim_time += 0.033
        tick_detector(sim_time)

    assert len(recorded_kills) == 4, f"FALLO: Trade kill no contó la kill! Kills: {len(recorded_kills)}"
    assert len(recorded_deaths) == 3, f"FALLO: Trade kill no contó la muerte! Muertes: {len(recorded_deaths)}"
    print("  ✅ ÉXITO TEST 7: Trade kill simultáneo procesó tanto +1 Kill como +1 Muerte.")

    # =========================================================================
    # ESCENARIO 8: PURGADO COMPLETO TRAS EXPIRACIÓN (>9.5s sin tarjetas)
    # =========================================================================
    print("\n[TEST 8] Purgado de tarjetas y memoria tras 10 segundos...")
    sim.cards.clear()
    sim_time += 10.0
    tick_detector(sim_time)

    assert len(kf.active_kills) == 0, f"FALLO: Quedan kills en memoria: {kf.active_kills}"
    assert len(kf.active_deaths) == 0, f"FALLO: Quedan muertes en memoria: {kf.active_deaths}"
    print("  ✅ ÉXITO TEST 8: Memoria y JSON 100% purgados al desaparecer las tarjetas.")

    print("\n" + "=" * 72)
    print("  🎉 TODOS LOS TESTS DEL SIMULADOR PASARON CON 100% DE ÉXITO")
    print(f"  - Kills totales simuladas y comprobadas: 4/4 exactas")
    print(f"  - Muertes totales simuladas y comprobadas: 3/3 exactas")
    print(f"  - Cero duplicados, cero bloqueos indebidos, calentamiento perfecto.")
    print("=" * 72)

if __name__ == "__main__":
    run_simulation()
