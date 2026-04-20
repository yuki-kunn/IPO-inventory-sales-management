<script lang="ts">
	import { ChefHat, Plus, Edit, Trash2, Moon, Sun } from 'lucide-svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { recipes } from '$lib/stores/recipes.firestore';
	import { ingredients } from '$lib/stores/ingredients.firestore';
	import { unregisteredProducts } from '$lib/stores/unregistered.firestore';
	import { darkMode } from '$lib/stores/darkMode';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import type { Recipe, Ingredient, RecipeIngredient } from '$lib/types';

	let currentRecipes = $state<Recipe[]>([]);
	let currentIngredients = $state<Ingredient[]>([]);
	let isDarkMode = $state(false);
	let showAddModal = $state(false);
	let editingRecipe = $state<Recipe | null>(null);
	let prefilledProductName = $state('');

	// レシピモーダル用のステート
	let modalFormData = $state({
		productName: '',
		ingredients: [] as { ingredientName: string; quantity: number }[]
	});

	recipes.subscribe((value) => {
		currentRecipes = value;
	});

	ingredients.subscribe((value) => {
		currentIngredients = value;
	});

	darkMode.subscribe((value) => {
		isDarkMode = value;
	});

	// URLパラメータから商品名を取得（ブラウザ環境でのみ）
	if (browser) {
		page.subscribe(($page) => {
			const productName = $page.url.searchParams.get('productName');
			if (productName && productName !== prefilledProductName) {
				prefilledProductName = productName;
				// 商品名が指定されている場合は自動的にモーダルを開く
				if (!showAddModal && !editingRecipe) {
					openAddModal();
				}
			}
		});
	}

	function toggleDarkMode() {
		darkMode.toggle();
	}

	function handleEdit(recipe: Recipe) {
		editingRecipe = recipe;
	}

	function handleDelete(id: string) {
		if (confirm('このレシピを削除してもよろしいですか?')) {
			recipes.remove(id);
		}
	}

	function closeModal() {
		showAddModal = false;
		editingRecipe = null;
		prefilledProductName = '';
	}

	function openAddModal() {
		modalFormData = {
			productName: prefilledProductName || '',
			ingredients: []
		};
		showAddModal = true;
	}

	function openEditModal(recipe: Recipe) {
		modalFormData = {
			productName: recipe.productName,
			ingredients: recipe.ingredients.map((ing) => ({
				ingredientName: ing.ingredientName,
				quantity: ing.quantity
			}))
		};
		editingRecipe = recipe;
	}

	function addIngredientToRecipe() {
		modalFormData.ingredients = [...modalFormData.ingredients, { ingredientName: '', quantity: 0 }];
	}

	function removeIngredientFromRecipe(index: number) {
		modalFormData.ingredients = modalFormData.ingredients.filter((_, i) => i !== index);
	}

	async function handleSaveRecipe() {
		if (!modalFormData.productName || modalFormData.ingredients.length === 0) {
			alert('商品名と原材料を入力してください。');
			return;
		}

		const recipeIngredients: RecipeIngredient[] = [];

		for (const ing of modalFormData.ingredients) {
			if (!ing.ingredientName || ing.quantity <= 0) {
				continue;
			}

			// 既存の原材料から検索（名前で検索）
			const existingIngredient = currentIngredients.find((i) => i.name === ing.ingredientName);

			if (!existingIngredient) {
				alert(
					`原材料「${ing.ingredientName}」が見つかりません。先に原材料マスタに登録してください。`
				);
				return;
			}

			console.log('[Recipes] 原材料を使用:', existingIngredient.name, 'ID:', existingIngredient.id);

			recipeIngredients.push({
				ingredientId: existingIngredient.id,
				ingredientName: existingIngredient.name,
				quantity: ing.quantity,
				unit: existingIngredient.unit
			});
		}

		if (recipeIngredients.length === 0) {
			alert('有効な原材料を追加してください。');
			return;
		}

		if (editingRecipe) {
			// 更新
			await recipes.update(editingRecipe.id, {
				productName: modalFormData.productName,
				ingredients: recipeIngredients
			});
			console.log('[Recipes] レシピ更新完了:', modalFormData.productName);
		} else {
			// 新規追加
			const newRecipe: Omit<Recipe, 'id'> = {
				productName: modalFormData.productName,
				ingredients: recipeIngredients,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			};
			await recipes.add(newRecipe);

			// レシピを登録したら未登録商品リストから削除
			console.log('[Recipes] 未登録商品リストから削除:', modalFormData.productName);
			await unregisteredProducts.remove(modalFormData.productName);
		}

		closeModal();
	}
</script>

<div class="bg-background min-h-screen">
	<div class="mx-auto max-w-7xl space-y-6 p-4 sm:space-y-8 sm:p-6 md:p-8">
		<!-- ヘッダー -->
		<div
			class="border-border ml-14 flex flex-col gap-4 border-b pb-4 sm:ml-0 sm:flex-row sm:items-center sm:justify-between sm:pb-6"
		>
			<div>
				<h1 class="text-2xl font-semibold tracking-tight sm:text-3xl">登録済み商品</h1>
				<p class="text-muted-foreground mt-1 text-xs sm:text-sm">商品ごとのレシピを管理</p>
			</div>
			<div class="flex items-center gap-2">
				<Button variant="outline" onclick={toggleDarkMode} size="icon" class="touch-manipulation">
					{#if isDarkMode}
						<Sun class="h-5 w-5" />
					{:else}
						<Moon class="h-5 w-5" />
					{/if}
				</Button>
				<Button onclick={openAddModal} class="touch-manipulation">
					<Plus class="h-4 w-4" />
					<span class="hidden sm:inline">商品を追加</span>
				</Button>
			</div>
		</div>

		<!-- レシピ一覧 -->
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
			{#if currentRecipes.length === 0}
				<div class="col-span-full">
					<Card>
						<CardContent class="text-muted-foreground py-12 text-center">
							登録済み商品がありません。商品を追加してください。
						</CardContent>
					</Card>
				</div>
			{:else}
				{#each currentRecipes as recipe}
					<Card>
						<CardHeader>
							<div class="flex items-start justify-between">
								<div class="flex items-center gap-2">
									<ChefHat class="text-primary h-5 w-5" />
									<CardTitle class="text-lg">{recipe.productName}</CardTitle>
								</div>
								<div class="flex gap-1">
									<Button variant="ghost" size="sm" onclick={() => openEditModal(recipe)}>
										<Edit class="h-4 w-4" />
									</Button>
									<Button variant="ghost" size="sm" onclick={() => handleDelete(recipe.id)}>
										<Trash2 class="h-4 w-4 text-red-500" />
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<div class="space-y-2">
								<p class="text-muted-foreground text-sm font-medium">原材料:</p>
								{#each recipe.ingredients as ingredient}
									<div class="flex items-center justify-between text-sm">
										<span>{ingredient.ingredientName}</span>
										<Badge variant="outline">
											{ingredient.quantity}
											{ingredient.unit}
										</Badge>
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/each}
			{/if}
		</div>
	</div>
</div>

<!-- レシピ追加/編集モーダル -->
{#if showAddModal || editingRecipe}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeModal();
		}}
		onkeydown={(e) => e.key === 'Escape' && closeModal()}
		role="button"
		tabindex="-1"
	>
		<Card class="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
			<CardHeader>
				<div class="flex items-center justify-between">
					<CardTitle>{editingRecipe ? '商品の原材料を編集' : '商品の原材料を追加'}</CardTitle>
					<Button variant="ghost" size="icon" onclick={closeModal}>
						<span class="text-lg">×</span>
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div>
						<label for="productName" class="mb-1 block text-sm font-medium">
							商品名<span class="text-red-500">*</span>
						</label>
						<input
							id="productName"
							type="text"
							bind:value={modalFormData.productName}
							required
							class="border-input bg-background w-full rounded-md border px-3 py-2"
						/>
					</div>

					<div>
						<div class="mb-2 flex items-center justify-between">
							<div class="block text-sm font-medium">原材料<span class="text-red-500">*</span></div>
							<Button variant="outline" size="sm" onclick={addIngredientToRecipe}>
								<Plus class="h-4 w-4" />
								追加
							</Button>
						</div>

						<div class="space-y-2">
							{#if currentIngredients.length === 0}
								<div
									class="text-muted-foreground rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm dark:border-yellow-800 dark:bg-yellow-950/20"
								>
									<p class="font-medium">原材料が登録されていません</p>
									<p class="mt-1">先に「原材料マスタ」ページで原材料を登録してください。</p>
									<Button
										variant="outline"
										size="sm"
										class="mt-2"
										onclick={() => (window.location.href = '/ingredients')}
									>
										原材料マスタへ
									</Button>
								</div>
							{:else if modalFormData.ingredients.length === 0}
								<p class="text-muted-foreground text-sm">原材料を追加してください。</p>
							{:else}
								{#each modalFormData.ingredients as ingredient, index}
									{@const selectedIngredient = currentIngredients.find(
										(i) => i.name === ingredient.ingredientName
									)}
									<div class="grid grid-cols-12 items-center gap-2">
										<select
											bind:value={ingredient.ingredientName}
											required
											class="border-input bg-background col-span-6 rounded-md border px-3 py-2"
										>
											<option value="">原材料を選択</option>
											{#each currentIngredients as ing}
												<option value={ing.name}>{ing.name}</option>
											{/each}
										</select>
										<input
											type="number"
											bind:value={ingredient.quantity}
											min="0"
											step="0.01"
											placeholder="使用量"
											required
											class="border-input bg-background col-span-3 rounded-md border px-3 py-2"
										/>
										<div class="text-muted-foreground col-span-2 text-sm">
											{selectedIngredient?.unit || '-'}
										</div>
										<Button
											variant="ghost"
											size="sm"
											class="col-span-1"
											onclick={() => removeIngredientFromRecipe(index)}
										>
											<Trash2 class="h-4 w-4 text-red-500" />
										</Button>
									</div>
								{/each}
							{/if}
						</div>
					</div>

					<div class="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onclick={closeModal}>キャンセル</Button>
						<Button type="button" onclick={handleSaveRecipe}>保存</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
{/if}
