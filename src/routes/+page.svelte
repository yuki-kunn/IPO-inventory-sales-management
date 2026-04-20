<script lang="ts">
	import { Package, AlertTriangle, XCircle, DollarSign, Moon, Sun, Upload } from 'lucide-svelte';
	import StatsCard from '$lib/components/StatsCard.svelte';
	import IngredientsTable from '$lib/components/IngredientsTable.svelte';
	import EditIngredientModal from '$lib/components/EditIngredientModal.svelte';
	import AddIngredientModal from '$lib/components/AddIngredientModal.svelte';
	import SalesUploader from '$lib/components/SalesUploader.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { ingredients, ingredientStats } from '$lib/stores/ingredients.firestore';
	import { darkMode } from '$lib/stores/darkMode';
	import type { Ingredient } from '$lib/types';

	let currentIngredients = $state<Ingredient[]>([]);
	let currentStats = $state({
		totalIngredients: 0,
		lowStockIngredients: 0,
		outOfStockIngredients: 0,
		totalValue: 0
	});
	let editingIngredient = $state<Ingredient | null>(null);
	let showAddModal = $state(false);
	let showUploader = $state(false);
	let isDarkMode = $state(false);

	ingredients.subscribe((value) => {
		currentIngredients = value;
	});

	ingredientStats.subscribe((value) => {
		currentStats = value;
	});

	darkMode.subscribe((value) => {
		isDarkMode = value;
	});

	function handleEdit(ingredient: Ingredient) {
		editingIngredient = ingredient;
	}

	function handleDelete(id: string) {
		if (confirm('この原材料を削除してもよろしいですか?')) {
			ingredients.remove(id);
		}
	}

	function closeEditModal() {
		editingIngredient = null;
	}

	function closeAddModal() {
		showAddModal = false;
	}

	function toggleDarkMode() {
		darkMode.toggle();
	}

	// 発注が必要な原材料
	let lowStockIngredients = $derived(
		currentIngredients.filter((i) => i.stockQuantity > 0 && i.stockQuantity <= i.minStockLevel)
	);
</script>

<div class="bg-background min-h-screen">
	<div class="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 md:p-8">
		<!-- ヘッダー -->
		<div
			class="border-border ml-14 flex flex-col gap-4 border-b pb-4 sm:ml-0 sm:flex-row sm:items-center sm:justify-between sm:pb-6"
		>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">AirREGI 在庫・売上管理</h1>
				<p class="text-muted-foreground mt-1 text-xs sm:text-sm">
					原材料在庫と売上データを統合管理
				</p>
			</div>
			<div class="flex items-center gap-2">
				<Button variant="outline" onclick={toggleDarkMode} size="icon" class="touch-manipulation">
					{#if isDarkMode}
						<Sun class="h-5 w-5" />
					{:else}
						<Moon class="h-5 w-5" />
					{/if}
				</Button>
				<Button
					variant="outline"
					onclick={() => (showUploader = !showUploader)}
					class="touch-manipulation"
				>
					<Upload class="h-4 w-4" />
					<span class="hidden sm:inline">{showUploader ? '閉じる' : '売上取込'}</span>
				</Button>
			</div>
		</div>

		<!-- 売上データアップローダー -->
		{#if showUploader}
			<SalesUploader />
		{/if}

		<!-- 統計カード -->
		<div class="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
			<StatsCard
				title="総原材料数"
				value={currentStats.totalIngredients}
				description="登録されている原材料の総数"
				icon={Package}
				iconColor="text-blue-600 dark:text-blue-400"
			/>
			<StatsCard
				title="在庫少"
				value={currentStats.lowStockIngredients}
				description="発注が必要な原材料"
				icon={AlertTriangle}
				iconColor="text-yellow-600 dark:text-yellow-400"
			/>
			<StatsCard
				title="在庫切れ"
				value={currentStats.outOfStockIngredients}
				description="在庫が0の原材料"
				icon={XCircle}
				iconColor="text-red-600 dark:text-red-400"
			/>
			<StatsCard
				title="総在庫価値"
				value={`¥${currentStats.totalValue.toLocaleString()}`}
				description="在庫の総額"
				icon={DollarSign}
				iconColor="text-green-600 dark:text-green-400"
			/>
		</div>

		<!-- アラート -->
		{#if lowStockIngredients.length > 0}
			<Card class="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20">
				<CardHeader>
					<CardTitle class="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
						<AlertTriangle class="h-5 w-5" />
						発注アラート
					</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="mb-3 text-sm text-yellow-700 dark:text-yellow-300">
						以下の原材料は在庫が少なくなっています。発注をご検討ください。
					</p>
					<div class="flex flex-wrap gap-2">
						{#each lowStockIngredients as ingredient}
							<Badge variant="warning">
								{ingredient.name} (残り{ingredient.stockQuantity}{ingredient.unit})
							</Badge>
						{/each}
					</div>
				</CardContent>
			</Card>
		{/if}

		<!-- 原材料一覧テーブル -->
		<Card>
			<CardHeader>
				<CardTitle>原材料一覧</CardTitle>
			</CardHeader>
			<CardContent>
				<IngredientsTable
					ingredients={currentIngredients}
					onEdit={handleEdit}
					onDelete={handleDelete}
				/>
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
