import { Particle, FloatingText } from '../types/game';

export class ParticleSystem {
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public screenShake: number = 0;

  public addScreenShake(intensity: number) {
    this.screenShake = Math.max(this.screenShake, intensity);
  }

  public updateScreenShake() {
    if (this.screenShake > 0) {
      this.screenShake *= 0.88;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }
  }

  public addFloatingText(x: number, y: number, text: string, color: string = '#00ff66') {
    this.floatingTexts.push({
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      text,
      color,
      alpha: 1.0,
      vy: -1.2,
      life: 45,
    });
  }

  public createExplosion(x: number, y: number, color: string, count: number = 16) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 4.5;
      this.particles.push({
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
  }

  public createThrusterTrail(x: number, y: number, color: string) {
    this.particles.push({
      id: Math.random().toString(36).substring(2, 9),
      x: x + (Math.random() * 6 - 3),
      y: y + 2,
      vx: Math.random() * 0.8 - 0.4,
      vy: 2.0 + Math.random() * 1.5,
      size: 2 + Math.random() * 2,
      color,
      alpha: 0.9,
      maxLife: 12,
      life: 0,
    });
  }

  public update() {
    this.updateScreenShake();

    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life += 1;
      p.alpha = 1 - p.life / p.maxLife;
    });
    this.particles = this.particles.filter((p) => p.life < p.maxLife);

    this.floatingTexts.forEach((ft) => {
      ft.y += ft.vy;
      ft.life -= 1;
      ft.alpha = ft.life / 45;
    });
    this.floatingTexts = this.floatingTexts.filter((ft) => ft.life > 0);
  }

  public render(ctx: CanvasRenderingContext2D) {
    this.particles.forEach((p) => {
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

    this.floatingTexts.forEach((ft) => {
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
  }
}
