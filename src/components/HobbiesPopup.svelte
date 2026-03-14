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

  $: titleText = translations[$lang ?? 'en']?.popup_hobbies ?? 'HOBBIES & INTERESTS';
  $: hobbies = config?.hobbies ?? [];
</script>

<div bind:this={el}
  class="popup-window hobbies-popup"
  style={px >= 0 ? `position:absolute;left:${px}px;top:${py}px` : `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)`}
  on:pointermove={onDrag}
  on:pointerup={stopDrag}
>
  <div class="titlebar" on:pointerdown={startDrag} style="cursor:move">
    <span class="title">🎮 {titleText}</span>
    <button class="close-btn" on:pointerdown|stopPropagation on:click={closePopup} aria-label="Close">[X]</button>
  </div>

  <div class="body">
    <p class="subtitle">C:\HOBBIES&gt; DIR /B</p>
    <div class="grid">
      {#each hobbies as hobby}
        <div class="hobby-tile">
          <span class="hobby-icon">{hobby.icon}</span>
          <span class="hobby-label">{$lang === 'de' ? hobby.label_de : hobby.label_en}</span>
          <span class="hobby-desc">{$lang === 'de' ? hobby.description_de : hobby.description_en}</span>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .popup-window {
    background: #1a1a12;
    border: 2px solid #40cc40;
    box-shadow: 4px 4px 0 #000000, inset 1px 1px 0 #60ee60, inset -1px -1px 0 #204020;
    font-family: 'VT323', monospace;
    color: #40cc40;
    width: 500px;
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
    padding: 10px 12px;
    overflow-y: auto;
    flex: 1;
  }

  .subtitle {
    font-size: 16px;
    color: #608060;
    margin: 0 0 10px;
    letter-spacing: 1px;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .hobby-tile {
    background: #0e1208;
    border: 1px solid #304830;
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    text-align: center;
    transition: background 0.1s, border-color 0.1s;
  }
  .hobby-tile:hover { background: #162010; border-color: #40cc40; }

  .hobby-icon  { font-size: 28px; line-height: 1; }
  .hobby-label { font-size: 16px; color: #80ff80; letter-spacing: 1px; }
  .hobby-desc  { font-size: 12px; color: #608060; line-height: 1.3; }
</style>
