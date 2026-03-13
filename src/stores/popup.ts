import { writable } from 'svelte/store';

export type PopupId = 'none' | 'menu' | 'cv' | 'hobbies' | 'pinboard';
export const activePopup = writable<PopupId>('none');
export function openPopup(id: PopupId) { activePopup.set(id); }
export function closePopup() { activePopup.set('none'); }
