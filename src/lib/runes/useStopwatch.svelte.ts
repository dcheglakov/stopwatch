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
	const isFinishedState = new PersistedState<boolean>('stopwatch-is-finished', false);
	const startTimeState = new PersistedState<number>('stopwatch-start-time', 0);
	const accumulatedTimeState = new PersistedState<number>('stopwatch-accumulated-time', 0);

	let currentElapsedTime = $state(0);
	let isRunning = $state(false);
	let timeDisplay = $state(INITIAL_TIME_DISPLAY);
	let interval: number | undefined;

	const currentDistance = $derived(laps.current.length * settings.current.lapDistance);

	const goalReached = $derived(() => {
		const s = settings.current;
		switch (s.mode) {
			case 'free':
				return false;
			case 'distance':
				return currentDistance >= s.targetDistance;
			case 'laps':
				return laps.current.length >= s.targetLaps;
			case 'time':
				return currentElapsedTime >= s.targetTime;
		}
	});

	const isFinished = $derived(() => isFinishedState.current || goalReached());

	const progressPercentage = $derived(() => {
		const s = settings.current;
		switch (s.mode) {
			case 'free':
				return 0;
			case 'distance':
				return Math.min((currentDistance / s.targetDistance) * 100, 100);
			case 'laps':
				return Math.min((laps.current.length / s.targetLaps) * 100, 100);
			case 'time':
				return Math.min((currentElapsedTime / s.targetTime) * 100, 100);
		}
	});

	function updateTime() {
		currentElapsedTime = Date.now() - startTimeState.current + accumulatedTimeState.current;
		timeDisplay = formatTime(currentElapsedTime, true);

		if (settings.current.mode === 'time' && goalReached()) finishTimer();
	}

	/** `at` (epoch ms, not in the future) backdates the start, e.g. to a remote crossing. */
	function startTimer(at?: number) {
		if (isRunning || isFinished()) return;

		const now = Date.now();
		startTimeState.current = at === undefined ? now : Math.min(at, now);
		interval = setInterval(updateTime, 10);
		isRunningState.current = true;
		isRunning = true;
		updateTime();
	}

	function stopTimer() {
		if (!isRunning && !isRunningState.current) return;

		clearInterval(interval);
		interval = undefined;
		if (startTimeState.current) {
			accumulatedTimeState.current += Date.now() - startTimeState.current;
			startTimeState.current = 0;
		}
		currentElapsedTime = accumulatedTimeState.current;
		timeDisplay = formatTime(currentElapsedTime, true);
		isRunningState.current = false;
		isRunning = false;
	}

	function finishTimer() {
		stopTimer();
		isFinishedState.current = true;
	}

	function resetTimer() {
		clearInterval(interval);
		interval = undefined;

		accumulatedTimeState.current = 0;
		startTimeState.current = 0;
		isRunningState.current = false;
		isFinishedState.current = false;
		currentElapsedTime = 0;
		timeDisplay = INITIAL_TIME_DISPLAY;
		laps.current = [];
		isRunning = false;
	}

	/** `at` (epoch ms) places the lap at that moment instead of now, e.g. a remote crossing. */
	function addLap(at?: number) {
		if (!isRunning) return;

		const previous = laps.current.length ? laps.current[0].elapsedTime : 0;
		let elapsed = currentElapsedTime;
		if (at !== undefined) {
			const now = Date.now();
			const nowElapsed = now - startTimeState.current + accumulatedTimeState.current;
			elapsed = Math.max(previous, Math.min(nowElapsed, nowElapsed - (now - at)));
		}
		const lapTimeMs = elapsed - previous;
		const lap: Lap = {
			lapTime: formatTime(lapTimeMs),
			totalTime: formatTime(elapsed, true),
			elapsedTime: elapsed
		};
		laps.current = [lap, ...laps.current];

		if (settings.current.mode !== 'free' && settings.current.mode !== 'time' && goalReached()) {
			finishTimer();
		}
	}

	function updateSettings(newSettings: StopwatchSettings) {
		if (isRunning || currentElapsedTime > 0) return;
		settings.current = newSettings;
	}

	onMount(() => {
		isRunning = isRunningState.current;
		currentElapsedTime = isRunningState.current
			? Date.now() - startTimeState.current + accumulatedTimeState.current
			: accumulatedTimeState.current;
		timeDisplay =
			currentElapsedTime > 0 ? formatTime(currentElapsedTime, true) : INITIAL_TIME_DISPLAY;

		if (!isRunningState.current) return;

		if (settings.current.mode === 'time' && currentElapsedTime >= settings.current.targetTime) {
			finishTimer();
			return;
		}

		interval = setInterval(updateTime, 10);
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
		finishTimer,
		addLap,
		resetTimer,
		updateSettings
	};
}
