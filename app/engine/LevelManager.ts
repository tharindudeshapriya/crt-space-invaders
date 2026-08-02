import { Enemy, EnemyType } from '../types/game';

export interface LevelInfo {
  levelNumber: number;
  name: string;
  targetScore: number;
  bossType: 'boss1' | 'boss2' | 'boss3' | 'boss4' | null;
}

export class LevelManager {
  public currentWave: number = 1;
  public levelBannerText: string = 'LEVEL 1: DEEP SPACE PATROL';
  public levelBannerTimer: number = 120;
  public spawnTimer: number = 0;

  public getLevelInfo(waveNum: number): LevelInfo {
    if (waveNum <= 3) {
      return {
        levelNumber: 1,
        name: 'LEVEL 1: DEEP SPACE PATROL',
        targetScore: 7500,
        bossType: waveNum === 3 ? 'boss1' : null,
      };
    }
    if (waveNum <= 6) {
      return {
        levelNumber: 2,
        name: 'LEVEL 2: ASTEROID BELT HAZARD',
        targetScore: 15000,
        bossType: waveNum === 6 ? 'boss2' : null,
      };
    }
    if (waveNum <= 9) {
      return {
        levelNumber: 3,
        name: 'LEVEL 3: NEBULA PLASMA STORM',
        targetScore: 22500,
        bossType: waveNum === 9 ? 'boss3' : null,
      };
    }
    if (waveNum <= 12) {
      return {
        levelNumber: 4,
        name: 'LEVEL 4: ALIEN ARMADA BASE',
        targetScore: 30000,
        bossType: waveNum === 12 ? 'boss4' : null,
      };
    }
    return {
      levelNumber: 5,
      name: 'LEVEL 5: CORE OVERLORD',
      targetScore: 999999,
      bossType: null,
    };
  }

  public updateBanner() {
    if (this.levelBannerTimer > 0) {
      this.levelBannerTimer--;
    }
  }

  public setWave(waveNum: number): string | null {
    this.currentWave = waveNum;
    const info = this.getLevelInfo(waveNum);
    if (info.name !== this.levelBannerText) {
      this.levelBannerText = info.name;
      this.levelBannerTimer = 150;
      return info.name;
    }
    return null;
  }
}
