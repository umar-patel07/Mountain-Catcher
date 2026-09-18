Mountain Catcher/Pahad Pahad

> A vibrant, arcade 3D playground tag game inspired by the beloved traditional Indian street game of higher ground and quick escapes.

---

## 🎮 Core Rules & Gameplay Mechanics

In the traditional street game **"Pahad Pahad"** (also known as *Oonch Neech Ka Papda* or *Higher Ground Tag*):

1. **Pahad = Safe Zone**:
   - Elevated grassy mounds (*Pahads*) are completely safe. The Catcher cannot tag any player standing on a Pahad.
   - **Strict Capacity (1 Player Per Pahad)**: Only one runner is allowed per Pahad. If another player tries to crowd onto an occupied hill, physical deflection pushes them back onto the ground.

2. **The Ground = Danger Zone**:
   - When running across the dirt or grass between Pahads, players are vulnerable.
   - If the Catcher tags an on-ground runner, that runner is **CAUGHT** and instantly becomes the new Catcher!

3. **Pahad Snatch (Pahad Badal)**:
   - When a runner leaves their hill to tease the Catcher or run to another Pahad, their hill becomes temporarily unoccupied.
   - If the Catcher reaches and steps onto that empty hill, the Catcher **claims the Pahad**!
   - The player who left that hill loses their safe haven, is called **OUT**, and becomes the **New Catcher**!

4. **Visual Occupancy Beacons**:
   - **Green Ring**: Pahad is safely occupied.
   - **Pulsing Amber Ring**: Pahad is empty and vulnerable to being snatched by the Catcher.

---

## 🕹️ Controls & Local Multiplayer Keybindings

Play with up to 5 players on a single keyboard or toggle any player to smart AI bot:

| Player | Name | Role / Badge | Controls | Keys |
| :--- | :--- | :--- | :--- | :--- |
| **P1** | Aarav | Runner / Catcher | **Arrow Keys** | `↑` `↓` `←` `→` |
| **P2** | Riya | Catcher / Runner | **WASD** | `W` `S` `A` `D` |
| **P3** | Kabir | Runner | **TFGH** | `T` `G` `F` `H` |
| **P4** | Sana | Runner | **IJKL** | `I` `K` `J` `L` |
| **P5** | Vihaan | Runner | **Numpad / 8456** | `8` `5` `4` `6` |

*Note: On touch screens or single-player sessions, toggle AI on/off for any player directly from the top or lobby controls.*

---

## ✨ Key Features

- **Custom Low-Poly 3D Playground**: Crafted in Three.js with soft lighting, trees, fences, benches, and an interactive kickable soccer ball.
- **Procedural Character Models**: Animated low-poly kid avatars with unique hairstyles, clothing colors, and running/idle/caught animations.
- **Audio Synthesizer**: Built with Web Audio API for authentic arcade whistles, footstep sfx, jump sounds, safe chimes, and celebration tunes.
- **Smart AI Bots**: Autonomous bots with reactive obstacle avoidance, safe hill seeking, taunt logic, and Catcher hunting behavior.
- **Dynamic Player Count**: Instant switching between 2P, 3P, 4P, and 5P modes on the fly.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **3D Graphics**: Three.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Motion, Canvas Confetti

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
By Umar Patel
