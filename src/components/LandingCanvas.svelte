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

  // ── Welcome text cycling ──────────────────────────────────────────────────
  const FONTS = [
    "'Playfair Display', serif",
    "'Space Grotesk', sans-serif",
    "'Bebas Neue', sans-serif",
    "'Cinzel', serif",
    "'Special Elite', cursive",
    "'Major Mono Display', monospace",
  ];
  let fontIdx = 0, flip = false;
  let welcomeFont = FONTS[0];
  let welcomeOpacity = 1;
  let welcomeText = 'Welcome';
  let hintText = 'Click anywhere to enter';
  $: hintText = translations[$lang]?.tagline_cta ?? 'Click anywhere to enter';

  // ── Color helpers ─────────────────────────────────────────────────────────
  function getBg(th: string, dk: boolean): number {
    if (!dk) return 0xd8c898;
    if (th === 'cool') return 0x020610;
    if (th === 'mono') return 0x030303;
    return 0x080502;
  }
  function getAccent(th: string, dk: boolean): number {
    if (!dk) return th === 'cool' ? 0x2060c0 : th === 'mono' ? 0x505050 : 0xb05010;
    if (th === 'cool') return 0x2888e0;
    if (th === 'mono') return 0x909090;
    return 0xe07828;
  }
  function getBright(th: string): number {
    if (th === 'cool') return 0x90d8ff;
    if (th === 'mono') return 0xd0d0d0;
    return 0xffc060;
  }

  // ── Screensaver state ─────────────────────────────────────────────────────
  // warm — embers
  type Ember = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number };
  const embers: Ember[] = [];

  // cool — starfield
  type Star = { x: number; y: number; z: number; pz: number };
  const stars: Star[] = [];
  let starsReady = false;

  // mono — matrix rain columns
  type Col = { x: number; y: number; speed: number; len: number };
  const cols: Col[] = [];
  let colsReady = false;
  let tick = 0;

  // ── Mount ─────────────────────────────────────────────────────────────────
  onMount(async () => {
    try { translations = JSON.parse(translationsJson); } catch {}
    welcomeText = translations[$lang]?.welcome ?? 'Welcome';

    app = new Application();
    await app.init({
      resizeTo: containerEl,
      backgroundAlpha: 0,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    Object.assign(app.canvas.style, { position: 'absolute', inset: '0', display: 'block' });
    containerEl.insertBefore(app.canvas, containerEl.firstChild);

    const gfx = new Graphics();
    app.stage.addChild(gfx);

    app.ticker.add(() => {
      const W = app.screen.width, H = app.screen.height;
      const th = $theme, dk = $darkMode;
      tick++;

      gfx.clear();
      gfx.rect(0, 0, W, H).fill({ color: getBg(th, dk) });

      if (th === 'warm') drawEmbers(gfx, W, H, th, dk);
      else if (th === 'cool') drawStarfield(gfx, W, H, th, dk);
      else drawMatrix(gfx, W, H, th, dk);
    });

    startWelcomeCycle();
  });

  onDestroy(() => app?.destroy(true));

  // ── Screensaver: warm — floating embers ──────────────────────────────────
  function spawnEmber(W: number, H: number): Ember {
    return {
      x: W * 0.1 + Math.random() * W * 0.8,
      y: H + 5,
      vx: (Math.random() - 0.5) * 0.7,
      vy: -(0.5 + Math.random() * 1.4),
      r: 1.2 + Math.random() * 3.5,
      life: 0,
      max: 140 + Math.random() * 160,
    };
  }

  function drawEmbers(gfx: Graphics, W: number, H: number, th: string, dk: boolean) {
    if (embers.length < 110) embers.push(spawnEmber(W, H));
    const accent = getAccent(th, dk), bright = getBright(th);

    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.x += e.vx + Math.sin(e.life * 0.045 + i) * 0.4;
      e.y += e.vy;
      e.life++;
      if (e.life > e.max || e.y < -10) { embers.splice(i, 1); continue; }

      const p = e.life / e.max;
      const alpha = p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85;
      gfx.circle(e.x, e.y, e.r * (1 - p * 0.4));
      gfx.fill({ color: p > 0.45 ? bright : accent, alpha: alpha * 0.9 });
    }
  }

  // ── Screensaver: cool — 3-D starfield ────────────────────────────────────
  function initStars(W: number, H: number) {
    stars.length = 0;
    for (let i = 0; i < 220; i++)
      stars.push({ x: Math.random() * W - W / 2, y: Math.random() * H - H / 2, z: Math.random() * W, pz: 0 });
    starsReady = true;
  }

  function drawStarfield(gfx: Graphics, W: number, H: number, th: string, dk: boolean) {
    if (!starsReady) initStars(W, H);
    const speed = dk ? 5 : 2.5;
    const accent = getAccent(th, dk), bright = getBright(th);

    for (const s of stars) {
      s.pz = s.z;
      s.z -= speed;
      if (s.z <= 1) { s.x = Math.random() * W - W / 2; s.y = Math.random() * H - H / 2; s.z = W; s.pz = W; }

      const sx = (s.x / s.z) * W + W / 2;
      const sy = (s.y / s.z) * H + H / 2;
      const px = (s.x / s.pz) * W + W / 2;
      const py = (s.y / s.pz) * H + H / 2;
      const nearness = 1 - s.z / W;
      const color = nearness > 0.7 ? bright : accent;

      if (nearness > 0.05) {
        gfx.moveTo(px, py).lineTo(sx, sy);
        gfx.stroke({ color, alpha: nearness * 0.7, width: nearness * 1.5 });
      }
      gfx.circle(sx, sy, Math.max(0.5, nearness * 2));
      gfx.fill({ color, alpha: nearness });
    }
  }

  // ── Screensaver: mono — matrix character-rain ────────────────────────────
  const CHARSET = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ01';
  const CELL = 14; // px per column

  function initCols(W: number, H: number) {
    cols.length = 0;
    const count = Math.floor(W / CELL);
    for (let i = 0; i < count; i++)
      cols.push({ x: i * CELL, y: -(Math.random() * H), speed: 1.5 + Math.random() * 3, len: 8 + Math.floor(Math.random() * 20) });
    colsReady = true;
  }

  function drawMatrix(gfx: Graphics, W: number, H: number, th: string, dk: boolean) {
    if (!colsReady || cols.length !== Math.floor(W / CELL)) initCols(W, H);
    const accent = getAccent(th, dk), bright = getBright(th);

    // Only advance every 2 ticks for a slower, chunkier feel
    const advance = tick % 2 === 0;

    for (const c of cols) {
      if (advance) c.y += c.speed * CELL;
      if (c.y - c.len * CELL > H) {
        c.y = -CELL * (2 + Math.random() * 10);
        c.speed = 1.5 + Math.random() * 3;
        c.len = 8 + Math.floor(Math.random() * 20);
      }

      // Draw trail blocks
      for (let j = 0; j < c.len; j++) {
        const gy = c.y - j * CELL;
        if (gy < 0 || gy > H) continue;
        const t = j / c.len;
        const color = j === 0 ? bright : accent;
        const alpha = j === 0 ? 1 : (1 - t) * 0.65;
        const w = CELL - 2, h = CELL - 2;
        gfx.rect(c.x + 1, gy + 1, w, h).fill({ color, alpha });
      }
    }
  }

  // ── Welcome cycling ───────────────────────────────────────────────────────
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

  // ── Transition: flicker → collapse → navigate ────────────────────────────
  function triggerTransition() {
    if (triggered || !app) return;
    triggered = true;
    transitioning = true;

    const filter = new ColorMatrixFilter();
    app.stage.filters = [filter];
    let phase = 0, elapsed = 0;

    app.ticker.add((ticker) => {
      elapsed += ticker.deltaMS;

      if (phase === 0) {
        if (elapsed < 350) {
          filter.brightness(1 + Math.abs(Math.sin(elapsed * 0.025)) * 2.5, false);
        } else { phase = 1; elapsed = 0; }

      } else if (phase === 1) {
        if (elapsed < 600) {
          const p = elapsed / 600;
          const s = 1 - p * 0.98;
          app.stage.scale.set(s);
          app.stage.position.set(app.screen.width / 2 * (1 - s), app.screen.height / 2 * (1 - s));
          filter.brightness(1 + p * 6, false);
        } else { phase = 2; elapsed = 0; }

      } else if (phase === 2 && elapsed >= 100) {
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
