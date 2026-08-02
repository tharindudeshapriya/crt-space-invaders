import { CrtThemeMode, Star, LeaderboardEntry } from '../types/game';

export class RenderEngine {
  public getPalette(theme: CrtThemeMode = 'NEON') {
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
  }

  public renderStarfield(ctx: CanvasRenderingContext2D, stars: Star[], width: number, height: number) {
    stars.forEach((star) => {
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.alpha;
      ctx.fillRect(star.x, star.y, star.size, star.size);
      star.y += star.speed;
      if (star.y > height) {
        star.y = -5;
        star.x = Math.random() * width;
      }
    });
    ctx.globalAlpha = 1.0;
  }

  public renderHUD(
    ctx: CanvasRenderingContext2D,
    score: number,
    highScore: number,
    bombs: number,
    lives: number,
    multiplier: number,
    palette: { primary: string; secondary: string; accent: string; gold: string }
  ) {
    ctx.save();
    ctx.font = '11px "Press Start 2P", monospace';

    ctx.fillStyle = 'rgba(0, 20, 10, 0.65)';
    ctx.fillRect(0, 0, 800, 38);
    ctx.strokeStyle = palette.primary;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 38);
    ctx.lineTo(800, 38);
    ctx.stroke();

    ctx.fillStyle = palette.primary;
    ctx.shadowColor = palette.primary;
    ctx.shadowBlur = 4;
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score.toString().padStart(6, '0')}`, 16, 24);

    if (multiplier > 1) {
      ctx.fillStyle = palette.gold;
      ctx.fillText(`x${multiplier}`, 175, 24);
    }

    ctx.fillStyle = palette.secondary;
    ctx.shadowColor = palette.secondary;
    ctx.textAlign = 'center';
    ctx.fillText(`HIGH: ${highScore.toString().padStart(6, '0')}`, 380, 24);

    ctx.fillStyle = bombs > 0 ? palette.gold : palette.accent;
    ctx.textAlign = 'right';
    ctx.fillText(`BOMBS: ${bombs}`, 650, 24);

    for (let l = 0; l < lives; l++) {
      const lx = 690 + l * 20;
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
  }
}
