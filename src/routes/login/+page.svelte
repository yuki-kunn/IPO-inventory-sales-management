<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import { onMount } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import { Lock } from 'lucide-svelte';

	let password = $state('');
	let error = $state('');
	let isAuthenticated = $state(false);

	auth.subscribe((value) => {
		isAuthenticated = value;
	});

	onMount(() => {
		// 既にログイン済みの場合はホームにリダイレクト
		if (auth.check()) {
			goto('/');
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		const success = auth.login(password);
		if (success) {
			goto('/');
		} else {
			error = 'パスワードが正しくありません';
			password = '';
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800">
	<Card class="w-full max-w-md">
		<CardHeader>
			<div class="flex flex-col items-center gap-3">
				<div class="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
					<Lock class="h-8 w-8 text-blue-600 dark:text-blue-400" />
				</div>
				<CardTitle class="text-center text-2xl">ログイン</CardTitle>
				<p class="text-muted-foreground text-center text-sm">
					IPO在庫・売上管理システム
				</p>
			</div>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleSubmit} class="space-y-4">
				<div>
					<label for="password" class="mb-2 block text-sm font-medium">
						パスワード
					</label>
					<input
						id="password"
						type="password"
						bind:value={password}
						placeholder="パスワードを入力してください"
						required
						autofocus
						class="border-input bg-background w-full rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				</div>

				{#if error}
					<div class="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
						{error}
					</div>
				{/if}

				<Button type="submit" class="w-full">
					ログイン
				</Button>
			</form>

			<div class="mt-6 text-center text-xs text-muted-foreground">
				<p>パスワードを忘れた場合は管理者にお問い合わせください</p>
			</div>
		</CardContent>
	</Card>
</div>
