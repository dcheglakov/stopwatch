export type TrackMode = 'time' | 'laps' | 'distance';

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
	mode: 'distance',
	targetTime: 3600000, // 1 година
	targetLaps: 100,
	targetDistance: 250000, // 250 км
	lapDistance: 250 // 250 метрів
};
