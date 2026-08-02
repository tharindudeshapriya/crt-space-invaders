export type GameStateMode = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type CrtThemeMode = 'NEON' | 'PHOSPHOR_GREEN' | 'AMBER_CRT' | 'MONOCHROME';

export type WeaponType = 'single' | 'triple' | 'plasma_beam' | 'homing_missiles' | 'hyper_cannon';

export type PowerUpType = 'triple' | 'shield' | 'bomb' | 'life' | 'beam' | 'missiles' | 'time_freeze' | 'overdrive';

export type EnemyType =
  | 'invader'
  | 'asteroid_lg'
  | 'asteroid_md'
  | 'asteroid_sm'
  | 'saucer'
  | 'boss1'
  | 'boss2'
  | 'boss3'
  | 'boss4';

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

export interface CrtSettings {
  theme: CrtThemeMode;
  scanlineOpacity: number;
  flickerEnabled: boolean;
  vignetteEnabled: boolean;
  bgmMuted: boolean;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  lives: number;
  maxLives: number;
  bombs: number;
  maxBombs: number;
  invulnerableTimer: number;
  weaponType: WeaponType;
  weaponTimer: number;
  timeFreezeTimer: number;
  overdriveTimer: number;
  hasShield: boolean;
  shieldHits: number;
  score: number;
  multiplier: number;
  multiplierTimer: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isPlayer: boolean;
  damage: number;
  isHoming?: boolean;
  targetEnemyId?: string;
  isBeam?: boolean;
  isHyper?: boolean;
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  type: EnemyType;
  health: number;
  maxHealth: number;
  scoreValue: number;
  color: string;
  rotation: number;
  rotSpeed: number;
  zigzagPhase?: number;
  zigzagSpeed?: number;
  shootTimer?: number;
  bossPhase?: number;
  bossAttackTimer?: number;
  bossShieldAngle?: number;
  laserBeamActive?: boolean;
  laserBeamWidth?: number;
  teleportTimer?: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
  shape?: 'square' | 'circle' | 'spark';
}

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
  color: string;
  size: number;
  pulsePhase: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  life: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  alpha: number;
}

export interface AudioSettings {
  muted: boolean;
  volume: number;
}
