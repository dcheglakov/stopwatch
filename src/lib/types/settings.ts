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
	targetTime: 3600000, // 1 година
	targetLaps: 120, // 30 км на треку 250 м
	targetDistance: 30000, // 30 км
	lapDistance: 250 // 250 метрів
};
