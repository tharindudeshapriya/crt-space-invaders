import { GameStateMode, Player, Enemy, CrtThemeMode } from '../types/game';
import { ParticleSystem } from './ParticleSystem';
import { WeaponSystem } from './WeaponSystem';
import { LevelManager } from './LevelManager';
import { BossEngine } from './BossEngine';
import { RenderEngine } from './RenderEngine';
import { soundEngine } from '../lib/audio';

export class CoreEngine {
  public gameState: GameStateMode = 'START';
  public particleSystem = new ParticleSystem();
  public weaponSystem = new WeaponSystem();
  public levelManager = new LevelManager();
  public bossEngine = new BossEngine();
  public renderEngine = new RenderEngine();

  public score: number = 0;
  public highScore: number = 0;
  public wave: number = 1;
  public theme: CrtThemeMode = 'NEON';
  public isBgmMuted: boolean = false;

  public player: Player = {
    x: 382,
    y: 530,
    width: 36,
    height: 36,
    speed: 5.5,
    lives: 3,
    maxLives: 5,
    bombs: 2,
    maxBombs: 5,
    invulnerableTimer: 0,
    weaponType: 'single',
    weaponTimer: 0,
    timeFreezeTimer: 0,
    overdriveTimer: 0,
    hasShield: false,
    shieldHits: 0,
    score: 0,
    multiplier: 1,
    multiplierTimer: 0,
  };

  public enemies: Enemy[] = [];

  public resetGame() {
    this.player = {
      x: 382,
      y: 530,
      width: 36,
      height: 36,
      speed: 5.5,
      lives: 3,
      maxLives: 5,
      bombs: 2,
      maxBombs: 5,
      invulnerableTimer: 0,
      weaponType: 'single',
      weaponTimer: 0,
      timeFreezeTimer: 0,
      overdriveTimer: 0,
      hasShield: false,
      shieldHits: 0,
      score: 0,
      multiplier: 1,
      multiplierTimer: 0,
    };
    this.weaponSystem.bullets = [];
    this.enemies = [];
    this.particleSystem.particles = [];
    this.particleSystem.floatingTexts = [];
    this.score = 0;
    this.wave = 1;
    this.levelManager.setWave(1);
    this.gameState = 'PLAYING';

    soundEngine.setBGMTempo(135);
    if (!this.isBgmMuted) {
      soundEngine.startBGM();
    }
  }

  public triggerEMPBomb() {
    if (this.player.bombs <= 0) {
      soundEngine.playHit();
      this.particleSystem.addFloatingText(this.player.x, this.player.y - 20, 'NO BOMBS LEFT!', '#ff007f');
      return;
    }

    this.player.bombs -= 1;
    soundEngine.playBomb();
    this.particleSystem.addScreenShake(18);

    this.enemies.forEach((enemy) => {
      this.particleSystem.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 14);
      this.score += enemy.scoreValue * this.player.multiplier;
    });

    this.weaponSystem.bullets = this.weaponSystem.bullets.filter((b) => b.isPlayer);
    this.enemies = [];
    this.particleSystem.addFloatingText(400 - 80, 300, `EMP BOMB! (${this.player.bombs} LEFT)`, '#ffe600');
  }
}
