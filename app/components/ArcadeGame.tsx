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
  LeaderboardEntry
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

export default function ArcadeGame() {
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
  const [activeWeapon, setActiveWeapon] = useState<string>('SINGLE');
  const [shieldActive, setShieldActive] = useState<boolean>(false);

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
    const stars: Star[] = [];
    const colors = ['#ffffff', '#00ff66', '#00f0ff', '#ff007f', '#ffe600'];
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
  }, []);

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

    setScore(0);
    setLives(3);
    setBombs(2);
    setWave(1);
    setMultiplier(1);
    setActiveWeapon('SINGLE');
    setShieldActive(false);
    setSavedScore(false);

    setGameState('PLAYING');
    stateRef.current = 'PLAYING';
  }, []);

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
      // Prevent browser default scrolling for arcade control keys
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyE'].includes(e.code)) {
        e.preventDefault();
      }

      keysRef.current[e.code] = true;

      // Start or Restart with Space
      if (e.code === 'Space') {
        if (stateRef.current === 'START' || stateRef.current === 'GAMEOVER') {
          resetGame();
        }
      }

      // EMP Bomb key (B, E, or Shift)
      if (e.code === 'KeyB' || e.code === 'KeyE') {
        if (stateRef.current === 'PLAYING') {
          triggerEMPBomb();
        }
      }

      // Pause toggle with P or Escape
      if (e.code === 'KeyP' || e.code === 'Escape') {
        e.preventDefault();
        if (stateRef.current === 'PLAYING') {
          setGameState('PAUSED');
          stateRef.current = 'PAUSED';
        } else if (stateRef.current === 'PAUSED') {
          setGameState('PLAYING');
          stateRef.current = 'PLAYING';
        }
      }

      // Audio Mute toggle with M
      if (e.code === 'KeyM') {
        const muted = soundEngine.toggleMute();
        setIsMuted(muted);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
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
  }, [resetGame]);

  // Main Canvas Game Tick & Render Pipeline
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let tick = 0;

    const gameLoop = (timestamp: number) => {
      tick++;

      // Delta time calculation
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      lastTimeRef.current = timestamp;

      // -------------------------------------------------------------
      // 1. UPDATE GAME LOGIC (Only if state is PLAYING)
      // -------------------------------------------------------------
      if (stateRef.current === 'PLAYING') {
        const player = playerRef.current;

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
          player.x += dx * player.speed;
          player.y += dy * player.speed;
        } else if (pointerRef.current.active) {
          const targetX = pointerRef.current.x - player.width / 2;
          const targetY = pointerRef.current.y - player.height / 2;
          player.x += (targetX - player.x) * 0.25;
          player.y += (targetY - player.y) * 0.25;
        }

        // Clamp inside Canvas bounds
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
            color: Math.random() > 0.5 ? '#00f0ff' : '#00ff66',
            alpha: 0.9,
            maxLife: 12,
            life: 0,
          });
        }

        // Weapon Timer & Cooldown Update
        if (player.weaponTimer > 0) {
          player.weaponTimer--;
          if (player.weaponTimer <= 0) {
            player.weaponType = 'single';
            setActiveWeapon('SINGLE');
          }
        }

        // Invulnerability Timer
        if (player.invulnerableTimer > 0) {
          player.invulnerableTimer--;
        }

        // Player Firing (Keyboard Space or Mouse / Touch Hold)
        if (fireCooldownRef.current > 0) fireCooldownRef.current--;

        const isFiring = keysRef.current['Space'] || pointerRef.current.firing;
        if (isFiring && fireCooldownRef.current <= 0) {
          fireCooldownRef.current = 10; // rate limit frames
          soundEngine.playLaser();

          if (player.weaponType === 'triple') {
            bulletsRef.current.push(
              {
                id: Math.random().toString(),
                x: player.x + player.width / 2,
                y: player.y,
                vx: 0,
                vy: -11,
                radius: 3,
                color: '#00f0ff',
                isPlayer: true,
                damage: 1,
              },
              {
                id: Math.random().toString(),
                x: player.x + 4,
                y: player.y + 6,
                vx: -2.2,
                vy: -10,
                radius: 3,
                color: '#ff007f',
                isPlayer: true,
                damage: 1,
              },
              {
                id: Math.random().toString(),
                x: player.x + player.width - 4,
                y: player.y + 6,
                vx: 2.2,
                vy: -10,
                radius: 3,
                color: '#ff007f',
                isPlayer: true,
                damage: 1,
              }
            );
          } else {
            // Dual laser default
            bulletsRef.current.push(
              {
                id: Math.random().toString(),
                x: player.x + 8,
                y: player.y,
                vx: 0,
                vy: -11,
                radius: 3.5,
                color: '#00ff66',
                isPlayer: true,
                damage: 1,
              },
              {
                id: Math.random().toString(),
                x: player.x + player.width - 8,
                y: player.y,
                vx: 0,
                vy: -11,
                radius: 3.5,
                color: '#00ff66',
                isPlayer: true,
                damage: 1,
              }
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

        // Enemy Spawner Logic
        spawnTimerRef.current++;
        const spawnInterval = Math.max(30, 90 - waveRef.current * 8);

        if (spawnTimerRef.current >= spawnInterval) {
          spawnTimerRef.current = 0;
          const rand = Math.random();

          if (rand < 0.45) {
            // Alien Invader
            enemiesRef.current.push({
              id: Math.random().toString(),
              x: 30 + Math.random() * (CANVAS_WIDTH - 80),
              y: -30,
              width: 32,
              height: 26,
              vx: 1.5,
              vy: 1.2 + waveRef.current * 0.15,
              type: 'invader',
              health: 1,
              maxHealth: 1,
              scoreValue: 100,
              color: '#00f0ff',
              rotation: 0,
              rotSpeed: 0,
              zigzagPhase: Math.random() * Math.PI * 2,
              zigzagSpeed: 0.04,
              shootTimer: Math.floor(Math.random() * 120),
            });
          } else if (rand < 0.85) {
            // Asteroid Space Rock
            const isLarge = Math.random() > 0.5;
            const size = isLarge ? 44 : 26;
            enemiesRef.current.push({
              id: Math.random().toString(),
              x: 20 + Math.random() * (CANVAS_WIDTH - 60),
              y: -40,
              width: size,
              height: size,
              vx: (Math.random() - 0.5) * 1.5,
              vy: 1.5 + Math.random() * 2.0 + waveRef.current * 0.1,
              type: isLarge ? 'asteroid_lg' : 'asteroid_md',
              health: isLarge ? 3 : 1,
              maxHealth: isLarge ? 3 : 1,
              scoreValue: isLarge ? 150 : 75,
              color: isLarge ? '#ffe600' : '#ff007f',
              rotation: Math.random() * Math.PI,
              rotSpeed: (Math.random() - 0.5) * 0.06,
            });
          } else {
            // Bonus Saucer Ship
            if (!enemiesRef.current.some((e) => e.type === 'saucer')) {
              enemiesRef.current.push({
                id: Math.random().toString(),
                x: -50,
                y: 50 + Math.random() * 40,
                width: 48,
                height: 22,
                vx: 3.5 + waveRef.current * 0.2,
                vy: 0,
                type: 'saucer',
                health: 4,
                maxHealth: 4,
                scoreValue: 500,
                color: '#ff007f',
                rotation: 0,
                rotSpeed: 0,
              });
            }
          }
        }

        // Wave progression check
        if (scoreRef.current > waveRef.current * 2500) {
          waveRef.current += 1;
          setWave(waveRef.current);
          addFloatingText(CANVAS_WIDTH / 2 - 80, CANVAS_HEIGHT / 2 - 40, `WAVE ${waveRef.current} REACHED!`, '#ff007f');
          soundEngine.playPowerUp();
        }

        // Update Bullets
        bulletsRef.current.forEach((b) => {
          b.x += b.vx;
          b.y += b.vy;
        });

        // Filter out out-of-bounds bullets
        bulletsRef.current = bulletsRef.current.filter(
          (b) => b.x >= -10 && b.x <= CANVAS_WIDTH + 10 && b.y >= -10 && b.y <= CANVAS_HEIGHT + 10
        );

        // Update Enemies
        enemiesRef.current.forEach((enemy) => {
          if (enemy.type === 'invader') {
            enemy.zigzagPhase = (enemy.zigzagPhase || 0) + (enemy.zigzagSpeed || 0.04);
            enemy.x += Math.sin(enemy.zigzagPhase) * 2.2;
            enemy.y += enemy.vy;

            // Invader firing enemy plasma drops
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
                  color: '#ff007f',
                  isPlayer: false,
                  damage: 1,
                });
              }
            }
          } else if (enemy.type === 'saucer') {
            enemy.x += enemy.vx;
          } else {
            // Asteroid
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            enemy.rotation += enemy.rotSpeed;
          }
        });

        // Filter out enemies out of screen
        enemiesRef.current = enemiesRef.current.filter(
          (enemy) => enemy.y < CANVAS_HEIGHT + 60 && enemy.x < CANVAS_WIDTH + 80
        );

        // Update Power-Ups
        powerUpsRef.current.forEach((pu) => {
          pu.y += pu.vy;
          pu.pulsePhase += 0.08;
        });
        powerUpsRef.current = powerUpsRef.current.filter((pu) => pu.y < CANVAS_HEIGHT + 40);

        // -------------------------------------------------------------
        // COLLISION DETECTION & RESOLUTION
        // -------------------------------------------------------------

        // 1. Player Lasers vs Enemies
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
              bullet.damage = 0; // Destroy bullet
              enemy.health -= 1;
              soundEngine.playHit();

              // Spark hit effect
              createExplosion(bullet.x, bullet.y, enemy.color, 5);

              if (enemy.health <= 0) {
                // Enemy Destroyed!
                soundEngine.playExplosion(enemy.type === 'saucer' || enemy.type === 'asteroid_lg');
                createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 16);
                addScreenShake(enemy.type === 'saucer' ? 10 : 4);

                // Multiplier calculation
                multiplierTimerRef.current = 180; // 3 seconds streak
                if (multiplierRef.current < 4) {
                  multiplierRef.current += 1;
                  setMultiplier(multiplierRef.current);
                }

                const gainedScore = enemy.scoreValue * multiplierRef.current;
                scoreRef.current += gainedScore;
                setScore(scoreRef.current);

                // Check High Score
                if (scoreRef.current > highScoreRef.current) {
                  highScoreRef.current = scoreRef.current;
                  setHighScore(scoreRef.current);
                  localStorage.setItem(HIGH_SCORE_KEY, scoreRef.current.toString());
                }

                // Score Popup
                addFloatingText(
                  enemy.x + enemy.width / 2 - 15,
                  enemy.y,
                  `+${gainedScore}`,
                  multiplierRef.current > 1 ? '#ffe600' : '#00ff66'
                );

                // Split large asteroids into smaller ones
                if (enemy.type === 'asteroid_lg') {
                  for (let s = 0; s < 2; s++) {
                    enemiesRef.current.push({
                      id: Math.random().toString(),
                      x: enemy.x + (s === 0 ? -10 : 15),
                      y: enemy.y,
                      width: 22,
                      height: 22,
                      vx: (s === 0 ? -1.8 : 1.8) + (Math.random() - 0.5),
                      vy: 2.0 + Math.random(),
                      type: 'asteroid_sm',
                      health: 1,
                      maxHealth: 1,
                      scoreValue: 50,
                      color: '#00ff66',
                      rotation: Math.random() * Math.PI,
                      rotSpeed: (Math.random() - 0.5) * 0.1,
                    });
                  }
                }

                // Drop Power-Up chance (20%)
                if (Math.random() < 0.22 || enemy.type === 'saucer') {
                  const types: PowerUpType[] = ['triple', 'shield', 'bomb', 'life'];
                  const selectedType = types[Math.floor(Math.random() * types.length)];
                  const colorMap: Record<PowerUpType, string> = {
                    triple: '#00f0ff',
                    shield: '#ff007f',
                    bomb: '#ffe600',
                    life: '#00ff66',
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

        // Clean destroyed bullets & enemies
        bulletsRef.current = bulletsRef.current.filter((b) => b.damage > 0);
        enemiesRef.current = enemiesRef.current.filter((e) => e.health > 0);

        // 2. Power-Up Collection by Player
        powerUpsRef.current.forEach((pu) => {
          const dist = Math.hypot(
            pu.x - (player.x + player.width / 2),
            pu.y - (player.y + player.height / 2)
          );

          if (dist < player.width / 2 + pu.size / 2) {
            soundEngine.playPowerUp();
            pu.y = CANVAS_HEIGHT + 100; // remove

            if (pu.type === 'triple') {
              player.weaponType = 'triple';
              player.weaponTimer = 500; // 8 seconds of triple shot
              setActiveWeapon('TRIPLE LASER');
              addFloatingText(player.x, player.y - 20, 'TRIPLE LASERS!', '#00f0ff');
            } else if (pu.type === 'shield') {
              player.hasShield = true;
              player.shieldHits = 2;
              setShieldActive(true);
              addFloatingText(player.x, player.y - 20, 'SHIELD ACTIVATED!', '#ff007f');
            } else if (pu.type === 'bomb') {
              if (player.bombs < player.maxBombs) {
                player.bombs += 1;
                setBombs(player.bombs);
                addFloatingText(player.x, player.y - 20, '+1 EMP BOMB!', '#ffe600');
              } else {
                addFloatingText(player.x, player.y - 20, 'MAX BOMBS!', '#ffe600');
              }
            } else if (pu.type === 'life') {
              if (livesRef.current < player.maxLives) {
                livesRef.current += 1;
                setLives(livesRef.current);
                addFloatingText(player.x, player.y - 20, '+1 EXTRA SHIP!', '#00ff66');
              }
            }
          }
        });

        // 3. Player Collision vs Enemy Bullets & Enemies
        if (player.invulnerableTimer <= 0) {
          let tookHit = false;

          // Check vs enemy bullets
          bulletsRef.current.forEach((bullet) => {
            if (bullet.isPlayer) return;
            const dist = Math.hypot(
              bullet.x - (player.x + player.width / 2),
              bullet.y - (player.y + player.height / 2)
            );
            if (dist < bullet.radius + player.width / 2 - 4) {
              bullet.damage = 0;
              tookHit = true;
            }
          });

          // Check vs enemy ships/rocks
          enemiesRef.current.forEach((enemy) => {
            const isColliding =
              player.x < enemy.x + enemy.width &&
              player.x + player.width > enemy.x &&
              player.y < enemy.y + enemy.height &&
              player.y + player.height > enemy.y;

            if (isColliding) {
              enemy.health = 0;
              createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, enemy.color, 14);
              tookHit = true;
            }
          });

          if (tookHit) {
            if (player.hasShield) {
              player.shieldHits -= 1;
              soundEngine.playHit();
              createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#00f0ff', 12);
              if (player.shieldHits <= 0) {
                player.hasShield = false;
                setShieldActive(false);
                addFloatingText(player.x, player.y - 20, 'SHIELD BROKEN!', '#ff007f');
              } else {
                addFloatingText(player.x, player.y - 20, 'SHIELD ABSORBED!', '#00f0ff');
              }
              player.invulnerableTimer = 30; // brief invulnerability
            } else {
              // Damage Player
              soundEngine.playExplosion(true);
              addScreenShake(16);
              createExplosion(player.x + player.width / 2, player.y + player.height / 2, '#ff007f', 24);

              livesRef.current -= 1;
              setLives(livesRef.current);
              player.invulnerableTimer = 90; // ~1.5 seconds invulnerability after hit

              // Reset Multiplier
              multiplierRef.current = 1;
              setMultiplier(1);

              if (livesRef.current <= 0) {
                // Game Over!
                soundEngine.playGameOver();
                setGameState('GAMEOVER');
                stateRef.current = 'GAMEOVER';
              } else {
                // Respawn Player in center
                player.x = CANVAS_WIDTH / 2 - player.width / 2;
                player.y = CANVAS_HEIGHT - 70;
              }
            }
          }
        }
      }

      // Update Particles
      particlesRef.current.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;
        p.alpha = 1 - p.life / p.maxLife;
      });
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

      // Update Floating Texts
      floatingTextsRef.current.forEach((ft) => {
        ft.y += ft.vy;
        ft.life -= 1;
        ft.alpha = ft.life / 45;
      });
      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => ft.life > 0);

      // Update Stars
      starsRef.current.forEach((star) => {
        star.y += star.speed;
        if (star.y > CANVAS_HEIGHT) {
          star.y = -5;
          star.x = Math.random() * CANVAS_WIDTH;
        }
      });

      // Decay Screen Shake
      if (screenShakeRef.current > 0) {
        screenShakeRef.current *= 0.88;
        if (screenShakeRef.current < 0.2) screenShakeRef.current = 0;
      }

      // -------------------------------------------------------------
      // 2. CANVAS RENDERING
      // -------------------------------------------------------------
      ctx.save();

      // Apply Screen Shake transform offset
      if (screenShakeRef.current > 0) {
        const shakeX = (Math.random() - 0.5) * screenShakeRef.current * 1.5;
        const shakeY = (Math.random() - 0.5) * screenShakeRef.current * 1.5;
        ctx.translate(shakeX, shakeY);
      }

      // Clear Screen with deep retro CRT dark backdrop
      ctx.fillStyle = '#030806';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Render Parallax Retro Starfield
      starsRef.current.forEach((star) => {
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha;
        ctx.fillRect(star.x, star.y, star.size, star.size);
      });
      ctx.globalAlpha = 1.0;

      // Render Particles
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

      // Render Power-Ups
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
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = pu.type === 'triple' ? '3X' : pu.type === 'shield' ? 'SH' : pu.type === 'bomb' ? 'B' : '+1';
        ctx.fillText(label, 0, 1);

        ctx.restore();
      });

      // Render Bullets
      bulletsRef.current.forEach((b) => {
        ctx.save();
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8;
        ctx.fillStyle = b.color;

        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();

        // Laser tail energy trail
        ctx.strokeStyle = b.color;
        ctx.lineWidth = b.radius * 1.2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x - b.vx * 1.5, b.y - b.vy * 1.5);
        ctx.stroke();

        ctx.restore();
      });

      // Render Enemies
      enemiesRef.current.forEach((enemy) => {
        ctx.save();
        ctx.translate(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);

        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = enemy.color;
        ctx.fillStyle = enemy.color;
        ctx.lineWidth = 2;

        if (enemy.type === 'invader') {
          // Classic Vector Alien Invader Drawing
          const animLeg = Math.floor(tick / 15) % 2 === 0;

          ctx.beginPath();
          // Antennae
          ctx.moveTo(-10, -12); ctx.lineTo(-6, -6);
          ctx.moveTo(10, -12); ctx.lineTo(6, -6);
          // Body Box
          ctx.rect(-12, -6, 24, 12);
          ctx.stroke();

          // Eyes
          ctx.fillRect(-8, -3, 4, 4);
          ctx.fillRect(4, -3, 4, 4);

          // Animated Legs
          if (animLeg) {
            ctx.beginPath();
            ctx.moveTo(-12, 6); ctx.lineTo(-15, 12);
            ctx.moveTo(-4, 6); ctx.lineTo(-6, 12);
            ctx.moveTo(4, 6); ctx.lineTo(6, 12);
            ctx.moveTo(12, 6); ctx.lineTo(15, 12);
            ctx.stroke();
          } else {
            ctx.beginPath();
            ctx.moveTo(-12, 6); ctx.lineTo(-9, 12);
            ctx.moveTo(-4, 6); ctx.lineTo(-2, 12);
            ctx.moveTo(4, 6); ctx.lineTo(2, 12);
            ctx.moveTo(12, 6); ctx.lineTo(9, 12);
            ctx.stroke();
          }
        } else if (enemy.type === 'saucer') {
          // UFO Saucer
          ctx.beginPath();
          ctx.ellipse(0, 0, 22, 8, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(0, -3, 10, Math.PI, 0);
          ctx.stroke();

          // Pulsing dome lights
          const lightColor = Math.floor(tick / 10) % 2 === 0 ? '#ffe600' : '#00f0ff';
          ctx.fillStyle = lightColor;
          ctx.fillRect(-12, 0, 4, 3);
          ctx.fillRect(-3, 1, 4, 3);
          ctx.fillRect(6, 0, 4, 3);
        } else {
          // Polygon Asteroid Space Rock
          ctx.rotate(enemy.rotation);
          const r = enemy.width / 2;
          ctx.beginPath();
          const points = 7;
          for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const variance = i % 2 === 0 ? 1 : 0.75;
            const px = Math.cos(angle) * r * variance;
            const py = Math.sin(angle) * r * variance;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }

        ctx.restore();
      });

      // Render Player Ship (if playing & invulnerability flash check)
      const player = playerRef.current;
      const isInvulnerable = player.invulnerableTimer > 0;
      const shouldDrawPlayer = !isInvulnerable || Math.floor(tick / 4) % 2 === 0;

      if ((stateRef.current === 'PLAYING' || stateRef.current === 'PAUSED') && shouldDrawPlayer) {
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

        // Tilt effect based on arrow keys
        let tiltAngle = 0;
        if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) tiltAngle = -0.15;
        if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) tiltAngle = 0.15;
        ctx.rotate(tiltAngle);

        // Ship Outer Glow & Body
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#00ff66';
        ctx.fillStyle = '#032414';
        ctx.lineWidth = 2;

        // Draw Retro Starfighter Wing Vector Polygon
        ctx.beginPath();
        ctx.moveTo(0, -18); // nose tip
        ctx.lineTo(14, 14); // right wing tip
        ctx.lineTo(6, 10);  // right inner engine
        ctx.lineTo(-6, 10); // left inner engine
        ctx.lineTo(-14, 14); // left wing tip
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Cockpit Glass Hatch
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(4, 0);
        ctx.lineTo(-4, 0);
        ctx.closePath();
        ctx.fill();

        // Active Shield Render
        if (player.hasShield) {
          ctx.save();
          ctx.strokeStyle = '#00f0ff';
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 14;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 26 + Math.sin(tick * 0.1) * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();
      }

      // Render Floating Text Popups
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

      // -------------------------------------------------------------
      // 3. CANVAS HUD OVERLAY (Always visible on canvas top)
      // -------------------------------------------------------------
      ctx.save();
      ctx.font = '11px "Press Start 2P", monospace';

      // Top Header HUD Bar Background
      ctx.fillStyle = 'rgba(0, 20, 10, 0.65)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, 38);
      ctx.strokeStyle = '#00ff66';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 38);
      ctx.lineTo(CANVAS_WIDTH, 38);
      ctx.stroke();

      // Score Display
      ctx.fillStyle = '#00ff66';
      ctx.shadowColor = '#00ff66';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${scoreRef.current.toString().padStart(6, '0')}`, 16, 24);

      // Multiplier Badge
      if (multiplierRef.current > 1) {
        ctx.fillStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.fillText(`x${multiplierRef.current}`, 175, 24);
      }

      // High Score
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.textAlign = 'center';
      ctx.fillText(`HIGH: ${highScoreRef.current.toString().padStart(6, '0')}`, CANVAS_WIDTH / 2 - 20, 24);

      // Bomb Inventory Count Display
      ctx.fillStyle = playerRef.current.bombs > 0 ? '#ffe600' : '#ff007f';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 4;
      ctx.textAlign = 'right';
      ctx.fillText(`BOMBS: ${playerRef.current.bombs}`, CANVAS_WIDTH - 150, 24);

      // Lives Display (Mini Ship Icons)
      for (let l = 0; l < livesRef.current; l++) {
        const lx = CANVAS_WIDTH - 110 + l * 20;
        const ly = 22;
        ctx.fillStyle = '#00ff66';
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 4;

        ctx.beginPath();
        ctx.moveTo(lx, ly - 8);
        ctx.lineTo(lx + 6, ly + 6);
        ctx.lineTo(lx - 6, ly + 6);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // -------------------------------------------------------------
      // 4. GAME STATE SCREENS OVERLAY (START, PAUSED, GAMEOVER)
      // -------------------------------------------------------------
      if (stateRef.current === 'START') {
        ctx.save();
        ctx.fillStyle = 'rgba(3, 8, 6, 0.88)';
        ctx.fillRect(0, 40, CANVAS_WIDTH, CANVAS_HEIGHT - 40);

        // Title Header Banner
        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#00ff66';
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 12;
        ctx.fillText('SPACE DEFENDER 1984', CANVAS_WIDTH / 2, 110);

        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.fillText('RETRO 2D ARCADE SHOOTER', CANVAS_WIDTH / 2, 140);

        // Flashing Press Space
        if (Math.floor(tick / 30) % 2 === 0) {
          ctx.font = '12px "Press Start 2P", monospace';
          ctx.fillStyle = '#ffe600';
          ctx.shadowColor = '#ffe600';
          ctx.shadowBlur = 8;
          ctx.fillText('PRESS SPACE OR TAP TO START', CANVAS_WIDTH / 2, 210);
        }

        // Leaderboard Hall of Fame Table
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 6;
        ctx.fillText('★ TOP 5 PILOTS HALL OF FAME ★', CANVAS_WIDTH / 2, 280);

        leaderboardRef.current.slice(0, 5).forEach((entry, idx) => {
          const yPos = 315 + idx * 26;
          const rankLabel = `${idx + 1}. ${entry.name.padEnd(4, ' ')}`;
          const scoreLabel = entry.score.toString().padStart(6, '0');
          ctx.font = '10px "Press Start 2P", monospace';
          ctx.fillStyle = idx === 0 ? '#ffe600' : idx === 1 ? '#00f0ff' : '#00ff66';
          ctx.shadowBlur = 4;
          ctx.fillText(`${rankLabel} - ${scoreLabel}`, CANVAS_WIDTH / 2, yPos);
        });

        // Control Cards
        ctx.font = '9px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;

        ctx.fillText('MOVE: WASD / ARROWS / MOUSE / TOUCH DRAG', CANVAS_WIDTH / 2, 480);
        ctx.fillText('FIRE: SPACE / CLICK    BOMB: [B] KEY or BOMB BUTTON', CANVAS_WIDTH / 2, 510);
        ctx.fillText('PAUSE: P / ESC    MUTE: M', CANVAS_WIDTH / 2, 540);

        ctx.restore();
      } else if (stateRef.current === 'PAUSED') {
        ctx.save();
        ctx.fillStyle = 'rgba(3, 8, 6, 0.70)';
        ctx.fillRect(0, 40, CANVAS_WIDTH, CANVAS_HEIGHT - 40);

        ctx.font = '22px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 12;
        ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

        ctx.font = '12px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        ctx.fillText('PRESS P OR ESC TO RESUME', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
        ctx.restore();
      } else if (stateRef.current === 'GAMEOVER') {
        ctx.save();
        ctx.fillStyle = 'rgba(10, 2, 5, 0.88)';
        ctx.fillRect(0, 40, CANVAS_WIDTH, CANVAS_HEIGHT - 40);

        ctx.font = '26px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ff007f';
        ctx.shadowColor = '#ff007f';
        ctx.shadowBlur = 16;
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, 140);

        ctx.font = '14px "Press Start 2P", monospace';
        ctx.fillStyle = '#00ff66';
        ctx.shadowColor = '#00ff66';
        ctx.shadowBlur = 8;
        ctx.fillText(`FINAL SCORE: ${scoreRef.current}`, CANVAS_WIDTH / 2, 190);

        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.fillText(`HIGH SCORE: ${highScoreRef.current}`, CANVAS_WIDTH / 2, 225);

        // Leaderboard Table on Game Over
        ctx.font = '11px "Press Start 2P", monospace';
        ctx.fillStyle = '#ffe600';
        ctx.shadowColor = '#ffe600';
        ctx.shadowBlur = 6;
        ctx.fillText('LEADERBOARD RANKINGS', CANVAS_WIDTH / 2, 280);

        leaderboardRef.current.slice(0, 5).forEach((entry, idx) => {
          const yPos = 315 + idx * 24;
          const rankLabel = `${idx + 1}. ${entry.name.padEnd(4, ' ')}`;
          const scoreLabel = entry.score.toString().padStart(6, '0');
          ctx.font = '10px "Press Start 2P", monospace';
          ctx.fillStyle = idx === 0 ? '#ffe600' : idx === 1 ? '#00f0ff' : '#00ff66';
          ctx.shadowBlur = 4;
          ctx.fillText(`${rankLabel} - ${scoreLabel}`, CANVAS_WIDTH / 2, yPos);
        });

        if (Math.floor(tick / 30) % 2 === 0) {
          ctx.font = '11px "Press Start 2P", monospace';
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 0;
          ctx.fillText('PRESS SPACE TO RESTART', CANVAS_WIDTH / 2, 480);
        }

        ctx.restore();
      }

      ctx.restore(); // Restore shake transform

      // Request next frame
      animFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [resetGame]);

  return (
    <div className="flex flex-col items-center w-full">
      {/* Canvas Display Container */}
      <div className="relative w-full max-w-[800px] aspect-[4/3] mx-auto bg-[#030806] rounded-lg overflow-hidden shadow-2xl select-none touch-none">
        {/* Canvas Element with Mouse & Touch Event Handlers */}
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

        {/* CRT Physical Screen Effect Layers */}
        <div className="absolute inset-0 crt-scanlines pointer-events-none z-10" />
        <div className="absolute inset-0 crt-vignette pointer-events-none z-20" />
        <div className="absolute inset-0 crt-glare pointer-events-none z-30" />
      </div>

      {/* Leaderboard Submission Box (Visible on Game Over) */}
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
                className="w-16 bg-black border border-[#00ff66] text-[#00ff66] text-center font-retro py-1 px-2 uppercase rounded focus:outline-none focus:ring-1 focus:ring-[#00ff66]"
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

      {/* On-Screen Touch & Mobile Virtual Controller */}
      <div className="mt-4 w-full max-w-[800px] flex items-center justify-between px-2 sm:px-6 select-none touch-none">
        {/* Virtual D-Pad */}
        <div className="relative w-28 h-28 bg-stone-900/90 border border-stone-700/80 rounded-2xl p-2 grid grid-cols-3 grid-rows-3 gap-1 shadow-lg">
          <div />
          <button
            onPointerDown={() => (keysRef.current['ArrowUp'] = true)}
            onPointerUp={() => (keysRef.current['ArrowUp'] = false)}
            onPointerLeave={() => (keysRef.current['ArrowUp'] = false)}
            className="bg-stone-800 active:bg-[#00ff66] active:text-black border border-stone-700 rounded-lg text-center text-xs font-bold text-[#00ff66] flex items-center justify-center transition-transform active:scale-95"
          >
            ▲
          </button>
          <div />
          <button
            onPointerDown={() => (keysRef.current['ArrowLeft'] = true)}
            onPointerUp={() => (keysRef.current['ArrowLeft'] = false)}
            onPointerLeave={() => (keysRef.current['ArrowLeft'] = false)}
            className="bg-stone-800 active:bg-[#00ff66] active:text-black border border-stone-700 rounded-lg text-center text-xs font-bold text-[#00ff66] flex items-center justify-center transition-transform active:scale-95"
          >
            ◀
          </button>
          <div className="flex items-center justify-center text-[9px] text-stone-500 font-mono">D-PAD</div>
          <button
            onPointerDown={() => (keysRef.current['ArrowRight'] = true)}
            onPointerUp={() => (keysRef.current['ArrowRight'] = false)}
            onPointerLeave={() => (keysRef.current['ArrowRight'] = false)}
            className="bg-stone-800 active:bg-[#00ff66] active:text-black border border-stone-700 rounded-lg text-center text-xs font-bold text-[#00ff66] flex items-center justify-center transition-transform active:scale-95"
          >
            ▶
          </button>
          <div />
          <button
            onPointerDown={() => (keysRef.current['ArrowDown'] = true)}
            onPointerUp={() => (keysRef.current['ArrowDown'] = false)}
            onPointerLeave={() => (keysRef.current['ArrowDown'] = false)}
            className="bg-stone-800 active:bg-[#00ff66] active:text-black border border-stone-700 rounded-lg text-center text-xs font-bold text-[#00ff66] flex items-center justify-center transition-transform active:scale-95"
          >
            ▼
          </button>
          <div />
        </div>

        {/* Status Indicator */}
        <div className="hidden sm:flex flex-col items-center text-[10px] font-retro text-stone-400 text-center">
          <span className="text-[#ffe600]">BOMB: [B] KEY</span>
          <span className="text-[9px] text-stone-500 mt-1">BOMBS REMAINING: {bombs}</span>
        </div>

        {/* Virtual Action Buttons */}
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
            className={`w-14 h-14 rounded-full font-retro text-[9px] font-bold shadow-lg flex items-center justify-center transition-transform active:scale-95 ${
              bombs > 0 || gameState !== 'PLAYING'
                ? 'bg-gradient-to-b from-[#ffe600]/30 to-amber-900/40 border border-[#ffe600] text-[#ffe600]'
                : 'bg-stone-800 border border-stone-700 text-stone-600 opacity-50 cursor-not-allowed'
            }`}
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
            className="w-16 h-16 bg-gradient-to-b from-[#00ff66]/30 to-emerald-900/40 border-2 border-[#00ff66] active:scale-95 text-[#00ff66] rounded-full font-retro text-[10px] font-bold shadow-[0_0_15px_rgba(0,255,102,0.4)] flex items-center justify-center transition-transform"
          >
            {gameState === 'PLAYING' ? 'FIRE' : 'START'}
          </button>
        </div>
      </div>
    </div>
  );
}
