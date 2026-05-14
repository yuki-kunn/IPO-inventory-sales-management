<script lang="ts">
	import {
		Home,
		Package,
		BookOpen,
		AlertCircle,
		Calendar,
		BarChart2,
		TrendingUp,
		LogOut
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';

	let currentPath = $state('');

	page.subscribe(($page) => {
		currentPath = $page.url.pathname;
	});

	const menuItems = [
		{ href: '/', label: 'ホーム', icon: Home },
		{ href: '/ingredients', label: '原材料マスタ', icon: Package },
		{ href: '/recipes', label: '登録済み商品', icon: BookOpen },
		{ href: '/unregistered', label: '未登録商品', icon: AlertCircle },
		{ href: '/calendar', label: '売上カレンダー', icon: Calendar },
		{ href: '/analytics', label: '売上分析', icon: BarChart2 },
		{ href: '/forecast', label: '販売予測', icon: TrendingUp }
	];

	// ボトムナビに表示する主要5項目
	const bottomNavItems = [
		{ href: '/', label: 'ホーム', icon: Home },
		{ href: '/ingredients', label: '原材料', icon: Package },
		{ href: '/recipes', label: 'レシピ', icon: BookOpen },
		{ href: '/calendar', label: 'カレンダー', icon: Calendar },
		{ href: '/forecast', label: '予測', icon: TrendingUp }
	];

	function isActive(href: string): boolean {
		if (href === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(href);
	}

	function handleLogout() {
		auth.logout();
		goto('/login');
	}
</script>

<!-- ボトムナビゲーション（sm未満のモバイルのみ） -->
<nav class="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background px-2 sm:hidden">
	{#each bottomNavItems as item}
		{@const ItemIcon = item.icon}
		<a
			href={item.href}
			class="flex min-w-[60px] flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors
				{isActive(item.href) ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}"
		>
			<ItemIcon class="h-5 w-5" />
			<span>{item.label}</span>
		</a>
	{/each}
</nav>

<!-- タブレットサイドバー（sm〜lg: 64px幅、アイコンのみ） -->
<nav class="fixed top-0 left-0 z-40 hidden h-full w-16 flex-col border-r bg-background sm:flex lg:hidden">
	<div class="flex flex-col items-center py-4">
		<div class="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
			<span class="text-primary text-xs font-bold">AR</span>
		</div>
		<ul class="flex flex-col items-center gap-1 w-full px-2">
			{#each menuItems as item}
				{@const ItemIcon = item.icon}
				<li class="w-full">
					<a
						href={item.href}
						title={item.label}
						class="group relative flex h-10 w-full items-center justify-center rounded-lg transition-colors
							{isActive(item.href)
								? 'bg-primary/10 text-primary'
								: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
					>
						<ItemIcon class="h-5 w-5" />
						<!-- Tooltip -->
						<span class="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50">
							{item.label}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</div>
	<!-- ログアウト -->
	<div class="mt-auto flex flex-col items-center px-2 pb-4">
		<button
			onclick={handleLogout}
			title="ログアウト"
			class="group relative flex h-10 w-full items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
		>
			<LogOut class="h-5 w-5" />
			<span class="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100 z-50">
				ログアウト
			</span>
		</button>
	</div>
</nav>

<!-- デスクトップサイドバー（lg以上: 256px幅、フル展開） -->
<nav class="fixed top-0 left-0 z-40 hidden h-full w-64 flex-col border-r bg-background lg:flex">
	<div class="p-6">
		<div class="mb-6">
			<h2 class="text-primary text-lg font-bold">AirREGI</h2>
			<p class="text-muted-foreground text-sm">在庫・売上管理</p>
		</div>
		<h3 class="text-muted-foreground mb-2 text-sm font-semibold tracking-wider uppercase">
			メニュー
		</h3>
		<ul class="space-y-1">
			{#each menuItems as item}
				{@const ItemIcon = item.icon}
				<li>
					<a
						href={item.href}
						class="flex items-center gap-3 rounded-lg px-4 py-3 transition-colors
							{isActive(item.href)
								? 'border-l-2 border-primary bg-primary/10 font-medium text-primary'
								: 'text-foreground hover:bg-muted'}"
					>
						<ItemIcon class="h-5 w-5 shrink-0" />
						<span class="text-sm">{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>

		<!-- ログアウトボタン -->
		<div class="border-border mt-6 border-t pt-4">
			<button
				onclick={handleLogout}
				class="hover:bg-destructive/90 flex w-full items-center gap-3 rounded-lg bg-destructive px-4 py-3 text-sm text-destructive-foreground transition-colors"
			>
				<LogOut class="h-5 w-5 shrink-0" />
				<span class="font-medium">ログアウト</span>
			</button>
		</div>
	</div>
</nav>
