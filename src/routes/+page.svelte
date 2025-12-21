<script lang="ts">
	import LucideTrophy from '~icons/lucide/trophy';
	import LucideTimerReset from '~icons/lucide/timer-reset';
	import LucidePause from '~icons/lucide/pause';
	import LucideClipboardList from '~icons/lucide/clipboard-list';
	import LucideBike from '~icons/lucide/bike';
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
	import Dialog from '$lib/components/Dialog.svelte';
	import { PersistedState } from 'runed';
	import { onMount } from 'svelte';

	let dialog = $state<HTMLDialogElement | null>(null);

	let isRunning = $state(false);
	let timeDisplay = $state(INITIAL_TIME_DISPLAY);
	const laps = new PersistedState<Lap[]>('stopwatch-laps', []);
	const elapsedTime = new PersistedState<number>('stopwatch-elapsed-time', 0);
	let lapsOpen = $state(false);
	let showConfetti = $state(false);
	const isDark = new PersistedState<boolean>('stopwatch-dark-mode', false);

	let startTime: number = 0;
	let interval: number | undefined;

	onMount(() => {
		if (elapsedTime.current > 0) {
			timeDisplay = formatTime(elapsedTime.current, true);
		}
	});

	let totalAverageSpeed = $derived(
		(
			laps.current.reduce((acc, lap) => acc + Number(lap.averageSpeed), 0) / laps.current.length
		).toFixed(2)
	);

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

	function updateTime() {
		elapsedTime.current = Date.now() - startTime;
		timeDisplay = formatTime(elapsedTime.current, true);
	}

	function addLap() {
		if (isRunning) {
			const lapTimeMs =
				elapsedTime.current - (laps.current.length ? laps.current[0].elapsedTime : 0);
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
				dialog?.showModal();
				showConfetti = true;
			}
		}
	}

	function markFastestSlowestLaps() {
		if (laps.current.length < 2) return;

		let fastestLapTime = Math.min(...laps.current.map((lap) => parseTime(lap.lapTime)));
		let slowestLapTime = Math.max(...laps.current.map((lap) => parseTime(lap.lapTime)));

		laps.current = laps.current.map((lap) => ({
			...lap,
			isFastest: parseTime(lap.lapTime) === fastestLapTime,
			isSlowest: parseTime(lap.lapTime) === slowestLapTime
		}));
	}

	function resetTimer() {
		clearInterval(interval);
		elapsedTime.current = 0;
		timeDisplay = INITIAL_TIME_DISPLAY;
		laps.current = [];
		isRunning = false;
		showConfetti = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === ' ') {
			if (isRunning) {
				addLap();
			}
			event.preventDefault();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>{TOTAL_DISTANCE_METERS / 1000} км на треку</title>
	<meta name="description" content="Stopwatch" />
</svelte:head>

<div class="{isDark.current ? 'dark' : ''} contents font-mono">
	<header class="bg-gray-3 text-gray-11 flex items-center justify-between gap-5 p-2 px-6">
		<h1 class="flex items-center gap-2 tracking-wide uppercase">
			<LucideBike />секундомір
		</h1>
		<nav class="flex items-center gap-2">
			{#if showConfetti}
				<button
					class="bg-gray-5 text-gray-11 hover:bg-gray-6 rounded-lg p-2"
					onclick={() => dialog?.showModal()}><LucideTrophy /></button
				>
			{/if}
			<button
				class="bg-gray-5 text-gray-11 hover:bg-gray-6 rounded-lg p-2"
				onclick={() => (lapsOpen = !lapsOpen)}><LucideClipboardList /></button
			>
			<button
				class="bg-gray-5 text-gray-11 hover:bg-gray-6 rounded-lg p-2"
				onclick={() => (isDark.current = !isDark.current)}
			>
				{#if isDark.current}
					<LucideMoon />
				{:else}
					<LucideSun />
				{/if}
			</button>
		</nav>
	</header>

	<Sidebar bind:isOpen={lapsOpen}>
		<LapsTable laps={laps.current} />
	</Sidebar>

	<main class="bg-gray-1">
		{#if showConfetti}
			<Confetti />
		{/if}
		<Dialog bind:dialog>
			<div class="grid grid-cols-2">
				<div class="p-6">
					<h2 class="pb-6 text-3xl font-bold">Вітаємо дон Влодко!</h2>
					<dl class="flex flex-col gap-4">
						<div>
							<dt class="font-medium">Середня швидкість</dt>
							<dd class="text-2xl font-semibold">
								{totalAverageSpeed} км/год
							</dd>
						</div>
						<div>
							<dt class="font-medium">Загальний час</dt>
							<dd class="text-2xl font-semibold">{formatTime(elapsedTime.current, true)}</dd>
						</div>
						<div>
							<dt class="font-medium">Дистанція</dt>
							<dd class="text-2xl font-semibold">{TOTAL_DISTANCE_METERS / 1000} км</dd>
						</div>
						<div>
							<dt class="font-medium">Кількість кіл</dt>
							<dd class="text-2xl font-semibold">{TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS}</dd>
						</div>
					</dl>
				</div>
				<img src="/images/don.jpg" alt="Logo" class="h-auto w-full" />
			</div>
		</Dialog>
		<StatsGrid>
			<StatTitle
				title="Коло ({laps.current.length}/{TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS})"
				value={String(laps.current.length).padStart(3, '0')}
			/>
			<StatTitle
				title="Час на коло (сек)"
				value={laps.current.length ? laps.current[0].lapTime : '00.00'}
			/>
			<Timer {timeDisplay} />
		</StatsGrid>
	</main>

	<footer class="bg-gray-3 relative flex h-20 items-center justify-between gap-2 px-4">
		<progress
			id="file"
			max="100"
			value={(laps.current.length * 100) / (TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS)}
			class="absolute -top-2 left-0 h-2 w-full"
			>{(laps.current.length * 100) / (TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS)}%</progress
		>
		<button
			class="bg-gray-9 text-gray-1 hover:bg-gray-10 disabled:hover:bg-gray-9 inline-flex items-center justify-center rounded-lg p-3 text-lg disabled:cursor-not-allowed disabled:opacity-50"
			disabled={!isRunning}
			onclick={stopTimer}><LucidePause /></button
		>
		{#if !isRunning && laps.current.length < TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS}
			<button
				class="bg-success-9 text-success-1 hover:bg-success-10 inline-flex w-full max-w-48 items-center justify-center rounded-full px-4 py-3 tracking-wide uppercase"
				onclick={startTimer}>{elapsedTime.current > 0 ? 'Продовжити' : 'Старт'}</button
			>
		{:else if laps.current.length < TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS}
			<button
				class="bg-brand-10 text-brand-1 hover:bg-brand-11 inline-flex w-full max-w-48 items-center justify-center rounded-full px-4 py-3 tracking-wide uppercase disabled:opacity-50"
				onclick={addLap}
			>
				Коло
			</button>
		{/if}
		<button
			class="bg-gray-9 text-gray-1 hover:bg-gray-10 disabled:hover:bg-gray-9 inline-flex items-center justify-center rounded-lg p-3 text-lg disabled:cursor-not-allowed disabled:opacity-50"
			onclick={resetTimer}
			disabled={isRunning || elapsedTime.current === 0}><LucideTimerReset /></button
		>
	</footer>
</div>

<style>
	progress::-webkit-progress-bar {
		background-color: var(--slate-6);
	}
	progress::-webkit-progress-value {
		background-color: var(--pink-10);
	}
	progress::-moz-progress-bar {
		background-color: var(--slate-6);
	}
	progress::-moz-progress-value {
		background-color: var(--pink-10);
	}
</style>
