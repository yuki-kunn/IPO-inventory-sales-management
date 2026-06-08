<script lang="ts">
	import { onMount } from 'svelte';
	import {
		Settings,
		Clock,
		Power,
		PlayCircle,
		RefreshCw,
		CheckCircle2,
		XCircle,
		MinusCircle
	} from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';

	interface AutomationConfig {
		enabled: boolean;
		scheduledTime: string;
		timezone: string;
		lastRunDate: string;
		forceRun: boolean;
	}

	interface LogEntry {
		id: string;
		runAt?: string;
		status: 'success' | 'failed' | 'skipped';
		message?: string;
		importedCount?: number;
		durationMs?: number;
		stage?: string;
	}

	let config = $state<AutomationConfig | null>(null);
	let logs = $state<LogEntry[]>([]);
	let loading = $state(true);
	let saving = $state(false);
	let saveMessage = $state('');

	// フォーム用
	let scheduledTime = $state('09:00');
	let enabled = $state(true);

	async function loadConfig() {
		const res = await fetch('/api/automation/config');
		const data = await res.json();
		config = data.config;
		if (config) {
			scheduledTime = config.scheduledTime;
			enabled = config.enabled;
		}
	}

	async function loadLogs() {
		const res = await fetch('/api/automation/logs?limit=30');
		const data = await res.json();
		logs = data.logs ?? [];
	}

	async function refresh() {
		loading = true;
		await Promise.all([loadConfig(), loadLogs()]);
		loading = false;
	}

	onMount(refresh);

	async function saveSettings() {
		saving = true;
		saveMessage = '';
		try {
			const res = await fetch('/api/automation/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ scheduledTime, enabled })
			});
			const data = await res.json();
			if (data.success) {
				saveMessage = '保存しました';
				await loadConfig();
			} else {
				saveMessage = data.message || '保存に失敗しました';
			}
		} catch (e) {
			saveMessage = '保存中にエラーが発生しました';
		} finally {
			saving = false;
			setTimeout(() => (saveMessage = ''), 3000);
		}
	}

	async function triggerManualRun() {
		saving = true;
		saveMessage = '';
		try {
			const res = await fetch('/api/automation/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ forceRun: true })
			});
			const data = await res.json();
			saveMessage = data.success
				? '次回チェック時（最大10分以内）に実行されます'
				: data.message || '失敗しました';
			await loadConfig();
		} catch (e) {
			saveMessage = 'エラーが発生しました';
		} finally {
			saving = false;
			setTimeout(() => (saveMessage = ''), 5000);
		}
	}

	function statusBadge(status: string) {
		switch (status) {
			case 'success':
				return { variant: 'success' as const, label: '成功', icon: CheckCircle2 };
			case 'failed':
				return { variant: 'destructive' as const, label: '失敗', icon: XCircle };
			default:
				return { variant: 'secondary' as const, label: 'スキップ', icon: MinusCircle };
		}
	}

	function formatTime(iso?: string) {
		if (!iso) return '-';
		try {
			return new Date(iso).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
		} catch {
			return iso;
		}
	}

	let lastLog = $derived(logs.length > 0 ? logs[0] : null);
</script>

<div class="mx-auto max-w-4xl space-y-6 p-4 pt-16 md:p-8 md:pt-8">
	<!-- ヘッダー -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-slate-900 p-2 text-white dark:bg-slate-100 dark:text-slate-900">
				<Settings class="h-6 w-6" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">自動化管理</h1>
				<p class="text-muted-foreground text-sm">CSV自動取込・アップロードの設定と稼働状況</p>
			</div>
		</div>
		<Button variant="outline" size="icon" onclick={refresh} disabled={loading}>
			<RefreshCw class="h-4 w-4 {loading ? 'animate-spin' : ''}" />
		</Button>
	</div>

	{#if loading && !config}
		<p class="text-muted-foreground text-sm">読み込み中...</p>
	{:else}
		<!-- 稼働状況サマリー -->
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
			<Card>
				<CardContent class="pt-6">
					<div class="flex items-center gap-3">
						<Power class="h-5 w-5 {enabled ? 'text-green-500' : 'text-gray-400'}" />
						<div>
							<p class="text-muted-foreground text-xs">状態</p>
							<p class="font-semibold">{enabled ? '有効' : '無効'}</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="pt-6">
					<div class="flex items-center gap-3">
						<Clock class="h-5 w-5 text-blue-500" />
						<div>
							<p class="text-muted-foreground text-xs">実行予定時刻 (JST)</p>
							<p class="font-semibold">{config?.scheduledTime ?? '-'}</p>
						</div>
					</div>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="pt-6">
					<div class="flex items-center gap-3">
						{#if lastLog}
							{@const b = statusBadge(lastLog.status)}
							<b.icon
								class="h-5 w-5 {lastLog.status === 'success'
									? 'text-green-500'
									: lastLog.status === 'failed'
										? 'text-red-500'
										: 'text-gray-400'}"
							/>
						{:else}
							<MinusCircle class="h-5 w-5 text-gray-400" />
						{/if}
						<div>
							<p class="text-muted-foreground text-xs">最終実行</p>
							<p class="font-semibold">{config?.lastRunDate || '未実行'}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- 設定 -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Clock class="h-5 w-5" />
					スケジュール設定
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-5">
					<div>
						<label for="scheduledTime" class="mb-2 block text-sm font-medium">
							実行時刻 (JST)
						</label>
						<input
							id="scheduledTime"
							type="time"
							bind:value={scheduledTime}
							class="border-input bg-background rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
						/>
						<p class="text-muted-foreground mt-1 text-xs">
							この時刻の前後{config?.timezone === 'Asia/Tokyo' ? '' : ''}10分以内に1回実行されます
						</p>
					</div>

					<div class="flex items-center justify-between rounded-md border p-3">
						<div>
							<p class="text-sm font-medium">自動実行を有効にする</p>
							<p class="text-muted-foreground text-xs">無効にすると毎日の自動取込が停止します</p>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={enabled}
							aria-label="自動実行の有効/無効を切り替え"
							onclick={() => (enabled = !enabled)}
							class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {enabled
								? 'bg-green-500'
								: 'bg-gray-300 dark:bg-gray-600'}"
						>
							<span
								class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {enabled
									? 'translate-x-6'
									: 'translate-x-1'}"
							></span>
						</button>
					</div>

					<div class="flex flex-wrap items-center gap-3">
						<Button onclick={saveSettings} disabled={saving}>
							{saving ? '保存中...' : '設定を保存'}
						</Button>
						<Button variant="outline" onclick={triggerManualRun} disabled={saving}>
							<PlayCircle class="mr-2 h-4 w-4" />
							今すぐ実行
						</Button>
						{#if saveMessage}
							<span class="text-sm text-blue-600 dark:text-blue-400">{saveMessage}</span>
						{/if}
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- 実行ログ -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<RefreshCw class="h-5 w-5" />
					実行ログ（直近30件）
				</CardTitle>
			</CardHeader>
			<CardContent>
				{#if logs.length === 0}
					<p class="text-muted-foreground text-sm">ログがまだありません</p>
				{:else}
					<div class="space-y-2">
						{#each logs as log}
							{@const b = statusBadge(log.status)}
							<div class="flex items-start justify-between rounded-md border p-3 text-sm">
								<div class="space-y-1">
									<div class="flex items-center gap-2">
										<Badge variant={b.variant}>{b.label}</Badge>
										{#if log.stage}
											<span class="text-muted-foreground text-xs">[{log.stage}]</span>
										{/if}
										<span class="text-muted-foreground text-xs">{formatTime(log.runAt)}</span>
									</div>
									{#if log.message}
										<p class="text-muted-foreground text-xs">{log.message}</p>
									{/if}
								</div>
								<div class="text-right text-xs">
									{#if log.importedCount}
										<p class="font-medium">{log.importedCount}件</p>
									{/if}
									{#if log.durationMs}
										<p class="text-muted-foreground">{Math.round(log.durationMs / 1000)}秒</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
