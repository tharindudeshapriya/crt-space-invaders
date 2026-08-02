export type GameStateMode = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type WeaponType = 'single' | 'triple' | 'railgun' | 'homing' | 'wave';

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
  maxWeaponTimer: number;
  weaponLevel: number; // 1, 2, or 3 (MAX)
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
  piercing?: boolean;
  isHoming?: boolean;
  targetEnemyId?: string;
  bulletType?: WeaponType | 'enemy';
}

export type EnemyType = 'invader' | 'asteroid_lg' | 'asteroid_md' | 'asteroid_sm' | 'saucer';

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

export type PowerUpType = 'w_triple' | 'w_railgun' | 'w_homing' | 'w_wave' | 'shield' | 'bomb' | 'life';

export interface PowerUp {
  id: string;
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
  color: string;
  size: number;
  pulsePhase: number;
  label: string;
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
