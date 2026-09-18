export type PlayerId = 'p1' | 'p2' | 'p3' | 'p4' | 'p5';

export type PlayerRole = 'CATCHER' | 'PAHAD_PLAYER';

export type PlayerState = 
  | 'ON_PAHAD' 
  | 'ON_GROUND' 
  | 'TRANSITION' 
  | 'CAUGHT';

export interface PlayerConfig {
  id: PlayerId;
  name: string;
  badge: string;
  color: string;
  hexColor: string;
  shirtColor: number;
  pantsColor: number;
  hairColor: number;
  skinColor: number;
  hairStyle: 'spiky' | 'ponytail' | 'cap' | 'bob' | 'curly';
  controls: {
    forward: string;
    backward: string;
    left: string;
    right: string;
    jump?: string;
  };
  controlLabel: string;
  isAI: boolean;
}

export interface PlayerEntity extends PlayerConfig {
  role: PlayerRole;
  state: PlayerState;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rotation: number;
  targetRotation: number;
  currentPahadId: number | null; // which Pahad they are standing on or assigned to
  assignedPahadId: number | null; // Home pahad assigned to this player
  isGrounded: boolean;
  isAirborne: boolean;
  graceTimer: number; // Invulnerability / reaction time right after a transition
  stats: {
    timesCaught: number;
    pahadsCaptured: number;
    pahadsSwitched: number;
    timeOnGroundSeconds: number;
  };
}

export interface PahadData {
  id: number;
  name: string;
  x: number;
  z: number;
  radius: number;
  height: number;
  assignedPlayerId: PlayerId | null;
  currentOccupantId: PlayerId | null;
  isOccupied: boolean;
  snatchProgress: number;
}

export type GamePhase = 
  | 'MENU' 
  | 'READY_COUNTDOWN' 
  | 'PLAYING' 
  | 'TRANSITION' 
  | 'PAUSED';

export interface GameEventNotification {
  id: string;
  title: string;
  subtitle: string;
  type: 'READY' | 'RUN' | 'CAUGHT' | 'PAHAD_TAKEN' | 'NEW_CATCHER' | 'SAFE';
  timestamp: number;
  duration: number;
}
