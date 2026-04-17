import type { WeatherType } from '$lib/types';

export interface WeatherData {
  date: string;
  weather: WeatherType;
  description: string;
  temp_c?: number;
}

/**
 * 指定した日付の天候データを取得
 */
export async function fetchWeatherForDate(
  date: string,
  location: string = 'Tokyo,Japan'
): Promise<WeatherData | null> {
  try {
    const response = await fetch(`/api/weather?date=${date}&location=${encodeURIComponent(location)}`);

    if (!response.ok) {
      console.error('Weather fetch failed:', response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
}
