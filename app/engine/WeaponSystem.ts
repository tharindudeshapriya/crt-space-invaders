import { Bullet, Enemy, WeaponType } from '../types/game';
import { soundEngine } from '../lib/audio';

export class WeaponSystem {
  public bullets: Bullet[] = [];

  public fire(
    x: number,
    y: number,
    width: number,
    weaponType: WeaponType,
    palette: { primary: string; secondary: string; accent: string; gold: string }
  ) {
    if (weaponType === 'triple') {
      soundEngine.playLaser();
      this.bullets.push(
        { id: Math.random().toString(), x: x + width / 2, y, vx: 0, vy: -11, radius: 3, color: palette.secondary, isPlayer: true, damage: 1 },
        { id: Math.random().toString(), x: x + 4, y: y + 6, vx: -2.2, vy: -10, radius: 3, color: palette.accent, isPlayer: true, damage: 1 },
        { id: Math.random().toString(), x: x + width - 4, y: y + 6, vx: 2.2, vy: -10, radius: 3, color: palette.accent, isPlayer: true, damage: 1 }
      );
    } else if (weaponType === 'plasma_beam') {
      soundEngine.playLaser();
      this.bullets.push({
        id: Math.random().toString(),
        x: x + width / 2,
        y: y - 10,
        vx: 0,
        vy: -14,
        radius: 7,
        color: palette.accent,
        isPlayer: true,
        damage: 2,
        isBeam: true,
      });
    } else if (weaponType === 'homing_missiles') {
      soundEngine.playMissile();
      this.bullets.push(
        { id: Math.random().toString(), x: x + 4, y: y + 10, vx: -1.5, vy: -6, radius: 4, color: palette.gold, isPlayer: true, damage: 2, isHoming: true },
        { id: Math.random().toString(), x: x + width - 4, y: y + 10, vx: 1.5, vy: -6, radius: 4, color: palette.gold, isPlayer: true, damage: 2, isHoming: true }
      );
    } else if (weaponType === 'hyper_cannon') {
      soundEngine.playMissile();
      this.bullets.push({
        id: Math.random().toString(),
        x: x + width / 2,
        y,
        vx: 0,
        vy: -8,
        radius: 9,
        color: palette.gold,
        isPlayer: true,
        damage: 3,
        isHyper: true,
      });
    } else {
      soundEngine.playLaser();
      this.bullets.push(
        { id: Math.random().toString(), x: x + 8, y, vx: 0, vy: -11, radius: 3.5, color: palette.primary, isPlayer: true, damage: 1 },
        { id: Math.random().toString(), x: x + width - 8, y, vx: 0, vy: -11, radius: 3.5, color: palette.primary, isPlayer: true, damage: 1 }
      );
    }
  }

  public update(enemies: Enemy[], speedScale: number = 1.0) {
    this.bullets.forEach((b) => {
      if (b.isHoming && b.isPlayer) {
        let closestEnemy: Enemy | null = null;
        let minDist = 9999;
        enemies.forEach((e) => {
          const dist = Math.hypot(e.x + e.width / 2 - b.x, e.y + e.height / 2 - b.y);
          if (dist < minDist) {
            minDist = dist;
            closestEnemy = e;
          }
        });

        if (closestEnemy) {
          const targetAngle = Math.atan2(
            (closestEnemy as Enemy).y + (closestEnemy as Enemy).height / 2 - b.y,
            (closestEnemy as Enemy).x + (closestEnemy as Enemy).width / 2 - b.x
          );
          b.vx += Math.cos(targetAngle) * 0.6;
          b.vy += Math.sin(targetAngle) * 0.6;
        }
      }

      b.x += b.vx;
      b.y += b.vy * (b.isPlayer ? 1 : speedScale);
    });

    this.bullets = this.bullets.filter(
      (b) => b.x >= -10 && b.x <= 810 && b.y >= -10 && b.y <= 610 && b.damage > 0
    );
  }

  public render(ctx: CanvasRenderingContext2D) {
    this.bullets.forEach((b) => {
      ctx.save();
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = b.color;

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }
}
