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
		onClose: () => void;
	}

	let { onClose }: Props = $props();

	let formData = $state({
		name: '',
		unit: '',
		stockQuantity: 0,
		minStockLevel: 0,
		supplier: '',
		unitPrice: 0,
		description: ''
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();

		console.log('[AddIngredientModal] フォームデータ:', formData);

		const newIngredient: any = {
			name: formData.name,
			unit: formData.unit,
			stockQuantity: Number(formData.stockQuantity),
			minStockLevel: Number(formData.minStockLevel),
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		};

		// オプションフィールドは値がある場合のみ追加
		if (formData.supplier && formData.supplier.trim() !== '') {
			newIngredient.supplier = formData.supplier;
		}
		if (formData.unitPrice !== null && formData.unitPrice !== undefined && formData.unitPrice > 0) {
			newIngredient.unitPrice = Number(formData.unitPrice);
		}
		if (formData.description && formData.description.trim() !== '') {
			newIngredient.description = formData.description;
		}

		console.log('[AddIngredientModal] 送信データ:', newIngredient);

		try {
			await ingredients.add(newIngredient);
			onClose();
		} catch (error) {
			console.error('[AddIngredientModal] 追加失敗:', error);
			alert('追加に失敗しました: ' + error);
		}
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
				<CardTitle>原材料を追加</CardTitle>
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
							bind:value={formData.name}
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
							bind:value={formData.unit}
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
							bind:value={formData.stockQuantity}
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
							bind:value={formData.minStockLevel}
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
							bind:value={formData.unitPrice}
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
							bind:value={formData.supplier}
							class="border-input bg-background w-full rounded-md border px-3 py-2"
						/>
					</div>
				</div>

				<div>
					<label for="description" class="mb-1 block text-sm font-medium">説明</label>
					<textarea
						id="description"
						bind:value={formData.description}
						rows="3"
						class="border-input bg-background w-full rounded-md border px-3 py-2"
					></textarea>
				</div>

				<div class="flex justify-end gap-2 pt-4">
					<Button type="button" variant="outline" onclick={onClose}>キャンセル</Button>
					<Button type="submit">追加</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
