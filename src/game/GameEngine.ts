import * as THREE from 'three';
import { GameEventNotification, GamePhase, PahadData, PlayerConfig, PlayerEntity, PlayerId } from '../types';
import { sound } from '../audio/SoundSystem';
import { CharacterMeshContainer, createCharacterMesh } from './CharacterModel';
import { createPlaygroundEnvironment, EnvironmentResult } from './PahadEnvironment';
import confetti from 'canvas-confetti';

export interface GameEngineCallbacks {
  onPhaseChange: (phase: GamePhase) => void;
  onPlayersUpdate: (players: PlayerEntity[]) => void;
  onNotification: (notif: GameEventNotification) => void;
  onCatcherChange: (catcherId: PlayerId) => void;
}

export const DEFAULT_PLAYERS_CONFIG: PlayerConfig[] = [
  {
    id: 'p1',
    name: 'Aarav',
    badge: 'P1',
    color: 'Blue',
    hexColor: '#3b82f6',
    shirtColor: 0x2563eb,
    pantsColor: 0x1e293b,
    hairColor: 0x111827,
    skinColor: 0xf5cda7,
    hairStyle: 'spiky',
    controls: { forward: 'KeyW', backward: 'KeyS', left: 'KeyA', right: 'KeyD' },
    controlLabel: 'W / S / A / D',
    isAI: false,
  },
  {
    id: 'p2',
    name: 'Riya',
    badge: 'P2',
    color: 'Green',
    hexColor: '#22c55e',
    shirtColor: 0x16a34a,
    pantsColor: 0x334155,
    hairColor: 0x3e2723,
    skinColor: 0xfbd2b0,
    hairStyle: 'ponytail',
    controls: { forward: 'ArrowUp', backward: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
    controlLabel: '↑ / ↓ / ← / →',
    isAI: false,
  },
  {
    id: 'p3',
    name: 'Kabir',
    badge: 'P3',
    color: 'Yellow',
    hexColor: '#eab308',
    shirtColor: 0xd97706,
    pantsColor: 0x1e3a8a,
    hairColor: 0x18181b,
    skinColor: 0xf5cda7,
    hairStyle: 'cap',
    controls: { forward: 'KeyI', backward: 'KeyK', left: 'KeyJ', right: 'KeyL' },
    controlLabel: 'I / K / J / L',
    isAI: false,
  },
  {
    id: 'p4',
    name: 'Sana',
    badge: 'P4',
    color: 'Purple',
    hexColor: '#a855f7',
    shirtColor: 0x9333ea,
    pantsColor: 0x475569,
    hairColor: 0x2c1d11,
    skinColor: 0xf7d5ba,
    hairStyle: 'bob',
    controls: { forward: 'KeyT', backward: 'KeyG', left: 'KeyF', right: 'KeyH' },
    controlLabel: 'T / G / F / H',
    isAI: false,
  },
  {
    id: 'p5',
    name: 'Vihaan',
    badge: 'P5',
    color: 'Red',
    hexColor: '#ef4444',
    shirtColor: 0xdc2626,
    pantsColor: 0x0f172a,
    hairColor: 0x171717,
    skinColor: 0xf5c096,
    hairStyle: 'curly',
    controls: { forward: 'Numpad8', backward: 'Numpad5', left: 'Numpad4', right: 'Numpad6' },
    controlLabel: 'NUM 8 / 5 / 4 / 6',
    isAI: false,
  },
];

export class GameEngine {
  private container: HTMLElement;
  private callbacks: GameEngineCallbacks;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private charactersGroup: THREE.Group = new THREE.Group();
  private envResult!: EnvironmentResult;
  private characterMeshes: Map<PlayerId, CharacterMeshContainer> = new Map();

  private playerCount: number = 4;
  private players: PlayerEntity[] = [];
  private pahads: PahadData[] = [];
  private phase: GamePhase = 'MENU';
  private currentCatcherId: PlayerId = 'p1';
  private activeKeys: Set<string> = new Set();

  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  private transitionTimer: number = 0;
  private readyTimer: number = 0;
  private readyStep: number = 3;
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement, callbacks: GameEngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.initThree();
    this.setupInputs();
  }

  private initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdcecf8); // Clear sunny afternoon sky
    this.scene.fog = new THREE.FogExp2(0xdcecf8, 0.012);

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
    this.camera.position.set(0, 24, 28);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.charactersGroup = new THREE.Group();
    this.scene.add(this.charactersGroup);

    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private setupInputs() {
    window.addEventListener('keydown', (e) => {
      // Normalize numpad or fallback keys
      this.activeKeys.add(e.code);

      // Support alternative P5 keys on keyboards without numpad (8, 5, 4, 6 or keypad digits)
      if (e.key === '8') this.activeKeys.add('Numpad8');
      if (e.key === '5') this.activeKeys.add('Numpad5');
      if (e.key === '4') this.activeKeys.add('Numpad4');
      if (e.key === '6') this.activeKeys.add('Numpad6');
    });

    window.addEventListener('keyup', (e) => {
      this.activeKeys.delete(e.code);
      if (e.key === '8') this.activeKeys.delete('Numpad8');
      if (e.key === '5') this.activeKeys.delete('Numpad5');
      if (e.key === '4') this.activeKeys.delete('Numpad4');
      if (e.key === '6') this.activeKeys.delete('Numpad6');
    });
  }

  public setupMatch(count: number, configs?: PlayerConfig[]) {
    this.playerCount = Math.max(2, Math.min(5, count));

    // Clear old characters completely from scene and container group
    this.characterMeshes.forEach((m) => {
      m.dispose();
      this.charactersGroup.remove(m.root);
      this.scene.remove(m.root);
    });
    this.characterMeshes.clear();

    while (this.charactersGroup.children.length > 0) {
      const child = this.charactersGroup.children[0];
      this.charactersGroup.remove(child);
    }

    if (this.envResult) {
      this.envResult.dispose();
    }

    // Pahad count strictly equals number of non-catcher players
    // 2 players -> 1 Pahad
    // 3 players -> 2 Pahads
    // 4 players -> 3 Pahads
    // 5 players -> 4 Pahads
    const pahadCount = this.playerCount - 1;
    this.pahads = this.generatePahadPositions(pahadCount);

    // Build playground environment with Pahads
    this.envResult = createPlaygroundEnvironment(this.scene, this.pahads);

    // Create Players
    const baseConfigs = configs || DEFAULT_PLAYERS_CONFIG.slice(0, this.playerCount);
    const selectedConfigs = baseConfigs.slice(0, this.playerCount);

    // Set initial Catcher to Player 1 (as specified in gameplay loop)
    this.currentCatcherId = selectedConfigs[0].id;

    // Non-catcher players get assigned their home Pahad
    let pahadIdx = 0;
    this.players = selectedConfigs.map((cfg) => {
      const isCatcher = cfg.id === this.currentCatcherId;
      const assignedPahad = !isCatcher ? this.pahads[pahadIdx++] : null;

      let startX = 0;
      let startY = 0;
      let startZ = 0;

      if (isCatcher) {
        // Catcher spawns on the ground at the designated starting position
        startX = 0;
        startY = 0;
        startZ = 4.5;
      } else if (assignedPahad) {
        // Non-catcher spawns on top of their assigned Pahad
        startX = assignedPahad.x;
        startY = assignedPahad.height;
        startZ = assignedPahad.z;
        assignedPahad.assignedPlayerId = cfg.id;
        assignedPahad.currentOccupantId = cfg.id;
        assignedPahad.isOccupied = true;
      }

      const entity: PlayerEntity = {
        ...cfg,
        role: isCatcher ? 'CATCHER' : 'PAHAD_PLAYER',
        state: isCatcher ? 'ON_GROUND' : 'ON_PAHAD',
        x: startX,
        y: startY,
        z: startZ,
        vx: 0,
        vy: 0,
        vz: 0,
        rotation: isCatcher ? Math.PI : Math.random() * Math.PI * 2,
        targetRotation: 0,
        currentPahadId: assignedPahad ? assignedPahad.id : null,
        assignedPahadId: assignedPahad ? assignedPahad.id : null,
        isGrounded: true,
        isAirborne: false,
        graceTimer: 0,
        stats: {
          timesCaught: 0,
          pahadsCaptured: 0,
          pahadsSwitched: 0,
          timeOnGroundSeconds: 0,
        },
      };

      // 3D Mesh
      const meshContainer = createCharacterMesh(entity);
      this.charactersGroup.add(meshContainer.root);
      this.characterMeshes.set(entity.id, meshContainer);

      return entity;
    });

    this.callbacks.onPlayersUpdate([...this.players]);
    this.callbacks.onCatcherChange(this.currentCatcherId);

    // Begin READY countdown sequence
    this.startReadySequence();

    // Start render loop
    if (!this.animationFrameId) {
      this.lastTime = performance.now();
      this.animate();
    }
  }

  private generatePahadPositions(count: number): PahadData[] {
    const list: PahadData[] = [];
    const height = 2.2;
    const radius = 2.1;

    if (count === 1) {
      list.push({
        id: 1,
        name: 'Pahad 1',
        x: 0,
        z: -2,
        radius: 2.3,
        height,
        assignedPlayerId: null,
        currentOccupantId: null,
        isOccupied: false,
        snatchProgress: 0,
      });
    } else if (count === 2) {
      list.push(
        {
          id: 1,
          name: 'Pahad 1',
          x: -8.5,
          z: -2.5,
          radius,
          height,
          assignedPlayerId: null,
          currentOccupantId: null,
          isOccupied: false,
          snatchProgress: 0,
        },
        {
          id: 2,
          name: 'Pahad 2',
          x: 8.5,
          z: -2.5,
          radius,
          height,
          assignedPlayerId: null,
          currentOccupantId: null,
          isOccupied: false,
          snatchProgress: 0,
        }
      );
    } else if (count === 3) {
      // Triangle layout
      list.push(
        {
          id: 1,
          name: 'Pahad 1',
          x: -9.5,
          z: 3,
          radius,
          height,
          assignedPlayerId: null,
          currentOccupantId: null,
          isOccupied: false,
          snatchProgress: 0,
        },
        {
          id: 2,
          name: 'Pahad 2',
          x: 0,
          z: -9,
          radius,
          height,
          assignedPlayerId: null,
          currentOccupantId: null,
          isOccupied: false,
          snatchProgress: 0,
        },
        {
          id: 3,
          name: 'Pahad 3',
          x: 9.5,
          z: 3,
          radius,
          height,
          assignedPlayerId: null,
          currentOccupantId: null,
          isOccupied: false,
          snatchProgress: 0,
        }
      );
    } else {
      // 4 Pahads - Quad / Diamond layout
      list.push(
        {
          id: 1,
          name: 'Pahad 1',
          x: -9.5,
          z: -7.5,
          radius,
          height,
          assignedPlayerId: null,
          currentOccupantId: null,
          isOccupied: false,
          snatchProgress: 0,
        },
        {
          id: 2,
          name: 'Pahad 2',
          x: 9.5,
          z: -7.5,
          radius,
          height,
          assignedPlayerId: null,
          currentOccupantId: null,
          isOccupied: false,
          snatchProgress: 0,
        },
        {
          id: 3,
          name: 'Pahad 3',
          x: 10.5,
          z: 7.5,
          radius,
          height,
          assignedPlayerId: null,
          currentOccupantId: null,
          isOccupied: false,
          snatchProgress: 0,
        },
        {
          id: 4,
          name: 'Pahad 4',
          x: -10.5,
          z: 7.5,
          radius,
          height,
          assignedPlayerId: null,
          currentOccupantId: null,
          isOccupied: false,
          snatchProgress: 0,
        }
      );
    }
    return list;
  }

  private startReadySequence() {
    this.phase = 'READY_COUNTDOWN';
    this.callbacks.onPhaseChange(this.phase);
    this.readyTimer = 0;
    this.readyStep = 3;

    const catcher = this.players.find(p => p.id === this.currentCatcherId);
    this.callbacks.onNotification({
      id: 'ready-1',
      title: `${catcher ? catcher.name.toUpperCase() : 'PLAYER 1'} IS THE CATCHER!`,
      subtitle: 'Non-catcher players must stay on their Pahads!',
      type: 'READY',
      timestamp: Date.now(),
      duration: 2000,
    });
    sound.playReadyCountdown(3);
  }

  public toggleAI(playerId: PlayerId) {
    const player = this.players.find(p => p.id === playerId);
    if (player) {
      player.isAI = !player.isAI;
      this.callbacks.onPlayersUpdate([...this.players]);
    }
  }

  public setPhase(phase: GamePhase) {
    this.phase = phase;
    this.callbacks.onPhaseChange(phase);
    if (phase === 'PLAYING') {
      sound.startMusic();
    }
  }

  private animate = () => {
    if (this.isDestroyed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const delta = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // Update game logic according to current phase
    if (this.phase === 'READY_COUNTDOWN') {
      this.updateReadyCountdown(delta);
    } else if (this.phase === 'PLAYING') {
      this.updateGameplay(delta);
    } else if (this.phase === 'TRANSITION') {
      this.updateTransition(delta);
    }

    // Update environments & animations
    if (this.envResult) {
      this.envResult.updateEnvironment(delta, this.pahads);
    }

    // Update characters
    this.players.forEach((p) => {
      const meshContainer = this.characterMeshes.get(p.id);
      if (meshContainer) {
        meshContainer.updateAnimation(delta, p, p.role === 'CATCHER');
      }
    });

    // Camera follow
    this.updateCamera(delta);

    // Render
    this.renderer.render(this.scene, this.camera);
  };

  private updateReadyCountdown(delta: number) {
    this.readyTimer += delta;
    if (this.readyStep === 3 && this.readyTimer >= 1.6) {
      this.readyStep = 2;
      this.callbacks.onNotification({
        id: 'ready-2',
        title: 'READY?',
        subtitle: 'Watch out when stepping on the ground!',
        type: 'READY',
        timestamp: Date.now(),
        duration: 1200,
      });
      sound.playReadyCountdown(1);
    } else if (this.readyStep === 2 && this.readyTimer >= 2.8) {
      this.readyStep = 1;
      this.callbacks.onNotification({
        id: 'ready-3',
        title: 'RUN!',
        subtitle: 'Climb, Move, Survive!',
        type: 'RUN',
        timestamp: Date.now(),
        duration: 1500,
      });
      sound.playRunWhistle();
      sound.startMusic();
      this.phase = 'PLAYING';
      this.callbacks.onPhaseChange('PLAYING');
    }
  }

  private updateGameplay(delta: number) {
    // 1. Process player inputs and movement
    this.players.forEach((player) => {
      // Decrease grace timer
      if (player.graceTimer > 0) {
        player.graceTimer = Math.max(0, player.graceTimer - delta);
      }

      let moveX = 0;
      let moveZ = 0;

      if (player.isAI) {
        const aiMove = this.calculateAIMovement(player);
        moveX = aiMove.x;
        moveZ = aiMove.z;
      } else {
        // Human Keyboard Input
        if (this.activeKeys.has(player.controls.forward)) moveZ -= 1;
        if (this.activeKeys.has(player.controls.backward)) moveZ += 1;
        if (this.activeKeys.has(player.controls.left)) moveX -= 1;
        if (this.activeKeys.has(player.controls.right)) moveX += 1;
      }

      // Normalize diagonal movement
      const inputLen = Math.sqrt(moveX * moveX + moveZ * moveZ);
      if (inputLen > 0.001) {
        moveX /= inputLen;
        moveZ /= inputLen;

        // Smooth rotation to face movement
        const desiredRot = Math.atan2(moveX, moveZ);
        // Angle diff
        let diff = desiredRot - player.rotation;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        player.rotation += diff * Math.min(1, delta * 14);
      }

      // Physics: Speed and Acceleration
      // Catcher is given a slight speed advantage on ground, rewarding strategic Pahad climbs
      const baseMaxSpeed = player.role === 'CATCHER' ? 7.6 : 6.8;
      const acceleration = 38;
      const friction = 26;

      if (inputLen > 0.01) {
        player.vx += moveX * acceleration * delta;
        player.vz += moveZ * acceleration * delta;
        // Limit to max speed
        const speed = Math.sqrt(player.vx * player.vx + player.vz * player.vz);
        if (speed > baseMaxSpeed) {
          player.vx = (player.vx / speed) * baseMaxSpeed;
          player.vz = (player.vz / speed) * baseMaxSpeed;
        }

        // Random footstep sound
        if (Math.random() < 0.035) {
          sound.playStep(player.state === 'ON_PAHAD');
        }
      } else {
        // Friction / Deceleration
        const speed = Math.sqrt(player.vx * player.vx + player.vz * player.vz);
        if (speed > 0.05) {
          const drop = friction * delta;
          const newSpeed = Math.max(0, speed - drop);
          player.vx = (player.vx / speed) * newSpeed;
          player.vz = (player.vz / speed) * newSpeed;
        } else {
          player.vx = 0;
          player.vz = 0;
        }
      }

      // Apply positions
      player.x += player.vx * delta;
      player.z += player.vz * delta;

      // Soccer ball interaction (bump it if player collides!)
      if (this.envResult && this.envResult.soccerBall) {
        const ball = this.envResult.soccerBall;
        const distToBall = Math.sqrt((player.x - ball.x) ** 2 + (player.z - ball.z) ** 2);
        if (distToBall < 0.75) {
          const kickDirX = (ball.x - player.x) / (distToBall || 1);
          const kickDirZ = (ball.z - player.z) / (distToBall || 1);
          ball.vx = kickDirX * 10;
          ball.vz = kickDirZ * 10;
          sound.playLand();
        }
      }

      // Boundary limits (keep inside playground fence)
      const bound = 19.5;
      if (player.x < -bound) { player.x = -bound; player.vx = 0; }
      if (player.x > bound) { player.x = bound; player.vx = 0; }
      if (player.z < -bound) { player.z = -bound; player.vz = 0; }
      if (player.z > bound) { player.z = bound; player.vz = 0; }

      // 2. Pahad Height & Collision Detection
      let foundPahad: PahadData | null = null;
      for (const pahad of this.pahads) {
        const dist = Math.sqrt((player.x - pahad.x) ** 2 + (player.z - pahad.z) ** 2);
        if (dist <= pahad.radius) {
          foundPahad = pahad;
          break;
        }
      }

      const wasOnPahad = player.state === 'ON_PAHAD';

      if (foundPahad) {
        if (player.role === 'CATCHER') {
          // CATCHER tries to climb Pahad:
          // Can ONLY climb if Pahad is NOT currently occupied by a safe runner!
          // ("Catcher cannot tag on Pahad. Pahad = Safe.")
          if (foundPahad.currentOccupantId !== null && foundPahad.currentOccupantId !== player.id) {
            // Repel Catcher! Catcher cannot climb onto an occupied safe Pahad
            const angle = Math.atan2(player.z - foundPahad.z, player.x - foundPahad.x) || 0;
            player.x = foundPahad.x + Math.cos(angle) * (foundPahad.radius + 0.35);
            player.z = foundPahad.z + Math.sin(angle) * (foundPahad.radius + 0.35);
            player.vx = Math.cos(angle) * 3;
            player.vz = Math.sin(angle) * 3;
            player.state = 'ON_GROUND';
            player.currentPahadId = null;
            player.y = 0;
          } else {
            // Empty Pahad! Catcher climbs onto it to snatch it!
            player.state = 'ON_PAHAD';
            player.currentPahadId = foundPahad.id;
            player.y = foundPahad.height;
            player.isAirborne = false;
          }
        } else {
          // NON-CATCHER tries to stand on Pahad:
          // STRICT RULE: Only ONE player per Pahad! No piling up!
          if (foundPahad.currentOccupantId !== null && foundPahad.currentOccupantId !== player.id) {
            // Pahad is already occupied by someone else! Push this player off back to ground!
            const angle = Math.atan2(player.z - foundPahad.z, player.x - foundPahad.x) || 0;
            player.x = foundPahad.x + Math.cos(angle) * (foundPahad.radius + 0.35);
            player.z = foundPahad.z + Math.sin(angle) * (foundPahad.radius + 0.35);
            player.vx = Math.cos(angle) * 3;
            player.vz = Math.sin(angle) * 3;
            player.state = 'ON_GROUND';
            player.currentPahadId = null;
            player.y = 0;

            if (!player.isAI && Math.random() < 0.04) {
              sound.playStep(false);
              this.callbacks.onNotification({
                id: `full-${foundPahad.id}-${Date.now()}`,
                title: 'PAHAD OCCUPIED!',
                subtitle: `Only 1 player per Pahad! Find another one!`,
                type: 'READY',
                timestamp: Date.now(),
                duration: 1200,
              });
            }
          } else {
            // Safe on Pahad!
            player.state = 'ON_PAHAD';
            player.currentPahadId = foundPahad.id;
            player.y = foundPahad.height;
            player.isAirborne = false;

            if (!wasOnPahad || foundPahad.currentOccupantId !== player.id) {
              sound.playLand();
              sound.playSafe();

              // If player was occupying another Pahad earlier, vacate that old one
              const oldPahad = this.pahads.find(p => p.id !== foundPahad.id && p.currentOccupantId === player.id);
              if (oldPahad) {
                oldPahad.currentOccupantId = null;
                oldPahad.isOccupied = false;
              }

              foundPahad.currentOccupantId = player.id;
              foundPahad.isOccupied = true;
              foundPahad.assignedPlayerId = player.id;
              player.assignedPahadId = foundPahad.id;
              player.stats.pahadsSwitched++;
              this.callbacks.onNotification({
                id: `safe-${player.id}-${Date.now()}`,
                title: `${player.name.toUpperCase()} IS SAFE!`,
                subtitle: `Secured ${foundPahad.name}`,
                type: 'SAFE',
                timestamp: Date.now(),
                duration: 1000,
              });
            }
          }
        }
      } else {
        // Player is off all Pahads -> ON GROUND
        player.state = 'ON_GROUND';
        player.currentPahadId = null;

        // If player just stepped down from Pahad:
        if (wasOnPahad) {
          sound.playStep(false);
          // Vacate the pahad they just left
          const leftPahad = this.pahads.find(p => p.currentOccupantId === player.id);
          if (leftPahad) {
            leftPahad.currentOccupantId = null;
            leftPahad.isOccupied = false;
          }
        }

        // Smoothly return Y to ground
        if (player.y > 0) {
          player.y = Math.max(0, player.y - delta * 12);
        } else {
          player.y = 0;
        }

        // Track stats
        if (player.role === 'PAHAD_PLAYER') {
          player.stats.timeOnGroundSeconds += delta;
        }
      }
    });

    // 3. CHECK FOR CATCHER ACTIONS:
    // A. Check for "PAHAD SNATCH" (Catcher takes an empty player's Pahad)
    // B. Check for "GROUND CATCH" (Catcher tags an ON_GROUND player)
    const catcher = this.players.find(p => p.id === this.currentCatcherId);
    if (!catcher) return;

    // Check Pahad Snatch: Catcher reaches and steps onto an unoccupied Pahad
    if (catcher.state === 'ON_PAHAD' && catcher.currentPahadId !== null) {
      const snatchedPahad = this.pahads.find(p => p.id === catcher.currentPahadId);
      if (snatchedPahad) {
        // Find which non-catcher player lost their Pahad
        // 1. Check who was the assigned owner of this snatched Pahad
        let displacedPlayer = this.players.find(
          p => p.role === 'PAHAD_PLAYER' && p.assignedPahadId === snatchedPahad.id
        );

        // 2. If the assigned owner already grabbed another Pahad, find any runner currently on the ground without a Pahad
        if (!displacedPlayer) {
          displacedPlayer = this.players.find(
            p => p.role === 'PAHAD_PLAYER' && p.currentPahadId === null
          );
        }

        // 3. Ultimate fallback
        if (!displacedPlayer) {
          displacedPlayer = this.players.find(p => p.role === 'PAHAD_PLAYER');
        }

        if (displacedPlayer) {
          this.triggerTransition(displacedPlayer, catcher, 'PAHAD_TAKEN', snatchedPahad);
          return;
        }
      }
    }

    // Check Ground Catch: Catcher tags a vulnerable player on the ground
    if (catcher.state === 'ON_GROUND') {
      for (const victim of this.players) {
        if (victim.role === 'PAHAD_PLAYER' && victim.state === 'ON_GROUND' && victim.graceTimer <= 0) {
          const dist = Math.sqrt((catcher.x - victim.x) ** 2 + (catcher.z - victim.z) ** 2);
          // Catch distance is 1.45 units
          if (dist <= 1.45) {
            this.triggerTransition(victim, catcher, 'CAUGHT');
            return;
          }
        }
      }
    }

    this.callbacks.onPlayersUpdate([...this.players]);
  }

  private triggerTransition(
    outPlayer: PlayerEntity,
    prevCatcher: PlayerEntity,
    reason: 'CAUGHT' | 'PAHAD_TAKEN',
    snatchedPahad?: PahadData
  ) {
    this.phase = 'TRANSITION';
    this.callbacks.onPhaseChange('TRANSITION');
    this.transitionTimer = 0;

    outPlayer.state = 'CAUGHT';
    outPlayer.stats.timesCaught++;
    prevCatcher.stats.pahadsCaptured++;

    // Audio & Visual Effects
    if (reason === 'PAHAD_TAKEN') {
      sound.playPahadTaken();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f59e0b', '#3b82f6'],
      });
      this.callbacks.onNotification({
        id: `taken-${Date.now()}`,
        title: 'PAHAD TAKEN!',
        subtitle: `${prevCatcher.name} captured ${outPlayer.name}'s Pahad!`,
        type: 'PAHAD_TAKEN',
        timestamp: Date.now(),
        duration: 2200,
      });
    } else {
      sound.playCaught();
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#ef4444', '#10b981', '#f59e0b'],
      });
      this.callbacks.onNotification({
        id: `caught-${Date.now()}`,
        title: 'CAUGHT!',
        subtitle: `${prevCatcher.name} tagged ${outPlayer.name} on the ground!`,
        type: 'CAUGHT',
        timestamp: Date.now(),
        duration: 2200,
      });
    }

    // Assign roles:
    // Displaced or caught player becomes the NEW CATCHER
    this.currentCatcherId = outPlayer.id;

    // Transition delay before resuming
    setTimeout(() => {
      this.executeRoleSwitch(outPlayer, prevCatcher, snatchedPahad);
    }, 1600);
  }

  private executeRoleSwitch(
    newCatcher: PlayerEntity,
    prevCatcher: PlayerEntity,
    snatchedPahad?: PahadData
  ) {
    // 1. Previous catcher becomes a normal Pahad player
    prevCatcher.role = 'PAHAD_PLAYER';

    // Move previous Catcher safely onto the snatched Pahad or an available Pahad
    let targetPahad: PahadData | undefined = snatchedPahad;
    if (!targetPahad) {
      targetPahad = this.pahads.find(p => !p.isOccupied) || this.pahads[0];
    }

    if (targetPahad) {
      targetPahad.assignedPlayerId = prevCatcher.id;
      targetPahad.currentOccupantId = prevCatcher.id;
      targetPahad.isOccupied = true;
      prevCatcher.assignedPahadId = targetPahad.id;
      prevCatcher.currentPahadId = targetPahad.id;
      prevCatcher.state = 'ON_PAHAD';
      prevCatcher.x = targetPahad.x;
      prevCatcher.y = targetPahad.height;
      prevCatcher.z = targetPahad.z;
    }

    // 2. New Catcher begins on the ground with full visibility & control
    newCatcher.role = 'CATCHER';
    newCatcher.state = 'ON_GROUND';
    newCatcher.assignedPahadId = null;
    newCatcher.currentPahadId = null;
    newCatcher.y = 0;

    // Safely position new catcher on the ground outside targetPahad so they don't immediately collide
    if (targetPahad) {
      const angle = Math.atan2(newCatcher.z - targetPahad.z, newCatcher.x - targetPahad.x) || (Math.PI / 4);
      newCatcher.x = targetPahad.x + Math.cos(angle) * (targetPahad.radius + 1.6);
      newCatcher.z = targetPahad.z + Math.sin(angle) * (targetPahad.radius + 1.6);
    }
    newCatcher.vx = 0;
    newCatcher.vz = 0;

    // Set grace reaction timer for 1.8 seconds so players have time to scatter
    newCatcher.graceTimer = 1.8;
    this.players.forEach(p => {
      if (p.id !== newCatcher.id) {
        p.graceTimer = 1.8;
      }
    });

    this.callbacks.onCatcherChange(this.currentCatcherId);
    this.callbacks.onNotification({
      id: `new-catcher-${Date.now()}`,
      title: 'NEW CATCHER!',
      subtitle: `${newCatcher.name.toUpperCase()} is now the Catcher! RUN!`,
      type: 'NEW_CATCHER',
      timestamp: Date.now(),
      duration: 1800,
    });

    sound.playRunWhistle();

    this.phase = 'PLAYING';
    this.callbacks.onPhaseChange('PLAYING');
    this.callbacks.onPlayersUpdate([...this.players]);
  }

  private updateTransition(delta: number) {
    this.transitionTimer += delta;
    // Keep characters slightly animated during transition
  }

  // Realistic bot behaviors for practice / solo testing or unfilled slots
  private calculateAIMovement(bot: PlayerEntity): { x: number; z: number } {
    const catcher = this.players.find(p => p.role === 'CATCHER');
    if (!catcher) return { x: 0, z: 0 };

    if (bot.role === 'CATCHER') {
      // 1. Catcher Bot Strategy:
      // Look for any empty Pahad where no non-catcher is standing!
      const targetEmptyPahad = this.pahads.find(p => p.currentOccupantId === null && !p.isOccupied);

      // If empty Pahad exists and catcher is reasonably near or ground runners are far:
      if (targetEmptyPahad) {
        const distToPahad = Math.sqrt((bot.x - targetEmptyPahad.x) ** 2 + (bot.z - targetEmptyPahad.z) ** 2);
        let nearestGroundDist = 999;
        for (const pl of this.players) {
          if (pl.id !== bot.id && pl.state === 'ON_GROUND') {
            const d = Math.sqrt((bot.x - pl.x) ** 2 + (bot.z - pl.z) ** 2);
            if (d < nearestGroundDist) nearestGroundDist = d;
          }
        }

        // Prioritize snatching empty Pahad if nearby or nobody to tag directly
        if (distToPahad < 12 || nearestGroundDist > 7) {
          const dx = targetEmptyPahad.x - bot.x;
          const dz = targetEmptyPahad.z - bot.z;
          return { x: dx, z: dz };
        }
      }

      // Otherwise, hunt nearest vulnerable player on the ground
      let nearestGroundPlayer: PlayerEntity | null = null;
      let minDist = 999;
      for (const pl of this.players) {
        if (pl.id !== bot.id && pl.state === 'ON_GROUND') {
          const d = Math.sqrt((bot.x - pl.x) ** 2 + (bot.z - pl.z) ** 2);
          if (d < minDist) {
            minDist = d;
            nearestGroundPlayer = pl;
          }
        }
      }

      if (nearestGroundPlayer) {
        return {
          x: nearestGroundPlayer.x - bot.x,
          z: nearestGroundPlayer.z - bot.z,
        };
      }

      // If everyone is safe on Pahads, circle around center and tempt them
      return {
        x: -bot.z * 0.4 + (Math.sin(performance.now() * 0.002) * 2),
        z: bot.x * 0.4 + (Math.cos(performance.now() * 0.002) * 2),
      };
    } else {
      // 2. Non-Catcher Bot Strategy:
      const distToCatcher = Math.sqrt((bot.x - catcher.x) ** 2 + (bot.z - catcher.z) ** 2);

      if (bot.state === 'ON_PAHAD') {
        // Safe on Pahad.
        // ONLY consider teasing or hopping if there is a genuinely EMPTY Pahad!
        const trulyEmptyPahad = this.pahads.find(
          p => p.id !== bot.currentPahadId && p.currentOccupantId === null && !p.isOccupied
        );

        const canTease = trulyEmptyPahad && distToCatcher > 14 && Math.random() < 0.005;
        if (canTease && trulyEmptyPahad) {
          return { x: trulyEmptyPahad.x - bot.x, z: trulyEmptyPahad.z - bot.z };
        }

        // Keep position centered on current Pahad
        const myPahad = this.pahads.find(p => p.id === bot.currentPahadId);
        if (myPahad) {
          const offX = bot.x - myPahad.x;
          const offZ = bot.z - myPahad.z;
          if (Math.sqrt(offX * offX + offZ * offZ) > myPahad.radius * 0.5) {
            return { x: -offX, z: -offZ };
          }
        }
        return { x: 0, z: 0 };
      } else {
        // ON GROUND: RUN FOR SAFETY!
        // ONLY target an UNOCCUPIED Pahad! Never an occupied one!
        const freePahads = this.pahads.filter(
          p => p.currentOccupantId === null || p.currentOccupantId === bot.id
        );

        let bestPahad: PahadData | null = null;
        if (freePahads.length > 0) {
          // If assigned home Pahad is free, prioritize it
          const myHome = freePahads.find(p => p.id === bot.assignedPahadId);
          if (myHome) {
            bestPahad = myHome;
          } else {
            // Nearest free Pahad
            let minDist = 999;
            for (const p of freePahads) {
              const d = Math.sqrt((bot.x - p.x) ** 2 + (bot.z - p.z) ** 2);
              if (d < minDist) {
                minDist = d;
                bestPahad = p;
              }
            }
          }
        }

        if (bestPahad) {
          const toPahadX = bestPahad.x - bot.x;
          const toPahadZ = bestPahad.z - bot.z;
          // Evade catcher while heading to pahad
          const awayFromCatcherX = bot.x - catcher.x;
          const awayFromCatcherZ = bot.z - catcher.z;
          return {
            x: toPahadX + (distToCatcher < 5 ? awayFromCatcherX * 1.5 : 0),
            z: toPahadZ + (distToCatcher < 5 ? awayFromCatcherZ * 1.5 : 0),
          };
        }
        return { x: bot.x - catcher.x, z: bot.z - catcher.z };
      }
    }
  }

  private updateCamera(delta: number) {
    if (this.players.length === 0) return;

    // Focus camera on centroid of catcher + active players
    const catcher = this.players.find(p => p.id === this.currentCatcherId);
    let targetX = catcher ? catcher.x * 0.45 : 0;
    let targetZ = catcher ? catcher.z * 0.45 : 0;

    // Average with other players
    this.players.forEach(p => {
      targetX += (p.x * 0.55) / this.players.length;
      targetZ += (p.z * 0.55) / this.players.length;
    });

    const camTargetPos = new THREE.Vector3(targetX, 22, targetZ + 24);
    this.camera.position.lerp(camTargetPos, delta * 3.5);
    this.camera.lookAt(targetX, 1.2, targetZ - 1.5);
  }

  public getPlayers(): PlayerEntity[] {
    return this.players;
  }

  public getPahads(): PahadData[] {
    return this.pahads;
  }

  public getCurrentCatcherId(): PlayerId {
    return this.currentCatcherId;
  }

  public getPhase(): GamePhase {
    return this.phase;
  }

  public restartMatch() {
    this.setupMatch(this.playerCount);
  }

  public dispose() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    sound.stopMusic();
    this.characterMeshes.forEach(m => {
      m.dispose();
      this.charactersGroup.remove(m.root);
      this.scene.remove(m.root);
    });
    this.characterMeshes.clear();
    while (this.charactersGroup.children.length > 0) {
      this.charactersGroup.remove(this.charactersGroup.children[0]);
    }
    this.scene.remove(this.charactersGroup);
    if (this.envResult) {
      this.envResult.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
    }
  }
}
