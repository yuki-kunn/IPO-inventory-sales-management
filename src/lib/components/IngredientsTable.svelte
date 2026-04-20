<script lang="ts">
	import type { Ingredient } from '$lib/types';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Edit, Trash2 } from 'lucide-svelte';

	interface Props {
		ingredients: Ingredient[];
		onEdit?: (ingredient: Ingredient) => void;
		onDelete?: (id: string) => void;
	}

	let { ingredients, onEdit, onDelete }: Props = $props();

	function getStockStatus(ingredient: Ingredient): 'ok' | 'low' | 'out' {
		if (ingredient.stockQuantity === 0) return 'out';
		if (ingredient.stockQuantity <= ingredient.minStockLevel) return 'low';
		return 'ok';
	}

	function getStockBadgeVariant(
		status: 'ok' | 'low' | 'out'
	): 'default' | 'warning' | 'destructive' {
		switch (status) {
			case 'ok':
				return 'default';
			case 'low':
				return 'warning';
			case 'out':
				return 'destructive';
		}
	}

	function getStockBadgeText(status: 'ok' | 'low' | 'out'): string {
		switch (status) {
			case 'ok':
				return '正常';
			case 'low':
				return '在庫少';
			case 'out':
				return '在庫切れ';
		}
	}
</script>

<div class="border-border overflow-x-auto rounded-lg border">
	<table class="divide-border min-w-full divide-y">
		<thead class="bg-muted/50">
			<tr>
				<th
					class="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
				>
					原材料名
				</th>
				<th
					class="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
				>
					在庫数
				</th>
				<th
					class="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
				>
					単位
				</th>
				<th
					class="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
				>
					単価
				</th>
				<th
					class="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
				>
					発注レベル
				</th>
				<th
					class="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
				>
					仕入先
				</th>
				<th
					class="text-muted-foreground px-6 py-3 text-left text-xs font-medium tracking-wider uppercase"
				>
					ステータス
				</th>
				<th
					class="text-muted-foreground px-6 py-3 text-right text-xs font-medium tracking-wider uppercase"
				>
					アクション
				</th>
			</tr>
		</thead>
		<tbody class="bg-background divide-border divide-y">
			{#if ingredients.length === 0}
				<tr>
					<td colspan="8" class="text-muted-foreground px-6 py-12 text-center">
						原材料が登録されていません
					</td>
				</tr>
			{:else}
				{#each ingredients as ingredient}
					{@const status = getStockStatus(ingredient)}
					<tr class="hover:bg-muted/50 transition-colors">
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm font-medium">{ingredient.name}</div>
							{#if ingredient.description}
								<div class="text-muted-foreground text-xs">{ingredient.description}</div>
							{/if}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm font-semibold">{ingredient.stockQuantity.toLocaleString()}</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm">{ingredient.unit}</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm">
								{ingredient.unitPrice ? `¥${ingredient.unitPrice.toLocaleString()}` : '-'}
							</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm">{ingredient.minStockLevel.toLocaleString()}</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="text-sm">{ingredient.supplier || '-'}</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<Badge variant={getStockBadgeVariant(status)}>
								{getStockBadgeText(status)}
							</Badge>
						</td>
						<td class="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
							<div class="flex justify-end gap-2">
								{#if onEdit}
									<Button variant="ghost" size="sm" onclick={() => onEdit(ingredient)}>
										<Edit class="h-4 w-4" />
									</Button>
								{/if}
								{#if onDelete}
									<Button variant="ghost" size="sm" onclick={() => onDelete(ingredient.id)}>
										<Trash2 class="h-4 w-4 text-red-500" />
									</Button>
								{/if}
							</div>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
