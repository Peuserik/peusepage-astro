<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Application, Graphics, ColorMatrixFilter } from 'pixi.js';
  import { theme, darkMode, lang } from '../stores/settings';

  export let name: string;
  export let title: string;
  export let tagline: string;
  export let officeUrl: string;
  export let translationsJson: string = '{}';

  let containerEl: HTMLDivElement;
  let app: Application;
  let triggered = false;
  let transitioning = false;
  let translations: Record<string, Record<string, string>> = {};

  // Reactive store values
  $: t = $theme;
  $: dark = $darkMode;
  $: l = $lang;

  // Welcome text cycling state
  const FONTS = [
    "'Playfair Display', serif",
    "'Space Grotesk', sans-serif",
    "'Bebas Neue', sans-serif",
    "'Cinzel', serif",
    "'Special Elite', cursive",
    "'Major Mono Display', monospace",
  ];
  let fontIdx = 0;
  let flip = false;
  let welcomeFont = FONTS[0];
  let welcomeOpacity = 1;
  let welcomeText = 'Welcome';
  let hintText = 'Click anywhere to enter';

  // Update hint text reactively
  $: hintText = translations[$lang]?.tagline_cta ?? 'Click anywhere to enter';
  // (Pixi bg color is drawn each tick by buildParticleNetwork, reading live store values)

  function getBgColor(th: string, dk: boolean): number {
    if (!dk) return 0xe8d8b0;
    if (th === 'cool') return 0x050810;
    if (th === 'mono') return 0x040404;
    return 0x0a0a0f;
  }

  function getParticleColor(th: string, dk: boolean): number {
    if (!dk) return 0xc07820;
    if (th === 'cool') return 0x40a0e8;
    if (th === 'mono') return 0xc0c0c0;
    return 0xe8a040;
  }

  onMount(async () => {
    try { translations = JSON.parse(translationsJson); } catch {}
    welcomeText = translations[$lang]?.welcome ?? 'Welcome';

    // Let Pixi create & own its canvas, append to our container
    app = new Application();
    await app.init({
      resizeTo: containerEl,
      backgroundAlpha: 0,   // transparent — we draw bg in ticker
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    Object.assign(app.canvas.style, { position: 'absolute', inset: '0', display: 'block' });
    // Insert canvas BEFORE overlay so overlay stays on top
    containerEl.insertBefore(app.canvas, containerEl.firstChild);

    buildParticleNetwork();
    startWelcomeCycle();
  });

  onDestroy(() => app?.destroy(true));

  function buildParticleNetwork() {
    const N = 80;
    type P = { x: number; y: number; vx: number; vy: number };
    const pts: P[] = Array.from({ length: N }, () => ({
      x: Math.random() * app.screen.width,
      y: Math.random() * app.screen.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
    }));

    const gfx = new Graphics();
    app.stage.addChild(gfx);

    app.ticker.add(() => {
      gfx.clear();
      // Draw background rect every frame so theme changes are instant
      gfx.rect(0, 0, app.screen.width, app.screen.height).fill({ color: getBgColor($theme, $darkMode) });

      const color = getParticleColor($theme, $darkMode);

      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > app.screen.width)  p.vx *= -1;
        if (p.y < 0 || p.y > app.screen.height) p.vy *= -1;
      }

      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            gfx.moveTo(pts[i].x, pts[i].y);
            gfx.lineTo(pts[j].x, pts[j].y);
            gfx.stroke({ color, alpha: (1 - dist / 130) * 0.2, width: 0.8 });
          }
        }
      }
      for (const p of pts) {
        gfx.circle(p.x, p.y, 1.5);
        gfx.fill({ color, alpha: 0.7 });
      }
    });
  }

  function startWelcomeCycle() {
    setInterval(() => {
      welcomeOpacity = 0;
      setTimeout(() => {
        fontIdx = (fontIdx + 1) % FONTS.length;
        welcomeFont = FONTS[fontIdx];
        flip = !flip;
        const show = flip ? ($lang === 'en' ? 'de' : 'en') : $lang;
        welcomeText = translations[show]?.welcome ?? (show === 'de' ? 'Willkommen' : 'Welcome');
        welcomeOpacity = 1;
      }, 400);
    }, 3000);
  }

  function triggerTransition() {
    if (triggered || !app) return;
    triggered = true;
    transitioning = true; // hides HTML overlay immediately

    const filter = new ColorMatrixFilter();
    app.stage.filters = [filter];

    let phase = 0, elapsed = 0;

    app.ticker.add((ticker) => {
      elapsed += ticker.deltaMS;

      if (phase === 0) {
        // Phase 0: flicker (350ms)
        if (elapsed < 350) {
          filter.brightness(1 + Math.abs(Math.sin(elapsed * 0.025)) * 2.5, false);
        } else { phase = 1; elapsed = 0; }

      } else if (phase === 1) {
        // Phase 1: collapse + brighten (600ms)
        if (elapsed < 600) {
          const p = elapsed / 600;
          const s = 1 - p * 0.98;
          app.stage.scale.set(s);
          app.stage.position.set(
            app.screen.width  / 2 * (1 - s),
            app.screen.height / 2 * (1 - s),
          );
          filter.brightness(1 + p * 6, false);
        } else { phase = 2; elapsed = 0; }

      } else if (phase === 2 && elapsed >= 100) {
        // Phase 2: navigate after brief white flash
        window.location.href = officeUrl;
      }
    });
  }
</script>

<!-- Container receives clicks; Pixi canvas is appended inside by onMount -->
<div
  bind:this={containerEl}
  class="wrap"
  on:click={triggerTransition}
  on:keydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); triggerTransition(); } }}
  role="button"
  tabindex="0"
  aria-label="Click anywhere to enter"
>
  <!-- HTML overlay: hidden when transition starts so Pixi animation plays cleanly -->
  {#if !transitioning}
  <div class="overlay">
    <!-- Certificate card -->
    <div class="cert">
      <span class="cert-seal" aria-hidden="true">❋</span>
      <p class="cert-name">{name}</p>
      <p class="cert-title">{title}</p>
      <hr class="cert-line" />
      <p class="cert-tagline">{tagline}</p>
    </div>

    <!-- Welcome cycling text -->
    <p
      class="welcome"
      style="font-family:{welcomeFont}; opacity:{welcomeOpacity};"
      aria-live="polite"
    >{welcomeText}</p>

    <!-- Hint -->
    <p class="hint">{hintText}</p>
  </div>
  {/if}

  <!-- White flash overlay that fades in at the end of the transition -->
  {#if transitioning}
  <div class="flash" style="animation-delay: 0.85s;"></div>
  {/if}
</div>

<style>
  .wrap {
    position: absolute;
    inset: 0;
    cursor: pointer;
    outline: none;
    overflow: hidden;
    background: transparent;
  }

  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    pointer-events: none; /* let clicks fall through to .wrap */
    z-index: 5;
  }

  /* Transition flash overlay */
  .flash {
    position: absolute;
    inset: 0;
    background: white;
    z-index: 10;
    opacity: 0;
    animation: flash-in 0.3s ease-in forwards;
    pointer-events: none;
  }
  @keyframes flash-in { to { opacity: 1; } }

  /* Certificate */
  .cert {
    background: linear-gradient(135deg, #fdf8e8, #f5e8c8);
    border: 3px double #e8a040;
    border-radius: 6px;
    padding: 2.5rem 3rem;
    text-align: center;
    box-shadow: 0 4px 24px rgba(0,0,0,.6), 0 0 0 6px rgba(232,160,64,.15),
                inset 0 0 30px rgba(255,240,200,.3);
    color: #2a1a08;
    max-width: 460px;
    width: 90%;
  }
  .cert-seal {
    display: block;
    font-size: 2rem;
    color: #e8a040;
    margin-bottom: .75rem;
    filter: drop-shadow(0 0 6px #e8a040);
  }
  .cert-name {
    font-family: 'Cinzel', serif;
    font-size: clamp(1.1rem, 2.5vw, 1.7rem);
    font-weight: 700;
    letter-spacing: .05em;
    margin: 0 0 .25rem;
    color: #1a0e04;
  }
  .cert-title {
    font-family: 'Special Elite', cursive;
    font-size: clamp(.75rem, 1.5vw, 1rem);
    color: #4a3020;
    margin: 0 0 1rem;
    letter-spacing: .04em;
  }
  .cert-line {
    border: none;
    border-top: 1px solid rgba(232,160,64,.6);
    margin: .75rem auto;
    width: 60%;
  }
  .cert-tagline {
    font-family: 'Special Elite', cursive;
    font-size: clamp(.65rem, 1.2vw, .85rem);
    color: #5a3a18;
    font-style: italic;
    line-height: 1.5;
    margin: 0;
  }

  /* Welcome text */
  .welcome {
    font-size: clamp(2.5rem, 7vw, 5rem);
    color: var(--text, #f0deb4);
    text-shadow: 0 0 20px var(--glow), 0 0 40px var(--glow);
    display: inline-block;
    transition: opacity .4s ease;
    margin: 0;
    text-align: center;
  }

  /* Hint */
  .hint {
    position: absolute;
    bottom: 1.5rem;
    font-size: .75rem;
    color: var(--text-muted, #a08060);
    letter-spacing: .1em;
    text-transform: uppercase;
    animation: pulse 2.5s ease-in-out infinite;
    margin: 0;
  }
  @keyframes pulse { 0%,100%{opacity:.35} 50%{opacity:1} }
</style>
