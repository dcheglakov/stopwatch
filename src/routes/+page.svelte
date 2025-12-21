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
	import { formatTime, LAP_DISTANCE_METERS, TOTAL_DISTANCE_METERS } from '$lib';
	import LapsTable from '$lib/components/LapsTable.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import { PersistedState } from 'runed';
	import { useStopwatch } from '$lib/runes/useStopwatch.svelte';
	import type { KeyboardHandler, ClickHandler } from '$lib/types/events';

	let dialog = $state<HTMLDialogElement | null>(null);
	let confirmDialog = $state<HTMLDialogElement | null>(null);

	const stopwatch = useStopwatch();
	let lapsOpen = $state(false);
	const isDark = new PersistedState<boolean>('stopwatch-dark-mode', false);

	const handleKeydown: KeyboardHandler = (event) => {
		if (event.key === ' ') {
			if (stopwatch.isRunning) {
				stopwatch.addLap();
			}
			event.preventDefault();
		}
	};

	$effect(() => {
		if (stopwatch.isFinished && dialog) {
			dialog.showModal();
		}
	});

	const handleResetClick: ClickHandler = () => {
		confirmDialog?.showModal();
	};

	const confirmReset = () => {
		stopwatch.resetTimer();
	};
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
			{#if stopwatch.showConfetti}
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
		<LapsTable laps={stopwatch.laps} />
	</Sidebar>

	<main class="bg-gray-1">
		{#if stopwatch.showConfetti}
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
								{stopwatch.totalAverageSpeed} км/год
							</dd>
						</div>
						<div>
							<dt class="font-medium">Загальний час</dt>
							<dd class="text-2xl font-semibold">{formatTime(stopwatch.elapsedTime, true)}</dd>
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
				title="Коло ({stopwatch.laps.length}/{TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS})"
				value={String(stopwatch.laps.length).padStart(3, '0')}
			/>
			<StatTitle
				title="Час на коло (сек)"
				value={stopwatch.laps.length ? stopwatch.laps[0].lapTime : '00.00'}
			/>
			<Timer timeDisplay={stopwatch.timeDisplay} />
		</StatsGrid>
	</main>

	<footer class="bg-gray-3 relative flex h-20 items-center justify-between gap-2 px-4">
		<progress
			id="file"
			max="100"
			value={(stopwatch.laps.length * 100) / (TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS)}
			class="absolute -top-2 left-0 h-2 w-full"
			>{(stopwatch.laps.length * 100) / (TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS)}%</progress
		>
		<button
			class="bg-gray-9 text-gray-1 hover:bg-gray-10 disabled:hover:bg-gray-9 inline-flex items-center justify-center rounded-lg p-3 text-lg disabled:cursor-not-allowed disabled:opacity-50"
			disabled={!stopwatch.isRunning}
			onclick={stopwatch.stopTimer}><LucidePause /></button
		>
		{#if !stopwatch.isRunning && stopwatch.laps.length < TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS}
			<button
				class="bg-success-9 text-success-1 hover:bg-success-10 inline-flex w-full max-w-48 items-center justify-center rounded-full px-4 py-3 tracking-wide uppercase"
				onclick={stopwatch.startTimer}>{stopwatch.elapsedTime > 0 ? 'Продовжити' : 'Старт'}</button
			>
		{:else if stopwatch.laps.length < TOTAL_DISTANCE_METERS / LAP_DISTANCE_METERS}
			<button
				class="bg-brand-10 text-brand-1 hover:bg-brand-11 inline-flex w-full max-w-48 items-center justify-center rounded-full px-4 py-3 tracking-wide uppercase disabled:opacity-50"
				onclick={stopwatch.addLap}
			>
				Коло
			</button>
		{/if}
		<button
			class="bg-gray-9 text-gray-1 hover:bg-gray-10 disabled:hover:bg-gray-9 inline-flex items-center justify-center rounded-lg p-3 text-lg disabled:cursor-not-allowed disabled:opacity-50"
			onclick={handleResetClick}
			disabled={stopwatch.isRunning || stopwatch.elapsedTime === 0}><LucideTimerReset /></button
		>
	</footer>

	<ConfirmDialog
		bind:dialog={confirmDialog}
		title="Скинути таймер?"
		message="Всі дані про кола та час будуть втрачені. Ця дія незворотня."
		confirmText="Скинути"
		cancelText="Скасувати"
		onconfirm={confirmReset}
	/>
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
