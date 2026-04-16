import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const darkModeKey = 'cafe-inventory-dark-mode';

function loadDarkMode(): boolean {
  if (!browser) return false;

  try {
    const stored = localStorage.getItem(darkModeKey);
    if (stored !== null) {
      return JSON.parse(stored);
    }
    // デフォルトでシステム設定を確認
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch (error) {
    return false;
  }
}

function createDarkModeStore() {
  const { subscribe, set } = writable<boolean>(loadDarkMode());

  return {
    subscribe,
    toggle: () => {
      const newValue = !loadDarkMode();
      if (browser) {
        localStorage.setItem(darkModeKey, JSON.stringify(newValue));
        if (newValue) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      set(newValue);
    },
    set: (value: boolean) => {
      if (browser) {
        localStorage.setItem(darkModeKey, JSON.stringify(value));
        if (value) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      set(value);
    },
  };
}

export const darkMode = createDarkModeStore();
