<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { cleanupLocalStorage } from '$lib/utils/cleanupLocalStorage';
	import { auth } from '$lib/stores/auth';
	import Navigation from '$lib/components/Navigation.svelte';

	let isAuthenticated = $state(false);
	let currentPath = $state('');

	auth.subscribe((value) => {
		isAuthenticated = value;
	});

	page.subscribe((p) => {
		currentPath = p.url.pathname;
	});

	onMount(() => {
		// ローカルストレージに残っている古いデータをクリーンアップ
		cleanupLocalStorage();

		// 認証チェック
		checkAuth();
	});

	function checkAuth() {
		const isLoginPage = currentPath === '/login';
		const authenticated = auth.check();

		if (!authenticated && !isLoginPage) {
			goto('/login');
		} else if (authenticated && isLoginPage) {
			goto('/');
		}
	}

	// パスが変更されたら認証チェック
	$effect(() => {
		if (currentPath) {
			checkAuth();
		}
	});
</script>

{#if isAuthenticated || currentPath === '/login'}
	{#if isAuthenticated}
		<Navigation />
	{/if}
	<slot />
{/if}
