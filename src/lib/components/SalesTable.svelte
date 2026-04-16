<script lang="ts">
  import Badge from './ui/Badge.svelte';
  import type { SalesData } from '$lib/types';

  interface Props {
    salesData: SalesData[];
  }

  let { salesData }: Props = $props();

  function formatCurrency(value: number): string {
    return `¥${value.toLocaleString()}`;
  }

  function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
</script>

{#if salesData.length === 0}
  <div class="p-8 text-center text-muted-foreground">
    売上データがありません。CSVをアップロードしてください。
  </div>
{:else}
  <!-- モバイル: カード表示 -->
  <div class="block md:hidden space-y-3">
    {#each salesData as data (data.id)}
      <div class="border border-border rounded-lg p-4 space-y-3 hover:bg-accent/50 transition-colors">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="font-medium text-base">{data.productName}</div>
            {#if data.productCode}
              <div class="text-xs text-muted-foreground mt-0.5">{data.productCode}</div>
            {/if}
          </div>
          <Badge variant="outline" class="ml-2">{data.category}</Badge>
        </div>

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div class="text-xs text-muted-foreground mb-1">販売額</div>
            <div class="font-semibold">{formatCurrency(data.totalSales)}</div>
            <div class="text-xs text-muted-foreground">{formatPercentage(data.salesRatio)}</div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground mb-1">粗利</div>
            <div class="font-semibold">{formatCurrency(data.grossProfit)}</div>
            <div class="text-xs text-muted-foreground">{formatPercentage(data.profitRatio)}</div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground mb-1">販売数</div>
            <div class="font-semibold">{data.soldQuantity}</div>
            <div class="text-xs text-muted-foreground">{formatPercentage(data.quantityRatio)}</div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground mb-1">返品数</div>
            {#if data.returnedQuantity > 0}
              <Badge variant="warning">{data.returnedQuantity}</Badge>
            {:else}
              <span class="text-sm text-muted-foreground">0</span>
            {/if}
          </div>
        </div>

        <div class="flex gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
          <div><span class="font-medium">税区分:</span> {data.taxType}</div>
          {#if data.productId}
            <div><span class="font-medium">商品ID:</span> {data.productId}</div>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  <!-- デスクトップ: テーブル表示 -->
  <div class="hidden md:block overflow-x-auto">
    <table class="w-full">
      <thead>
        <tr class="border-b border-border">
          <th class="text-left px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">商品名</th>
          <th class="text-left px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">カテゴリ</th>
          <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">販売額</th>
          <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">粗利</th>
          <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">販売数</th>
          <th class="text-right px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">返品数</th>
          <th class="text-left px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">税区分</th>
          <th class="text-left px-4 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wide">商品ID</th>
        </tr>
      </thead>
      <tbody>
        {#each salesData as data (data.id)}
          <tr class="border-b border-border hover:bg-accent/50 transition-colors">
            <td class="px-4 py-3">
              <div class="font-medium">{data.productName}</div>
              {#if data.productCode}
                <div class="text-xs text-muted-foreground">{data.productCode}</div>
              {/if}
            </td>
            <td class="px-4 py-3 text-sm">{data.category}</td>
            <td class="px-4 py-3 text-right">
              <div class="font-medium">{formatCurrency(data.totalSales)}</div>
              <div class="text-xs text-muted-foreground">{formatPercentage(data.salesRatio)}</div>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="font-medium">{formatCurrency(data.grossProfit)}</div>
              <div class="text-xs text-muted-foreground">{formatPercentage(data.profitRatio)}</div>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="font-medium">{data.soldQuantity}</div>
              <div class="text-xs text-muted-foreground">{formatPercentage(data.quantityRatio)}</div>
            </td>
            <td class="px-4 py-3 text-right">
              {#if data.returnedQuantity > 0}
                <Badge variant="warning">{data.returnedQuantity}</Badge>
              {:else}
                <span class="text-sm text-muted-foreground">0</span>
              {/if}
            </td>
            <td class="px-4 py-3 text-sm">{data.taxType}</td>
            <td class="px-4 py-3 text-sm text-muted-foreground">{data.productId || '-'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
