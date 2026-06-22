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
		MinusCircle,
		Cookie,
		KeyRound
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
		runDate: string;
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

	// Cookie登録用
	interface CookieMeta {
		count: number;
		updatedAt: string | null;
		names: string[];
	}
	let cookieMeta = $state<CookieMeta | null>(null);
	let cookieInput = $state('');
	let cookieSaving = $state(false);
	let cookieMessage = $state('');
	let showCookieHelp = $state(false);

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

	async function loadCookieMeta() {
		const res = await fetch('/api/automation/cookies');
		const data = await res.json();
		cookieMeta = data.cookieMeta ?? null;
	}

	async function saveCookies() {
		if (!cookieInput.trim()) {
			cookieMessage = 'Cookieを貼り付けてください';
			return;
		}
		cookieSaving = true;
		cookieMessage = '';
		try {
			const res = await fetch('/api/automation/cookies', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ cookies: cookieInput })
			});
			const data = await res.json();
			if (data.success) {
				cookieMessage = `${data.count}個のCookieを保存しました`;
				cookieInput = '';
				await loadCookieMeta();
			} else {
				cookieMessage = data.message || '保存に失敗しました';
			}
		} catch (e) {
			cookieMessage = '保存中にエラーが発生しました';
		} finally {
			cookieSaving = false;
			setTimeout(() => (cookieMessage = ''), 4000);
		}
	}

	async function refresh() {
		loading = true;
		await Promise.all([loadConfig(), loadLogs(), loadCookieMeta()]);
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
		// 当日を即時実行（runDateを空にして当日対象を保証）
		saving = true;
		saveMessage = '';
		try {
			const res = await fetch('/api/automation/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ forceRun: true, runDate: '' })
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

	// 指定日実行用
	let runDateInput = $state('');

	async function triggerDateRun() {
		if (!runDateInput) {
			saveMessage = '日付を選択してください';
			setTimeout(() => (saveMessage = ''), 3000);
			return;
		}
		saving = true;
		saveMessage = '';
		try {
			const res = await fetch('/api/automation/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ forceRun: true, runDate: runDateInput })
			});
			const data = await res.json();
			saveMessage = data.success
				? `${runDateInput} のデータを次回チェック時（最大10分以内）に取得します`
				: data.message || '失敗しました';
			await loadConfig();
		} catch (e) {
			saveMessage = 'エラーが発生しました';
		} finally {
			saving = false;
			setTimeout(() => (saveMessage = ''), 6000);
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
							今すぐ実行（当日）
						</Button>
						{#if saveMessage}
							<span class="text-sm text-blue-600 dark:text-blue-400">{saveMessage}</span>
						{/if}
					</div>

					<!-- 指定日を即時実行 -->
					<div class="space-y-2 rounded-md border border-dashed p-4">
						<p class="text-sm font-medium">指定日のデータを取得</p>
						<p class="text-muted-foreground text-xs">
							過去の取りこぼしや再取得に。選んだ日付のバリエーション別売上と天候を取り込みます。
						</p>
						<div class="flex flex-wrap items-center gap-3 pt-1">
							<input
								type="date"
								bind:value={runDateInput}
								max={config?.lastRunDate || undefined}
								class="border-input bg-background rounded-md border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-500"
							/>
							<Button variant="outline" onclick={triggerDateRun} disabled={saving}>
								<PlayCircle class="mr-2 h-4 w-4" />
								この日付で実行
							</Button>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>

		<!-- AirREGI Cookie登録 -->
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<KeyRound class="h-5 w-5" />
					AirREGI ログインCookie
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<!-- 現在の状態 -->
					<div class="flex items-center gap-3 rounded-md border p-3">
						<Cookie
							class="h-5 w-5 {cookieMeta && cookieMeta.count > 0
								? 'text-green-500'
								: 'text-gray-400'}"
						/>
						<div class="flex-1">
							{#if cookieMeta && cookieMeta.count > 0}
								<p class="text-sm font-medium">登録済み（{cookieMeta.count}個）</p>
								<p class="text-muted-foreground text-xs">
									最終更新: {cookieMeta.updatedAt
										? new Date(cookieMeta.updatedAt).toLocaleString('ja-JP', {
												timeZone: 'Asia/Tokyo'
											})
										: '-'}
								</p>
							{:else}
								<p class="text-sm font-medium text-yellow-600 dark:text-yellow-400">未登録</p>
								<p class="text-muted-foreground text-xs">
									自動取込にはCookieの登録が必要です
								</p>
							{/if}
						</div>
					</div>

					<!-- 取得手順 -->
					<button
						type="button"
						class="text-xs text-blue-600 underline dark:text-blue-400"
						onclick={() => (showCookieHelp = !showCookieHelp)}
					>
						{showCookieHelp ? '手順を隠す' : 'Cookieの取得手順を表示'}
					</button>
					{#if showCookieHelp}
						<div
							class="space-y-1 rounded-md border border-blue-500/20 bg-blue-500/5 p-3 text-xs text-muted-foreground"
						>
							<p class="font-medium text-foreground">取得手順（Windowsのブラウザで）:</p>
							<ol class="ml-4 list-decimal space-y-1">
								<li>
									<a
										href="https://airregi.jp/CLP/view/salesListByMenu/"
										target="_blank"
										rel="noopener"
										class="text-blue-600 underline dark:text-blue-400"
									>
										AirREGIの売上ページ
									</a>
									を開いてログインする
								</li>
								<li><kbd class="rounded border px-1">F12</kbd> で開発者ツールを開く</li>
								<li>「Application」(アプリケーション) タブ → 左の「Cookies」を開く</li>
								<li>
									<code>https://airregi.jp</code> と
									<code>https://connect.airregi.jp</code> の両方の行を全選択してコピー
								</li>
								<li>下の欄に貼り付けて「保存」</li>
							</ol>
							<p class="mt-2">
								※ Cookie-Editor等の拡張機能でエクスポートしたJSON配列も貼り付け可能です。
							</p>
						</div>
					{/if}

					<!-- 入力欄 -->
					<div>
						<label for="cookieInput" class="mb-2 block text-sm font-medium">
							Cookieを貼り付け
						</label>
						<textarea
							id="cookieInput"
							bind:value={cookieInput}
							rows="5"
							placeholder="DevToolsのCookie表、またはCookie-Editor等のJSONを貼り付け"
							class="border-input bg-background w-full rounded-md border px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-slate-500"
						></textarea>
					</div>

					<div class="flex flex-wrap items-center gap-3">
						<Button onclick={saveCookies} disabled={cookieSaving}>
							{cookieSaving ? '保存中...' : 'Cookieを保存'}
						</Button>
						{#if cookieMessage}
							<span class="text-sm text-blue-600 dark:text-blue-400">{cookieMessage}</span>
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
