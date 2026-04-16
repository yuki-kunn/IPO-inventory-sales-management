<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { cleanupLocalStorage } from '$lib/utils/cleanupLocalStorage';
	import Navigation from '$lib/components/Navigation.svelte';

	onMount(() => {
		// ローカルストレージに残っている古いデータをクリーンアップ
		cleanupLocalStorage();
	});
</script>

<Navigation />
<slot />
