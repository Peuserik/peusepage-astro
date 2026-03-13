import { writable, get } from 'svelte/store';

function persisted<T>(key: string, initial: T) {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  const store = writable<T>(stored ? JSON.parse(stored) : initial);
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
