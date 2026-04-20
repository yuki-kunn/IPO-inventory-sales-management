<script lang="ts">
	import Badge from './ui/Badge.svelte';
	import type { SalesData } from '$lib/types';
	import { formatCurrency, formatPercentage } from '$lib/utils/formatters';

	interface Props {
		salesData: SalesData[];
	}

	let { salesData }: Props = $props();
</script>

{#if salesData.length === 0}
	<div class="text-muted-foreground p-8 text-center">
		売上データがありません。CSVをアップロードしてください。
	</div>
{:else}
	<!-- モバイル: カード表示 -->
	<div class="block space-y-3 md:hidden">
		{#each salesData as data (data.id)}
			<div
				class="border-border hover:bg-accent/50 space-y-3 rounded-lg border p-4 transition-colors"
			>
				<div class="flex items-start justify-between">
					<div class="flex-1">
						<div class="text-base font-medium">{data.productName}</div>
						{#if data.productCode}
							<div class="text-muted-foreground mt-0.5 text-xs">{data.productCode}</div>
						{/if}
					</div>
					<Badge variant="outline" class="ml-2">{data.category}</Badge>
				</div>

				<div class="grid grid-cols-2 gap-3 text-sm">
					<div>
						<div class="text-muted-foreground mb-1 text-xs">販売額</div>
						<div class="font-semibold">{formatCurrency(data.totalSales)}</div>
						<div class="text-muted-foreground text-xs">{formatPercentage(data.salesRatio)}</div>
					</div>
					<div>
						<div class="text-muted-foreground mb-1 text-xs">粗利</div>
						<div class="font-semibold">{formatCurrency(data.grossProfit)}</div>
						<div class="text-muted-foreground text-xs">{formatPercentage(data.profitRatio)}</div>
					</div>
					<div>
						<div class="text-muted-foreground mb-1 text-xs">販売数</div>
						<div class="font-semibold">{data.soldQuantity}</div>
						<div class="text-muted-foreground text-xs">{formatPercentage(data.quantityRatio)}</div>
					</div>
					<div>
						<div class="text-muted-foreground mb-1 text-xs">返品数</div>
						{#if data.returnedQuantity > 0}
							<Badge variant="warning">{data.returnedQuantity}</Badge>
						{:else}
							<span class="text-muted-foreground text-sm">0</span>
						{/if}
					</div>
				</div>

				<div class="text-muted-foreground border-border flex gap-4 border-t pt-2 text-xs">
					<div><span class="font-medium">税区分:</span> {data.taxType}</div>
					{#if data.productId}
						<div><span class="font-medium">商品ID:</span> {data.productId}</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- デスクトップ: テーブル表示 -->
	<div class="hidden overflow-x-auto md:block">
		<table class="w-full">
			<thead>
				<tr class="border-border border-b">
					<th
						class="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wide uppercase"
						>商品名</th
					>
					<th
						class="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wide uppercase"
						>カテゴリ</th
					>
					<th
						class="text-muted-foreground px-4 py-3 text-right text-xs font-medium tracking-wide uppercase"
						>販売額</th
					>
					<th
						class="text-muted-foreground px-4 py-3 text-right text-xs font-medium tracking-wide uppercase"
						>粗利</th
					>
					<th
						class="text-muted-foreground px-4 py-3 text-right text-xs font-medium tracking-wide uppercase"
						>販売数</th
					>
					<th
						class="text-muted-foreground px-4 py-3 text-right text-xs font-medium tracking-wide uppercase"
						>返品数</th
					>
					<th
						class="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wide uppercase"
						>税区分</th
					>
					<th
						class="text-muted-foreground px-4 py-3 text-left text-xs font-medium tracking-wide uppercase"
						>商品ID</th
					>
				</tr>
			</thead>
			<tbody>
				{#each salesData as data (data.id)}
					<tr class="border-border hover:bg-accent/50 border-b transition-colors">
						<td class="px-4 py-3">
							<div class="font-medium">{data.productName}</div>
							{#if data.productCode}
								<div class="text-muted-foreground text-xs">{data.productCode}</div>
							{/if}
						</td>
						<td class="px-4 py-3 text-sm">{data.category}</td>
						<td class="px-4 py-3 text-right">
							<div class="font-medium">{formatCurrency(data.totalSales)}</div>
							<div class="text-muted-foreground text-xs">{formatPercentage(data.salesRatio)}</div>
						</td>
						<td class="px-4 py-3 text-right">
							<div class="font-medium">{formatCurrency(data.grossProfit)}</div>
							<div class="text-muted-foreground text-xs">{formatPercentage(data.profitRatio)}</div>
						</td>
						<td class="px-4 py-3 text-right">
							<div class="font-medium">{data.soldQuantity}</div>
							<div class="text-muted-foreground text-xs">
								{formatPercentage(data.quantityRatio)}
							</div>
						</td>
						<td class="px-4 py-3 text-right">
							{#if data.returnedQuantity > 0}
								<Badge variant="warning">{data.returnedQuantity}</Badge>
							{:else}
								<span class="text-muted-foreground text-sm">0</span>
							{/if}
						</td>
						<td class="px-4 py-3 text-sm">{data.taxType}</td>
						<td class="text-muted-foreground px-4 py-3 text-sm">{data.productId || '-'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
