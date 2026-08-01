export type GameStateMode = 'START' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  x: number;
  y: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  lives: number;
  maxLives: number;
  invulnerableTimer: number; // in seconds or frames
  weaponType: 'single' | 'double' | 'triple';
  weaponTimer: number;
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

export type PowerUpType = 'triple' | 'shield' | 'bomb' | 'life';

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
