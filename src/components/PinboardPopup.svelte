<script lang="ts">
  import { closePopup } from '../stores/popup';

  export let config: any = {};

  $: pinboard = config?.pinboard ?? {};
  $: events   = pinboard?.latest_events ?? [];
  $: working  = pinboard?.currently_working_on ?? [];
</script>

<div class="popup-window pinboard-popup">
  <div class="titlebar">
    <span class="title">📌 PINBOARD</span>
    <button class="close-btn" on:click={closePopup} aria-label="Close">[X]</button>
  </div>

  <div class="body">
    <div class="columns">

      <!-- Left column: Latest events -->
      <div class="col">
        <p class="col-title">[LATEST EVENTS]</p>
        {#each events as ev}
          <p class="event-item">▶ {ev}</p>
        {/each}
      </div>

      <!-- Right column: Currently working on -->
      <div class="col">
        <p class="col-title">[WORKING ON]</p>
        {#each working as item}
          <div class="progress-item">
            <p class="progress-label">{item.label}</p>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: {item.percent}%"></div>
            </div>
            <p class="progress-pct">{item.percent}%</p>
          </div>
        {/each}
      </div>

    </div>

    <!-- Sticky note at bottom -->
    <div class="sticky-note">
      <p>📎 "The best code is the code that works AND ships."</p>
    </div>
  </div>
</div>

<style>
  .popup-window {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #1a1a12;
    border: 2px solid #40cc40;
    box-shadow: 4px 4px 0 #000000, inset 1px 1px 0 #60ee60, inset -1px -1px 0 #204020;
    font-family: 'VT323', monospace;
    color: #40cc40;
    width: 540px;
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
  }

  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 12px;
  }

  .col { }
  .col-title {
    color: #60a060;
    font-size: 16px;
    letter-spacing: 2px;
    margin: 0 0 8px;
    border-bottom: 1px solid #304830;
    padding-bottom: 4px;
  }

  .event-item {
    font-size: 14px;
    color: #a0d0a0;
    margin: 3px 0;
    line-height: 1.3;
  }

  .progress-item { margin-bottom: 10px; }
  .progress-label {
    font-size: 15px;
    color: #c0e8c0;
    margin: 0 0 3px;
  }
  .progress-bar-bg {
    height: 10px;
    background: #0e1208;
    border: 1px solid #304830;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    background: linear-gradient(to right, #204a18, #40cc40);
    transition: width 0.6s ease;
  }
  .progress-pct {
    font-size: 13px;
    color: #608060;
    margin: 1px 0 0;
    text-align: right;
  }

  .sticky-note {
    background: #2a2a10;
    border: 1px solid #606020;
    border-left: 4px solid #aaaa30;
    padding: 8px 12px;
    font-size: 14px;
    color: #c0c080;
    font-style: italic;
    margin-top: 4px;
  }
  .sticky-note p { margin: 0; }
</style>
