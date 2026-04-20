<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { BarChart3 } from 'lucide-svelte';

	interface Props {
		startDate: string;
		endDate: string;
		onDateChange: (start: string, end: string) => void;
		onCalculate: () => void;
	}

	let { startDate, endDate, onDateChange, onCalculate }: Props = $props();
</script>

<div class="grid gap-4 md:grid-cols-3">
	<div>
		<label for="startDate" class="mb-2 block text-sm font-medium">開始日</label>
		<input
			id="startDate"
			type="date"
			value={startDate}
			oninput={(e) => onDateChange(e.currentTarget.value, endDate)}
			class="border-input bg-background w-full rounded-md border px-3 py-2"
		/>
	</div>
	<div>
		<label for="endDate" class="mb-2 block text-sm font-medium">終了日</label>
		<input
			id="endDate"
			type="date"
			value={endDate}
			oninput={(e) => onDateChange(startDate, e.currentTarget.value)}
			class="border-input bg-background w-full rounded-md border px-3 py-2"
		/>
	</div>
	<div class="flex items-end">
		<Button onclick={onCalculate} class="w-full">
			<BarChart3 class="mr-2 h-4 w-4" />
			集計実行
		</Button>
	</div>
</div>
