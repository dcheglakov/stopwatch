<script lang="ts">
	import LucideClipboardList from '~icons/lucide/clipboard-list';
	import LucideSun from '~icons/lucide/sun';
	import LucideMoon from '~icons/lucide/moon';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StatsGrid from '$lib/components/StatsGrid.svelte';
	import StatTitle from '$lib/components/StatTitle.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import {
		formatTime,
		INITIAL_TIME_DISPLAY,
		LAP_DISTANCE_METERS,
		parseTime,
		TOTAL_DISTANCE_METERS
	} from '$lib';
	import type { Lap } from '$lib/types';
	import LapsTable from '$lib/components/LapsTable.svelte';
	import Confetti from '$lib/components/Confetti.svelte';

	let isRunning = $state(false);
	let timeDisplay = $state(INITIAL_TIME_DISPLAY);
	let laps = $state<Lap[]>([]);
	let elapsedTime = $state(0);
	let lapsOpen = $state(false);
	let showConfetti = $state(false);
	let isDark = $state(false);

	let startTime: number = 0;
	let interval: number | undefined;

	function startStopTimer() {
		if (isRunning) {
			clearInterval(interval);
		} else {
			startTime = Date.now() - elapsedTime;
			interval = setInterval(updateTime, 10);
		}
		isRunning = !isRunning;
	}

	function updateTime() {
		elapsedTime = Date.now() - startTime;
		timeDisplay = formatTime(elapsedTime, true);
	}

	function addLap() {
		if (isRunning) {
			const lapTimeMs = elapsedTime - (laps.length ? laps[0].elapsedTime : 0);
			const lapTime = formatTime(lapTimeMs);
			const totalTime = formatTime(elapsedTime, true);

			const lapTimeHours = lapTimeMs / (1000 * 60 * 60);
			const averageSpeed = (LAP_DISTANCE_METERS / 1000 / lapTimeHours).toFixed(2);

			const lap: Lap = {
				lapTime,
				totalTime,
				elapsedTime,
				isFastest: false,
				isSlowest: false,
				averageSpeed
			};
			laps = [lap, ...laps];

			markFastestSlowestLaps();
			if (laps.length === TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS) {
				startStopTimer();
				showConfetti = true;
			}
		}
	}

	function markFastestSlowestLaps() {
		if (laps.length < 2) return;

		let fastestLapTime = Math.min(...laps.map((lap) => parseTime(lap.lapTime)));
		let slowestLapTime = Math.max(...laps.map((lap) => parseTime(lap.lapTime)));

		laps = laps.map((lap) => ({
			...lap,
			isFastest: parseTime(lap.lapTime) === fastestLapTime,
			isSlowest: parseTime(lap.lapTime) === slowestLapTime
		}));
	}

	function resetTimer() {
		clearInterval(interval);
		elapsedTime = 0;
		timeDisplay = INITIAL_TIME_DISPLAY;
		laps = [];
		isRunning = false;
		showConfetti = false;
	}
</script>

<svelte:head>
	<title>{TOTAL_DISTANCE_METERS / 1000} км на треку</title>
	<meta name="description" content="Stopwatch" />
</svelte:head>

<div class="{isDark ? 'dark' : ''} contents">
	<header class="flex items-center justify-between gap-5 bg-gray-3 p-2 px-6 text-gray-11">
		<h1 class="font-bold uppercase tracking-wide">{TOTAL_DISTANCE_METERS / 1000} км на треку</h1>
		<nav class="flex items-center gap-2">
			<button
				class="rounded-lg bg-gray-5 p-2 text-gray-11 hover:bg-gray-6"
				onclick={() => (lapsOpen = !lapsOpen)}><LucideClipboardList /></button
			>
			<button
				class="rounded-lg bg-gray-5 p-2 text-gray-11 hover:bg-gray-6"
				onclick={() => (isDark = !isDark)}
			>
				{#if isDark}
					<LucideMoon />
				{:else}
					<LucideSun />
				{/if}
			</button>
		</nav>
	</header>

	<Sidebar bind:isOpen={lapsOpen}>
		<LapsTable {laps} />
	</Sidebar>

	<main class="bg-gray-1">
		{#if showConfetti}
			<Confetti />
		{/if}
		<StatsGrid>
			<StatTitle
				title="Коло (з {TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS})"
				value={String(laps.length).padStart(3, '0')}
			/>
			<StatTitle title="Час на коло (сек)" value={laps.length ? laps[0].lapTime : '00.00'} />
			<Timer {timeDisplay} />
		</StatsGrid>
	</main>

	<footer class="bg-gray-3 p-4">
		<button
			class="inline-flex min-w-32 items-center justify-center rounded-lg bg-gray-9 px-4 py-3 text-lg text-gray-1 hover:bg-gray-10 disabled:opacity-50"
			onclick={addLap}
		>
			Коло
		</button>
		<button
			class="inline-flex min-w-32 items-center justify-center rounded-lg px-4 py-3 text-lg {isRunning
				? 'bg-danger-9 text-danger-1 hover:bg-danger-10'
				: 'bg-success-9 text-success-1 hover:bg-success-10'}"
			onclick={startStopTimer}
			>{isRunning ? 'Стоп' : elapsedTime > 0 ? 'Продовжити' : 'Старт'}</button
		>
		<button
			class="inline-flex min-w-32 items-center justify-center rounded-lg bg-danger-9 px-4 py-3 text-lg text-danger-1 hover:bg-danger-10 disabled:opacity-50"
			onclick={resetTimer}
			disabled={isRunning || elapsedTime === 0}>Спочатку</button
		>
	</footer>
</div>
