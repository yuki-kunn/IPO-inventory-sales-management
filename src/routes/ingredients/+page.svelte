<script lang="ts">
	import { Package, Moon, Sun, Plus, Edit, Trash2 } from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import EditIngredientModal from '$lib/components/EditIngredientModal.svelte';
	import AddIngredientModal from '$lib/components/AddIngredientModal.svelte';
	import { ingredients } from '$lib/stores/ingredients.firestore';
	import { darkMode } from '$lib/stores/darkMode';
	import type { Ingredient } from '$lib/types';

	let currentIngredients = $state<Ingredient[]>([]);
	let isDarkMode = $state(false);
	let editingIngredient = $state<Ingredient | null>(null);
	let showAddModal = $state(false);

	ingredients.subscribe((value) => {
		currentIngredients = value;
	});

	darkMode.subscribe((value) => {
		isDarkMode = value;
	});

	function toggleDarkMode() {
		darkMode.toggle();
	}

	function handleEdit(ingredient: Ingredient) {
		editingIngredient = ingredient;
	}

	function handleDelete(id: string) {
		if (confirm('この原材料を削除してもよろしいですか？')) {
			ingredients.remove(id);
		}
	}

	function closeEditModal() {
		editingIngredient = null;
	}

	function closeAddModal() {
		showAddModal = false;
	}

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

<div class="bg-background min-h-screen">
	<div class="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 md:p-8">
		<!-- ヘッダー -->
		<div
			class="border-border ml-14 flex flex-col gap-4 border-b pb-4 sm:ml-0 sm:flex-row sm:items-center sm:justify-between sm:pb-6"
		>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">原材料マスタ</h1>
				<p class="text-muted-foreground mt-1 text-xs sm:text-sm">原材料の基本情報と在庫を管理</p>
			</div>
			<div class="flex items-center gap-2">
				<Button variant="outline" onclick={toggleDarkMode} size="icon" class="touch-manipulation">
					{#if isDarkMode}
						<Sun class="h-5 w-5" />
					{:else}
						<Moon class="h-5 w-5" />
					{/if}
				</Button>
				<Button onclick={() => (showAddModal = true)} class="touch-manipulation">
					<Plus class="h-4 w-4" />
					<span class="hidden sm:inline">原材料を追加</span>
				</Button>
			</div>
		</div>

		<!-- 原材料一覧テーブル -->
		<Card>
			<CardHeader>
				<CardTitle>原材料一覧</CardTitle>
			</CardHeader>
			<CardContent>
				{#if currentIngredients.length === 0}
					<div class="text-muted-foreground py-12 text-center">
						原材料が登録されていません。「原材料を追加」から登録してください。
					</div>
				{:else}
					<!-- モバイル: カード表示 -->
					<div class="-mx-4 block space-y-3 sm:mx-0 md:hidden">
						{#each currentIngredients as ingredient}
							{@const status = getStockStatus(ingredient)}
							<div
								class="hover:bg-muted/50 space-y-3 border-b p-4 transition-colors last:border-b-0 md:rounded-lg md:border"
							>
								<div class="flex items-start justify-between">
									<div class="flex-1">
										<div class="text-base font-medium">{ingredient.name}</div>
										{#if ingredient.description}
											<div class="text-muted-foreground mt-0.5 text-xs">
												{ingredient.description}
											</div>
										{/if}
									</div>
									<Badge variant={getStockBadgeVariant(status)} class="ml-2">
										{getStockBadgeText(status)}
									</Badge>
								</div>

								<div class="grid grid-cols-2 gap-3 text-sm">
									<div>
										<div class="text-muted-foreground mb-1 text-xs">在庫数</div>
										<div class="font-semibold">
											{ingredient.stockQuantity.toLocaleString()}
											{ingredient.unit}
										</div>
									</div>
									<div>
										<div class="text-muted-foreground mb-1 text-xs">単価</div>
										<div class="font-semibold">
											{ingredient.unitPrice ? `¥${ingredient.unitPrice.toLocaleString()}` : '-'}
										</div>
									</div>
									<div>
										<div class="text-muted-foreground mb-1 text-xs">発注レベル</div>
										<div class="font-semibold">{ingredient.minStockLevel.toLocaleString()}</div>
									</div>
									<div>
										<div class="text-muted-foreground mb-1 text-xs">仕入先</div>
										<div class="truncate font-semibold">{ingredient.supplier || '-'}</div>
									</div>
								</div>

								<div class="border-border flex justify-end gap-2 border-t pt-2">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => handleEdit(ingredient)}
										class="touch-manipulation"
									>
										<Edit class="h-4 w-4" />
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => handleDelete(ingredient.id)}
										class="touch-manipulation"
									>
										<Trash2 class="h-4 w-4 text-red-500" />
									</Button>
								</div>
							</div>
						{/each}
					</div>

					<!-- デスクトップ: テーブル表示 -->
					<div
						class="border-border -mx-4 hidden overflow-x-auto border-y sm:mx-0 sm:rounded-lg sm:border md:block"
					>
						<table class="divide-border min-w-full divide-y">
							<thead class="bg-muted/50">
								<tr>
									<th
										class="text-muted-foreground px-4 py-2 text-left text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										原材料名
									</th>
									<th
										class="text-muted-foreground px-4 py-2 text-left text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										在庫数
									</th>
									<th
										class="text-muted-foreground px-4 py-2 text-left text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										単位
									</th>
									<th
										class="text-muted-foreground px-4 py-2 text-left text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										単価
									</th>
									<th
										class="text-muted-foreground px-4 py-2 text-left text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										発注レベル
									</th>
									<th
										class="text-muted-foreground px-4 py-2 text-left text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										仕入先
									</th>
									<th
										class="text-muted-foreground px-4 py-2 text-left text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										ステータス
									</th>
									<th
										class="text-muted-foreground px-4 py-2 text-right text-xs font-medium tracking-wider uppercase sm:px-6 sm:py-3"
									>
										アクション
									</th>
								</tr>
							</thead>
							<tbody class="bg-background divide-border divide-y">
								{#each currentIngredients as ingredient}
									{@const status = getStockStatus(ingredient)}
									<tr class="hover:bg-muted/50 transition-colors">
										<td class="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
											<div class="text-sm font-medium">{ingredient.name}</div>
											{#if ingredient.description}
												<div class="text-muted-foreground text-xs">{ingredient.description}</div>
											{/if}
										</td>
										<td class="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
											<div class="text-sm font-semibold">
												{ingredient.stockQuantity.toLocaleString()}
											</div>
										</td>
										<td class="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
											<div class="text-sm">{ingredient.unit}</div>
										</td>
										<td class="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
											<div class="text-sm">
												{ingredient.unitPrice ? `¥${ingredient.unitPrice.toLocaleString()}` : '-'}
											</div>
										</td>
										<td class="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
											<div class="text-sm">{ingredient.minStockLevel.toLocaleString()}</div>
										</td>
										<td class="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
											<div class="text-sm">{ingredient.supplier || '-'}</div>
										</td>
										<td class="px-4 py-3 whitespace-nowrap sm:px-6 sm:py-4">
											<Badge variant={getStockBadgeVariant(status)}>
												{getStockBadgeText(status)}
											</Badge>
										</td>
										<td
											class="px-4 py-3 text-right text-sm font-medium whitespace-nowrap sm:px-6 sm:py-4"
										>
											<div class="flex justify-end gap-2">
												<Button variant="ghost" size="sm" onclick={() => handleEdit(ingredient)}>
													<Edit class="h-4 w-4" />
												</Button>
												<Button
													variant="ghost"
													size="sm"
													onclick={() => handleDelete(ingredient.id)}
												>
													<Trash2 class="h-4 w-4 text-red-500" />
												</Button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>

<!-- モーダル -->
{#if editingIngredient}
	<EditIngredientModal ingredient={editingIngredient} onClose={closeEditModal} />
{/if}

{#if showAddModal}
	<AddIngredientModal onClose={closeAddModal} />
{/if}
