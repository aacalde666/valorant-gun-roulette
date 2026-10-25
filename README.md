# VALORANT Gun Roulette Challenge 🎯🔫

[![Platform: Overwolf](https://img.shields.io/badge/Platform-Overwolf%20%7C%20Desktop-orange.svg)](https://dev.overwolf.com/)
[![Game: VALORANT](https://img.shields.io/badge/Game-VALORANT-red.svg)](https://playvalorant.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An interactive companion overlay and aim-challenge progression tool designed for **VALORANT Deathmatch** and casual practice sessions. 

The app challenges players with randomized weapon tiers, setting target kill requirements per tier while strictly limiting player lives. It acts as an engaging personal handicap and adaptive aim-training mini-game for streamers and players looking to master every weapon in the arsenal.

---

## 🌟 Key Features

- **Dynamic Weapon Tier Progression:** Progress through distinct weapon categories (Sidearms, SMGs, Shotguns, Rifles, Machine Guns, and Snipers).
- **Adaptive Aim Handicap:** Players are assigned a randomized weapon and a target number of kills required to advance to the next tier.
- **Life & Penalty System:** 3 lives per tier. Dying depletes a life; losing all lives resets progress or forces an alternate weapon rotation within the tier.
- **Overwolf Integration:** Seamlessly synchronizes with the Overwolf Game Events Provider for real-time, low-latency in-game event detection.
- **Passive Vision Fallback:** Integrated lightweight OCR detector to read killfeed notifications locally without inspecting game memory or injecting code.
- **Customizable In-Game HUD:** Non-intrusive, clean tactical overlay with transparency toggle and quick calibration hotkeys (`F6` calibration, `F7` overlay toggle, `F9`/`F10` hotkeys).

---

## 🛡️ Fair Play & Policy Compliance

This application is strictly designed within the guidelines of **Riot Games' Policies** and **Overwolf Game Compliance**:

1. **No Competitive Advantage:** The app only applies restrictions and handicaps to the user. It does not provide radar, wallhacks, auto-aim, recoil compensation, or any tactical assistance.
2. **No Memory Tampering:** Does not read or write to VALORANT's game memory, inject DLLs, or modify game files.
3. **No Toxic Shaming:** Does not evaluate, score, or track other players in the match. Only the local player's personal challenge score is displayed.
4. **Free & Community-Driven:** 100% free to use with no locked features, paywalls, or Elo/MMR calculations.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide React
- **Platform:** Overwolf SDK & Game Events Provider (GEP)
- **Desktop Runtime:** Electron / Native Windows Shell
- **Detector Engine:** Python 3.11 + WinRT OCR (Windows.Media.Ocr)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or newer)
- Overwolf Client (Developer Mode enabled) or Python 3.10+ (for local desktop standalone mode)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/aacalde666/valorant-gun-roulette.git
   cd valorant-gun-roulette
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build Overwolf package (`.opk`):
   ```bash
   npm run build
   python pack_opk.py
   ```

---

## ⚖️ Legal Disclaimer

*Valorant Gun Roulette Challenge isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing Riot Games properties. Riot Games, and all associated properties are trademarks or registered trademarks of Riot Games, Inc.*
