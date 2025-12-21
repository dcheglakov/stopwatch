import { PersistedState } from 'runed';
import { onMount, onDestroy, untrack } from 'svelte';
import { formatTime, parseTime, LAP_DISTANCE_METERS, TOTAL_DISTANCE_METERS, INITIAL_TIME_DISPLAY } from '$lib';
import type { Lap } from '$lib/types';

export function useStopwatch() {
	const laps = new PersistedState<Lap[]>('stopwatch-laps', []);
	const elapsedTime = new PersistedState<number>('stopwatch-elapsed-time', 0);

	let isRunning = $state(false);
	let timeDisplay = $state(INITIAL_TIME_DISPLAY);
	let showConfetti = $state(false);

	let startTime: number = 0;
	let interval: number | undefined;

	const totalAverageSpeed = $derived(
		laps.current.length > 0
			? (laps.current.reduce((acc, lap) => acc + Number(lap.averageSpeed), 0) / laps.current.length).toFixed(2)
			: '0.00'
	);

	const isFinished = $derived(
		laps.current.length === TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS
	);

	function updateTime() {
		elapsedTime.current = Date.now() - startTime;
		timeDisplay = formatTime(elapsedTime.current, true);
	}

	function startTimer() {
		if (!isRunning) {
			startTime = Date.now() - elapsedTime.current;
			interval = setInterval(updateTime, 10);
		}
		isRunning = true;
	}

	function stopTimer() {
		if (isRunning) {
			clearInterval(interval);
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
			const lapTimeMs = elapsedTime.current - (laps.current.length ? laps.current[0].elapsedTime : 0);
			const lapTime = formatTime(lapTimeMs);
			const totalTime = formatTime(elapsedTime.current, true);

			const lapTimeHours = lapTimeMs / (1000 * 60 * 60);
			const averageSpeed = (LAP_DISTANCE_METERS / 1000 / lapTimeHours).toFixed(2);

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

			if (laps.current.length === TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS) {
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
		showConfetti = false;
	}

	onMount(() => {
		if (elapsedTime.current > 0) {
			timeDisplay = formatTime(elapsedTime.current, true);
		}
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});

	return {
		// State
		get laps() { return laps.current; },
		get elapsedTime() { return elapsedTime.current; },
		get isRunning() { return isRunning; },
		get timeDisplay() { return timeDisplay; },
		get showConfetti() { return showConfetti; },
		set showConfetti(value: boolean) { showConfetti = value; },

		// Derived
		get totalAverageSpeed() { return totalAverageSpeed; },
		get isFinished() { return isFinished; },

		// Actions
		startTimer,
		stopTimer,
		addLap,
		resetTimer
	};
}
