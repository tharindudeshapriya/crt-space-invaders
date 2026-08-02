import { Enemy, Bullet } from '../types/game';

export class BossEngine {
  public updateBoss(boss: Enemy, bullets: Bullet[], speedScale: number = 1.0, palette: { primary: string; secondary: string; accent: string; gold: string }) {
    boss.x += boss.vx * speedScale;
    if (boss.x < 30 || boss.x > 800 - boss.width - 30) {
      boss.vx = -boss.vx;
    }

    boss.bossShieldAngle = (boss.bossShieldAngle || 0) + 0.04;
    boss.bossAttackTimer = (boss.bossAttackTimer || 0) + 1;

    if (boss.health < boss.maxHealth * 0.5 && boss.bossPhase === 1) {
      boss.bossPhase = 2;
    }

    if (boss.type === 'boss1') {
      if (boss.bossAttackTimer % 75 === 0) {
        bullets.push(
          { id: Math.random().toString(), x: boss.x + 20, y: boss.y + boss.height, vx: -1.2, vy: 4.5, radius: 4, color: palette.accent, isPlayer: false, damage: 1 },
          { id: Math.random().toString(), x: boss.x + boss.width - 20, y: boss.y + boss.height, vx: 1.2, vy: 4.5, radius: 4, color: palette.accent, isPlayer: false, damage: 1 }
        );
      }
    } else if (boss.type === 'boss2') {
      if (boss.bossAttackTimer % 65 === 0) {
        for (let i = -1; i <= 1; i++) {
          bullets.push({
            id: Math.random().toString(),
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height,
            vx: i * 2.0,
            vy: 4.0,
            radius: 5,
            color: palette.gold,
            isPlayer: false,
            damage: 1,
          });
        }
      }
    } else if (boss.type === 'boss3') {
      if (boss.bossAttackTimer % 50 === 0) {
        for (let a = 0; a < 6; a++) {
          const angle = (a / 6) * Math.PI * 2;
          bullets.push({
            id: Math.random().toString(),
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height / 2,
            vx: Math.cos(angle) * 3.5,
            vy: Math.sin(angle) * 3.5,
            radius: 4,
            color: palette.secondary,
            isPlayer: false,
            damage: 1,
          });
        }
      }
    } else if (boss.type === 'boss4') {
      if (boss.bossAttackTimer % 45 === 0) {
        bullets.push({
          id: Math.random().toString(),
          x: boss.x + boss.width / 2,
          y: boss.y + boss.height,
          vx: (Math.random() - 0.5) * 3,
          vy: 5.0,
          radius: 5,
          color: palette.accent,
          isPlayer: false,
          damage: 1,
        });
      }
      boss.laserBeamActive = boss.bossAttackTimer % 180 > 120;
    }
  }

  public renderBoss(ctx: CanvasRenderingContext2D, boss: Enemy, palette: { primary: string; secondary: string; accent: string; gold: string }) {
    ctx.save();
    ctx.translate(boss.x + boss.width / 2, boss.y + boss.height / 2);

    ctx.shadowColor = boss.color;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = boss.color;
    ctx.fillStyle = boss.color;
    ctx.lineWidth = 2;

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
    ctx.rotate(boss.bossShieldAngle || 0);
    ctx.strokeStyle = palette.secondary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 48, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  }
}
