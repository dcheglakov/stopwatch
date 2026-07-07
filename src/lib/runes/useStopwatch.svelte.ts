import { PersistedState } from 'runed';
import { onMount, onDestroy } from 'svelte';
import { formatTime, INITIAL_TIME_DISPLAY } from '$lib';
import type { Lap } from '$lib/types';
import type { StopwatchSettings } from '$lib/types/settings';
import { DEFAULT_SETTINGS } from '$lib/types/settings';

export function useStopwatch() {
	const laps = new PersistedState<Lap[]>('stopwatch-laps', []);
	const settings = new PersistedState<StopwatchSettings>('stopwatch-settings', DEFAULT_SETTINGS);
	const isRunningState = new PersistedState<boolean>('stopwatch-is-running', false);
	const startTimeState = new PersistedState<number>('stopwatch-start-time', 0);
	const accumulatedTimeState = new PersistedState<number>('stopwatch-accumulated-time', 0);

	let currentElapsedTime = $state(0);
	let isRunning = $state(isRunningState.current);
	let timeDisplay = $state(INITIAL_TIME_DISPLAY);
	let interval: number | undefined;

	const currentDistance = $derived(laps.current.length * settings.current.lapDistance);

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

	function updateTime() {
		const now = Date.now();
		currentElapsedTime = now - startTimeState.current + accumulatedTimeState.current;
		timeDisplay = formatTime(currentElapsedTime, true);

		if (settings.current.mode === 'time' && isFinished()) stopTimer();
	}

	function startTimer() {
		if (isRunning) return;

		startTimeState.current = Date.now();
		interval = setInterval(updateTime, 10);
		isRunningState.current = true;
		isRunning = true;
	}

	function stopTimer() {
		if (!isRunning) return;

		clearInterval(interval);
		accumulatedTimeState.current += Date.now() - startTimeState.current;
		isRunningState.current = false;
		isRunning = false;
	}

	function resetTimer() {
		clearInterval(interval);

		accumulatedTimeState.current = 0;
		startTimeState.current = 0;
		isRunningState.current = false;
		currentElapsedTime = 0;
		timeDisplay = INITIAL_TIME_DISPLAY;
		laps.current = [];
		isRunning = false;
	}

	function addLap() {
		if (!isRunning) return;

		const lapTimeMs = currentElapsedTime - (laps.current.length ? laps.current[0].elapsedTime : 0);
		const lap: Lap = {
			lapTime: formatTime(lapTimeMs),
			totalTime: formatTime(currentElapsedTime, true),
			elapsedTime: currentElapsedTime
		};
		laps.current = [lap, ...laps.current];

		if (settings.current.mode !== 'time' && isFinished()) stopTimer();
	}

	function updateSettings(newSettings: StopwatchSettings) {
		settings.current = newSettings;
	}

	onMount(() => {
		if (isRunningState.current) {
			const now = Date.now();
			currentElapsedTime = now - startTimeState.current + accumulatedTimeState.current;
			timeDisplay = formatTime(currentElapsedTime, true);

			if (settings.current.mode === 'time' && currentElapsedTime >= settings.current.targetTime) {
				stopTimer();
				isRunning = false;
			} else {
				interval = setInterval(updateTime, 10);
				isRunning = true;
			}
		} else {
			currentElapsedTime = accumulatedTimeState.current;
			if (currentElapsedTime > 0) timeDisplay = formatTime(currentElapsedTime, true);
			isRunning = false;
		}
	});

	onDestroy(() => {
		if (interval) clearInterval(interval);
	});

	return {
		get laps() {
			return laps.current;
		},
		get elapsedTime() {
			return currentElapsedTime;
		},
		get isRunning() {
			return isRunning;
		},
		get timeDisplay() {
			return timeDisplay;
		},
		get settings() {
			return settings.current;
		},
		get isFinished() {
			return isFinished();
		},
		get progressPercentage() {
			return progressPercentage();
		},
		startTimer,
		stopTimer,
		addLap,
		resetTimer,
		updateSettings
	};
}
