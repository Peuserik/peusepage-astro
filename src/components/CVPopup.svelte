<script lang="ts">
  import { closePopup } from '../stores/popup';
  import { lang } from '../stores/settings';

  export let config: any = {};
  export let translations: any = {};

  let el: HTMLDivElement;
  let px = -1, py = -1;
  let dragging = false, ox = 0, oy = 0;

  function startDrag(e: PointerEvent) {
    if (!el) return;
    dragging = true;
    const r = el.getBoundingClientRect();
    if (px < 0) { px = r.left - el.offsetParent!.getBoundingClientRect().left; py = r.top - el.offsetParent!.getBoundingClientRect().top; }
    ox = e.clientX - px; oy = e.clientY - py;
    el.setPointerCapture(e.pointerId);
  }
  function onDrag(e: PointerEvent) {
    if (!dragging) return;
    const par = el.offsetParent!.getBoundingClientRect();
    px = Math.max(0, Math.min(e.clientX - ox, par.width  - el.offsetWidth));
    py = Math.max(0, Math.min(e.clientY - oy, par.height - el.offsetHeight));
  }
  function stopDrag() { dragging = false; }

  $: titleText = translations[$lang ?? 'en']?.popup_cv ?? 'CURRICULUM VITAE';
  $: person   = config?.person   ?? {};
  $: social   = config?.social   ?? {};
  $: summary  = config?.cv_summary ?? '';

  $: bullets = summary
    .split(/\.\s+|\n/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0);

  let blink = true;
  setInterval(() => { blink = !blink; }, 600);
</script>

<div bind:this={el}
  class="popup-window cv-popup"
  style={px >= 0 ? `position:absolute;left:${px}px;top:${py}px` : `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)`}
  on:pointermove={onDrag}
  on:pointerup={stopDrag}
>
  <div class="titlebar" on:pointerdown={startDrag} style="cursor:move">
    <span class="title">📋 {titleText}</span>
    <button class="close-btn" on:click={closePopup} aria-label="Close">[X]</button>
  </div>

  <div class="body">
    <div class="header-block">
      <p class="name-line">C:\&gt; <span class="name">{person.name ?? ''}</span></p>
      <p class="title-line">TITLE: <span class="title-val">{person.title ?? ''}</span></p>
      <p class="tag-line">INFO:  <span class="tag-val">{person.tagline ?? ''}</span></p>
    </div>

    <div class="divider">─────────────────────────────────</div>

    <div class="summary-block">
      <p class="section-label">[SUMMARY]</p>
      {#each bullets as bullet}
        <p class="bullet">▶ {bullet}.</p>
      {/each}
    </div>

    <div class="divider">─────────────────────────────────</div>

    <div class="links-block">
      <p class="section-label">[LINKS]</p>
      <div class="link-row">
        {#if social.linkedin}
          <a class="link-btn" href={social.linkedin} target="_blank" rel="noopener">🔗 LinkedIn</a>
        {/if}
        {#if social.github}
          <a class="link-btn" href={social.github} target="_blank" rel="noopener">🐙 GitHub</a>
        {/if}
        {#if social.xing}
          <a class="link-btn" href={social.xing} target="_blank" rel="noopener">🔗 XING</a>
        {/if}
        {#if social.x_handle}
          <a class="link-btn" href="https://x.com/{social.x_handle.replace('@','')}" target="_blank" rel="noopener">𝕏 X</a>
        {/if}
        {#if social.threads_handle}
          <a class="link-btn" href="https://threads.net/{social.threads_handle.replace('@','')}" target="_blank" rel="noopener">🧵 Threads</a>
        {/if}
        {#if social.email}
          <a class="link-btn" href="mailto:{social.email}">✉️ Email</a>
        {/if}
      </div>
    </div>

    <p class="cursor">{blink ? '█' : ' '}</p>
  </div>
</div>

<style>
  .popup-window {
    background: #1a1a12;
    border: 2px solid #40cc40;
    box-shadow: 4px 4px 0 #000000, inset 1px 1px 0 #60ee60, inset -1px -1px 0 #204020;
    font-family: 'VT323', monospace;
    color: #40cc40;
    width: 520px;
    max-width: 92vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    z-index: 200;
    user-select: none;
  }

  .titlebar {
    background: #2a3a1a;
    border-bottom: 2px solid #40cc40;
    padding: 3px 6px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .title { font-size: 20px; color: #80ff80; letter-spacing: 2px; }
  .close-btn {
    background: none; border: 1px solid #40cc40; color: #40cc40;
    font-family: 'VT323', monospace; font-size: 18px;
    width: 22px; height: 22px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; padding: 0;
  }
  .close-btn:hover { background: #40cc40; color: #1a1a12; }

  .body {
    padding: 10px 14px;
    overflow-y: auto;
    flex: 1;
    font-size: 17px;
    line-height: 1.45;
  }

  .header-block { margin-bottom: 6px; }
  .name-line { margin: 0 0 4px; font-size: 20px; }
  .name { color: #80ff80; font-size: 22px; }
  .title-line, .tag-line { margin: 0 0 3px; color: #608060; font-size: 16px; }
  .title-val, .tag-val { color: #c0e8c0; }

  .divider { color: #304830; margin: 6px 0; font-size: 14px; letter-spacing: 1px; }

  .section-label { color: #60a060; margin: 0 0 5px; font-size: 16px; letter-spacing: 2px; }

  .summary-block { margin-bottom: 6px; }
  .bullet { margin: 2px 0; color: #a0d0a0; font-size: 15px; padding-left: 4px; }

  .links-block { }
  .link-row { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .link-btn {
    background: #0e1208;
    border: 1px solid #304830;
    color: #40cc40;
    font-family: 'VT323', monospace;
    font-size: 15px;
    padding: 2px 10px;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.1s, border-color 0.1s;
  }
  .link-btn:hover { background: #1a2e12; border-color: #40cc40; color: #80ff80; text-decoration: none; }

  .cursor { color: #80ff80; font-size: 18px; margin: 6px 0 0; height: 20px; }
</style>
