export type TrackMode = 'free' | 'time' | 'laps' | 'distance';

export interface StopwatchSettings {
	mode: TrackMode;
	// Для режиму 'time' - час у мілісекундах
	targetTime: number;
	// Для режиму 'laps' - кількість кіл
	targetLaps: number;
	// Для режиму 'distance' - дистанція в метрах
	targetDistance: number;
	// Довжина одного кола в метрах
	lapDistance: number;
}

export const DEFAULT_SETTINGS: StopwatchSettings = {
	mode: 'free',
	targetTime: 43200000, // 12 годин
	targetLaps: 100,
	targetDistance: 100000, // 100 км
	lapDistance: 250 // 250 метрів
};
