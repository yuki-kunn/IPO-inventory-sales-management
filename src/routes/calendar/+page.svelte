<script lang="ts">
  import { Calendar as CalendarIcon, Moon, Sun, ChevronLeft, ChevronRight } from 'lucide-svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import CardContent from '$lib/components/ui/CardContent.svelte';
  import CardHeader from '$lib/components/ui/CardHeader.svelte';
  import CardTitle from '$lib/components/ui/CardTitle.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import { dailySales } from '$lib/stores/dailySales.firestore';
  import { darkMode } from '$lib/stores/darkMode';
  import type { DailySales } from '$lib/types';

  let dailySalesData = $state<DailySales[]>([]);
  let isDarkMode = $state(false);
  let currentYear = $state(new Date().getFullYear());
  let currentMonth = $state(new Date().getMonth()); // 0-11

  dailySales.subscribe((value) => {
    dailySalesData = value;
  });

  darkMode.subscribe((value) => {
    isDarkMode = value;
  });

  function toggleDarkMode() {
    darkMode.toggle();
  }

  function previousMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
  }

  function goToToday() {
    const today = new Date();
    currentYear = today.getFullYear();
    currentMonth = today.getMonth();
  }

  // カレンダーの日付を生成
  let calendarDays = $derived(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: Array<{
      date: number | null;
      dateString: string | null;
      isCurrentMonth: boolean;
      isToday: boolean;
      salesData: DailySales | null;
    }> = [];

    // 前月の日付で埋める
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push({ date: null, dateString: null, isCurrentMonth: false, isToday: false, salesData: null });
    }

    // 当月の日付
    for (let date = 1; date <= daysInMonth; date++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
      const isToday =
        date === new Date().getDate() &&
        currentMonth === new Date().getMonth() &&
        currentYear === new Date().getFullYear();

      const salesData = dailySalesData.find((ds) => ds.date === dateString) || null;

      days.push({ date, dateString, isCurrentMonth: true, isToday, salesData });
    }

    return days;
  });

  function handleDateClick(dateString: string | null) {
    if (dateString) {
      window.location.href = `/calendar/${dateString}`;
    }
  }

  const monthNames = [
    '1月',
    '2月',
    '3月',
    '4月',
    '5月',
    '6月',
    '7月',
    '8月',
    '9月',
    '10月',
    '11月',
    '12月',
  ];
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
</script>

<div class="min-h-screen bg-background">
  <div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
    <!-- ヘッダー -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 sm:pb-6 gap-4 ml-14 sm:ml-0">
      <div>
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
          <CalendarIcon class="h-6 w-6 sm:h-8 sm:w-8" />
          売上カレンダー
        </h1>
        <p class="text-muted-foreground mt-1 text-xs sm:text-sm">日別の売上データを確認</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" onclick={toggleDarkMode} size="icon" class="touch-manipulation">
          {#if isDarkMode}
            <Sun class="h-5 w-5" />
          {:else}
            <Moon class="h-5 w-5" />
          {/if}
        </Button>
      </div>
    </div>

    <!-- カレンダー -->
    <Card>
      <CardHeader>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle class="text-xl sm:text-2xl">
            {currentYear}年 {monthNames[currentMonth]}
          </CardTitle>
          <div class="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="sm" onclick={previousMonth} class="touch-manipulation">
              <ChevronLeft class="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onclick={goToToday} class="touch-manipulation">今月</Button>
            <Button variant="outline" size="sm" onclick={nextMonth} class="touch-manipulation">
              <ChevronRight class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <!-- 曜日ヘッダー -->
        <div class="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {#each weekDays as day}
            <div class="text-center text-xs sm:text-sm font-medium text-muted-foreground p-1 sm:p-2">
              {day}
            </div>
          {/each}
        </div>

        <!-- カレンダーの日付 -->
        <div class="grid grid-cols-7 gap-1 sm:gap-2">
          {#each calendarDays() as day}
            {#if day.isCurrentMonth && day.date !== null}
              <button
                onclick={() => handleDateClick(day.dateString)}
                class="aspect-square p-1 sm:p-2 rounded-lg border border-border hover:bg-muted/50 active:bg-muted/50 transition-colors touch-manipulation {day.isToday
                  ? 'border-primary bg-primary/10'
                  : ''} {day.salesData ? 'bg-blue-50 dark:bg-blue-950/20' : ''}"
              >
                <div class="flex flex-col items-center justify-center h-full gap-0.5">
                  <div class="text-xs sm:text-sm font-medium">{day.date}</div>
                  {#if day.salesData}
                    <div class="text-[8px] sm:text-[10px] text-muted-foreground truncate w-full text-center px-0.5">
                      ¥{day.salesData.totalSales.toLocaleString()}
                    </div>
                    {#if day.salesData.unregisteredCount > 0}
                      <div class="text-[9px] sm:text-xs text-red-600 dark:text-red-400 font-medium">
                        未{day.salesData.unregisteredCount}
                      </div>
                    {:else if day.salesData.inventoryProcessed}
                      <div class="text-[10px] text-green-600 dark:text-green-400">
                        ✓
                      </div>
                    {/if}
                  {/if}
                </div>
              </button>
            {:else}
              <div class="aspect-square p-2"></div>
            {/if}
          {/each}
        </div>
      </CardContent>
    </Card>

    <!-- 凡例 -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base sm:text-lg">凡例</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid gap-2 grid-cols-2 md:grid-cols-4">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 sm:w-8 sm:h-8 rounded border border-primary bg-primary/10 flex-shrink-0"></div>
            <span class="text-xs sm:text-sm">今日</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 sm:w-8 sm:h-8 rounded border border-border bg-blue-50 dark:bg-blue-950/20 flex-shrink-0"></div>
            <span class="text-xs sm:text-sm">売上あり</span>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="destructive" class="text-[9px] sm:text-[10px] whitespace-nowrap">未登録 N</Badge>
            <span class="text-xs sm:text-sm">未登録</span>
          </div>
          <div class="flex items-center gap-2">
            <Badge variant="default" class="text-[9px] sm:text-[10px] whitespace-nowrap">反映済み</Badge>
            <span class="text-xs sm:text-sm">反映済</span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</div>
