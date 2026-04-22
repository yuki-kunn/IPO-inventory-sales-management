<script lang="ts">
	import {
		Menu,
		X,
		Home,
		Database,
		ChefHat,
		FileWarning,
		Calendar,
		Upload,
		BarChart3,
		TrendingUp,
		LogOut
	} from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth';
	import Button from './ui/Button.svelte';

	let isOpen = $state(false);
	let currentPath = $state('');

	page.subscribe(($page) => {
		currentPath = $page.url.pathname;
		// ページ遷移時にメニューを閉じる
		isOpen = false;
	});

	function toggleMenu() {
		isOpen = !isOpen;
	}

	function closeMenu() {
		isOpen = false;
	}

	const menuItems = [
		{ href: '/', label: 'ホーム', icon: Home },
		{ href: '/ingredients', label: '原材料マスタ', icon: Database },
		{ href: '/recipes', label: '登録済み商品', icon: ChefHat },
		{ href: '/unregistered', label: '未登録商品', icon: FileWarning },
		{ href: '/calendar', label: '売上カレンダー', icon: Calendar },
		{ href: '/analytics', label: '売上分析', icon: BarChart3 },
		{ href: '/forecast', label: '販売予測・発注管理', icon: TrendingUp }
	];

	function isActive(href: string): boolean {
		if (href === '/') {
			return currentPath === '/';
		}
		return currentPath.startsWith(href);
	}

	function handleLogout() {
		auth.logout();
		closeMenu();
		goto('/login');
	}
</script>

<!-- ハンバーガーメニューボタン -->
<button
	onclick={toggleMenu}
	class="bg-background border-border hover:bg-muted fixed top-3 left-3 z-50 touch-manipulation rounded-lg border p-3 shadow-lg transition-colors md:top-4 md:left-4 md:p-2"
	aria-label="メニュー"
>
	{#if isOpen}
		<X class="h-7 w-7 md:h-6 md:w-6" />
	{:else}
		<Menu class="h-7 w-7 md:h-6 md:w-6" />
	{/if}
</button>

<!-- オーバーレイ -->
{#if isOpen}
	<div
		class="fixed inset-0 z-40 bg-black/50"
		onclick={closeMenu}
		role="button"
		tabindex="-1"
		onkeydown={(e) => e.key === 'Escape' && closeMenu()}
	></div>
{/if}

<!-- サイドバーメニュー -->
<nav
	class="bg-background border-border fixed top-0 left-0 z-40 h-full w-[85vw] transform border-r shadow-xl transition-transform duration-300 sm:w-80 md:w-64 {isOpen
		? 'translate-x-0'
		: '-translate-x-full'}"
>
	<div class="p-4 sm:p-6">
		<div class="mt-14 mb-4 sm:mt-12 sm:mb-6">
			<h2 class="text-primary text-base font-bold sm:text-lg">AirREGI</h2>
			<p class="text-muted-foreground text-xs sm:text-sm">在庫・売上管理</p>
		</div>
		<h3 class="text-muted-foreground mb-2 text-sm font-semibold tracking-wider uppercase">
			メニュー
		</h3>
		<ul class="space-y-1 sm:space-y-2">
			{#each menuItems as item}
				{@const ItemIcon = item.icon}
				<li>
					<a
						href={item.href}
						class="flex touch-manipulation items-center gap-3 rounded-lg px-4 py-3.5 transition-colors sm:py-3 {isActive(
							item.href
						)
							? 'bg-primary text-primary-foreground'
							: 'hover:bg-muted active:bg-muted'}"
						onclick={closeMenu}
					>
						<ItemIcon class="h-5 w-5 sm:h-5 sm:w-5" />
						<span class="text-base font-medium sm:text-base">{item.label}</span>
					</a>
				</li>
			{/each}
		</ul>

		<!-- ログアウトボタン -->
		<div class="border-border mt-6 border-t pt-4">
			<button
				onclick={handleLogout}
				class="hover:bg-destructive/90 flex w-full touch-manipulation items-center gap-3 rounded-lg bg-destructive px-4 py-3.5 text-destructive-foreground transition-colors sm:py-3"
			>
				<LogOut class="h-5 w-5 sm:h-5 sm:w-5" />
				<span class="text-base font-medium sm:text-base">ログアウト</span>
			</button>
		</div>
	</div>
</nav>
