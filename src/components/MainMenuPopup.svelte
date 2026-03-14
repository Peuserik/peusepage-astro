<script lang="ts">
  import { openPopup, closePopup } from '../stores/popup';
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

  $: titleText = translations[$lang ?? 'en']?.nav_home ?? 'MAIN MENU';

  interface MenuItem {
    icon: string;
    label: string;
    action: () => void;
  }

  const menuItems: MenuItem[] = [
    { icon: '👤', label: 'ABOUT',    action: () => openPopup('cv') },
    { icon: '💼', label: 'CAREER',   action: () => openPopup('cv') },
    { icon: '🚀', label: 'PROJECTS', action: () => {} },
    { icon: '📬', label: 'CONTACT',  action: () => {} },
    { icon: '🎮', label: 'HOBBIES',  action: () => openPopup('hobbies') },
    { icon: '⚡', label: 'SKILLS',   action: () => {} },
    { icon: '📄', label: 'RESUME',   action: () => openPopup('cv') },
    { icon: '🔗', label: 'LINKS',    action: () => {} },
    { icon: '📝', label: 'BLOG',     action: () => {} },
    { icon: '🐙', label: 'GITHUB',   action: () => { if (config?.social?.github) window.open(config.social.github, '_blank'); } },
    { icon: '📱', label: 'SOCIAL',   action: () => {} },
    { icon: '✉️',  label: 'EMAIL',    action: () => { if (config?.social?.email) window.location.href = `mailto:${config.social.email}`; } },
  ];

  function getTime(): string {
    return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  let timeStr = getTime();
  const _timer = setInterval(() => { timeStr = getTime(); }, 1000);
</script>

<div bind:this={el}
  class="popup-window main-menu"
  style={px >= 0 ? `position:absolute;left:${px}px;top:${py}px` : `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)`}
  on:pointermove={onDrag}
  on:pointerup={stopDrag}
>
  <div class="titlebar" on:pointerdown={startDrag} style="cursor:move">
    <span class="title">📟 {titleText}</span>
    <button class="close-btn" on:pointerdown|stopPropagation on:click={closePopup} aria-label="Close">[X]</button>
  </div>

  <div class="body">
    <p class="subtitle">C:\&gt; SELECT_OPTION</p>
    <div class="grid">
      {#each menuItems as item}
        <button class="menu-item" on:click={item.action}>
          <span class="item-icon">{item.icon}</span>
          <span class="item-label">{item.label}</span>
        </button>
      {/each}
    </div>
  </div>

  <div class="taskbar">
    <span class="taskbar-btn active">▶ MENU</span>
    <span class="taskbar-spacer"></span>
    <span class="taskbar-clock">{timeStr}</span>
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

  .title {
    font-size: 20px;
    color: #80ff80;
    letter-spacing: 2px;
  }

  .close-btn {
    background: none;
    border: 1px solid #40cc40;
    color: #40cc40;
    font-family: 'VT323', monospace;
    font-size: 18px;
    width: 22px;
    height: 22px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    line-height: 1;
  }
  .close-btn:hover { background: #40cc40; color: #1a1a12; }

  .body {
    padding: 10px 12px;
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
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .menu-item {
    background: #0e1208;
    border: 1px solid #304830;
    color: #40cc40;
    font-family: 'VT323', monospace;
    font-size: 16px;
    padding: 8px 4px;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    transition: background 0.1s, border-color 0.1s;
  }
  .menu-item:hover {
    background: #1a2e12;
    border-color: #40cc40;
    color: #80ff80;
  }

  .item-icon { font-size: 22px; line-height: 1; }
  .item-label { font-size: 13px; letter-spacing: 1px; }

  .taskbar {
    background: #0e1208;
    border-top: 2px solid #40cc40;
    padding: 3px 8px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
  }

  .taskbar-btn {
    padding: 1px 8px;
    border: 1px solid #304830;
    cursor: default;
  }
  .taskbar-btn.active {
    background: #2a3a1a;
    border-color: #40cc40;
  }

  .taskbar-spacer { flex: 1; }

  .taskbar-clock {
    border: 1px solid #304830;
    padding: 1px 8px;
    color: #80ff80;
    letter-spacing: 2px;
  }
</style>
