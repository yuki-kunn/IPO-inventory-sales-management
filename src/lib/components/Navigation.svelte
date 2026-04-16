<script lang="ts">
  import { Menu, X, Home, Database, ChefHat, FileWarning, Calendar, Upload } from 'lucide-svelte';
  import { page } from '$app/stores';
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
  ];

  function isActive(href: string): boolean {
    if (href === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(href);
  }
</script>

<!-- ハンバーガーメニューボタン -->
<button
  onclick={toggleMenu}
  class="fixed top-3 left-3 md:top-4 md:left-4 z-50 p-3 md:p-2 rounded-lg bg-background border border-border shadow-lg hover:bg-muted transition-colors touch-manipulation"
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
    class="fixed inset-0 bg-black/50 z-40"
    onclick={closeMenu}
    role="button"
    tabindex="-1"
    onkeydown={(e) => e.key === 'Escape' && closeMenu()}
  ></div>
{/if}

<!-- サイドバーメニュー -->
<nav
  class="fixed top-0 left-0 h-full w-[85vw] sm:w-80 md:w-64 bg-background border-r border-border shadow-xl z-40 transform transition-transform duration-300 {isOpen
    ? 'translate-x-0'
    : '-translate-x-full'}"
>
  <div class="p-4 sm:p-6">
    <div class="mt-14 sm:mt-12 mb-4 sm:mb-6">
      <h2 class="text-base sm:text-lg font-bold text-primary">AirREGI</h2>
      <p class="text-xs sm:text-sm text-muted-foreground">在庫・売上管理</p>
    </div>
    <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">メニュー</h3>
    <ul class="space-y-1 sm:space-y-2">
      {#each menuItems as item}
        {@const ItemIcon = item.icon}
        <li>
          <a
            href={item.href}
            class="flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-lg transition-colors touch-manipulation {isActive(
              item.href
            )
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted active:bg-muted'}"
            onclick={closeMenu}
          >
            <ItemIcon class="h-5 w-5 sm:h-5 sm:w-5" />
            <span class="font-medium text-base sm:text-base">{item.label}</span>
          </a>
        </li>
      {/each}
    </ul>
  </div>
</nav>
