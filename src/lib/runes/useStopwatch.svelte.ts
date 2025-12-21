import { PersistedState } from 'runed';
import { onMount, onDestroy } from 'svelte';
import { formatTime, parseTime, INITIAL_TIME_DISPLAY } from '$lib';
import type { Lap } from '$lib/types';
import type { StopwatchSettings } from '$lib/types/settings';
import { DEFAULT_SETTINGS } from '$lib/types/settings';

export function useStopwatch() {
	const laps = new PersistedState<Lap[]>('stopwatch-laps', []);
	const elapsedTime = new PersistedState<number>('stopwatch-elapsed-time', 0);
	const settings = new PersistedState<StopwatchSettings>('stopwatch-settings', DEFAULT_SETTINGS);
	const isRunningState = new PersistedState<boolean>('stopwatch-is-running', false);

	let isRunning = $state(isRunningState.current);
	let timeDisplay = $state(INITIAL_TIME_DISPLAY);
	let showConfetti = $state(false);

	let startTime: number = 0;
	let interval: number | undefined;

	// Середня швидкість на основі загального часу та дистанції
	const totalAverageSpeed = $derived(() => {
		if (elapsedTime.current === 0 || laps.current.length === 0) {
			return '0.00';
		}
		const totalDistanceKm = currentDistance / 1000;
		const totalTimeHours = elapsedTime.current / (1000 * 60 * 60);
		return (totalDistanceKm / totalTimeHours).toFixed(2);
	});

	// Обчислення залежно від режиму
	const targetLapsCount = $derived(() => {
		const s = settings.current;
		switch (s.mode) {
			case 'distance':
				return Math.ceil(s.targetDistance / s.lapDistance);
			case 'laps':
				return s.targetLaps;
			case 'time':
				// Для режиму часу немає фіксованої кількості кіл
				return Number.POSITIVE_INFINITY;
		}
	});

	const currentDistance = $derived(laps.current.length * settings.current.lapDistance);

	const totalDistance = $derived(() => {
		const s = settings.current;
		return s.mode === 'distance' ? s.targetDistance : targetLapsCount() * s.lapDistance;
	});

	const isFinished = $derived(() => {
		const s = settings.current;
		switch (s.mode) {
			case 'distance':
				return currentDistance >= s.targetDistance;
			case 'laps':
				return laps.current.length >= s.targetLaps;
			case 'time':
				return elapsedTime.current >= s.targetTime;
		}
	});

	const progressPercentage = $derived(() => {
		const s = settings.current;
		switch (s.mode) {
			case 'distance':
				return Math.min((currentDistance / s.targetDistance) * 100, 100);
			case 'laps':
				return Math.min((laps.current.length / s.targetLaps) * 100, 100);
			case 'time':
				return Math.min((elapsedTime.current / s.targetTime) * 100, 100);
		}
	});

	function updateTime() {
		elapsedTime.current = Date.now() - startTime;
		timeDisplay = formatTime(elapsedTime.current, true);

		// Перевірка завершення для режиму часу
		if (settings.current.mode === 'time' && isFinished()) {
			stopTimer();
			showConfetti = true;
		}
	}

	function startTimer() {
		if (!isRunning) {
			startTime = Date.now() - elapsedTime.current;
			interval = setInterval(updateTime, 10);
			isRunningState.current = true;
		}
		isRunning = true;
	}

	function stopTimer() {
		if (isRunning) {
			clearInterval(interval);
			isRunningState.current = false;
		}
		isRunning = false;
	}

	function markFastestSlowestLaps() {
		if (laps.current.length < 2) return;

		const fastestLapTime = Math.min(...laps.current.map((lap) => parseTime(lap.lapTime)));
		const slowestLapTime = Math.max(...laps.current.map((lap) => parseTime(lap.lapTime)));

		laps.current = laps.current.map((lap) => ({
			...lap,
			isFastest: parseTime(lap.lapTime) === fastestLapTime,
			isSlowest: parseTime(lap.lapTime) === slowestLapTime
		}));
	}

	function addLap() {
		if (isRunning) {
			const lapTimeMs =
				elapsedTime.current - (laps.current.length ? laps.current[0].elapsedTime : 0);
			const lapTime = formatTime(lapTimeMs);
			const totalTime = formatTime(elapsedTime.current, true);

			const lapTimeHours = lapTimeMs / (1000 * 60 * 60);
			const averageSpeed = (settings.current.lapDistance / 1000 / lapTimeHours).toFixed(2);

			const lap: Lap = {
				lapTime,
				totalTime,
				elapsedTime: elapsedTime.current,
				isFastest: false,
				isSlowest: false,
				averageSpeed
			};
			laps.current = [lap, ...laps.current];

			markFastestSlowestLaps();

			// Перевірка завершення для режимів дистанції та кіл
			if (settings.current.mode !== 'time' && isFinished()) {
				stopTimer();
				showConfetti = true;
			}
		}
	}

	function resetTimer() {
		clearInterval(interval);
		elapsedTime.current = 0;
		timeDisplay = INITIAL_TIME_DISPLAY;
		laps.current = [];
		isRunning = false;
		isRunningState.current = false;
		showConfetti = false;
	}

	function updateSettings(newSettings: StopwatchSettings) {
		settings.current = newSettings;
	}

	onMount(() => {
		if (elapsedTime.current > 0) {
			timeDisplay = formatTime(elapsedTime.current, true);
		}

		// Відновлюємо стан роботи таймера після оновлення сторінки
		if (isRunningState.current && !isFinished()) {
			startTime = Date.now() - elapsedTime.current;
			interval = setInterval(updateTime, 10);
			isRunning = true;
		} else {
			isRunning = false;
			isRunningState.current = false;
		}
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});

	return {
		// State
		get laps() {
			return laps.current;
		},
		get elapsedTime() {
			return elapsedTime.current;
		},
		get isRunning() {
			return isRunning;
		},
		get timeDisplay() {
			return timeDisplay;
		},
		get showConfetti() {
			return showConfetti;
		},
		set showConfetti(value: boolean) {
			showConfetti = value;
		},
		get settings() {
			return settings.current;
		},

		// Derived
		get totalAverageSpeed() {
			return totalAverageSpeed();
		},
		get isFinished() {
			return isFinished();
		},
		get currentDistance() {
			return currentDistance;
		},
		get totalDistance() {
			return totalDistance();
		},
		get targetLapsCount() {
			return targetLapsCount();
		},
		get progressPercentage() {
			return progressPercentage();
		},

		// Actions
		startTimer,
		stopTimer,
		addLap,
		resetTimer,
		updateSettings
	};
}
