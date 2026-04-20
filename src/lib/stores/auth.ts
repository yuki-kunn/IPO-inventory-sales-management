import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const CORRECT_PASSWORD = 'IPO-0201';
const AUTH_KEY = 'ipo_authenticated';

function createAuthStore() {
	const { subscribe, set } = writable<boolean>(false);

	// 初期化：localStorageから認証状態を復元
	if (browser) {
		const stored = localStorage.getItem(AUTH_KEY);
		if (stored === 'true') {
			set(true);
		}
	}

	return {
		subscribe,
		login: (password: string): boolean => {
			if (password === CORRECT_PASSWORD) {
				set(true);
				if (browser) {
					localStorage.setItem(AUTH_KEY, 'true');
				}
				return true;
			}
			return false;
		},
		logout: () => {
			set(false);
			if (browser) {
				localStorage.removeItem(AUTH_KEY);
			}
		},
		check: (): boolean => {
			if (browser) {
				return localStorage.getItem(AUTH_KEY) === 'true';
			}
			return false;
		}
	};
}

export const auth = createAuthStore();
