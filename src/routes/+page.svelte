<script lang="ts">
	import { Confetti } from 'svelte-confetti';
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
	<header class="flex items-center justify-between gap-5 bg-gray-3 p-4 text-gray-11">
		<h1 class="font-bold uppercase tracking-wide">{TOTAL_DISTANCE_METERS / 1000} км на треку</h1>
		<nav class="flex items-center gap-5">
			<button onclick={() => (lapsOpen = !lapsOpen)}>Статистика</button>
			<button onclick={() => (isDark = !isDark)}>{isDark ? 'Темна' : 'Світла'}</button>
		</nav>
	</header>

	<Sidebar bind:isOpen={lapsOpen}>
		<LapsTable {laps} />
	</Sidebar>

	<main class="bg-gray-1">
		{#if showConfetti}
			<div
				class="pointer-events-none fixed -top-12 left-0 flex h-screen w-screen justify-center overflow-hidden"
			>
				<Confetti
					x={[-5, 5]}
					y={[0, 0.1]}
					delay={[500, 2000]}
					infinite
					duration={5000}
					amount={200}
					fallDistance="100vh"
				/>
			</div>
		{/if}
		<StatsGrid>
			<button
				class="bg-danger-9 text-danger-1 hover:bg-danger-10 m-auto inline-flex max-w-sm items-center justify-center rounded-lg px-4 py-2 text-lg disabled:opacity-50 {!isRunning &&
				elapsedTime > 0
					? ''
					: 'invisible'}"
				onclick={resetTimer}
				disabled={isRunning || elapsedTime === 0}>Спочатку</button
			>

			<StatTitle
				title="Коло (з {TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS})"
				value={String(laps.length).padStart(3, '0')}
			/>
			<StatTitle title="Час на коло (сек)" value={laps.length ? laps[0].lapTime : '00.00'} />
			<!-- <StatTitle title="Швидкість (км/год)" value={laps.length ? laps[0].averageSpeed : '00,00'} /> -->
			<!-- <StatTitle title="Дистанція (км)" value={overallDistance} /> -->
			<Timer {timeDisplay} />
		</StatsGrid>
	</main>

	<footer class="flex items-center justify-center bg-gray-3 p-4">
		<div class="grid w-full grid-cols-2 gap-4 md:w-6/12 xl:w-4/12">
			<button
				class="inline-flex items-center justify-center rounded-lg bg-gray-9 px-4 py-2 text-lg text-gray-1 hover:bg-gray-10 disabled:opacity-50"
				onclick={addLap}
				disabled={!isRunning}>Коло</button
			>
			<button
				class="inline-flex items-center justify-center rounded-lg px-4 py-2 text-lg {isRunning
					? 'bg-danger-9 hover:bg-danger-10 text-danger-1'
					: 'bg-success-9 hover:bg-success-10 text-success-1'}"
				onclick={startStopTimer}
				>{isRunning ? 'Стоп' : elapsedTime > 0 ? 'Продовжити' : 'Старт'}</button
			>
		</div>
	</footer>
</div>
