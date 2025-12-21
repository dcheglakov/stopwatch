import { PersistedState } from 'runed';
import { onMount, onDestroy } from 'svelte';
import { formatTime, parseTime, INITIAL_TIME_DISPLAY } from '$lib';
import type { Lap } from '$lib/types';
import type { StopwatchSettings } from '$lib/types/settings';
import { DEFAULT_SETTINGS } from '$lib/types/settings';

export function useStopwatch() {
	// 1. Зберігаємо історію кіл (це ок, пишеться рідко)
	const laps = new PersistedState<Lap[]>('stopwatch-laps', []);

	// 2. Зберігаємо налаштування (це ок)
	const settings = new PersistedState<StopwatchSettings>('stopwatch-settings', DEFAULT_SETTINGS);

	// 3. Зберігаємо стан "запущено чи ні"
	const isRunningState = new PersistedState<boolean>('stopwatch-is-running', false);

	// 4. НОВЕ: Зберігаємо час "старту" (timestamp).
	// Це "якір". Якщо таймер йде, ми рахуємо різницю від цього числа.
	// Це замінює постійний запис elapsed time.
	const startTimeState = new PersistedState<number>('stopwatch-start-time', 0);

	// 5. НОВЕ: Зберігаємо "накопичений" час при паузі.
	// Коли ми натискаємо Стоп, ми записуємо сюди, скільки набігло.
	const accumulatedTimeState = new PersistedState<number>('stopwatch-accumulated-time', 0);

	// 6. ЛОКАЛЬНИЙ стан для відображення. Це НЕ пишеться в localStorage.
	// Це просто реактивна змінна для UI.
	let currentElapsedTime = $state(0);

	let isRunning = $state(isRunningState.current);
	let timeDisplay = $state(INITIAL_TIME_DISPLAY);
	let showConfetti = $state(false);

	let interval: number | undefined;

	// --- Derived Values (обчислення) ---

	// Важливо: для розрахунків використовуємо currentElapsedTime (локальний швидкий стейт)
	const totalAverageSpeed = $derived(() => {
		if (currentElapsedTime === 0 || laps.current.length === 0) return '0.00';
		const totalDistanceKm = currentDistance / 1000;
		const totalTimeHours = currentElapsedTime / (1000 * 60 * 60);
		return (totalDistanceKm / totalTimeHours).toFixed(2);
	});

	const lastLapSpeed = $derived(() => {
		if (laps.current.length === 0) return '0.00';
		return laps.current[0].averageSpeed;
	});

	const targetLapsCount = $derived(() => {
		const s = settings.current;
		switch (s.mode) {
			case 'distance':
				return Math.ceil(s.targetDistance / s.lapDistance);
			case 'laps':
				return s.targetLaps;
			case 'time':
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
				return currentElapsedTime >= s.targetTime;
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
				return Math.min((currentElapsedTime / s.targetTime) * 100, 100);
		}
	});

	// --- Логіка Таймера ---

	function updateTime() {
		const now = Date.now();
		// Оновлюємо лише локальну змінну! Ніякого запису на диск.
		// Формула: Час = (Зараз - Час старту) + (Час накопичений до цього запуску)
		currentElapsedTime = now - startTimeState.current + accumulatedTimeState.current;

		timeDisplay = formatTime(currentElapsedTime, true);

		if (settings.current.mode === 'time' && isFinished()) {
			stopTimer();
			showConfetti = true;
		}
	}

	function startTimer() {
		if (!isRunning) {
			// Встановлюємо "Якір" на поточний момент
			startTimeState.current = Date.now();

			// Запускаємо інтервал лише для оновлення UI
			interval = setInterval(updateTime, 10);

			isRunningState.current = true;
			isRunning = true;
		}
	}

	function stopTimer() {
		if (isRunning) {
			clearInterval(interval);

			// КОЛИ зупиняємо - фіксуємо накопичений час у Storage
			// Це відбувається 1 раз, а не 100 разів на секунду
			const now = Date.now();
			const sessionDuration = now - startTimeState.current;
			accumulatedTimeState.current += sessionDuration;

			isRunningState.current = false;
			isRunning = false;
		}
	}

	function resetTimer() {
		clearInterval(interval);

		// Скидаємо всі збережені стани
		accumulatedTimeState.current = 0;
		startTimeState.current = 0;
		isRunningState.current = false;

		// Скидаємо локальні стани
		currentElapsedTime = 0;
		timeDisplay = INITIAL_TIME_DISPLAY;
		laps.current = [];
		isRunning = false;
		showConfetti = false;
	}

	// --- Логіка кіл ---

	function addLap() {
		if (isRunning) {
			// Використовуємо currentElapsedTime (він актуальний)
			const lapTimeMs =
				currentElapsedTime - (laps.current.length ? laps.current[0].elapsedTime : 0);
			const lapTime = formatTime(lapTimeMs);
			const totalTime = formatTime(currentElapsedTime, true);

			const lapTimeHours = lapTimeMs / (1000 * 60 * 60);
			const averageSpeed = (settings.current.lapDistance / 1000 / lapTimeHours).toFixed(2);

			const lap: Lap = {
				lapTime,
				totalTime,
				elapsedTime: currentElapsedTime, // Зберігаємо поточний час у коло
				isFastest: false,
				isSlowest: false,
				averageSpeed
			};
			laps.current = [lap, ...laps.current];

			markFastestSlowestLaps();

			if (settings.current.mode !== 'time' && isFinished()) {
				stopTimer();
				showConfetti = true;
			}
		}
	}

	function markFastestSlowestLaps() {
		if (laps.current.length < 2) return;
		const times = laps.current.map((lap) => parseTime(lap.lapTime));
		const fastestLapTime = Math.min(...times);
		const slowestLapTime = Math.max(...times);

		laps.current = laps.current.map((lap) => ({
			...lap,
			isFastest: parseTime(lap.lapTime) === fastestLapTime,
			isSlowest: parseTime(lap.lapTime) === slowestLapTime
		}));
	}

	function updateSettings(newSettings: StopwatchSettings) {
		settings.current = newSettings;
	}

	// --- Ініціалізація ---

	onMount(() => {
		// Відновлюємо стан при завантаженні сторінки

		if (isRunningState.current) {
			// Якщо таймер був активний, коли сторінку закрили:
			// 1. Рахуємо, скільки часу пройшло "поки нас не було" + те, що було до того
			const now = Date.now();
			currentElapsedTime = now - startTimeState.current + accumulatedTimeState.current;

			// 2. Якщо ми вже перевищили ліміт часу (поки вкладка була закрита)
			if (settings.current.mode === 'time' && currentElapsedTime >= settings.current.targetTime) {
				timeDisplay = formatTime(currentElapsedTime, true);
				stopTimer(); // Ця функція коректно збереже accumulatedTime
				showConfetti = true;
				isRunning = false; // Примусово оновлюємо локальний стейт
			} else {
				// Якщо ні, продовжуємо тікати
				timeDisplay = formatTime(currentElapsedTime, true);
				interval = setInterval(updateTime, 10);
				isRunning = true;
			}
		} else {
			// Якщо таймер був на паузі
			currentElapsedTime = accumulatedTimeState.current;
			if (currentElapsedTime > 0) {
				timeDisplay = formatTime(currentElapsedTime, true);
			}
			isRunning = false;
		}
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	return {
		// Getters
		get laps() {
			return laps.current;
		},
		get elapsedTime() {
			return currentElapsedTime;
		}, // Повертаємо локальний стейт
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
		get lastLapSpeed() {
			return lastLapSpeed();
		},

		// Actions
		startTimer,
		stopTimer,
		addLap,
		resetTimer,
		updateSettings
	};
}
