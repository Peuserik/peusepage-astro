import { writable } from 'svelte/store';

function persisted<T>(key: string, initial: T) {
  let value = initial;
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      try {
        value = JSON.parse(stored);
      } catch {
        // v1 stored plain strings (e.g. "warm" not '"warm"') — use as-is
        value = stored as unknown as T;
      }
    }
  }
  const store = writable<T>(value);
  // Always write back as valid JSON so future reads succeed
  store.subscribe(v => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(v));
  });
  return store;
}

export const theme = persisted<'warm' | 'cool' | 'mono'>('psp_theme', 'warm');
export const darkMode = persisted<boolean>('psp_dark', true);
export const lang = persisted<'en' | 'de'>('psp_lang', 'en');

export const translationsStore = writable<Record<string, Record<string, string>>>({});

export function t(key: string, translations: Record<string, Record<string, string>>, language: string): string {
  return translations?.[language]?.[key] ?? key;
}
