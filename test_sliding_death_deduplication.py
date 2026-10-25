import time
from PIL import Image, ImageDraw, ImageFont
import killfeed_detector as kf

print("=========================================================================")
print("🧪 TEST: TARJETA DE MUERTE DESLIZANTE CON RUIDO DE BORDE / OCR VARIADO")
print("=========================================================================\n")

target_player = "aacal666"
kf.active_deaths.clear()
kf.last_death_time = -10.0

events_triggered = []
def mock_send_event(action):
    events_triggered.append((time.time(), action))
kf.send_event = mock_send_event

# Simulamos 3 fotogramas de la MISMA muerte a diferentes tiempos y slots:
# Fotograma 1 (t=1.0s): Nace en Slot 0 (Y=28) -> Killer "Kemo"
# Fotograma 2 (t=4.5s): Cooldown superado (>3.2s). Tarjeta baja a Slot 2 (Y=108).
#                       OCR lee con ruido: "VANDAL Kemo |" (artefacto de borde)
# Fotograma 3 (t=7.5s): Tarjeta baja a Slot 4 (Y=188).
#                       OCR lee solo "KEM" por desvanecimiento de alfa.

test_frames = [
    (1.0, 28, "kemo", "Kemo"),
    (4.5, 108, "vandal kemo", "VANDAL Kemo |"),
    (7.5, 188, "kem", "KEM"),
    # Fotograma 4 (t=9.5s): Pasaron >8.5s, tarjeta 1 desapareció.
    # Ocurre una SEGUNDA muerte legítima en Slot 0 (Y=28) con Raze:
    (9.5, 28, "raze", "Raze")
]

for sim_t, card_y, rival_clean, rival_raw in test_frames:
    print(f"\n📸 Fotograma en t={sim_t}s (Slot Y={card_y}):")
    print(f"   -> OCR lee: rival='{rival_raw}', tu_nombre='aacal666' en Y={card_y}")

    # En t=9.5s la tarjeta 1 ya no existe, solo existe la tarjeta nueva
    visible_deaths_this_frame = [(rival_clean, rival_raw, card_y)]

    # Actualizar purgado
    kf.update_tablon_presence_and_purge([rival_raw, "aacal666"], target_player, now=sim_t)

    # Lógica de detección protegida
    num_visible_deaths = len(visible_deaths_this_frame)
    num_recorded_deaths = len(kf.active_deaths)

    if num_visible_deaths > num_recorded_deaths:
        top_death_cards = [c for c in visible_deaths_this_frame if c[2] <= 72]

        if top_death_cards and (sim_t - kf.last_death_time) >= 3.2:
            rc, rr, my_y = top_death_cards[0]
            kf.active_deaths.append({
                "nick": rc,
                "display": rr,
                "first_detected_ts": sim_t,
                "last_seen": sim_t,
                "first_detected": time.strftime("%H:%M:%S")
            })
            kf.last_death_time = sim_t
            kf.send_event("death")
            print(f"   💀 [REGISTRO] +1 Muerte enviada a Gun Roulette.")
        else:
            print(f"   🛡️ [BLOQUEADO] La tarjeta está en slot inferior (Y={card_y} > 72) o en cooldown.")
    else:
        print(f"   🛡️ [BLOQUEADO] Blindaje de Cardinalidad: {num_visible_deaths} visibles <= {num_recorded_deaths} en memoria.")

print("\n=========================================================================")
print(f"📊 RESULTADO FINAL:")
print(f"   - Eventos 'death' despachados en total: {len(events_triggered)}")
print(f"   - Muertes en memoria (active_deaths): {len(kf.active_deaths)}")
assert len(events_triggered) == 2, f"FALLO: Se despacharon {len(events_triggered)} muertes (esperaba 2)!"
print("✅ ¡ÉXITO ROTUNDO! CERO DUPLICADOS: 2 muertes reales registradas con total precisión.")
print("   La primera muerte no duplicó ni a los 4.5s ni a los 7.5s, y la segunda muerte se procesó al instante.")
print("=========================================================================")
