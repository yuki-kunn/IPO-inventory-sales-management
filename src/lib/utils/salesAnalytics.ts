import type { DailySales, WeatherType } from '$lib/types';

/**
 * 割引/割増を反映した後の実質売上額。
 * discountTotal は会計明細CSVから集計した「割引/割増合計(税込)」で、
 * 割引はマイナス値・割増はプラス値として保存されているため単純加算でよい。
 * discountTotal が無い日（割引データ未取得の期間）は totalSales をそのまま返す。
 */
export function netSales(day: DailySales): number {
	return day.totalSales + (day.discountTotal ?? 0);
}

/** Date -> YYYY-MM-DD (local, zero-padded) */
function formatLocalDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

/** YYYY-MM-DD をローカルタイムのDateに変換（UTC解釈による曜日ズレを防ぐ） */
export function parseLocalDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split('-').map(Number);
	return new Date(y, m - 1, d);
}

/** 曜日番号 0=日..6=土 */
export function getWeekday(dateStr: string): number {
	return parseLocalDate(dateStr).getDay();
}

/** 曜日ラベル（日本語短縮） */
export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

/** 中央値（空配列は0） */
export function median(nums: number[]): number {
	if (nums.length === 0) return 0;
	const sorted = [...nums].sort((a, b) => a - b);
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export interface WeekdayStat {
	weekday: number; // 0..6
	label: string; // 日..土
	count: number; // 日数
	total: number; // 合計売上
	avg: number; // 平均売上
	median: number; // 中央値
	max: number; // 最高売上
	min: number; // 最低売上
}

/** 期間内データを曜日別に集計（日→土の7要素を必ず返す） */
export function calculateWeekdayStats(days: DailySales[]): WeekdayStat[] {
	// 0〜6の7バケツに割引後の実質売上を集約
	const buckets: number[][] = [[], [], [], [], [], [], []];
	for (const day of days) {
		const wd = getWeekday(day.date);
		buckets[wd].push(netSales(day));
	}

	return buckets.map((values, weekday) => {
		const count = values.length;
		if (count === 0) {
			return {
				weekday,
				label: WEEKDAY_LABELS[weekday],
				count: 0,
				total: 0,
				avg: 0,
				median: 0,
				max: 0,
				min: 0
			};
		}
		const total = values.reduce((sum, v) => sum + v, 0);
		return {
			weekday,
			label: WEEKDAY_LABELS[weekday],
			count,
			total,
			avg: total / count,
			median: median(values),
			max: Math.max(...values),
			min: Math.min(...values)
		};
	});
}

/** YYYY-MM-DD の日付を月単位でシフトし、対象月の末日を超える日はクランプする */
export function shiftDateByMonths(dateStr: string, monthsDelta: number): string {
	const [y, m, d] = dateStr.split('-').map(Number);
	const totalMonths = y * 12 + (m - 1) + monthsDelta;
	const targetYear = Math.floor(totalMonths / 12);
	const targetMonth = ((totalMonths % 12) + 12) % 12;
	const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
	const clampedDay = Math.min(d, lastDayOfTargetMonth);
	const resultDate = new Date(targetYear, targetMonth, clampedDay);
	return formatLocalDate(resultDate);
}

/** 現在期間と同じ日数を保ったまま、開始日を1ヶ月/1年前にスライドした比較期間を返す */
export function getComparisonRange(
	startDate: string,
	endDate: string,
	mode: 'prevMonth' | 'prevYear'
): { start: string; end: string } {
	const start = parseLocalDate(startDate);
	const end = parseLocalDate(endDate);
	const durationDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
	const monthsDelta = mode === 'prevMonth' ? -1 : -12;
	const shiftedStart = shiftDateByMonths(startDate, monthsDelta);
	const shiftedStartDate = parseLocalDate(shiftedStart);
	const shiftedEndDate = new Date(
		shiftedStartDate.getFullYear(),
		shiftedStartDate.getMonth(),
		shiftedStartDate.getDate() + (durationDays - 1)
	);
	return { start: shiftedStart, end: formatLocalDate(shiftedEndDate) };
}

export interface PeriodSummary {
	totalSales: number;
	totalProfit: number;
	totalQuantity: number;
	dayCount: number;
	avgDailySales: number;
	productCount: number;
}

export function summarizePeriod(days: DailySales[]): PeriodSummary {
	const totalSales = days.reduce((s, d) => s + netSales(d), 0);
	const totalProfit = days.reduce((s, d) => s + d.totalProfit, 0);
	const totalQuantity = days.reduce((s, d) => s + d.totalQuantity, 0);
	const productSet = new Set<string>();
	days.forEach((d) => d.sales.forEach((s) => productSet.add(s.productName)));
	return {
		totalSales,
		totalProfit,
		totalQuantity,
		dayCount: days.length,
		avgDailySales: days.length > 0 ? totalSales / days.length : 0,
		productCount: productSet.size
	};
}

export interface WeatherStat {
	weather: WeatherType;
	totalSales: number;
	totalProfit: number;
	dayCount: number;
	avgDailySales: number;
}

export function calculateWeatherStats(days: DailySales[]): WeatherStat[] {
	const weatherMap = new Map<WeatherType, { totalSales: number; totalProfit: number; dayCount: number }>();
	days.forEach((daily) => {
		const weather = daily.weather || '';
		if (!weather) return;
		const existing = weatherMap.get(weather as WeatherType) || { totalSales: 0, totalProfit: 0, dayCount: 0 };
		weatherMap.set(weather as WeatherType, {
			totalSales: existing.totalSales + netSales(daily),
			totalProfit: existing.totalProfit + daily.totalProfit,
			dayCount: existing.dayCount + 1
		});
	});
	return Array.from(weatherMap.entries())
		.map(([weather, data]) => ({
			weather,
			totalSales: data.totalSales,
			totalProfit: data.totalProfit,
			dayCount: data.dayCount,
			avgDailySales: data.dayCount > 0 ? data.totalSales / data.dayCount : 0
		}))
		.sort((a, b) => b.totalSales - a.totalSales);
}

export interface ProductComparisonRow {
	productName: string;
	currentSales: number;
	currentQuantity: number;
	comparisonSales: number;
	comparisonQuantity: number;
	diffSales: number;
	diffPercent: number | null;
}

export function buildProductComparison(
	currentDays: DailySales[],
	comparisonDays: DailySales[]
): ProductComparisonRow[] {
	const currentMap = new Map<string, { sales: number; quantity: number }>();
	currentDays.forEach((d) =>
		d.sales.forEach((s) => {
			const e = currentMap.get(s.productName) || { sales: 0, quantity: 0 };
			currentMap.set(s.productName, { sales: e.sales + s.totalSales, quantity: e.quantity + s.soldQuantity });
		})
	);
	const comparisonMap = new Map<string, { sales: number; quantity: number }>();
	comparisonDays.forEach((d) =>
		d.sales.forEach((s) => {
			const e = comparisonMap.get(s.productName) || { sales: 0, quantity: 0 };
			comparisonMap.set(s.productName, { sales: e.sales + s.totalSales, quantity: e.quantity + s.soldQuantity });
		})
	);
	const allNames = new Set<string>([...currentMap.keys(), ...comparisonMap.keys()]);
	return Array.from(allNames).map((productName) => {
		const cur = currentMap.get(productName) || { sales: 0, quantity: 0 };
		const cmp = comparisonMap.get(productName) || { sales: 0, quantity: 0 };
		const diffSales = cur.sales - cmp.sales;
		const diffPercent = cmp.sales === 0 ? null : (diffSales / cmp.sales) * 100;
		return {
			productName,
			currentSales: cur.sales,
			currentQuantity: cur.quantity,
			comparisonSales: cmp.sales,
			comparisonQuantity: cmp.quantity,
			diffSales,
			diffPercent
		};
	});
}
