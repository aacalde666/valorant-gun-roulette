import sys
import os
import time
import math
import json
import urllib.request
import tkinter as tk
from tkinter import ttk
from PIL import Image, ImageDraw, ImageFont, ImageTk

# Importar el detector real para ejecutar la lógica de OCR y cardinalidad
import killfeed_detector as kf

# =========================================================================
# CONFIGURACIÓN VISUAL Y PARÁMETROS DEL KILLFEED DE VALORANT
# =========================================================================
KF_WIDTH = 510
KF_HEIGHT = 340
SLOT_HEIGHT = 38
MAX_SLOTS = 8  # Hasta 8 tarjetas simultáneas en momentos de máxima acción

WEAPONS_ICONS = {
    "VANDAL": "VANDAL",
    "PHANTOM": "PHANTOM",
    "OPERATOR": "OP",
    "SHERIFF": "SHERIFF",
    "BANDIT": "BANDIT",
    "GHOST": "GHOST",
    "JUDGE": "JUDGE",
    "SPECTRE": "SPECTRE",
    "ODIN": "ODIN",
    "CLASSIC": "CLASSIC"
}

import random

def generate_100_round_match(seed=None):
    """
    Genera una partida completa realista de Combate a Muerte de 100 rondas/bajas:
    - 12 jugadores distintos
    - Todo el arsenal de Valorant
    - Velocidad variable orgánica: ráfagas rápidas (0.35s-0.75s), combate normal (1.2s-2.1s), pausas/reposicionamiento (2.8s-4.2s)
    - aacal666 consigue ~20-22 bajas y ~12-14 muertes
    - Incluye trades rápidos (matar y morir 0.4s después)
    - Saturación de tablón de hasta 8 tarjetas
    - Respeto del cooldown de respawn (3.0s)
    """
    if seed is not None:
        random.seed(seed)
    else:
        random.seed(int(time.time() * 1000) % 1000000)

    rivals = [
        "Reyna", "Jett", "Raze", "Iso", "Omen", "Sova",
        "Fade", "Deadlock", "Chamber", "Phoenix", "Viper", "Cypher"
    ]
    weapons_pool = [
        "VANDAL", "PHANTOM", "OPERATOR", "SHERIFF", "BANDIT",
        "GHOST", "JUDGE", "SPECTRE", "ODIN", "OUTLAW", "BULLDOG"
    ]

    events = []
    t = 1.0

    # 1. FASE DE CALENTAMIENTO (6 eventos con muertes en lobby)
    warmup_skirmishes = [
        ("Jett", "VANDAL", "Reyna", "Lobby: Jett elimina a Reyna en Calentamiento"),
        ("aacal666", "BANDIT", "Sova", "TÚ matas en Calentamiento (¡Ignorado correctamente!)"),
        ("Omen", "JUDGE", "aacal666", "Te matan en Calentamiento (¡Ignorado correctamente!)"),
        ("Fade", "SPECTRE", "Chamber", "Lobby: Fade elimina a Chamber"),
        ("Iso", "PHANTOM", "Cypher", "Lobby: Iso elimina a Cypher"),
        ("Raze", "VANDAL", "Deadlock", "Lobby: Raze elimina a Deadlock")
    ]
    for k, w, v, d in warmup_skirmishes:
        events.append((round(t, 2), k, w, v, True, d, "warmup"))
        t += random.choice([1.2, 1.8, 2.2])

    t += 1.5
    events.append((round(t, 2), None, None, None, False, "🔔 ¡FIN DE CALENTAMIENTO! Comienza el Combate a Muerte oficial (100 rondas)", "bell"))
    t += 1.5

    # 2. PARTIDA OFICIAL DE 100 RONDAS
    aacal_kills = 0
    aacal_deaths = 0
    last_aacal_death_t = -10.0
    aacal_weapons = ["BANDIT", "GHOST", "SPECTRE", "JUDGE", "BULLDOG", "VANDAL", "OPERATOR"]
    current_w_idx = 0
    current_streak = 0

    trade_rounds = {14, 28, 45, 62, 79, 93}
    burst_rounds = {20, 21, 22, 49, 50, 51, 52, 71, 72, 73}

    for round_num in range(7, 101):
        if round_num in burst_rounds:
            delta = random.uniform(0.35, 0.65)
            pace_label = "🔥 Ráfaga rápida"
        else:
            pace_roll = random.random()
            if pace_roll < 0.22:
                delta = random.uniform(0.40, 0.80)  # Rápido
                pace_label = "🔥 Ráfaga rápida"
            elif pace_roll < 0.82:
                delta = random.uniform(1.2, 2.2)    # Normal
                pace_label = "⚔ Combate normal"
            else:
                delta = random.uniform(2.8, 4.2)    # Lento / reposicionamiento
                pace_label = "⏳ Reposicionamiento"

        t += delta
        can_aacal_participate = (t - last_aacal_death_t) > 3.2

        # Situación de TRADE simultáneo (tú matas y casi a la vez te matan)
        if round_num in trade_rounds and can_aacal_participate:
            victim = random.choice(rivals)
            w = aacal_weapons[min(current_w_idx, len(aacal_weapons)-1)]
            aacal_kills += 1
            current_streak += 1
            events.append((round(t, 2), "aacal666", w, victim, False, f"🎯 ¡TU BAJA! (Ronda {round_num}) Matas a {victim} ({aacal_kills} kills)", "🔥 Trade Kill"))

            # 0.42s después: Te matan inmediatamente
            t += 0.42
            killer = random.choice([r for r in rivals if r != victim])
            kw = random.choice(["JUDGE", "VANDAL", "OPERATOR", "PHANTOM"])
            aacal_deaths += 1
            last_aacal_death_t = t
            current_streak = 0
            events.append((round(t, 2), killer, kw, "aacal666", False, f"💀 ¡TE MATAN 0.4s DESPUÉS! {killer} te tradea ({aacal_deaths} muertes)", "💀 Trade Death"))
            continue

        prob_kill = 0.24 if (can_aacal_participate and aacal_kills < 22) else 0.0
        prob_death = 0.13 if (can_aacal_participate and aacal_deaths < 13) else 0.0

        roll = random.random()
        if roll < prob_kill:
            victim = random.choice(rivals)
            w = aacal_weapons[min(current_w_idx, len(aacal_weapons)-1)]
            aacal_kills += 1
            current_streak += 1
            events.append((round(t, 2), "aacal666", w, victim, False, f"🎯 ¡TU BAJA! (Ronda {round_num}) Eliminaste a {victim} con {w} ({aacal_kills} kills)", pace_label))
            if current_streak >= 3:
                current_w_idx += 1
                current_streak = 0
        elif roll < prob_kill + prob_death:
            killer = random.choice(rivals)
            kw = random.choice(weapons_pool)
            aacal_deaths += 1
            last_aacal_death_t = t
            current_streak = 0
            events.append((round(t, 2), killer, kw, "aacal666", False, f"💀 ¡TE MATAN! (Ronda {round_num}) {killer} te eliminó con {kw} ({aacal_deaths} muertes)", pace_label))
        else:
            k = random.choice(rivals)
            v = random.choice([r for r in rivals if r != k])
            w = random.choice(weapons_pool)
            events.append((round(t, 2), k, w, v, False, f"Lobby #{round_num}: {k} [{w}] {v}", pace_label))

    return events

# Instancia inicial de 100 rondas
MATCH_EVENTS = generate_100_round_match(seed=1337)

class VisualMatchSimulatorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Simulador Visual de Combate a Muerte - Valorant Killfeed")
        self.root.geometry("1100 x 740")
        self.root.minsize(1000, 680)
        self.root.configure(bg="#0b1219")

        self.player_name = "aacal666"
        self.current_sim_time = 0.0
        self.is_playing = False
        self.play_speed = 1.0
        self.is_warmup = True
        self.cards = []  # [{killer, weapon, victim, spawn_time, duration}]
        self.next_event_idx = 0
        self.match_events = MATCH_EVENTS
        self.last_death_sim_time = -10.0
        self.current_pace_label = "⚔ Combate normal"

        # Stats simuladas
        self.registered_kills = 0
        self.registered_deaths = 0
        self.active_weapon = "Bandit"
        self.weapon_streak = 0
        self.target_streak = 3
        self.lives_left = 3
        self.bridge_connected = False

        # Fuentes
        try:
            self.font_card = ImageFont.truetype("arialbd.ttf", 15)
            self.font_weapon = ImageFont.truetype("arial.ttf", 11)
            self.font_warmup = ImageFont.truetype("arialbd.ttf", 20)
        except:
            self.font_card = ImageFont.load_default()
            self.font_weapon = ImageFont.load_default()
            self.font_warmup = ImageFont.load_default()

        # Configurar detector en memoria
        kf.active_kills.clear()
        kf.active_deaths.clear()
        kf.last_kill_time = 0.0
        kf.last_death_time = 0.0

        self.setup_ui()
        self.check_bridge()
        self.update_loop()

    def setup_ui(self):
        # 1. BARRA SUPERIOR
        top_frame = tk.Frame(self.root, bg="#131e29", height=50, padx=15, pady=8)
        top_frame.pack(fill="x", side="top")

        lbl_title = tk.Label(
            top_frame,
            text="SIMULADOR VISUAL DE PARTIDA REAL (DEATHMATCH VALORANT)",
            font=("Segoe UI", 12, "bold"),
            fg="#5bb2d6",
            bg="#131e29"
        )
        lbl_title.pack(side="left")

        self.lbl_bridge = tk.Label(
            top_frame,
            text="Bridge: Conectando...",
            font=("Consolas", 10, "bold"),
            fg="#94a3b8",
            bg="#0d1620",
            padx=10,
            pady=3,
            relief="groove"
        )
        self.lbl_bridge.pack(side="right")

        # 2. CONTENEDOR PRINCIPAL (2 COLUMNAS)
        main_paned = tk.PanedWindow(self.root, orient="horizontal", bg="#0b1219", bd=0, sashwidth=4)
        main_paned.pack(fill="both", expand=True, padx=12, pady=10)

        # COLUMNA IZQUIERDA: PANTALLA DEL KILLFEED
        left_frame = tk.Frame(main_paned, bg="#0e1722", padx=10, pady=10, relief="ridge", bd=1)
        main_paned.add(left_frame, minsize=540)

        lbl_screen_header = tk.Label(
            left_frame,
            text="📺 VISOR DEL KILLFEED (510x340 px - Monitor 2)",
            font=("Segoe UI", 11, "bold"),
            fg="#ffffff",
            bg="#0e1722"
        )
        lbl_screen_header.pack(anchor="w", pady=(0, 6))

        # Canvas del Killfeed
        self.canvas_kf = tk.Canvas(left_frame, width=KF_WIDTH, height=KF_HEIGHT, bg="#05080c", highlightthickness=1, highlightbackground="#233544")
        self.canvas_kf.pack(anchor="center", pady=4)

        # Controles de reproducción debajo del canvas
        controls_frame = tk.Frame(left_frame, bg="#0e1722", pady=10)
        controls_frame.pack(fill="x")

        self.btn_play = tk.Button(
            controls_frame,
            text="▶ Iniciar Partida",
            font=("Segoe UI", 10, "bold"),
            bg="#00f59b",
            fg="#05080c",
            activebackground="#00c87d",
            cursor="hand2",
            padx=12,
            pady=6,
            command=self.toggle_play
        )
        self.btn_play.pack(side="left", padx=4)

        self.btn_step = tk.Button(
            controls_frame,
            text="⏭ Paso a Paso",
            font=("Segoe UI", 10, "bold"),
            bg="#1a2d3f",
            fg="#5bb2d6",
            activebackground="#25425d",
            cursor="hand2",
            padx=10,
            pady=6,
            command=self.step_next_event
        )
        self.btn_step.pack(side="left", padx=4)

        self.btn_reset = tk.Button(
            controls_frame,
            text="🔄 Reiniciar",
            font=("Segoe UI", 10),
            bg="#241b22",
            fg="#f87171",
            activebackground="#3b1d28",
            cursor="hand2",
            padx=10,
            pady=6,
            command=self.reset_match
        )
        self.btn_reset.pack(side="left", padx=4)

        # Selector de Velocidad
        speed_frame = tk.Frame(controls_frame, bg="#0e1722")
        speed_frame.pack(side="right")
        tk.Label(speed_frame, text="Velocidad:", font=("Segoe UI", 9), fg="#94a3b8", bg="#0e1722").pack(side="left", padx=2)
        for spd in [0.5, 1.0, 2.0]:
            b = tk.Button(
                speed_frame,
                text=f"{spd}x",
                font=("Segoe UI", 8, "bold"),
                bg="#13202d",
                fg="#e2e8f0",
                padx=6,
                pady=3,
                command=lambda s=spd: self.set_speed(s)
            )
            b.pack(side="left", padx=2)

        # Tiempo transcurrido
        self.lbl_time = tk.Label(
            left_frame,
            text="⏱ Tiempo de Partida: 00:00.0 | Estado: Calentamiento Activo",
            font=("Consolas", 10, "bold"),
            fg="#38bdf8",
            bg="#081018",
            padx=8,
            pady=4
        )
        self.lbl_time.pack(fill="x", pady=(6, 0))

        # COLUMNA DERECHA: INSPECTOR EN VIVO & AUDITOR
        right_frame = tk.Frame(main_paned, bg="#0e1722", padx=10, pady=10, relief="ridge", bd=1)
        main_paned.add(right_frame, minsize=480)

        lbl_inspector_header = tk.Label(
            right_frame,
            text="📊 AUDITOR Y DETECTOR EN TIEMPO REAL",
            font=("Segoe UI", 11, "bold"),
            fg="#ffffff",
            bg="#0e1722"
        )
        lbl_inspector_header.pack(anchor="w", pady=(0, 6))

        # Tarjeta de Estado del Jugador (aacal666)
        stats_box = tk.Frame(right_frame, bg="#13202d", padx=12, pady=10, relief="groove", bd=1)
        stats_box.pack(fill="x", pady=4)

        # Fila 1: Usuario y Arma
        row1 = tk.Frame(stats_box, bg="#13202d")
        row1.pack(fill="x", pady=2)
        tk.Label(row1, text="Jugador: aacal666", font=("Segoe UI", 11, "bold"), fg="#38bdf8", bg="#13202d").pack(side="left")
        self.lbl_weapon = tk.Label(row1, text="Arma: Bandit (Meta: 3 kills)", font=("Segoe UI", 10, "bold"), fg="#00f59b", bg="#13202d")
        self.lbl_weapon.pack(side="right")

        # Fila 2: Kills y Muertes con badges
        row2 = tk.Frame(stats_box, bg="#13202d")
        row2.pack(fill="x", pady=4)
        self.lbl_kills = tk.Label(row2, text="🎯 Kills: 0", font=("Consolas", 11, "bold"), fg="#ff4655", bg="#221217", padx=8, pady=3)
        self.lbl_kills.pack(side="left", padx=2)

        self.lbl_deaths = tk.Label(row2, text="💀 Muertes: 0 / 3 Vidas", font=("Consolas", 11, "bold"), fg="#f87171", bg="#261016", padx=8, pady=3)
        self.lbl_deaths.pack(side="left", padx=6)

        self.lbl_verdict = tk.Label(row2, text="✅ 0 DUPLICADOS", font=("Consolas", 10, "bold"), fg="#00f59b", bg="#0e231b", padx=8, pady=3)
        self.lbl_verdict.pack(side="right")

        # Estado del JSON en Memoria
        tk.Label(right_frame, text="🧠 Memoria Activa del Detector (active_kills / active_deaths):", font=("Segoe UI", 9, "bold"), fg="#94a3b8", bg="#0e1722").pack(anchor="w", pady=(8, 2))
        self.txt_memory = tk.Text(right_frame, height=4, bg="#070c12", fg="#a5f3fc", font=("Consolas", 9), relief="flat", padx=6, pady=4)
        self.txt_memory.pack(fill="x", pady=2)

        # Registro / Log en tiempo real
        tk.Label(right_frame, text="📜 Registro de Eventos y Comprobaciones en Directo:", font=("Segoe UI", 9, "bold"), fg="#94a3b8", bg="#0e1722").pack(anchor="w", pady=(8, 2))
        self.log_box = tk.Text(right_frame, bg="#070c12", fg="#e2e8f0", font=("Consolas", 9), relief="flat", padx=6, pady=4)
        self.log_box.pack(fill="both", expand=True, pady=2)

        self.add_log("🏁 Simulador inicializado. Pulsa '▶ Iniciar Partida' para ver el combate.", "#38bdf8")

    def add_log(self, text, color="#e2e8f0"):
        ts = time.strftime("%H:%M:%S")
        self.log_box.insert("end", f"[{ts}] {text}\n")
        self.log_box.see("end")

    def toggle_play(self):
        self.is_playing = not self.is_playing
        if self.is_playing:
            self.btn_play.config(text="⏸ Pausar", bg="#f59e0b", activebackground="#d97706")
        else:
            self.btn_play.config(text="▶ Reanudar", bg="#00f59b", activebackground="#00c87d")

    def set_speed(self, spd):
        self.play_speed = spd
        self.add_log(f"⚡ Velocidad de simulación ajustada a {spd}x")

    def reset_match(self):
        self.is_playing = False
        self.current_sim_time = 0.0
        self.next_event_idx = 0
        self.is_warmup = True
        self.cards.clear()
        self.registered_kills = 0
        self.registered_deaths = 0
        self.weapon_streak = 0
        self.active_weapon = "Bandit"
        self.lives_left = 3
        self.last_death_sim_time = -10.0
        self.current_pace_label = "⚔ Combate normal"
        self.match_events = generate_100_round_match()
        self.btn_play.config(text="▶ Iniciar Partida (100 Rondas)", bg="#00f59b")

        kf.active_kills.clear()
        kf.active_deaths.clear()
        kf.last_kill_time = 0.0
        kf.last_death_time = 0.0

        self.log_box.delete("1.0", "end")
        self.add_log(f"🔄 Partida de {len(self.match_events)} rondas generada con ritmo variable (Calentamiento activo).", "#f59e0b")
        self.render_frame()

    def step_next_event(self):
        if self.next_event_idx >= len(self.match_events):
            self.add_log("🏁 Fin de la partida de 100 rondas completada.", "#00f59b")
            return

        ev = self.match_events[self.next_event_idx]
        self.current_sim_time = ev[0]
        self.trigger_event(ev)
        self.next_event_idx += 1
        self.render_frame()
        self.process_detection()

    def trigger_event(self, ev):
        t = ev[0]
        killer = ev[1]
        weapon = ev[2]
        victim = ev[3]
        is_warmup = ev[4]
        desc = ev[5]
        pace = ev[6] if len(ev) > 6 else "⚔ Combate normal"
        self.current_pace_label = pace
        self.is_warmup = is_warmup

        if killer is None:
            # Evento especial (ej. Fin de calentamiento)
            self.add_log(f"📢 {desc}", "#00f59b")
            # Notificar al bridge local
            self.send_bridge_event("warmup", {"active": False})
            return

        # Insertar tarjeta en Slot 0 (desplaza las existentes hacia abajo)
        card = {
            "killer": killer,
            "weapon": weapon,
            "victim": victim,
            "spawn_time": self.current_sim_time,
            "duration": 8.5  # Duración auténtica de Valorant antes de desvanecerse
        }
        self.cards.insert(0, card)
        # Limitar a máximo 8 slots
        if len(self.cards) > MAX_SLOTS:
            self.cards = self.cards[:MAX_SLOTS]

        self.add_log(f"💥 [{killer}] [{weapon}] [{victim}] -> {desc} ({pace})", "#f87171" if victim == self.player_name else "#38bdf8")

    def check_bridge(self):
        try:
            req = urllib.request.Request("http://127.0.0.1:48888/status")
            with urllib.request.urlopen(req, timeout=0.4) as resp:
                data = json.loads(resp.read().decode())
                self.bridge_connected = True
                self.lbl_bridge.config(text="🟢 App Conectada (127.0.0.1:48888)", fg="#00f59b")
        except:
            self.bridge_connected = False
            self.lbl_bridge.config(text="⚪ App Desconectada (Modo Autónomo)", fg="#94a3b8")

        self.root.after(3000, self.check_bridge)

    def send_bridge_event(self, ev_type, payload=None):
        if not self.bridge_connected:
            return
        try:
            url = f"http://127.0.0.1:48888/{ev_type}"
            data = json.dumps(payload or {}).encode('utf-8')
            req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')
            urllib.request.urlopen(req, timeout=0.2)
        except:
            pass

    def render_frame(self):
        # Renderizar imagen con PIL y mostrar en Canvas
        img = Image.new("RGBA", (KF_WIDTH, KF_HEIGHT), (8, 12, 18, 255))
        draw = ImageDraw.Draw(img)

        # Cuadrícula sutil de fondo
        for y in range(0, KF_HEIGHT, 40):
            draw.line([(0, y), (KF_WIDTH, y)], fill=(15, 23, 34, 100), width=1)

        # Banner de calentamiento
        if self.is_warmup:
            draw.rectangle([(20, 8), (KF_WIDTH - 20, 36)], fill=(180, 80, 20, 220), outline=(255, 140, 40, 255), width=2)
            draw.text((KF_WIDTH // 2, 22), "⏳ CALENTAMIENTO / WARM UP", fill=(255, 255, 255, 255), font=self.font_weapon, anchor="mm")

        # Dibujar tarjetas de killfeed activas
        start_y = 48 if self.is_warmup else 14

        for slot_idx, card in enumerate(self.cards):
            card_y = start_y + slot_idx * (SLOT_HEIGHT + 4)
            if card_y + SLOT_HEIGHT > KF_HEIGHT:
                break

            age = self.current_sim_time - card["spawn_time"]
            # Desvanecimiento tras 7.5s
            alpha = 255
            if age > 7.5:
                alpha = max(30, int(255 * (1.0 - (age - 7.5))))

            is_my_kill = (card["killer"] == self.player_name)
            is_my_death = (card["victim"] == self.player_name)

            # Fondo de la tarjeta
            bg_color = (18, 28, 40, alpha)
            border_color = (40, 60, 80, alpha)
            if is_my_kill:
                bg_color = (25, 45, 65, alpha)
                border_color = (0, 245, 155, alpha)
            elif is_my_death:
                bg_color = (45, 20, 28, alpha)
                border_color = (255, 70, 85, alpha)

            draw.rounded_rectangle(
                [(15, card_y), (KF_WIDTH - 15, card_y + SLOT_HEIGHT)],
                radius=4,
                fill=bg_color,
                outline=border_color,
                width=1
            )

            # Killer (Izquierda)
            killer_color = (0, 245, 155, alpha) if is_my_kill else (240, 240, 240, alpha)
            draw.text((25, card_y + 11), card["killer"], fill=killer_color, font=self.font_card)

            # Icono / Nombre del arma (Centro)
            draw.text((KF_WIDTH // 2, card_y + 12), f"[{card['weapon']}]", fill=(148, 163, 184, alpha), font=self.font_weapon, anchor="mm")

            # Victim (Derecha)
            victim_color = (255, 70, 85, alpha) if is_my_death else (240, 240, 240, alpha)
            draw.text((KF_WIDTH - 25, card_y + 11), card["victim"], fill=victim_color, font=self.font_card, anchor="ra")

        # Si aacal666 está en respawn (< 3.0s de morir), dibujar aviso de respawn
        respawn_elapsed = self.current_sim_time - self.last_death_sim_time
        if respawn_elapsed < 3.0 and not self.is_warmup:
            remaining = 3.0 - respawn_elapsed
            draw.rectangle([(20, KF_HEIGHT - 32), (KF_WIDTH - 20, KF_HEIGHT - 6)], fill=(120, 20, 30, 220), outline=(255, 70, 85, 255), width=1)
            draw.text((KF_WIDTH // 2, KF_HEIGHT - 19), f"⏳ REAPARECIENDO EN {remaining:.1f}s (RESPAWN COUNTDOWN)", fill=(255, 255, 255, 255), font=self.font_weapon, anchor="mm")

        # Pasar a Tkinter PhotoImage
        self.tk_img = ImageTk.PhotoImage(img)
        self.canvas_kf.create_image(0, 0, anchor="nw", image=self.tk_img)

        # Actualizar labels de estado
        mins = int(self.current_sim_time) // 60
        secs = self.current_sim_time % 60
        state_str = "⏳ Calentamiento" if self.is_warmup else "🎮 Partida Oficial"
        total_ev = len(self.match_events)
        self.lbl_time.config(text=f"⏱ {mins:02d}:{secs:04.1f} | Ronda {self.next_event_idx}/{total_ev} | {state_str} | Ritmo: {self.current_pace_label}")

    def process_detection(self):
        """
        Ejecuta la lógica real del detector (cardinalidad vis_count > rec_count y purgado)
        sobre las tarjetas presentes en la pantalla simulada.
        """
        now = self.current_sim_time

        # 1. Purgar tarjetas que expiraron (>8.5s)
        self.cards = [c for c in self.cards if (now - c["spawn_time"]) < c["duration"]]

        # 2. Si está en calentamiento, el detector ignora todo
        if self.is_warmup:
            return

        # 3. Detectar tarjetas donde aparece aacal666
        visible_kills = [c for c in self.cards if c["killer"] == self.player_name]
        visible_deaths = [c for c in self.cards if c["victim"] == self.player_name]

        # A. PROCESAR KILLS CON CARDINALIDAD
        processed_kills = set()
        for k_card in visible_kills:
            rival = k_card["victim"].lower()
            if rival in processed_kills:
                continue
            processed_kills.add(rival)

            vis_count = sum(1 for c in visible_kills if c["victim"].lower() == rival)
            rec_count = sum(1 for item in kf.active_kills if item["nick"] == rival)

            if vis_count > rec_count:
                if (now - kf.last_kill_time) >= 0.35:
                    kf.active_kills.append({
                        "nick": rival,
                        "display": f"{k_card['weapon']} {k_card['victim']}",
                        "first_detected_ts": now,
                        "last_seen": now
                    })
                    kf.last_kill_time = now
                    self.registered_kills += 1
                    self.weapon_streak += 1

                    self.add_log(f"✅ DETECTOR: +1 Kill registrada contra '{k_card['victim']}' (Racha: {self.weapon_streak}/{self.target_streak})", "#00f59b")
                    self.send_bridge_event("kill")

                    # Si alcanza la racha
                    if self.weapon_streak >= self.target_streak:
                        self.add_log(f"🏆 ¡RACHA ALCANZADA! Con {self.active_weapon}. Siguiente arma: Ghost al morir.", "#fbbf24")

        # B. PROCESAR DEATHS CON CARDINALIDAD TOTAL (BLINDAJE ANTI-DUPLICADOS)
        num_visible_deaths = len(visible_deaths)
        num_recorded_deaths = len(kf.active_deaths)

        if num_visible_deaths > num_recorded_deaths:
            if (now - kf.last_death_time) >= 3.2:
                d_card = visible_deaths[0]
                killer = d_card["killer"].lower()
                kf.active_deaths.append({
                    "nick": killer,
                    "display": f"{d_card['killer']} {d_card['weapon']}",
                    "first_detected_ts": now,
                    "last_seen": now
                })
                kf.last_death_time = now
                self.last_death_sim_time = now
                self.registered_deaths += 1
                self.lives_left = max(0, self.lives_left - 1)

                if self.weapon_streak >= self.target_streak:
                    # Muerte de transición: equipa la siguiente arma
                    self.active_weapon = "Ghost"
                    self.weapon_streak = 0
                    self.lives_left = 3
                    self.add_log(f"🔄 Respawn: ¡Arma cambiada a {self.active_weapon}!", "#38bdf8")
                else:
                    self.weapon_streak = 0
                    self.add_log(f"💀 DETECTOR: +1 Muerte registrada por '{d_card['killer']}' (Vidas: {self.lives_left}/3)", "#f87171")

                self.send_bridge_event("death")

        # C. PURGA DE MEMORIA DEL DETECTOR
        # Si la tarjeta ya desapareció de la pantalla y pasaron >8.5s, se elimina del JSON
        new_active_kills = []
        for item in kf.active_kills:
            still_visible = any(c["victim"].lower() == item["nick"] for c in visible_kills)
            if still_visible or (now - item["first_detected_ts"]) < 8.5:
                new_active_kills.append(item)
            else:
                self.add_log(f"🗑️ JSON: '{item['display']}' salió de pantalla -> purgado de memoria", "#94a3b8")
        kf.active_kills = new_active_kills

        new_active_deaths = []
        for item in kf.active_deaths:
            still_visible = any(c["killer"].lower() == item["nick"] for c in visible_deaths)
            if still_visible or (now - item["first_detected_ts"]) < 8.5:
                new_active_deaths.append(item)
            else:
                self.add_log(f"🗑️ JSON: '{item['display']}' salió de pantalla -> purgado de memoria", "#94a3b8")
        kf.active_deaths = new_active_deaths

        # Actualizar labels
        self.lbl_kills.config(text=f"🎯 Kills: {self.registered_kills}")
        self.lbl_deaths.config(text=f"💀 Muertes: {self.registered_deaths} | {self.lives_left} Vidas")
        self.lbl_weapon.config(text=f"Arma: {self.active_weapon} ({self.weapon_streak}/{self.target_streak} racha)")

        # Actualizar vista del JSON de memoria
        mem_info = {
            "active_kills_en_tablon": [it["display"] for it in kf.active_kills],
            "active_deaths_en_tablon": [it["display"] for it in kf.active_deaths]
        }
        self.txt_memory.delete("1.0", "end")
        self.txt_memory.insert("end", json.dumps(mem_info, indent=2))

    def update_loop(self):
        if self.is_playing:
            dt = 0.05 * self.play_speed
            self.current_sim_time += dt

            # Disparar eventos según el tiempo de la partida
            while self.next_event_idx < len(self.match_events):
                ev = self.match_events[self.next_event_idx]
                if self.current_sim_time >= ev[0]:
                    self.trigger_event(ev)
                    self.next_event_idx += 1
                else:
                    break

            self.process_detection()
            self.render_frame()

        # Ciclo a ~30 FPS
        self.root.after(33, self.update_loop)

def main():
    root = tk.Tk()
    app = VisualMatchSimulatorApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
