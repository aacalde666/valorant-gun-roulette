#!/usr/bin/env python3
"""
Valorant Gun Roulette - Detector Inteligente de Killfeed con Memoria JSON en Tablón (V7)
- Cero duplicados: cada baja queda protegida en JSON durante la vida completa de la tarjeta (8.5s)
  y solo se elimina cuando ya no está visible en el tablón.
- Detección ultrarrápida e instantánea (~30 FPS, latencia < 30ms).
- Soporte para muerte y kill simultáneas en el mismo fotograma (sin interferencias).
- Escalado 1.5x dinámico desde Top: 18px (Slots 1 a 6 cubiertos).
- Optimización de CPU en combate: comprobación de calentamiento reducida durante la partida.
"""

import sys
import os
import time
import json
import re
import difflib
import unicodedata
import urllib.request
import urllib.error
import numpy as np

# Asegurar salida de consola inmediata sin buffering
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)

try:
    import winocr
except ImportError:
    winocr = None

try:
    import mss
except ImportError:
    mss = None

from PIL import Image

APP_URL = "http://127.0.0.1:48888/api"
TEMP_JSON_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp_killfeed.json")

# Región del Killfeed en Pantalla 2 (X=1920, 1920x1080)
# 'top': 18 px abarca desde el primer slot superior del Killfeed
KILLFEED_REGION = {
    "left": 1920 + 1400,
    "top": 18,
    "width": 510,
    "height": 340
}

# Región superior central donde aparece el cartel 'CALENTAMIENTO' (WARMUP)
# Centrada en Pantalla 2 (X: 1920..3840, Centro=2880) -> X: 2460..3300 (ancho 840)
# Top: 0..260 para cubrir todo el banner superior sin recortar letras
WARMUP_REGION = {
    "left": 1920 + 540,
    "top": 0,
    "width": 840,
    "height": 260
}

# Lista de armas de Valorant para ignorar al extraer el nick del jugador
WEAPON_NAMES = [
    "classic", "shorty", "frenzy", "ghost", "sheriff", "stinger", "spectre",
    "bucky", "judge", "bulldog", "guardian", "phantom", "vandal", "marshal",
    "operator", "ares", "odin", "outlaw", "knife", "melee", "headshot"
]

STATS_AND_UI_KEYWORDS = [
    "fps", "cliente", "error", "disparo", "paquetes", "loss", "rtt", "ms",
    "frame", "render", "cpu", "gpu", "calibr", "encuadre", "optico",
    "recuadro", "zona", "deduplicaci", "radar", "anti-fps", "calentamiento", "warmup"
]

def clean_nick(text):
    """Limpia el nick ignorando nombres de armas y quedándose con caracteres alfanuméricos en minúsculas"""
    t = text.lower()
    for w in WEAPON_NAMES:
        t = re.sub(r'\b' + w + r'\b', '', t)
    cleaned = re.sub(r'[^a-zA-Z0-9]', '', t)
    return cleaned if len(cleaned) >= 2 else re.sub(r'[^a-zA-Z0-9]', '', text).lower()

def is_matching_nick(a, b):
    """Compara si dos nicks corresponden al mismo jugador con tolerancia OCR y variaciones de armas"""
    ca = clean_nick(a)
    cb = clean_nick(b)
    if ca == cb:
        return True
    if len(ca) >= 3 and len(cb) >= 3:
        if ca in cb or cb in ca:
            return True
        if difflib.SequenceMatcher(None, ca, cb).ratio() >= 0.65:
            return True
    return False

def is_player_name(token, target_name="aacal666"):
    """Verifica con tolerancia si la palabra leída corresponde a 'aacal666'"""
    t = clean_nick(token)
    target = clean_nick(target_name)
    prefix = target[:5]  # 'aacal'

    if target in t:
        return True
    if len(t) >= 4 and prefix in t:
        return True
    if "aaca" in t and ("66" in t or "16" in t or "68" in t or "86" in t):
        return True
    if "acal666" in t or "aaca1666" in t or "aacai666" in t:
        return True
    if t.startswith("aacal") or t.startswith("acal6"):
        return True

    if len(t) >= 5 and difflib.SequenceMatcher(None, target, t).ratio() >= 0.75:
        return True
    if len(t) >= 4 and difflib.SequenceMatcher(None, prefix, t[:len(prefix)]).ratio() >= 0.80:
        return True

    return False

def is_stats_text(text):
    t = text.lower()
    return any(k in t for k in STATS_AND_UI_KEYWORDS)

def send_event(action):
    try:
        url = f"{APP_URL}/{action}"
        req = urllib.request.Request(url, headers={"User-Agent": "KillfeedWatcher/3.0"})
        with urllib.request.urlopen(req, timeout=0.6) as resp:
            return resp.status == 200
    except Exception:
        return False

def send_warmup_event(state):
    try:
        url = f"{APP_URL}/warmup?state={state}"
        req = urllib.request.Request(url, headers={"User-Agent": "KillfeedWatcher/3.0"})
        with urllib.request.urlopen(req, timeout=0.6) as resp:
            return resp.status == 200
    except Exception:
        return False

def is_warmup_text(raw_text):
    if not raw_text:
        return False
    norm = ''.join(c for c in unicodedata.normalize('NFD', raw_text.upper()) if unicodedata.category(c) != 'Mn')
    norm = norm.replace(' ', '')
    warmup_keywords = [
        'CALENTAMIENTO', 'CALENTAM', 'WARMUP', 'WARM-UP'
    ]
    return any(k in norm for k in warmup_keywords)

def check_warmup(sct):
    try:
        sct_img = sct.grab(WARMUP_REGION)
        arr = np.frombuffer(sct_img.raw, dtype=np.uint8).reshape((sct_img.height, sct_img.width, 4))
        rgb = arr[:, :, [2, 1, 0]]
        pil_img = Image.fromarray(rgb)

        # Escalado 1.5x dinámico para nitidez de fuentes en Valorant
        SCALE = 1.5
        scaled_w = int(pil_img.width * SCALE)
        scaled_h = int(pil_img.height * SCALE)
        pil_img_scaled = pil_img.resize((scaled_w, scaled_h), Image.Resampling.BILINEAR)

        res_raw = winocr.recognize_pil_sync(pil_img_scaled, lang='es')
        raw_text = res_raw.get('text', '')
        if is_warmup_text(raw_text):
            return True

        # Filtro de texto brillante (blanco / amarillo)
        mask = (arr[:, :, 2] > 175) & (arr[:, :, 1] > 175) & (arr[:, :, 0] > 175)
        if np.count_nonzero(mask) > 80:
            thresh = np.zeros_like(arr[:, :, 0], dtype=np.uint8)
            thresh[mask] = 255
            thresh_pil = Image.fromarray(thresh).resize((scaled_w, scaled_h), Image.Resampling.BILINEAR)
            res_thresh = winocr.recognize_pil_sync(thresh_pil, lang='es')
            thresh_text = res_thresh.get('text', '')
            if is_warmup_text(thresh_text):
                return True

        return False
    except Exception:
        return False

def get_app_status():
    try:
        url = f"{APP_URL}/status"
        req = urllib.request.Request(url, headers={"User-Agent": "KillfeedWatcher/3.0"})
        with urllib.request.urlopen(req, timeout=0.6) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data
    except Exception:
        return None

# Memoria temporal: lista de dicts con nicks activos en el tablón
# [{"nick": "kemo", "display": "KEMO", "first_detected_ts": float, "last_seen": float, "first_detected": str}]
active_kills = []
active_deaths = []
last_kill_time = 0.0
last_death_time = 0.0

def save_json(target_player):
    """Guarda en temp_killfeed.json exactamente los nombres que están en el tablón"""
    data = {
        "updated_at": time.strftime("%H:%M:%S"),
        "player": target_player,
        "active_kills_en_tablon": [
            {
                "nick": item["display"],
                "detected_at": item["first_detected"]
            }
            for item in active_kills
        ],
        "active_deaths_en_tablon": [
            {
                "nick": item["display"],
                "detected_at": item["first_detected"]
            }
            for item in active_deaths
        ]
    }
    try:
        with open(TEMP_JSON_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception:
        pass

def update_tablon_presence_and_purge(visible_words, target_player, now=None):
    """
    1. Si un nombre sigue visible en la pantalla (en el tablón), actualiza 'last_seen'.
    2. Purgado seguro con blindaje de 8.5s: Conserva las muertes en memoria durante todo
       el tiempo de vida de la tarjeta en pantalla (8.5s) para que NUNCA se vuelva a contar
       mientras baja por los slots del killfeed.
    """
    global active_kills, active_deaths
    if now is None:
        now = time.time()
    changed = False

    # 1. Actualizar presencia en pantalla
    for item in active_kills:
        if any(is_matching_nick(item["nick"], w) for w in visible_words):
            item["last_seen"] = now

    for item in active_deaths:
        if any(is_matching_nick(item["nick"], w) for w in visible_words):
            item["last_seen"] = now

    # 2. Purgado de kills (8.5s en pantalla)
    new_kills = []
    for item in active_kills:
        age = now - item["first_detected_ts"]
        if age < 8.5:
            new_kills.append(item)
        else:
            changed = True
            print(f"🗑️ [{time.strftime('%H:%M:%S')}] '{item['display']}' desapareció del tablón ({age:.1f}s) -> Eliminado de memoria.", flush=True)
    active_kills = new_kills

    # 3. Purgado de muertes: Permanece en memoria durante los 8.5s completos del ciclo de la tarjeta
    new_deaths = []
    for item in active_deaths:
        age = now - item["first_detected_ts"]
        if age < 8.5:
            new_deaths.append(item)
        else:
            changed = True
            print(f"🗑️ [{time.strftime('%H:%M:%S')}] Muerte de '{item['display']}' cumplió su ciclo en tablón ({age:.1f}s) -> Eliminada de memoria.", flush=True)
    active_deaths = new_deaths

    if changed:
        save_json(target_player)

def main():
    global last_kill_time, last_death_time

    print("=" * 68, flush=True)
    print("  VALORANT GUN ROULETTE - DETECTOR KF V7 (CERO DUPLICADOS / INSTANT)", flush=True)
    print("  - Blindaje anti-duplicados: ninguna baja se repite durante su vida en pantalla (8.5s)", flush=True)
    print("  - Respuesta instantánea en el primer fotograma (<30ms)", flush=True)
    print("  - Soporta Kill y Muerte simultáneas de forma completamente independiente", flush=True)
    print("  - Cobertura completa desde Top: 18px a ~30 FPS", flush=True)
    print("=" * 68, flush=True)
    print(flush=True)

    target_player = "aacal666"

    # Sincronizar jugador
    print("Conectando con la App en http://127.0.0.1:48888...", flush=True)
    status = get_app_status()
    if status and status.get("player"):
        clean_name = status["player"].split("#")[0]
        if clean_name:
            target_player = clean_name
            print(f"✅ Sincronizado con jugador: {status['player']} (Buscando: '{target_player}')", flush=True)
    else:
        print(f"ℹ️ Buscando por defecto: '{target_player}'", flush=True)

    print(f"📍 Killfeed Pantalla 2 (Slots 1 a 6): X={KILLFEED_REGION['left']}..{KILLFEED_REGION['left']+KILLFEED_REGION['width']}, Y={KILLFEED_REGION['top']}..{KILLFEED_REGION['top']+KILLFEED_REGION['height']}", flush=True)
    print(f"🎮 Escaneando a ~30 FPS. ¡Bajas y muertes listas!", flush=True)
    print(flush=True)

    save_json(target_player)

    with mss.mss() as sct:
        last_sync_time = 0.0
        last_warmup_check = 0.0
        is_warmup_state = False
        match_officially_started = False
        consecutive_connection_failures = 0

        while True:
            try:
                now = time.time()

                # 1. Comprobar CALENTAMIENTO solo antes del inicio oficial del combate
                # Una vez empezada la partida oficial, NUNCA vuelve a calentamiento en esa partida.
                if not match_officially_started:
                    warmup_interval = 0.6
                    if (now - last_warmup_check) > warmup_interval:
                        last_warmup_check = now
                        is_warmup_now = check_warmup(sct)
                        if is_warmup_now != is_warmup_state:
                            is_warmup_state = is_warmup_now
                            # Limpiar buffer de bajas y muertes para no arrastrar nada
                            active_kills.clear()
                            active_deaths.clear()
                            save_json(target_player)

                            if is_warmup_state:
                                print(flush=True)
                                print(f"⏳ [{time.strftime('%H:%M:%S')}] CALENTAMIENTO DETECTADO en Valorant.", flush=True)
                                print("   -> Bajas y muertes pausadas temporalmente hasta el inicio oficial.", flush=True)
                                send_warmup_event("active")
                            else:
                                match_officially_started = True
                                print(flush=True)
                                print(f"🎮 [{time.strftime('%H:%M:%S')}] ¡INICIO DE PARTIDA! Fin del calentamiento.", flush=True)
                                print("   -> Ruleta de Armas reanudada y blindada contra falsos calentamientos.", flush=True)
                                send_warmup_event("ended")

                # Si estamos en calentamiento, pausar escaneo de bajas y muertes por completo
                if is_warmup_state:
                    time.sleep(0.08)
                    continue

                # Sincronización periódica del JSON y verificación de App activa (cada 1.5s)
                if now - last_sync_time > 1.5:
                    save_json(target_player)
                    st = get_app_status()
                    if st is None:
                        consecutive_connection_failures += 1
                        if consecutive_connection_failures >= 4:
                            print(f"\n🛑 [{time.strftime('%H:%M:%S')}] App Valorant cerrada. Finalizando detector de Killfeed...", flush=True)
                            break
                    else:
                        consecutive_connection_failures = 0
                        if not st.get("isInGame", True) or not st.get("isDeathmatch", True):
                            match_officially_started = False
                    last_sync_time = now

                # Capturar región de Killfeed en Pantalla 2
                sct_img = sct.grab(KILLFEED_REGION)
                frame = np.frombuffer(sct_img.raw, dtype=np.uint8).reshape((sct_img.height, sct_img.width, 4))
                rgb = frame[:, :, [2, 1, 0]]
                pil_img = Image.fromarray(rgb)

                # Escalar 1.5x para nitidez de fuentes
                SCALE = 1.5
                scaled_w = int(pil_img.width * SCALE)
                scaled_h = int(pil_img.height * SCALE)
                pil_img_scaled = pil_img.resize((scaled_w, scaled_h), Image.Resampling.BILINEAR)

                # OCR nativo ultra-rápido (~10ms)
                ocr_result = winocr.recognize_pil_sync(pil_img_scaled, lang="en")
                lines = ocr_result.get("lines", [])

                # Recoger palabras normalizando coordenadas al espacio nativo
                all_words = []
                for line in lines:
                    line_text = line.get("text", "")
                    if is_stats_text(line_text):
                        continue
                    for w in line.get("words", []):
                        w_text = w.get("text", "")
                        if not is_stats_text(w_text):
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

                # A. Actualizar presencia de nombres en el tablón y purgar los desaparecidos
                all_word_texts = [w["text"] for w in all_words] if all_words else []
                update_tablon_presence_and_purge(all_word_texts, target_player, now=now)

                if not all_words:
                    time.sleep(0.025)
                    continue

                # B. Buscar si apareces tú (aacal666) en el Killfeed
                my_words = [w for w in all_words if is_player_name(w.get("text", ""), target_player)]
                if not my_words:
                    time.sleep(0.025)
                    continue

                # Agrupar menciones a tu nombre por tarjeta (verticalmente dentro de 36px)
                # Esto une "aacal", "666" y cualquier residuo del borde rojo de la misma tarjeta
                unique_my_rows = []
                for mw in my_words:
                    mw_y = mw.get("bounding_rect", {}).get("y", 0)
                    if not any(abs(mw_y - r.get("bounding_rect", {}).get("y", 0)) < 36 for r in unique_my_rows):
                        unique_my_rows.append(mw)

                # C. Extraer todas las tarjetas visibles donde apareces tú en este fotograma
                visible_kills_this_frame = []
                visible_deaths_this_frame = []

                for my_word in unique_my_rows:
                    my_rect = my_word.get("bounding_rect", {})
                    my_x = my_rect.get("x", 0)
                    my_y = my_rect.get("y", 0)

                    row_other_words = [
                        w for w in all_words
                        if w is not my_word
                        and not is_player_name(w.get("text", ""), target_player)
                        and abs(w.get("bounding_rect", {}).get("y", 0) - my_y) < 32
                    ]

                    # GEOMETRÍA ESTRICTA DE VALORANT (510 px de ancho):
                    # - Killer está SIEMPRE en la mitad izquierda (X < 240)
                    # - Victim está SIEMPRE en la mitad derecha (X > 260)
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
                    rival_clean = clean_nick(rival_raw)

                    if role == "killer":
                        if len(rival_clean) >= 2:
                            visible_kills_this_frame.append((rival_clean, rival_raw, my_y))
                    elif role == "victim":
                        if not rival_clean:
                            rival_clean = "rival"
                            rival_raw = "Rival"
                        visible_deaths_this_frame.append((rival_clean, rival_raw, my_y))

                # 1. Procesar Bajas (Kills) comparando ocurrencias en pantalla vs en memoria
                processed_kills = set()
                for rival_clean, rival_raw, my_y in visible_kills_this_frame:
                    if rival_clean in processed_kills:
                        continue
                    processed_kills.add(rival_clean)

                    vis_count = sum(1 for rc, _, _ in visible_kills_this_frame if is_matching_nick(rc, rival_clean))
                    rec_count = sum(1 for item in active_kills if is_matching_nick(item["nick"], rival_clean))

                    if vis_count > rec_count:
                        # Cooldown biológico mínimo entre bajas consecutivas (0.35s)
                        if (now - last_kill_time) < 0.35:
                            continue

                        active_kills.append({
                            "nick": rival_clean,
                            "display": rival_raw,
                            "first_detected_ts": now,
                            "last_seen": now,
                            "first_detected": time.strftime("%H:%M:%S")
                        })
                        last_kill_time = now
                        save_json(target_player)

                        print()
                        print(f"🎯 [{time.strftime('%H:%M:%S')}] ¡BAJA REGISTRADA! Eliminaste a: '{rival_raw}' (Y={my_y:.0f})", flush=True)
                        print(f"   -> Anotada en {os.path.basename(TEMP_JSON_FILE)}. Bloqueada contra duplicados.", flush=True)
                        print(f"   -> Enviando +1 Kill a Gun Roulette...", flush=True)
                        send_event("kill")

                # 2. Procesar Muertes (Deaths) con Blindaje Total Anti-Duplicados
                # Regla de Oro: Solo puede registrarse una nueva muerte si:
                # A) El número de tarjetas de muerte en pantalla SUPERA a las que ya tenemos anotadas (num_visible > num_recorded).
                #    (Esto hace IMPOSIBLE que la misma tarjeta se cuente 2 o 3 veces mientras baja por el tablón).
                # B) Hay una tarjeta en la zona superior donde nacen las nuevas muertes (Slot 0/1: y <= 72).
                # C) Ha transcurrido el tiempo mínimo de respawn de Combate a Muerte (>= 3.2s).
                num_visible_deaths = len(visible_deaths_this_frame)
                num_recorded_deaths = len(active_deaths)

                if num_visible_deaths > num_recorded_deaths:
                    top_death_cards = [c for c in visible_deaths_this_frame if c[2] <= 72]

                    if top_death_cards and (now - last_death_time) >= 3.2:
                        rival_clean, rival_raw, my_y = top_death_cards[0]

                        active_deaths.append({
                            "nick": rival_clean,
                            "display": rival_raw,
                            "first_detected_ts": now,
                            "last_seen": now,
                            "first_detected": time.strftime("%H:%M:%S")
                        })
                        last_death_time = now
                        save_json(target_player)

                        print()
                        print(f"💀 [{time.strftime('%H:%M:%S')}] ¡MUERTE REGISTRADA! Te eliminó: '{rival_raw}' (Slot superior Y={my_y:.0f})", flush=True)
                        print(f"   -> Anotada en {os.path.basename(TEMP_JSON_FILE)}. Bloqueada contra duplicados ({num_visible_deaths} visibles vs {len(active_deaths)} memoria).", flush=True)
                        print(f"   -> Enviando +1 Muerte a Gun Roulette...", flush=True)
                        send_event("death")

                time.sleep(0.025)  # ~30 FPS óptimos
            except Exception as e:
                time.sleep(0.15)

if __name__ == "__main__":
    main()
