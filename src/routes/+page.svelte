<script lang="ts">
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

	let isRunning = $state(false);
	let timeDisplay = $state(INITIAL_TIME_DISPLAY);
	let laps = $state<Lap[]>([]);
	let elapsedTime = $state(0);
	let lapsOpen = $state(false);

	let overallDistance = $derived((laps.length * LAP_DISTANCE_METERS) / 1000);

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
	}
</script>

<svelte:head>
	<title>{TOTAL_DISTANCE_METERS / 1000} км на треку</title>
	<meta name="description" content="Stopwatch" />
</svelte:head>

<header class="flex items-center justify-between gap-5 bg-gray-900 p-4 text-white">
	<h1 class="font-bold uppercase tracking-wide">{TOTAL_DISTANCE_METERS / 1000} км на треку</h1>
	<nav class="flex items-center gap-5">
		<button onclick={() => (lapsOpen = !lapsOpen)}>Статистика</button>
		<!-- <button onclick={() => (lapsOpen = !lapsOpen)}>Статистика</button> -->
	</nav>
</header>

<Sidebar bind:isOpen={lapsOpen}>
	<LapsTable {laps} />
</Sidebar>

<main class="bg-slate-800">
	<StatsGrid>
		<StatTitle
			title="Коло (з {TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS})"
			value={String(laps.length).padStart(3, '0')}
		/>
		<StatTitle title="Час на коло (сек)" value={laps.length ? laps[0].lapTime : '00.00'} />
		<StatTitle title="Швидкість (км/год)" value={laps.length ? laps[0].averageSpeed : '00,00'} />
		<StatTitle title="Дистанція (км)" value={overallDistance} />
		<Timer {timeDisplay} />
	</StatsGrid>
</main>

<footer class="flex items-center justify-center bg-gray-900 p-4">
	<div class="grid w-full grid-cols-2 gap-4 md:w-6/12 xl:w-4/12">
		{#if !isRunning && elapsedTime > 0}
			<button
				class="inline-flex items-center justify-center rounded-lg bg-slate-600 px-4 py-2 text-lg text-white disabled:opacity-50"
				onclick={resetTimer}
				disabled={isRunning || elapsedTime === 0}>На нуль</button
			>
		{:else}
			<button
				class="inline-flex items-center justify-center rounded-lg bg-slate-600 px-4 py-2 text-lg text-white disabled:opacity-50"
				onclick={addLap}
				disabled={!isRunning}>Коло</button
			>
		{/if}
		<button
			class="inline-flex items-center justify-center rounded-lg px-4 py-2 text-lg text-white {isRunning
				? 'bg-red-600'
				: 'bg-emerald-600'}"
			onclick={startStopTimer}
			>{isRunning ? 'Стоп' : elapsedTime > 0 ? 'Продовжити' : 'Старт'}</button
		>
	</div>
</footer>
