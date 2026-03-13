<script lang="ts">
  import { onMount } from 'svelte';
  import { theme, darkMode, lang } from '../stores/settings';

  let showThemePicker = false;

  onMount(() => {
    document.documentElement.setAttribute('data-theme', $theme);
    document.documentElement.setAttribute('data-mode', $darkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('lang', $lang);
  });

  function toggleMode() {
    const newDark = !$darkMode;
    darkMode.set(newDark);
    document.documentElement.setAttribute('data-mode', newDark ? 'dark' : 'light');
  }

  function setTheme(t: string) {
    theme.set(t as any);
    document.documentElement.setAttribute('data-theme', t);
    showThemePicker = false;
  }

  function toggleLang() {
    lang.update(v => v === 'en' ? 'de' : 'en');
    document.documentElement.setAttribute('lang', $lang);
  }
</script>

<div class="controls">
  <button class="ctrl-btn" on:click={toggleMode} title="Toggle dark/light mode">
    {$darkMode ? '🌙' : '☀️'}
  </button>

  <div class="theme-wrap">
    <button class="ctrl-btn" on:click={() => showThemePicker = !showThemePicker} title="Pick theme">
      🎨
    </button>
    {#if showThemePicker}
      <div class="theme-picker">
        <button on:click={() => setTheme('warm')}>Warm</button>
        <button on:click={() => setTheme('cool')}>Cool</button>
        <button on:click={() => setTheme('mono')}>Mono</button>
      </div>
    {/if}
  </div>

  <button class="ctrl-btn" on:click={toggleLang} title="Toggle language">
    {$lang === 'en' ? '🌐' : '🇩🇪'}
  </button>
</div>

<style>
  .controls {
    position: absolute;
    bottom: 1.4rem;
    right: 2rem;
    z-index: 50;
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .ctrl-btn {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    color: #a08060;
    font-size: 1rem;
    width: 2rem;
    height: 2rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s, color 0.2s;
    padding: 0;
    line-height: 1;
  }

  .ctrl-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e8a040;
  }

  .theme-wrap {
    position: relative;
  }

  .theme-picker {
    position: absolute;
    bottom: calc(100% + 0.5rem);
    right: 0;
    background: #1e1a14;
    border: 1px solid #4a3820;
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    min-width: 5rem;
  }

  .theme-picker button {
    background: none;
    border: none;
    color: #a08060;
    padding: 0.4rem 0.75rem;
    cursor: pointer;
    font-size: 0.8rem;
    text-align: left;
    font-family: 'Space Grotesk', sans-serif;
    transition: background 0.15s, color 0.15s;
  }

  .theme-picker button:hover {
    background: rgba(232, 160, 64, 0.15);
    color: #e8a040;
  }
</style>
