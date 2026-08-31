<script lang="ts">
	import type { DailySales, WeatherType } from '$lib/types';
	import { getWeekday, WEEKDAY_LABELS, netSales } from '$lib/utils/salesAnalytics';
	import { formatCurrency } from '$lib/utils/formatters';

	let {
		days,
		lowerThreshold = $bindable(),
		upperThreshold = $bindable()
	}: {
		days: DailySales[];
		lowerThreshold: number;
		upperThreshold: number;
	} = $props();

	// --- SVG レイアウト定数 ---
	const W = 1000;
	const H = 400;
	const M = { top: 20, right: 20, bottom: 40, left: 70 };

	// 曜日カラーパレット（SVG fill 用 hex 直値）
	const WEEKDAY_COLORS = [
		'#ef4444', // 日 red
		'#f59e0b', // 月 amber
		'#eab308', // 火 yellow
		'#22c55e', // 水 green
		'#06b6d4', // 木 cyan
		'#3b82f6', // 金 blue
		'#a855f7' // 土 purple
	];

	// 天候 → 絵文字
	function weatherEmoji(weather: WeatherType | undefined): string {
		switch (weather) {
			case 'sunny':
				return '☀️';
			case 'cloudy':
				return '☁️';
			case 'rainy':
				return '🌧️';
			case 'snowy':
				return '❄️';
			default:
				return '';
		}
	}

	let svgEl = $state<SVGSVGElement | null>(null);
	let draggingLine = $state<'lower' | 'upper' | null>(null);

	const n = $derived(days.length);

	// 閾値を有限値に正規化（NaN/未定義が渡っても描画が壊れないように防御）
	const safeLower = $derived(Number.isFinite(lowerThreshold) ? lowerThreshold : 0);
	const safeUpper = $derived(Number.isFinite(upperThreshold) ? upperThreshold : 0);

	// Y軸の最大値（割引反映後の実質売上ベース）
	const yMax = $derived(
		Math.max(...days.map((d) => netSales(d)), safeUpper, 1) * 1.1
	);

	// Xスケール: 点 i の x座標
	function xScale(i: number): number {
		if (n <= 1) {
			return M.left + (W - M.left - M.right) / 2;
		}
		return M.left + (i / (n - 1)) * (W - M.left - M.right);
	}

	// Yスケール: 値 → SVG Y座標
	function yToSvg(v: number): number {
		return H - M.bottom - (v / yMax) * (H - M.top - M.bottom);
	}

	// 逆変換: SVG Y座標 → 値
	function svgToY(svgY: number): number {
		return ((H - M.bottom - svgY) / (H - M.top - M.bottom)) * yMax;
	}

	// Y軸グリッド線の値（5本）
	const gridValues = $derived([0, yMax / 4, yMax / 2, (3 * yMax) / 4, yMax]);

	// 閾値線のSVG Y座標（{@const}はSVG直下に置けないため$derivedで算出）
	const lowerY = $derived(yToSvg(safeLower));
	const upperY = $derived(yToSvg(safeUpper));

	// clientY → viewBox内 Y座標
	function clientYToViewBoxY(clientY: number, el: SVGSVGElement): number {
		const rect = el.getBoundingClientRect();
		return ((clientY - rect.top) / rect.height) * H;
	}

	function startDrag(which: 'lower' | 'upper', event: PointerEvent) {
		draggingLine = which;
		(event.target as Element).setPointerCapture?.(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!draggingLine || !svgEl) return;
		const vbY = clientYToViewBoxY(event.clientY, svgEl);
		const value = Math.max(0, Math.round(svgToY(vbY)));
		if (draggingLine === 'lower') {
			lowerThreshold = value;
		} else {
			upperThreshold = value;
		}
	}

	function endDrag() {
		draggingLine = null;
	}

	function isOutlier(sales: number): boolean {
		return sales < safeLower || sales > safeUpper;
	}
</script>

{#if days.length === 0}
	<div class="flex h-40 items-center justify-center text-muted-foreground">
		データがありません
	</div>
{:else}
	<svg
		bind:this={svgEl}
		viewBox="0 0 {W} {H}"
		class="w-full h-auto"
		role="application"
		aria-label="日別売上の散布図。青と赤の線をドラッグして閾値を調整できます。"
		onpointermove={handlePointerMove}
		onpointerup={endDrag}
		onpointerleave={endDrag}
	>
		<!-- Y軸グリッド線＋ラベル -->
		{#each gridValues as gv}
			{@const gy = yToSvg(gv)}
			<line
				x1={M.left}
				y1={gy}
				x2={W - M.right}
				y2={gy}
				stroke="currentColor"
				stroke-width="1"
				class="text-border"
				opacity="0.4"
			/>
			<text
				x={M.left - 8}
				y={gy + 4}
				text-anchor="end"
				class="fill-muted-foreground text-xs"
			>
				{formatCurrency(gv)}
			</text>
		{/each}

		<!-- 閾値線（下限=青系） -->
		<line
			x1={M.left}
			y1={lowerY}
			x2={W - M.right}
			y2={lowerY}
			stroke="#2563eb"
			stroke-width="2"
			stroke-dasharray="6 4"
		/>
		<rect
			x={M.left}
			y={lowerY - 8}
			width={W - M.left - M.right}
			height="16"
			fill="transparent"
			class="cursor-ns-resize"
			role="slider"
			tabindex="0"
			aria-label="下限しきい値"
			aria-valuenow={lowerThreshold}
			onpointerdown={(e) => startDrag('lower', e)}
		/>
		<text x={M.left + 6} y={lowerY - 6} fill="#2563eb" font-size="12" font-weight="bold">
			下限 {formatCurrency(safeLower)}
		</text>

		<!-- 閾値線（上限=赤系） -->
		<line
			x1={M.left}
			y1={upperY}
			x2={W - M.right}
			y2={upperY}
			stroke="#dc2626"
			stroke-width="2"
			stroke-dasharray="6 4"
		/>
		<rect
			x={M.left}
			y={upperY - 8}
			width={W - M.left - M.right}
			height="16"
			fill="transparent"
			class="cursor-ns-resize"
			role="slider"
			tabindex="0"
			aria-label="上限しきい値"
			aria-valuenow={upperThreshold}
			onpointerdown={(e) => startDrag('upper', e)}
		/>
		<text x={M.left + 6} y={upperY - 6} fill="#dc2626" font-size="12" font-weight="bold">
			上限 {formatCurrency(safeUpper)}
		</text>

		<!-- 曜日色分けの点 -->
		{#each days as day, i}
			{@const cx = xScale(i)}
			{@const daySales = netSales(day)}
			{@const cy = yToSvg(daySales)}
			{@const wd = getWeekday(day.date)}
			{@const outlier = isOutlier(daySales)}
			{@const emoji = weatherEmoji(day.weather)}
			{#if emoji}
				<text x={cx} y={cy - 12} text-anchor="middle" font-size="10">{emoji}</text>
			{/if}
			<circle
				{cx}
				{cy}
				r={outlier ? 7 : 5}
				fill={WEEKDAY_COLORS[wd]}
				stroke={outlier ? '#111827' : 'white'}
				stroke-width={outlier ? 2.5 : 1}
			>
				<title
					>{day.date}（{WEEKDAY_LABELS[wd]}） {formatCurrency(daySales)}{emoji
						? ` ${emoji}`
						: ''}</title
				>
			</circle>
		{/each}
	</svg>

	<!-- 曜日色の凡例 -->
	<div class="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
		{#each WEEKDAY_LABELS as label, wd}
			<span class="inline-flex items-center gap-1">
				<span
					class="inline-block h-3 w-3 rounded-full"
					style="background-color: {WEEKDAY_COLORS[wd]}"
				></span>
				{label}
			</span>
		{/each}
	</div>
{/if}
