<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Application, Graphics, ColorMatrixFilter } from 'pixi.js';
  import { theme, darkMode } from '../stores/settings';

  export let mainUrl: string;

  let canvasEl: HTMLCanvasElement;
  let app: Application;
  let triggered = false;

  onMount(async () => {
    app = new Application();
    await app.init({
      canvas: canvasEl,
      resizeTo: canvasEl.parentElement!,
      backgroundColor: 0x0a0a0f,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    buildParticleNetwork();

    app.canvas.addEventListener('click', triggerTransition);
    app.canvas.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') triggerTransition();
    });

    theme.subscribe(updateBgColor);
    darkMode.subscribe(updateBgColor);
  });

  onDestroy(() => { app?.destroy(true); });

  function getThemeColors() {
    const t = document.documentElement.getAttribute('data-theme') || 'warm';
    const m = document.documentElement.getAttribute('data-mode') || 'dark';
    if (m === 'light') return { bg: 0xe8d8b0, particle: 0xc07820 };
    if (t === 'cool') return { bg: 0x050810, particle: 0x40a0e8 };
    if (t === 'mono') return { bg: 0x040404, particle: 0xc0c0c0 };
    return { bg: 0x0a0a0f, particle: 0xe8a040 };
  }

  function updateBgColor() {
    if (!app) return;
    const colors = getThemeColors();
    app.renderer.background.color = colors.bg;
  }

  function buildParticleNetwork() {
    const PARTICLE_COUNT = 80;
    const particles: Array<{ x: number; y: number; vx: number; vy: number }> = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * app.screen.width,
        y: Math.random() * app.screen.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    const gfx = new Graphics();
    app.stage.addChild(gfx);

    app.ticker.add(() => {
      const colors = getThemeColors();
      gfx.clear();

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > app.screen.width) p.vx *= -1;
        if (p.y < 0 || p.y > app.screen.height) p.vy *= -1;
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.2;
            gfx.moveTo(particles[i].x, particles[i].y);
            gfx.lineTo(particles[j].x, particles[j].y);
            gfx.stroke({ color: colors.particle, alpha, width: 0.8 });
          }
        }
      }

      for (const p of particles) {
        gfx.circle(p.x, p.y, 1.5);
        gfx.fill({ color: colors.particle, alpha: 0.7 });
      }
    });

    window.addEventListener('resize', () => {
      for (const p of particles) {
        p.x = Math.min(p.x, app.screen.width);
        p.y = Math.min(p.y, app.screen.height);
      }
    });
  }

  function triggerTransition() {
    if (triggered) return;
    triggered = true;

    const overlay = new Graphics();
    overlay.rect(0, 0, app.screen.width, app.screen.height);
    overlay.fill({ color: 0xffffff, alpha: 0 });
    app.stage.addChild(overlay);

    const filter = new ColorMatrixFilter();
    app.stage.filters = [filter];

    let phase = 0;
    let elapsed = 0;

    app.ticker.add((ticker) => {
      elapsed += ticker.deltaMS;

      if (phase === 0 && elapsed < 300) {
        const flicker = Math.sin(elapsed * 0.1) * 0.5 + 0.5;
        filter.brightness(1 + flicker * 2, false);
      } else if (phase === 0) {
        phase = 1;
        elapsed = 0;
      }

      if (phase === 1 && elapsed < 600) {
        const progress = elapsed / 600;
        const scale = 1 - progress * 0.98;
        app.stage.scale.set(scale);
        app.stage.position.set(
          app.screen.width / 2 * (1 - scale),
          app.screen.height / 2 * (1 - scale)
        );
        filter.brightness(1 + progress * 4, false);
      } else if (phase === 1) {
        phase = 2;
        elapsed = 0;
        overlay.clear();
        overlay.rect(0, 0, app.screen.width * 10, app.screen.height * 10);
        overlay.fill({ color: 0xffffff, alpha: 1 });
      }

      if (phase === 2 && elapsed >= 300) {
        window.location.href = mainUrl;
      }
    });
  }
</script>

<canvas
  bind:this={canvasEl}
  style="position: absolute; inset: 0; width: 100%; height: 100%; cursor: pointer;"
  tabindex="0"
></canvas>
