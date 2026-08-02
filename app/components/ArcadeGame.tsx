'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameStateMode,
  Player,
  Bullet,
  Enemy,
  Particle,
  PowerUp,
  FloatingText,
  Star,
  PowerUpType,
  WeaponType,
  LeaderboardEntry,
  CrtThemeMode,
} from '../types/game';
import { soundEngine } from '../lib/audio';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const HIGH_SCORE_KEY = 'crt_space_invaders_hi_score';
const LEADERBOARD_KEY = 'crt_space_invaders_leaderboard';

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { name: 'ACE', score: 12500, date: '1984-06-12' },
  { name: 'NEO', score: 9800, date: '1984-07-20' },
  { name: 'CRT', score: 7200, date: '1984-08-01' },
  { name: 'VAL', score: 4500, date: '1984-08-15' },
  { name: 'RAD', score: 2800, date: '1984-09-01' },
];

const getThemePalette = (theme: CrtThemeMode = 'NEON') => {
  switch (theme) {
    case 'PHOSPHOR_GREEN':
      return { primary: '#00ff66', secondary: '#00e65c', accent: '#00cc4b', gold: '#00ff66', bg: '#030a05' };
    case 'AMBER_CRT':
      return { primary: '#ff9900', secondary: '#ffaa33', accent: '#cc7a00', gold: '#ffcc00', bg: '#0c0702' };
    case 'MONOCHROME':
      return { primary: '#ffffff', secondary: '#dddddd', accent: '#888888', gold: '#ffffff', bg: '#080808' };
    case 'NEON':
    default:
      return { primary: '#00ff66', secondary: '#00f0ff', accent: '#ff007f', gold: '#ffe600', bg: '#030806' };
  }
};

const getLevelDetails = (waveNum: number) => {
  if (waveNum <= 3) return { level: 1, name: 'LEVEL 1: DEEP SPACE PATROL' };
  if (waveNum <= 6) return { level: 2, name: 'LEVEL 2: ASTEROID BELT HAZARD' };
  if (waveNum <= 9) return { level: 3, name: 'LEVEL 3: NEBULA PLASMA STORM' };
  if (waveNum <= 12) return { level: 4, name: 'LEVEL 4: ALIEN ARMADA BASE' };
  return { level: 5, name: 'LEVEL 5: CORE OVERLORD' };
};

interface ArcadeGameProps {
  theme?: CrtThemeMode;
  isBgmMuted?: boolean;
}

export default function ArcadeGame({ theme = 'NEON', isBgmMuted = false }: ArcadeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React State for UI & CRT Controls
  const [gameState, setGameState] = useState<GameStateMode>('START');
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [bombs, setBombs] = useState<number>(2);
  const [wave, setWave] = useState<number>(1);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeWeapon, setActiveWeapon] = useState<string>('SINGLE LASERS');
  const [shieldActive, setShieldActive] = useState<boolean>(false);
  const [activeLevelName, setActiveLevelName] = useState<string>('LEVEL 1: DEEP SPACE PATROL');

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);
  const leaderboardRef = useRef<LeaderboardEntry[]>(DEFAULT_LEADERBOARD);
  const [pilotInitials, setPilotInitials] = useState<string>('ACE');
  const [savedScore, setSavedScore] = useState<boolean>(false);

  // References for high performance Canvas Game Loop without stale closures
  const stateRef = useRef<GameStateMode>('START');
  const scoreRef = useRef<number>(0);
  const highScoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const waveRef = useRef<number>(1);
  const multiplierRef = useRef<number>(1);
  const multiplierTimerRef = useRef<number>(0);

  // Level & Banner Ref
  const levelBannerTextRef = useRef<string>('LEVEL 1: DEEP SPACE PATROL');
  const levelBannerTimerRef = useRef<number>(120);

  // Combo & Streak Counters
  const comboCountRef = useRef<number>(0);
  const comboTimerRef = useRef<number>(0);

  // Entity storage refs
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const playerRef = useRef<Player>({
    x: CANVAS_WIDTH / 2 - 18,
    y: CANVAS_HEIGHT - 70,
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
  });

  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const starsRef = useRef<Star[]>([]);

  // Mouse & Touch Pointer Reference
  const pointerRef = useRef<{
    x: number;
    y: number;
    active: boolean;
    firing: boolean;
    lastX: number;
    vx: number;
  }>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 70,
    active: false,
    firing: false,
    lastX: CANVAS_WIDTH / 2,
    vx: 0,
  });

  const updatePointerPosition = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const targetX = (clientX - rect.left) * scaleX;
    const targetY = (clientY - rect.top) * scaleY;

    const vx = targetX - pointerRef.current.lastX;
    pointerRef.current.lastX = targetX;
    pointerRef.current.vx = vx;
    pointerRef.current.x = targetX;
    pointerRef.current.y = targetY;
    pointerRef.current.active = true;
  };

  // System timers & frame ref
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const fireCooldownRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);
  const screenShakeRef = useRef<number>(0);

  // Load High Score & Leaderboard on Mount
  useEffect(() => {
    stateRef.current = gameState;
    const savedHi = localStorage.getItem(HIGH_SCORE_KEY);
    if (savedHi) {
      const parsed = parseInt(savedHi, 10);
      if (!isNaN(parsed)) {
        setHighScore(parsed);
        highScoreRef.current = parsed;
      }
    }

    const savedLb = localStorage.getItem(LEADERBOARD_KEY);
    if (savedLb) {
      try {
        const parsed = JSON.parse(savedLb);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLeaderboard(parsed);
          leaderboardRef.current = parsed;
        }
      } catch {
        // Fallback
      }
    }

    // Generate initial starfield
    const palette = getThemePalette(theme);
    const stars: Star[] = [];
    const colors = [palette.primary, palette.secondary, palette.accent, palette.gold, '#ffffff'];
    for (let i = 0; i < 85; i++) {
      stars.push({
        x: Math.random() * CANVAS_WIDTH,
        y: Math.random() * CANVAS_HEIGHT,
        size: Math.random() < 0.7 ? 1 : Math.random() < 0.9 ? 2 : 3,
        speed: 0.5 + Math.random() * 2.0,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.3 + Math.random() * 0.7,
      });
    }
    starsRef.current = stars;
  }, [theme]);

  // Sync ref with React state
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  // Restart Game logic
  const resetGame = useCallback(() => {
    playerRef.current = {
      x: CANVAS_WIDTH / 2 - 18,
      y: CANVAS_HEIGHT - 70,
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
    bulletsRef.current = [];
    enemiesRef.current = [];
    particlesRef.current = [];
    powerUpsRef.current = [];
    floatingTextsRef.current = [];

    scoreRef.current = 0;
    livesRef.current = 3;
    waveRef.current = 1;
    multiplierRef.current = 1;
    multiplierTimerRef.current = 0;
    comboCountRef.current = 0;
    comboTimerRef.current = 0;

    levelBannerTextRef.current = 'LEVEL 1: DEEP SPACE PATROL';
    levelBannerTimerRef.current = 120;
    setActiveLevelName('LEVEL 1: DEEP SPACE PATROL');

    setScore(0);
    setLives(3);
    setBombs(2);
    setWave(1);
    setMultiplier(1);
    setActiveWeapon('SINGLE LASERS');
    setShieldActive(false);
    setSavedScore(false);

    setGameState('PLAYING');
    stateRef.current = 'PLAYING';

    soundEngine.setBGMTempo(135);
    if (!isBgmMuted) {
      soundEngine.startBGM();
    }
  }, [isBgmMuted]);

  // Screen shake trigger helper
  const addScreenShake = (intensity: number) => {
    screenShakeRef.current = Math.max(screenShakeRef.current, intensity);
  };

  // Add Floating Text helper
  const addFloatingText = (x: number, y: number, text: string, color: string = '#00ff66') => {
    floatingTextsRef.current.push({
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      text,
      color,
      alpha: 1.0,
      vy: -1.2,
      life: 45,
    });
  };

  // Save High Score Leaderboard Record
  const saveLeaderboardRecord = () => {
    if (scoreRef.current <= 0 || savedScore) return;
    const cleanName = pilotInitials.toUpperCase().trim().slice(0, 3) || 'AAA';
    const newEntry: LeaderboardEntry = {
      name: cleanName,
      score: scoreRef.current,
      date: new Date().toISOString().split('T')[0],
    };

    const updated = [...leaderboardRef.current, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    leaderboardRef.current = updated;
    setLeaderboard(updated);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
    setSavedScore(true);
    soundEngine.playPowerUp();
  };

  // Explosion Particle Creator
  const createExplosion = (x: number, y: number, color: string, count: number = 16) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 4.5;
      particlesRef.current.push({
        id: Math.random().toString(36).substring(2, 9),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color,
        alpha: 1.0,
        maxLife: 20 + Math.random() * 25,
        life: 0,
        shape: Math.random() > 0.4 ? 'square' : 'spark',
      });
    }
  };

  // EMP Screen Clear Bomb Power-Up Trigger
  const triggerEMPBomb = () => {
    const player = playerRef.current;
    if (player.bombs <= 0) {
      soundEngine.playHit();
      addFloatingText(player.x, player.y - 20, 'NO BOMBS LEFT!', '#ff007f');
      return;
    }

    player.bombs -= 1;
    setBombs(player.bombs);

    soundEngine.playBomb();
    addScreenShake(18);

    enemiesRef.current.forEach((enemy) => {
      createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 14);
      scoreRef.current += enemy.scoreValue * multiplierRef.current;
    });

    bulletsRef.current = bulletsRef.current.filter((b) => b.isPlayer);
    enemiesRef.current = [];

    addFloatingText(CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT / 2, `EMP BOMB! (${player.bombs} REMAINING)`, '#ffe600');
    setScore(scoreRef.current);
  };

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyE'].includes(e.code)) {
        e.preventDefault();
      }

      keysRef.current[e.code] = true;

      if (e.code === 'Space') {
        if (stateRef.current === 'START' || stateRef.current === 'GAMEOVER') {
          resetGame();
        }
      }

      if (e.code === 'KeyB' || e.code === 'KeyE') {
        if (stateRef.current === 'PLAYING') {
          triggerEMPBomb();
        }
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        if (stateRef.current === 'PLAYING') {
          setGameState('PAUSED');
          stateRef.current = 'PAUSED';
          soundEngine.stopBGM();
        } else if (stateRef.current === 'PAUSED') {
          setGameState('PLAYING');
          stateRef.current = 'PLAYING';
          if (!isBgmMuted) soundEngine.startBGM();
        }
      }

      if (e.code === 'KeyM') {
        const muted = soundEngine.toggleMute();
        setIsMuted(muted);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyE'].includes(e.code)) {
        e.preventDefault();
      }
      keysRef.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetGame, isBgmMuted]);

  // Main Canvas Game Tick & Render Pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;
    const palette = getThemePalette(theme);

    const gameLoop = (timestamp: number) => {
      tick++;

      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      lastTimeRef.current = timestamp;

      // -------------------------------------------------------------
      // 1. UPDATE GAME LOGIC (Only if state is PLAYING)
      // -------------------------------------------------------------
      if (stateRef.current === 'PLAYING') {
        const player = playerRef.current;

        // Time-Freeze & Overdrive Scaling
        const isTimeFrozen = player.timeFreezeTimer > 0;
        const isOverdrive = player.overdriveTimer > 0;
        const enemySpeedScale = isTimeFrozen ? 0.4 : 1.0;
        const playerSpeedScale = isOverdrive ? 1.6 : 1.0;

        if (player.timeFreezeTimer > 0) player.timeFreezeTimer--;
        if (player.overdriveTimer > 0) player.overdriveTimer--;

        // Level Banner Decay
        if (levelBannerTimerRef.current > 0) {
          levelBannerTimerRef.current--;
        }

        // Player Movement Controls (Keyboard, Mouse, or Touch)
        let dx = 0;
        let dy = 0;
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) dx -= 1;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) dx += 1;
        if (keysRef.current['ArrowUp'] || keysRef.current['KeyW']) dy -= 1;
        if (keysRef.current['ArrowDown'] || keysRef.current['KeyS']) dy += 1;

        if (dx !== 0 || dy !== 0) {
          pointerRef.current.active = false;
          if (dx !== 0 && dy !== 0) {
            dx *= 0.7071;
            dy *= 0.7071;
          }
          player.x += dx * player.speed * playerSpeedScale;
          player.y += dy * player.speed * playerSpeedScale;
        } else if (pointerRef.current.active) {
          const targetX = pointerRef.current.x - player.width / 2;
          const targetY = pointerRef.current.y - player.height / 2;
          player.x += (targetX - player.x) * 0.25 * playerSpeedScale;
          player.y += (targetY - player.y) * 0.25 * playerSpeedScale;
        }

        player.x = Math.max(10, Math.min(CANVAS_WIDTH - player.width - 10, player.x));
        player.y = Math.max(100, Math.min(CANVAS_HEIGHT - player.height - 10, player.y));

        // Player Thruster Particles
        if (tick % 2 === 0) {
          particlesRef.current.push({
            id: Math.random().toString(),
            x: player.x + player.width / 2 + (Math.random() * 6 - 3),
            y: player.y + player.height + 2,
            vx: Math.random() * 0.8 - 0.4,
            vy: 2.0 + Math.random() * 1.5,
            size: 2 + Math.random() * 2,
            color: isOverdrive ? palette.gold : Math.random() > 0.5 ? palette.secondary : palette.primary,
            alpha: 0.9,
            maxLife: 12,
            life: 0,
          });
        }

        // Weapon & Invulnerability Timers
        if (player.weaponTimer > 0) {
          player.weaponTimer--;
          if (player.weaponTimer <= 0) {
            player.weaponType = 'single';
            setActiveWeapon('SINGLE LASERS');
          }
        }

        if (player.invulnerableTimer > 0) {
          player.invulnerableTimer--;
        }

        // Combo Timer Decay
        if (comboTimerRef.current > 0) {
          comboTimerRef.current--;
          if (comboTimerRef.current <= 0) {
            comboCountRef.current = 0;
          }
        }

        // Player Firing with 5 Weapon Systems
        if (fireCooldownRef.current > 0) fireCooldownRef.current--;

        const isFiring = keysRef.current['Space'] || pointerRef.current.firing;
        const cooldownMax = isOverdrive ? 4 : 10;

        if (isFiring && fireCooldownRef.current <= 0) {
          fireCooldownRef.current = cooldownMax;

          if (player.weaponType === 'triple') {
            soundEngine.playLaser();
            bulletsRef.current.push(
              { id: Math.random().toString(), x: player.x + player.width / 2, y: player.y, vx: 0, vy: -11, radius: 3, color: palette.secondary, isPlayer: true, damage: 1 },
              { id: Math.random().toString(), x: player.x + 4, y: player.y + 6, vx: -2.2, vy: -10, radius: 3, color: palette.accent, isPlayer: true, damage: 1 },
              { id: Math.random().toString(), x: player.x + player.width - 4, y: player.y + 6, vx: 2.2, vy: -10, radius: 3, color: palette.accent, isPlayer: true, damage: 1 }
            );
          } else if (player.weaponType === 'plasma_beam') {
            soundEngine.playLaser();
            bulletsRef.current.push({
              id: Math.random().toString(),
              x: player.x + player.width / 2,
              y: player.y - 10,
              vx: 0,
              vy: -14,
              radius: 7,
              color: palette.accent,
              isPlayer: true,
              damage: 2,
              isBeam: true,
            });
          } else if (player.weaponType === 'homing_missiles') {
            soundEngine.playMissile();
            bulletsRef.current.push(
              { id: Math.random().toString(), x: player.x + 4, y: player.y + 10, vx: -1.5, vy: -6, radius: 4, color: palette.gold, isPlayer: true, damage: 2, isHoming: true },
              { id: Math.random().toString(), x: player.x + player.width - 4, y: player.y + 10, vx: 1.5, vy: -6, radius: 4, color: palette.gold, isPlayer: true, damage: 2, isHoming: true }
            );
          } else {
            soundEngine.playLaser();
            bulletsRef.current.push(
              { id: Math.random().toString(), x: player.x + 8, y: player.y, vx: 0, vy: -11, radius: 3.5, color: palette.primary, isPlayer: true, damage: 1 },
              { id: Math.random().toString(), x: player.x + player.width - 8, y: player.y, vx: 0, vy: -11, radius: 3.5, color: palette.primary, isPlayer: true, damage: 1 }
            );
          }
        }

        // Multiplier Timer Decay
        if (multiplierTimerRef.current > 0) {
          multiplierTimerRef.current--;
          if (multiplierTimerRef.current <= 0) {
            multiplierRef.current = 1;
            setMultiplier(1);
          }
        }

        // 4 Epic Boss Spawners (Wave 3, Wave 6, Wave 9, Wave 12)
        let targetBossType: 'boss1' | 'boss2' | 'boss3' | 'boss4' | null = null;
        if (waveRef.current === 3) targetBossType = 'boss1';
        else if (waveRef.current === 6) targetBossType = 'boss2';
        else if (waveRef.current === 9) targetBossType = 'boss3';
        else if (waveRef.current === 12) targetBossType = 'boss4';

        if (targetBossType && !enemiesRef.current.some((e) => e.type.startsWith('boss'))) {
          const bossHealthMap = { boss1: 40, boss2: 60, boss3: 85, boss4: 120 };
          const bossNameMap = { boss1: 'SCOUT DREADNOUGHT', boss2: 'ASTEROID CRUSHER', boss3: 'NEBULA PHANTOM', boss4: 'CYBERTRON OVERLORD' };

          enemiesRef.current.push({
            id: targetBossType + '_' + waveRef.current,
            x: CANVAS_WIDTH / 2 - 60,
            y: 60,
            width: 120,
            height: 65,
            vx: 2.0,
            vy: 0,
            type: targetBossType,
            health: bossHealthMap[targetBossType],
            maxHealth: bossHealthMap[targetBossType],
            scoreValue: 4000,
            color: palette.accent,
            rotation: 0,
            rotSpeed: 0,
            bossPhase: 1,
            bossAttackTimer: 0,
            bossShieldAngle: 0,
            laserBeamActive: false,
          });
          soundEngine.setBGMTempo(170);
          addFloatingText(CANVAS_WIDTH / 2 - 110, CANVAS_HEIGHT / 2 - 40, `⚠️ ${bossNameMap[targetBossType]} ⚠️`, palette.accent);
        }

        // Enemy Spawner Logic (Non-boss waves)
        if (!targetBossType) {
          spawnTimerRef.current++;
          const spawnInterval = Math.max(25, 80 - waveRef.current * 6);

          if (spawnTimerRef.current >= spawnInterval) {
            spawnTimerRef.current = 0;
            const rand = Math.random();

            if (rand < 0.45) {
              enemiesRef.current.push({
                id: Math.random().toString(),
                x: 30 + Math.random() * (CANVAS_WIDTH - 80),
                y: -30,
                width: 32,
                height: 26,
                vx: 1.5,
                vy: (1.2 + waveRef.current * 0.15) * enemySpeedScale,
                type: 'invader',
                health: 1,
                maxHealth: 1,
                scoreValue: 100,
                color: palette.secondary,
                rotation: 0,
                rotSpeed: 0,
                zigzagPhase: Math.random() * Math.PI * 2,
                zigzagSpeed: 0.04,
                shootTimer: Math.floor(Math.random() * 120),
              });
            } else if (rand < 0.85) {
              const isLarge = Math.random() > 0.5;
              const size = isLarge ? 44 : 26;
              enemiesRef.current.push({
                id: Math.random().toString(),
                x: 20 + Math.random() * (CANVAS_WIDTH - 60),
                y: -40,
                width: size,
                height: size,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (1.5 + Math.random() * 2.0 + waveRef.current * 0.1) * enemySpeedScale,
                type: isLarge ? 'asteroid_lg' : 'asteroid_md',
                health: isLarge ? 3 : 1,
                maxHealth: isLarge ? 3 : 1,
                scoreValue: isLarge ? 150 : 75,
                color: isLarge ? palette.gold : palette.accent,
                rotation: Math.random() * Math.PI,
                rotSpeed: (Math.random() - 0.5) * 0.06,
              });
            } else {
              if (!enemiesRef.current.some((e) => e.type === 'saucer')) {
                enemiesRef.current.push({
                  id: Math.random().toString(),
                  x: -50,
                  y: 50 + Math.random() * 40,
                  width: 48,
                  height: 22,
                  vx: (3.5 + waveRef.current * 0.2) * enemySpeedScale,
                  vy: 0,
                  type: 'saucer',
                  health: 4,
                  maxHealth: 4,
                  scoreValue: 500,
                  color: palette.accent,
                  rotation: 0,
                  rotSpeed: 0,
                });
              }
            }
          }
        }

        // Wave & Level Progression
        if (scoreRef.current > waveRef.current * 2500) {
          waveRef.current += 1;
          setWave(waveRef.current);
          const lvlInfo = getLevelDetails(waveRef.current);

          if (lvlInfo.name !== activeLevelName) {
            setActiveLevelName(lvlInfo.name);
            levelBannerTextRef.current = lvlInfo.name;
            levelBannerTimerRef.current = 150;
            addFloatingText(CANVAS_WIDTH / 2 - 110, CANVAS_HEIGHT / 2 - 40, lvlInfo.name, palette.gold);
          } else {
            addFloatingText(CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT / 2 - 40, `WAVE ${waveRef.current} REACHED!`, palette.accent);
          }

          soundEngine.setBGMTempo(135 + waveRef.current * 3);
          soundEngine.playPowerUp();
        }

        // Update Bullets & Homing Physics
        bulletsRef.current.forEach((b) => {
          if (b.isHoming && b.isPlayer) {
            let closestEnemy: Enemy | null = null;
            let minDist = 9999;
            enemiesRef.current.forEach((e) => {
              const dist = Math.hypot(e.x + e.width / 2 - b.x, e.y + e.height / 2 - b.y);
              if (dist < minDist) {
                minDist = dist;
                closestEnemy = e;
              }
            });

            if (closestEnemy) {
              const targetAngle = Math.atan2((closestEnemy as Enemy).y + (closestEnemy as Enemy).height / 2 - b.y, (closestEnemy as Enemy).x + (closestEnemy as Enemy).width / 2 - b.x);
              b.vx += Math.cos(targetAngle) * 0.6;
              b.vy += Math.sin(targetAngle) * 0.6;
            }
          }

          b.x += b.vx;
          b.y += b.vy * (b.isPlayer ? 1 : enemySpeedScale);
        });

        bulletsRef.current = bulletsRef.current.filter(
          (b) => b.x >= -10 && b.x <= CANVAS_WIDTH + 10 && b.y >= -10 && b.y <= CANVAS_HEIGHT + 10
        );

        // Near-Miss Dodging Bonus Check
        bulletsRef.current.forEach((bullet) => {
          if (bullet.isPlayer) return;
          const dist = Math.hypot(
            bullet.x - (player.x + player.width / 2),
            bullet.y - (player.y + player.height / 2)
          );
          if (dist > player.width / 2 + bullet.radius && dist < player.width / 2 + bullet.radius + 14) {
            if (Math.random() < 0.05) {
              scoreRef.current += 50;
              setScore(scoreRef.current);
              addFloatingText(player.x, player.y - 15, 'CLOSE CALL! +50', palette.secondary);
            }
          }
        });

        // Update Enemies & 4 Bosses
        enemiesRef.current.forEach((enemy) => {
          if (enemy.type.startsWith('boss')) {
            enemy.x += enemy.vx * enemySpeedScale;
            if (enemy.x < 30 || enemy.x > CANVAS_WIDTH - enemy.width - 30) {
              enemy.vx = -enemy.vx;
            }

            enemy.bossShieldAngle = (enemy.bossShieldAngle || 0) + 0.04;
            enemy.bossAttackTimer = (enemy.bossAttackTimer || 0) + 1;

            if (enemy.health < enemy.maxHealth * 0.5 && enemy.bossPhase === 1) {
              enemy.bossPhase = 2;
              addFloatingText(enemy.x, enemy.y, 'BOSS ENRAGED!', palette.gold);
            }

            // Boss Attack Behaviors
            if (enemy.bossAttackTimer % 75 === 0) {
              bulletsRef.current.push(
                { id: Math.random().toString(), x: enemy.x + 20, y: enemy.y + enemy.height, vx: -1.2, vy: 4.5, radius: 4, color: palette.accent, isPlayer: false, damage: 1 },
                { id: Math.random().toString(), x: enemy.x + enemy.width - 20, y: enemy.y + enemy.height, vx: 1.2, vy: 4.5, radius: 4, color: palette.accent, isPlayer: false, damage: 1 }
              );
            }

            if (enemy.type === 'boss4' && enemy.bossPhase === 2) {
              enemy.laserBeamActive = enemy.bossAttackTimer % 180 > 120;
            }
          } else if (enemy.type === 'invader') {
            enemy.zigzagPhase = (enemy.zigzagPhase || 0) + (enemy.zigzagSpeed || 0.04);
            enemy.x += Math.sin(enemy.zigzagPhase) * 2.2;
            enemy.y += enemy.vy;

            enemy.shootTimer = (enemy.shootTimer || 0) + 1;
            if (enemy.shootTimer > 150) {
              enemy.shootTimer = 0;
              if (Math.random() < 0.4) {
                bulletsRef.current.push({
                  id: Math.random().toString(),
                  x: enemy.x + enemy.width / 2,
                  y: enemy.y + enemy.height,
                  vx: 0,
                  vy: 4.5,
                  radius: 3.5,
                  color: palette.accent,
                  isPlayer: false,
                  damage: 1,
                });
              }
            }
          } else if (enemy.type === 'saucer') {
            enemy.x += enemy.vx;
          } else {
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            enemy.rotation += enemy.rotSpeed;
          }
        });

        enemiesRef.current = enemiesRef.current.filter(
          (enemy) => enemy.y < CANVAS_HEIGHT + 60 && enemy.x < CANVAS_WIDTH + 80
        );

        // Update Power-Ups
        powerUpsRef.current.forEach((pu) => {
          pu.y += pu.vy;
          pu.pulsePhase += 0.08;
        });
        powerUpsRef.current = powerUpsRef.current.filter((pu) => pu.y < CANVAS_HEIGHT + 40);

        // Collision Detection vs Player Bullets
        bulletsRef.current.forEach((bullet) => {
          if (!bullet.isPlayer) return;

          enemiesRef.current.forEach((enemy) => {
            if (enemy.health <= 0) return;

            const isColliding =
              bullet.x >= enemy.x &&
              bullet.x <= enemy.x + enemy.width &&
              bullet.y >= enemy.y &&
              bullet.y <= enemy.y + enemy.height;

            if (isColliding) {
              bullet.damage = 0;
              enemy.health -= 1;
              soundEngine.playHit();

              createExplosion(bullet.x, bullet.y, enemy.color, 5);

              if (enemy.health <= 0) {
                soundEngine.playExplosion(enemy.type === 'saucer' || enemy.type === 'asteroid_lg' || enemy.type.startsWith('boss'));
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, enemy.type.startsWith('boss') ? 40 : 16);
                addScreenShake(enemy.type.startsWith('boss') ? 24 : 6);

                comboCountRef.current += 1;
                comboTimerRef.current = 90;
                if (comboCountRef.current >= 3) {
                  const comboText = comboCountRef.current === 3 ? 'SUPER COMBO x3!' : comboCountRef.current === 5 ? 'UNSTOPPABLE x5!' : `COMBO x${comboCountRef.current}!`;
                  addFloatingText(enemy.x, enemy.y - 20, comboText, palette.gold);
                }

                multiplierTimerRef.current = 180;
                if (multiplierRef.current < 4) {
                  multiplierRef.current += 1;
                  setMultiplier(multiplierRef.current);
                }

                const gainedScore = enemy.scoreValue * multiplierRef.current;
                scoreRef.current += gainedScore;
                setScore(scoreRef.current);

                if (scoreRef.current > highScoreRef.current) {
                  highScoreRef.current = scoreRef.current;
                  setHighScore(scoreRef.current);
                  localStorage.setItem(HIGH_SCORE_KEY, scoreRef.current.toString());
                }

                addFloatingText(enemy.x + enemy.width / 2 - 15, enemy.y, `+${gainedScore}`, palette.primary);

                // 8 Power-Up Drop Types
                if (Math.random() < 0.26 || enemy.type === 'saucer' || enemy.type.startsWith('boss')) {
                  const types: PowerUpType[] = ['triple', 'beam', 'missiles', 'shield', 'bomb', 'life', 'time_freeze', 'overdrive'];
                  const selectedType = types[Math.floor(Math.random() * types.length)];
                  const colorMap: Record<PowerUpType, string> = {
                    triple: palette.secondary,
                    beam: palette.accent,
                    missiles: palette.gold,
                    shield: palette.secondary,
                    bomb: palette.gold,
                    life: palette.primary,
                    time_freeze: '#00f0ff',
                    overdrive: '#ff007f',
                  };

                  powerUpsRef.current.push({
                    id: Math.random().toString(),
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height / 2,
                    vy: 1.4,
                    type: selectedType,
                    color: colorMap[selectedType],
                    size: 20,
                    pulsePhase: 0,
                  });
                }
              }
            }
          });
        });

        bulletsRef.current = bulletsRef.current.filter((b) => b.damage > 0);
        enemiesRef.current = enemiesRef.current.filter((e) => e.health > 0);

        // Power-Up Collection by Player
        powerUpsRef.current.forEach((pu) => {
          const dist = Math.hypot(pu.x - (player.x + player.width / 2), pu.y - (player.y + player.height / 2));

          if (dist < player.width / 2 + pu.size / 2) {
            soundEngine.playPowerUp();
            pu.y = CANVAS_HEIGHT + 100;

            if (pu.type === 'triple') {
              player.weaponType = 'triple';
              player.weaponTimer = 500;
              setActiveWeapon('TRI-BEAM SPREAD');
              addFloatingText(player.x, player.y - 20, 'TRI-BEAM SPREAD!', palette.secondary);
            } else if (pu.type === 'beam') {
              player.weaponType = 'plasma_beam';
              player.weaponTimer = 450;
              setActiveWeapon('HEAVY PLASMA BEAM');
              addFloatingText(player.x, player.y - 20, 'PLASMA BEAM COLUMN!', palette.accent);
            } else if (pu.type === 'missiles') {
              player.weaponType = 'homing_missiles';
              player.weaponTimer = 450;
              setActiveWeapon('SEEKING MISSILES');
              addFloatingText(player.x, player.y - 20, 'HOMING MISSILES!', palette.gold);
            } else if (pu.type === 'time_freeze') {
              player.timeFreezeTimer = 360;
              soundEngine.playFreeze();
              addFloatingText(player.x, player.y - 20, '⏱️ TIME FREEZE!', '#00f0ff');
            } else if (pu.type === 'overdrive') {
              player.overdriveTimer = 360;
              soundEngine.playPowerUp();
              addFloatingText(player.x, player.y - 20, '⚡ OVERDRIVE!', '#ff007f');
            } else if (pu.type === 'shield') {
              player.hasShield = true;
              player.shieldHits = 2;
              setShieldActive(true);
              addFloatingText(player.x, player.y - 20, 'SHIELD ACTIVATED!', palette.accent);
            } else if (pu.type === 'bomb') {
              if (player.bombs < player.maxBombs) {
                player.bombs += 1;
                setBombs(player.bombs);
                addFloatingText(player.x, player.y - 20, '+1 EMP BOMB!', palette.gold);
              }
            } else if (pu.type === 'life') {
              if (livesRef.current < player.maxLives) {
                livesRef.current += 1;
                setLives(livesRef.current);
                addFloatingText(player.x, player.y - 20, '+1 EXTRA SHIP!', palette.primary);
              }
            }
          }
        });

        // Player Hit Check
        if (player.invulnerableTimer <= 0) {
          let tookHit = false;

          bulletsRef.current.forEach((bullet) => {
            if (bullet.isPlayer) return;
            const dist = Math.hypot(bullet.x - (player.x + player.width / 2), bullet.y - (player.y + player.height / 2));
            if (dist < bullet.radius + player.width / 2 - 4) {
              bullet.damage = 0;
              tookHit = true;
            }
          });

          enemiesRef.current.forEach((enemy) => {
            const isColliding =
              player.x < enemy.x + enemy.width &&
              player.x + player.width > enemy.x &&
              player.y < enemy.y + enemy.height &&
              player.y + player.height > enemy.y;

            if (isColliding) {
              if (!enemy.type.startsWith('boss')) enemy.health = 0;
              createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 14);
              tookHit = true;
            }
          });

          if (tookHit) {
            if (player.hasShield) {
              player.shieldHits -= 1;
              soundEngine.playHit();
              createExplosion(player.x + player.width / 2, player.y + player.height / 2, palette.secondary, 12);
              if (player.shieldHits <= 0) {
                player.hasShield = false;
                setShieldActive(false);
                addFloatingText(player.x, player.y - 20, 'SHIELD BROKEN!', palette.accent);
              } else {
                addFloatingText(player.x, player.y - 20, 'SHIELD ABSORBED!', palette.secondary);
              }
              player.invulnerableTimer = 30;
            } else {
              soundEngine.playExplosion(true);
              addScreenShake(16);
              createExplosion(player.x + player.width / 2, player.y + player.height / 2, palette.accent, 24);

              livesRef.current -= 1;
              setLives(livesRef.current);
              player.invulnerableTimer = 90;

              multiplierRef.current = 1;
              setMultiplier(1);

              if (livesRef.current <= 0) {
                soundEngine.playGameOver();
                setGameState('GAMEOVER');
                stateRef.current = 'GAMEOVER';
              } else {
                player.x = CANVAS_WIDTH / 2 - player.width / 2;
                player.y = CANVAS_HEIGHT - 70;
              }
            }
          }
        }
      }

      // Update Particles & Floating Text
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        p.alpha = 1 - p.life / p.maxLife;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

      floatingTextsRef.current.forEach((ft) => {
        ft.y += ft.vy;
        ft.life -= 1;
        ft.alpha = ft.life / 45;
      });
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.life > 0);

      starsRef.current.forEach((star) => {
        star.y += star.speed;
        if (star.y > CANVAS_HEIGHT) {
          star.y = -5;
          star.x = Math.random() * CANVAS_WIDTH;
        }
      });

      if (screenShakeRef.current > 0) {
        screenShakeRef.current *= 0.88;
        if (screenShakeRef.current < 0.2) screenShakeRef.current = 0;
      }

      // -------------------------------------------------------------
      // 2. CANVAS RENDERING
      // -------------------------------------------------------------
      ctx.save();

      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current * 1.5;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current * 1.5;
        ctx.translate(shakeX, shakeY);
      }

      ctx.fillStyle = palette.bg;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Starfield
      starsRef.current.forEach((star) => {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      ctx.globalAlpha = 1.0;

      // Particles
      particlesRef.current.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        if (p.shape === 'square') {
          ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Power-Ups (8 Types)
      powerUpsRef.current.forEach((pu) => {
        ctx.save();
        ctx.translate(pu.x, pu.y);
        const scale = 1 + Math.sin(pu.pulsePhase) * 0.15;
        ctx.scale(scale, scale);

        ctx.shadowColor = pu.color;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = pu.color;
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc(0, 0, pu.size / 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = pu.color;
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const labelMap: Record<PowerUpType, string> = {
          triple: '3X',
          beam: 'BM',
          missiles: 'MS',
          shield: 'SH',
          bomb: 'B',
          life: '+1',
          time_freeze: 'TZ',
          overdrive: 'OD',
        };
        ctx.fillText(labelMap[pu.type] || 'PU', 0, 1);

        ctx.restore();
      });

      // Bullets
      bulletsRef.current.forEach((b) => {
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = b.color;

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      // Enemies & Bosses
      enemiesRef.current.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = enemy.color;
        ctx.fillStyle = enemy.color;
        ctx.lineWidth = 2;

        if (enemy.type.startsWith('boss')) {
          ctx.beginPath();
          ctx.moveTo(0, -25);
          ctx.lineTo(50, 10);
          ctx.lineTo(30, 25);
          ctx.lineTo(-30, 25);
          ctx.lineTo(-50, 10);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          ctx.save();
          ctx.rotate(enemy.bossShieldAngle || 0);
          ctx.strokeStyle = palette.secondary;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 48, 0, Math.PI * 1.5);
          ctx.stroke();
          ctx.restore();
        } else if (enemy.type === 'invader') {
          ctx.fillRect(-12, -6, 24, 12);
        } else if (enemy.type === 'saucer') {
          ctx.beginPath();
          ctx.ellipse(0, 0, 22, 8, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          ctx.rotate(enemy.rotation);
          ctx.strokeRect(-enemy.width / 2, -enemy.height / 2, enemy.width, enemy.height);
        }

        ctx.restore();
      });

      // Player Ship
      const player = playerRef.current;
      const isInvulnerable = player.invulnerableTimer > 0;
      const shouldDrawPlayer = !isInvulnerable || Math.floor(tick / 4) % 2 === 0;

      if ((stateRef.current === 'PLAYING' || stateRef.current === 'PAUSED') && shouldDrawPlayer) {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

        ctx.shadowColor = palette.primary;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = palette.primary;
        ctx.fillStyle = '#032414';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(0, -18);
        ctx.lineTo(14, 14);
        ctx.lineTo(6, 10);
        ctx.lineTo(-6, 10);
        ctx.lineTo(-14, 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      }

      // Render Floating Text
      floatingTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.fillStyle = ft.color;
        ctx.shadowColor = ft.color;
        ctx.shadowBlur = 6;
        ctx.font = '12px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      // Level Banner Overlay
      if (levelBannerTimerRef.current > 0 && stateRef.current === 'PLAYING') {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, CANVAS_HEIGHT / 2 - 35, CANVAS_WIDTH, 70);
        ctx.font = '14px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = palette.gold;
        ctx.shadowColor = palette.gold;
        ctx.shadowBlur = 12;
        ctx.fillText(levelBannerTextRef.current, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 5);
        ctx.restore();
      }

      // -------------------------------------------------------------
      // 3. CANVAS HUD OVERLAY
      // -------------------------------------------------------------
      ctx.save();
      ctx.font = '11px "Press Start 2P", monospace';

      ctx.fillStyle = 'rgba(0, 20, 10, 0.65)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 38);
      ctx.strokeStyle = palette.primary;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 38);
      ctx.lineTo(CANVAS_WIDTH, 38);
      ctx.stroke();

      ctx.fillStyle = palette.primary;
      ctx.shadowColor = palette.primary;
      ctx.shadowBlur = 4;
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${scoreRef.current.toString().padStart(6, '0')}`, 16, 24);

      ctx.fillStyle = palette.secondary;
      ctx.shadowColor = palette.secondary;
      ctx.textAlign = 'center';
      ctx.fillText(`HIGH: ${highScoreRef.current.toString().padStart(6, '0')}`, CANVAS_WIDTH / 2 - 20, 24);

      ctx.fillStyle = playerRef.current.bombs > 0 ? palette.gold : palette.accent;
      ctx.shadowColor = ctx.fillStyle;
      ctx.textAlign = 'right';
      ctx.fillText(`BOMBS: ${playerRef.current.bombs}`, CANVAS_WIDTH - 150, 24);

      for (let l = 0; l < livesRef.current; l++) {
        const lx = CANVAS_WIDTH - 110 + l * 20;
        const ly = 22;
        ctx.fillStyle = palette.primary;
        ctx.beginPath();
        ctx.moveTo(lx, ly - 8);
        ctx.lineTo(lx + 6, ly + 6);
        ctx.lineTo(lx - 6, ly + 6);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // -------------------------------------------------------------
      // 4. GAME OVERLAYS (START, PAUSED, GAMEOVER)
      // -------------------------------------------------------------
      if (stateRef.current === 'START') {
        ctx.save();
        ctx.fillStyle = 'rgba(3, 8, 6, 0.88)';
        ctx.fillRect(0, 40, CANVAS_WIDTH, CANVAS_HEIGHT - 40);

        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = palette.primary;
        ctx.shadowColor = palette.primary;
        ctx.shadowBlur = 12;
        ctx.fillText('SPACE DEFENDER 1984', CANVAS_WIDTH / 2, 110);

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = palette.secondary;
        ctx.fillText('5 LEVELS • 4 BOSSES • 8 POWER-UPS', CANVAS_WIDTH / 2, 140);

        if (Math.floor(tick / 30) % 2 === 0) {
          ctx.font = '12px "Press Start 2P", monospace';
          ctx.fillStyle = palette.gold;
          ctx.fillText('PRESS SPACE OR TAP TO START', CANVAS_WIDTH / 2, 210);
        }

        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillStyle = palette.gold;
        ctx.fillText('★ TOP 5 PILOTS HALL OF FAME ★', CANVAS_WIDTH / 2, 280);

        leaderboardRef.current.slice(0, 5).forEach((entry, idx) => {
          const yPos = 315 + idx * 26;
          ctx.font = '10px "Press Start 2P", monospace';
          ctx.fillStyle = idx === 0 ? palette.gold : idx === 1 ? palette.secondary : palette.primary;
          ctx.fillText(`${idx + 1}. ${entry.name.padEnd(4, ' ')} - ${entry.score.toString().padStart(6, '0')}`, CANVAS_WIDTH / 2, yPos);
        });

        ctx.restore();
      } else if (stateRef.current === 'GAMEOVER') {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 2, 5, 0.88)';
        ctx.fillRect(0, 40, CANVAS_WIDTH, CANVAS_HEIGHT - 40);

        ctx.font = '26px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = palette.accent;
        ctx.shadowColor = palette.accent;
        ctx.shadowBlur = 16;
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 140);

        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillStyle = palette.primary;
        ctx.fillText(`FINAL SCORE: ${scoreRef.current}`, CANVAS_WIDTH / 2, 190);

        if (Math.floor(tick / 30) % 2 === 0) {
          ctx.font = '11px "Press Start 2P", monospace';
          ctx.fillStyle = '#ffffff';
          ctx.fillText('PRESS SPACE TO RESTART', CANVAS_WIDTH / 2, 480);
        }

        ctx.restore();
      }

      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [resetGame, theme]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Canvas Display Container */}
      <div className="relative w-full max-w-[800px] aspect-[4/3] mx-auto bg-[#030806] rounded-lg overflow-hidden shadow-2xl select-none touch-none">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full block crt-flicker cursor-crosshair"
          onPointerDown={(e) => {
            if (stateRef.current === 'START' || stateRef.current === 'GAMEOVER') {
              resetGame();
            } else {
              updatePointerPosition(e.clientX, e.clientY);
              pointerRef.current.firing = true;
            }
          }}
          onPointerMove={(e) => {
            updatePointerPosition(e.clientX, e.clientY);
          }}
          onPointerUp={() => {
            pointerRef.current.firing = false;
          }}
          onPointerLeave={() => {
            pointerRef.current.firing = false;
          }}
          onTouchStart={(e) => {
            if (stateRef.current === 'START' || stateRef.current === 'GAMEOVER') {
              resetGame();
            } else if (e.touches.length > 0) {
              updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
              pointerRef.current.firing = true;
            }
          }}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              updatePointerPosition(e.touches[0].clientX, e.touches[0].clientY);
            }
          }}
          onTouchEnd={() => {
            pointerRef.current.firing = false;
          }}
        />

        {/* CRT Overlay Effects */}
        <div className="absolute inset-0 crt-scanlines pointer-events-none z-10" />
        <div className="absolute inset-0 crt-vignette pointer-events-none z-20" />
        <div className="absolute inset-0 crt-glare pointer-events-none z-30" />
      </div>

      {/* Leaderboard Submission Box */}
      {gameState === 'GAMEOVER' && score > 0 && (
        <div className="mt-3 w-full max-w-[800px] bg-stone-900/90 border border-[#ffe600]/40 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xl animate-in fade-in">
          <div className="flex items-center space-x-2 text-[#ffe600]">
            <span>🏆 LEADERBOARD ENTRY: ENTER CALL SIGN</span>
          </div>
          {savedScore ? (
            <div className="text-[#00ff66] font-bold font-retro">✓ SAVED TO HALL OF FAME!</div>
          ) : (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                maxLength={3}
                value={pilotInitials}
                onChange={(e) => setPilotInitials(e.target.value.toUpperCase())}
                className="w-16 bg-black border border-[#00ff66] text-[#00ff66] text-center font-retro py-1 px-2 uppercase rounded focus:outline-none"
                placeholder="ACE"
              />
              <button
                onClick={saveLeaderboardRecord}
                className="bg-[#00ff66] text-black font-retro font-bold px-3 py-1 rounded hover:bg-[#00f0ff] transition-all active:scale-95"
              >
                SAVE
              </button>
            </div>
          )}
        </div>
      )}

      {/* On-Screen Virtual Touch Controls */}
      <div className="mt-4 w-full max-w-[800px] flex items-center justify-between px-2 sm:px-6 select-none touch-none">
        <div className="relative w-28 h-28 bg-stone-900/90 border border-stone-700/80 rounded-2xl p-2 grid grid-cols-3 grid-rows-3 gap-1 shadow-lg">
          <div />
          <button
            onPointerDown={() => (keysRef.current['ArrowUp'] = true)}
            onPointerUp={() => (keysRef.current['ArrowUp'] = false)}
            onPointerLeave={() => (keysRef.current['ArrowUp'] = false)}
            className="bg-stone-800 active:bg-[#00ff66] border border-stone-700 rounded text-center text-xs font-bold text-[#00ff66]"
          >
            ▲
          </button>
          <div />
          <button
            onPointerDown={() => (keysRef.current['ArrowLeft'] = true)}
            onPointerUp={() => (keysRef.current['ArrowLeft'] = false)}
            onPointerLeave={() => (keysRef.current['ArrowLeft'] = false)}
            className="bg-stone-800 active:bg-[#00ff66] border border-stone-700 rounded text-center text-xs font-bold text-[#00ff66]"
          >
            ◀
          </button>
          <div className="flex items-center justify-center text-[9px] text-stone-500 font-mono">D-PAD</div>
          <button
            onPointerDown={() => (keysRef.current['ArrowRight'] = true)}
            onPointerUp={() => (keysRef.current['ArrowRight'] = false)}
            onPointerLeave={() => (keysRef.current['ArrowRight'] = false)}
            className="bg-stone-800 active:bg-[#00ff66] border border-stone-700 rounded text-center text-xs font-bold text-[#00ff66]"
          >
            ▶
          </button>
          <div />
          <button
            onPointerDown={() => (keysRef.current['ArrowDown'] = true)}
            onPointerUp={() => (keysRef.current['ArrowDown'] = false)}
            onPointerLeave={() => (keysRef.current['ArrowDown'] = false)}
            className="bg-stone-800 active:bg-[#00ff66] border border-stone-700 rounded text-center text-xs font-bold text-[#00ff66]"
          >
            ▼
          </button>
          <div />
        </div>

        <div className="hidden sm:flex flex-col items-center text-[10px] font-retro text-stone-400 text-center">
          <span className="text-[#ffe600]">{activeLevelName}</span>
          <span className="text-[9px] text-stone-500 mt-1">WEAPON: {activeWeapon}</span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onPointerDown={() => {
              if (stateRef.current === 'START' || stateRef.current === 'GAMEOVER') {
                resetGame();
              } else {
                triggerEMPBomb();
              }
            }}
            disabled={gameState === 'PLAYING' && bombs <= 0}
            className="w-14 h-14 rounded-full font-retro text-[9px] font-bold shadow-lg flex items-center justify-center bg-gradient-to-b from-[#ffe600]/30 to-amber-900/40 border border-[#ffe600] text-[#ffe600]"
          >
            BOMB ({bombs})
          </button>
          <button
            onPointerDown={() => {
              if (stateRef.current === 'START' || stateRef.current === 'GAMEOVER') {
                resetGame();
              } else {
                pointerRef.current.firing = true;
              }
            }}
            onPointerUp={() => {
              pointerRef.current.firing = false;
            }}
            className="w-16 h-16 bg-gradient-to-b from-[#00ff66]/30 to-emerald-900/40 border-2 border-[#00ff66] text-[#00ff66] rounded-full font-retro text-[10px] font-bold shadow-lg flex items-center justify-center"
          >
            {gameState === 'PLAYING' ? 'FIRE' : 'START'}
          </button>
        </div>
      </div>
    </div>
  );
}
