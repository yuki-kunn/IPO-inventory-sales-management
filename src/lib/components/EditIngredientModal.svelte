<script lang="ts">
	import type { Ingredient } from '$lib/types';
	import { ingredients } from '$lib/stores/ingredients.firestore';
	import Button from '$lib/components/ui/Button.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import CardHeader from '$lib/components/ui/CardHeader.svelte';
	import CardTitle from '$lib/components/ui/CardTitle.svelte';
	import CardContent from '$lib/components/ui/CardContent.svelte';
	import { X } from 'lucide-svelte';

	interface Props {
		ingredient: Ingredient | null;
		onClose: () => void;
	}

	let { ingredient, onClose }: Props = $props();

	// フォーム入力用の状態（derivedで初期化）
	let name = $state('');
	let unit = $state('');
	let stockQuantity = $state(0);
	let minStockLevel = $state(0);
	let supplier = $state('');
	let unitPrice = $state(0);
	let description = $state('');

	// ingredientが変更されたときに状態を更新
	$effect(() => {
		const currentIngredient = ingredient;
		if (currentIngredient) {
			name = currentIngredient.name || '';
			unit = currentIngredient.unit || '';
			stockQuantity = currentIngredient.stockQuantity || 0;
			minStockLevel = currentIngredient.minStockLevel || 0;
			supplier = currentIngredient.supplier || '';
			unitPrice = currentIngredient.unitPrice || 0;
			description = currentIngredient.description || '';
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (ingredient) {
			console.log('[EditIngredientModal] 更新開始:', {
				id: ingredient.id,
				name,
				unit,
				stockQuantity,
				minStockLevel,
				unitPrice,
				supplier,
				description
			});

			try {
				const updateData: any = {
					name,
					unit,
					stockQuantity: Number(stockQuantity),
					minStockLevel: Number(minStockLevel)
				};

				// オプションフィールドは値がある場合のみ追加
				if (supplier && supplier.trim() !== '') {
					updateData.supplier = supplier;
				}
				if (unitPrice !== null && unitPrice !== undefined && unitPrice > 0) {
					updateData.unitPrice = Number(unitPrice);
				}
				if (description && description.trim() !== '') {
					updateData.description = description;
				}

				console.log('[EditIngredientModal] 送信データ:', updateData);

				await ingredients.update(ingredient.id, updateData);
				console.log('[EditIngredientModal] 更新成功');
			} catch (error) {
				console.error('[EditIngredientModal] 更新失敗:', error);
				alert('更新に失敗しました: ' + error);
				return;
			}
		}
		onClose();
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
	onclick={handleBackdropClick}
	onkeydown={(e) => e.key === 'Escape' && onClose()}
	role="button"
	tabindex="-1"
>
	<Card class="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle>原材料を編集</CardTitle>
				<Button variant="ghost" size="icon" onclick={onClose}>
					<X class="h-4 w-4" />
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="grid gap-4 md:grid-cols-2">
					<div>
						<label for="name" class="mb-1 block text-sm font-medium">
							原材料名<span class="text-red-500">*</span>
						</label>
						<input
							id="name"
							type="text"
							bind:value={name}
							required
							class="border-input bg-background w-full rounded-md border px-3 py-2"
						/>
					</div>

					<div>
						<label for="unit" class="mb-1 block text-sm font-medium">
							単位<span class="text-red-500">*</span>
						</label>
						<input
							id="unit"
							type="text"
							bind:value={unit}
							placeholder="例: g, ml, 個"
							required
							class="border-input bg-background w-full rounded-md border px-3 py-2"
						/>
					</div>

					<div>
						<label for="stockQuantity" class="mb-1 block text-sm font-medium">
							在庫数<span class="text-red-500">*</span>
						</label>
						<input
							id="stockQuantity"
							type="number"
							bind:value={stockQuantity}
							min="0"
							step="0.01"
							required
							class="border-input bg-background w-full rounded-md border px-3 py-2"
						/>
					</div>

					<div>
						<label for="minStockLevel" class="mb-1 block text-sm font-medium">
							発注レベル<span class="text-red-500">*</span>
						</label>
						<input
							id="minStockLevel"
							type="number"
							bind:value={minStockLevel}
							min="0"
							step="0.01"
							required
							class="border-input bg-background w-full rounded-md border px-3 py-2"
						/>
					</div>

					<div>
						<label for="unitPrice" class="mb-1 block text-sm font-medium">単価</label>
						<input
							id="unitPrice"
							type="number"
							bind:value={unitPrice}
							min="0"
							step="0.01"
							class="border-input bg-background w-full rounded-md border px-3 py-2"
						/>
					</div>

					<div>
						<label for="supplier" class="mb-1 block text-sm font-medium">仕入先</label>
						<input
							id="supplier"
							type="text"
							bind:value={supplier}
							class="border-input bg-background w-full rounded-md border px-3 py-2"
						/>
					</div>
				</div>

				<div>
					<label for="description" class="mb-1 block text-sm font-medium">説明</label>
					<textarea
						id="description"
						bind:value={description}
						rows="3"
						class="border-input bg-background w-full rounded-md border px-3 py-2"
					></textarea>
				</div>

				<div class="flex justify-end gap-2 pt-4">
					<Button type="button" variant="outline" onclick={onClose}>キャンセル</Button>
					<Button type="submit">保存</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
