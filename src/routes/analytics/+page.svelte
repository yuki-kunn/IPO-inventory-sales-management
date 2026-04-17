<script lang="ts">
  import { onMount } from 'svelte';
  import { BarChart3, TrendingUp, Calendar as CalendarIcon, Moon, Sun } from 'lucide-svelte';
  import Card from '$lib/components/ui/Card.svelte';
  import CardContent from '$lib/components/ui/CardContent.svelte';
  import CardHeader from '$lib/components/ui/CardHeader.svelte';
  import CardTitle from '$lib/components/ui/CardTitle.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import StatsCard from '$lib/components/StatsCard.svelte';
  import { dailySales } from '$lib/stores/dailySales.firestore';
  import { darkMode } from '$lib/stores/darkMode';
  import type { DailySales, SalesData } from '$lib/types';
  import { DollarSign, Package, ShoppingCart } from 'lucide-svelte';

  let isDarkMode = $state(false);
  let allSalesData = $state<DailySales[]>([]);
  let loading = $state(true);

  // 期間選択
  let startDate = $state('');
  let endDate = $state('');

  // 集計結果
  let periodStats = $state({
    totalSales: 0,
    totalProfit: 0,
    totalQuantity: 0,
    productCount: 0,
    avgDailySales: 0,
  });

  // 商品別データ
  let productTrends = $state<Array<{
    productName: string;
    totalSales: number;
    totalQuantity: number;
    avgPrice: number;
    frequency: number;
  }>>([]);

  let selectedProduct = $state<string | null>(null);
  let productDailyData = $state<Array<{
    date: string;
    quantity: number;
    sales: number;
  }>>([]);

  darkMode.subscribe((value) => {
    isDarkMode = value;
  });

  dailySales.subscribe((value) => {
    allSalesData = value;
    loading = false;
  });

  onMount(() => {
    // デフォルトで過去30日間を設定
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    endDate = end.toISOString().split('T')[0];
    startDate = start.toISOString().split('T')[0];

    calculatePeriodStats();
  });

  function toggleDarkMode() {
    darkMode.toggle();
  }

  function calculatePeriodStats() {
    if (!startDate || !endDate) return;

    // 期間内のデータをフィルタリング
    const filteredData = allSalesData.filter((ds) => {
      return ds.date >= startDate && ds.date <= endDate;
    });

    // 統計計算
    let totalSales = 0;
    let totalProfit = 0;
    let totalQuantity = 0;
    const productMap = new Map<string, {
      totalSales: number;
      totalQuantity: number;
      frequency: number;
    }>();

    filteredData.forEach((daily) => {
      totalSales += daily.totalSales;
      totalProfit += daily.totalProfit;
      totalQuantity += daily.totalQuantity;

      daily.sales.forEach((sale) => {
        const existing = productMap.get(sale.productName) || {
          totalSales: 0,
          totalQuantity: 0,
          frequency: 0,
        };

        productMap.set(sale.productName, {
          totalSales: existing.totalSales + sale.totalSales,
          totalQuantity: existing.totalQuantity + sale.soldQuantity,
          frequency: existing.frequency + 1,
        });
      });
    });

    periodStats = {
      totalSales,
      totalProfit,
      totalQuantity,
      productCount: productMap.size,
      avgDailySales: filteredData.length > 0 ? totalSales / filteredData.length : 0,
    };

    // 商品別トレンドデータを作成
    productTrends = Array.from(productMap.entries())
      .map(([productName, data]) => ({
        productName,
        totalSales: data.totalSales,
        totalQuantity: data.totalQuantity,
        avgPrice: data.totalQuantity > 0 ? data.totalSales / data.totalQuantity : 0,
        frequency: data.frequency,
      }))
      .sort((a, b) => b.totalSales - a.totalSales);
  }

  function selectProduct(productName: string) {
    selectedProduct = productName;

    // 選択した商品の日別データを取得
    const dailyData = allSalesData
      .filter((ds) => ds.date >= startDate && ds.date <= endDate)
      .map((daily) => {
        const productSale = daily.sales.find((s) => s.productName === productName);
        return {
          date: daily.date,
          quantity: productSale?.soldQuantity || 0,
          sales: productSale?.totalSales || 0,
        };
      })
      .filter((d) => d.quantity > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    productDailyData = dailyData;
  }

  function formatCurrency(value: number): string {
    return `¥${Math.round(value).toLocaleString()}`;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }
</script>

<div class="min-h-screen bg-background">
  <div class="max-w-7xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
    <!-- ヘッダー -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 sm:pb-6 gap-4 ml-14 sm:ml-0">
      <div>
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2">
          <BarChart3 class="h-6 w-6 sm:h-8 sm:w-8" />
          売上分析
        </h1>
        <p class="text-muted-foreground mt-1 text-xs sm:text-sm">期間集計と商品別トレンド分析</p>
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

    <!-- 期間選択 -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <CalendarIcon class="h-5 w-5" />
          分析期間の選択
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4 md:grid-cols-3">
          <div>
            <label for="startDate" class="block text-sm font-medium mb-2">開始日</label>
            <input
              id="startDate"
              type="date"
              bind:value={startDate}
              class="w-full px-3 py-2 border border-input rounded-md bg-background"
            />
          </div>
          <div>
            <label for="endDate" class="block text-sm font-medium mb-2">終了日</label>
            <input
              id="endDate"
              type="date"
              bind:value={endDate}
              class="w-full px-3 py-2 border border-input rounded-md bg-background"
            />
          </div>
          <div class="flex items-end">
            <Button onclick={calculatePeriodStats} class="w-full">
              <BarChart3 class="h-4 w-4 mr-2" />
              集計実行
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 期間統計 -->
    <div class="grid gap-3 grid-cols-2 md:grid-cols-2 lg:grid-cols-5">
      <StatsCard
        title="総売上"
        value={formatCurrency(periodStats.totalSales)}
        description={`${startDate} 〜 ${endDate}`}
        icon={DollarSign}
        iconColor="text-green-600 dark:text-green-400"
      />
      <StatsCard
        title="総粗利"
        value={formatCurrency(periodStats.totalProfit)}
        description="期間内の粗利益"
        icon={TrendingUp}
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <StatsCard
        title="販売商品数"
        value={periodStats.totalQuantity}
        description="期間内の販売総数"
        icon={ShoppingCart}
        iconColor="text-purple-600 dark:text-purple-400"
      />
      <StatsCard
        title="商品種類"
        value={periodStats.productCount}
        description="販売された商品種類"
        icon={Package}
        iconColor="text-orange-600 dark:text-orange-400"
      />
      <StatsCard
        title="1日平均売上"
        value={formatCurrency(periodStats.avgDailySales)}
        description="期間内の平均"
        icon={DollarSign}
        iconColor="text-teal-600 dark:text-teal-400"
      />
    </div>

    <!-- 商品別ランキング -->
    <Card>
      <CardHeader>
        <CardTitle>商品別売上ランキング（TOP 20）</CardTitle>
      </CardHeader>
      <CardContent>
        {#if productTrends.length === 0}
          <div class="py-12 text-center text-muted-foreground">
            期間を選択して集計を実行してください
          </div>
        {:else}
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-border">
                  <th class="text-left px-4 py-3 font-medium text-xs text-muted-foreground uppercase">順位</th>
                  <th class="text-left px-4 py-3 font-medium text-xs text-muted-foreground uppercase">商品名</th>
                  <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase">売上額</th>
                  <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase">販売数</th>
                  <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase">平均単価</th>
                  <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase">販売日数</th>
                  <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase">アクション</th>
                </tr>
              </thead>
              <tbody>
                {#each productTrends.slice(0, 20) as product, index}
                  <tr class="border-b border-border hover:bg-muted/50 transition-colors">
                    <td class="px-4 py-3">
                      <Badge variant={index < 3 ? 'default' : 'outline'}>{index + 1}</Badge>
                    </td>
                    <td class="px-4 py-3 font-medium">{product.productName}</td>
                    <td class="px-4 py-3 text-right font-semibold">{formatCurrency(product.totalSales)}</td>
                    <td class="px-4 py-3 text-right">{product.totalQuantity}</td>
                    <td class="px-4 py-3 text-right">{formatCurrency(product.avgPrice)}</td>
                    <td class="px-4 py-3 text-right">{product.frequency}日</td>
                    <td class="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onclick={() => selectProduct(product.productName)}
                      >
                        <TrendingUp class="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </CardContent>
    </Card>

    <!-- 商品別トレンド -->
    {#if selectedProduct && productDailyData.length > 0}
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle class="flex items-center gap-2">
              <TrendingUp class="h-5 w-5" />
              {selectedProduct} のトレンド
            </CardTitle>
            <Button variant="ghost" size="sm" onclick={() => (selectedProduct = null)}>
              <span class="text-lg">×</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <!-- シンプルなバーチャート -->
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-muted/50 rounded-lg">
                <div class="text-sm text-muted-foreground">期間内総売上</div>
                <div class="text-2xl font-bold mt-1">
                  {formatCurrency(productDailyData.reduce((sum, d) => sum + d.sales, 0))}
                </div>
              </div>
              <div class="p-4 bg-muted/50 rounded-lg">
                <div class="text-sm text-muted-foreground">期間内総販売数</div>
                <div class="text-2xl font-bold mt-1">
                  {productDailyData.reduce((sum, d) => sum + d.quantity, 0)}
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <h4 class="text-sm font-medium">日別販売推移</h4>
              {#each productDailyData as data}
                {@const maxQuantity = Math.max(...productDailyData.map(d => d.quantity))}
                <div class="flex items-center gap-3">
                  <div class="text-xs text-muted-foreground w-16">{formatDate(data.date)}</div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <div
                        class="h-8 bg-primary/20 border border-primary/30 rounded flex items-center px-2"
                        style="width: {(data.quantity / maxQuantity) * 100}%;"
                      >
                        <span class="text-xs font-medium">{data.quantity}個</span>
                      </div>
                    </div>
                  </div>
                  <div class="text-sm font-medium w-24 text-right">{formatCurrency(data.sales)}</div>
                </div>
              {/each}
            </div>
          </div>
        </CardContent>
      </Card>
    {/if}
  </div>
</div>
