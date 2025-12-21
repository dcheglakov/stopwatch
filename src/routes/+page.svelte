<script lang="ts">
	import LucideTrophy from '~icons/lucide/trophy';
	import LucideTimerReset from '~icons/lucide/timer-reset';
	import LucidePause from '~icons/lucide/pause';
	import LucideClipboardList from '~icons/lucide/clipboard-list';
	import LucideBike from '~icons/lucide/bike';
	import LucideSun from '~icons/lucide/sun';
	import LucideMoon from '~icons/lucide/moon';
	import LucideSettings from '~icons/lucide/settings';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import StatsGrid from '$lib/components/StatsGrid.svelte';
	import StatTitle from '$lib/components/StatTitle.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import { formatTime } from '$lib';
	import LapsTable from '$lib/components/LapsTable.svelte';
	import Confetti from '$lib/components/Confetti.svelte';
	import Dialog from '$lib/components/Dialog.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import SettingsButton from '$lib/components/SettingsButton.svelte';
	import { PersistedState } from 'runed';
	import { useStopwatch } from '$lib/runes/useStopwatch.svelte';
	import type { KeyboardHandler, ClickHandler } from '$lib/types/events';
	import { formatDuration, intervalToDuration } from 'date-fns';
	import { uk } from 'date-fns/locale';
	import LapTimeTile from '$lib/components/LapTimeTile.svelte';

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

	// Форматування часу у людський формат
	function formatHumanTime(ms: number): string {
		if (ms === 0) return '0 хв';

		const duration = intervalToDuration({ start: 0, end: ms });

		// Якщо менше хвилини
		if (!duration.hours && !duration.minutes) {
			return formatDuration(duration, {
				format: ['seconds'],
				locale: uk
			});
		}

		// Якщо менше години
		if (!duration.hours) {
			return formatDuration(duration, {
				format: ['minutes', 'seconds'],
				locale: uk
			});
		}

		// Якщо є години
		return formatDuration(duration, {
			format: ['hours', 'minutes'],
			locale: uk
		});
	}

	// Завжди показуємо три метрики
	const lapsDisplay = $derived(() => {
		if (stopwatch.settings.mode === 'laps') {
			return `${stopwatch.laps.length} / ${stopwatch.targetLapsCount}`;
		}
		return String(stopwatch.laps.length);
	});

	const distanceDisplay = $derived(() => {
		const currentKm = stopwatch.currentDistance / 1000;
		// Якщо дистанція ціла, показуємо без дробової частини
		const current = currentKm % 1 === 0 ? currentKm.toFixed(0) : currentKm.toFixed(2);

		if (stopwatch.settings.mode === 'distance') {
			const targetKm = stopwatch.totalDistance / 1000;
			const target = targetKm % 1 === 0 ? targetKm.toFixed(0) : targetKm.toFixed(2);
			return `${current} / ${target} км`;
		}
		return `${current} км`;
	});

	const timeDisplay = $derived(() => {
		if (stopwatch.settings.mode === 'time') {
			const remaining = stopwatch.settings.targetTime - stopwatch.elapsedTime;
			return remaining > 0 ? formatHumanTime(remaining) : '0 хв';
		}
		return formatHumanTime(stopwatch.elapsedTime);
	});

	const canAddLap = $derived(() => {
		// Для режиму часу можна додавати кола завжди поки не закінчився час
		if (stopwatch.settings.mode === 'time') {
			return stopwatch.isRunning && !stopwatch.isFinished;
		}
		// Для інших режимів - поки не досягли цілі
		return stopwatch.isRunning && !stopwatch.isFinished;
	});

	const canStart = $derived(() => {
		return !stopwatch.isRunning && !stopwatch.isFinished;
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Секундомір на треку</title>
	<meta name="description" content="Stopwatch" />
</svelte:head>

<div class="{isDark.current ? 'dark' : ''} contents font-mono">
	<header
		class="flex items-center justify-between gap-5 bg-gray-100 p-2 px-6 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
	>
		<h1 class="flex items-center gap-2 tracking-wide uppercase">
			<LucideBike />секундомір
		</h1>
		<nav class="flex items-center gap-2">
			{#if stopwatch.showConfetti}
				<button
					class="rounded-lg bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
					onclick={() => dialog?.showModal()}><LucideTrophy /></button
				>
			{/if}
			<button
				class="rounded-lg bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
				onclick={() => (lapsOpen = !lapsOpen)}><LucideClipboardList /></button
			>
			<SettingsButton
				settings={stopwatch.settings}
				onSettingsChange={stopwatch.updateSettings}
				disabled={stopwatch.isRunning || stopwatch.elapsedTime > 0}
			/>
			<button
				class="rounded-lg bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
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

	<main class="bg-white dark:bg-gray-900">
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
							<dd class="text-2xl font-semibold">
								{(stopwatch.currentDistance / 1000).toFixed(1)} км
							</dd>
						</div>
						<div>
							<dt class="font-medium">Кількість кіл</dt>
							<dd class="text-2xl font-semibold">{stopwatch.laps.length}</dd>
						</div>
					</dl>
				</div>
				<img src="/images/don.jpg" alt="Logo" class="h-auto w-full" />
			</div>
		</Dialog>
		<StatsGrid>
			<LapTimeTile
				title="Час на коло (сек)"
				value={stopwatch.laps.length ? stopwatch.laps[0].lapTime : '00.00'}
			/>
			<div class="grid grid-flow-col auto-rows-fr gap-4 px-6">
				<StatTitle title="Кола" value={lapsDisplay()} />
				<StatTitle title="Дистанція" value={distanceDisplay()} />
				<StatTitle
					title={stopwatch.settings.mode === 'time' ? 'Залишилось часу' : 'Час'}
					value={timeDisplay()}
				/>
			</div>
			<Timer timeDisplay={stopwatch.timeDisplay} />
		</StatsGrid>
	</main>

	<footer
		class="relative flex h-20 items-center justify-between gap-2 bg-gray-100 px-4 dark:bg-gray-800"
	>
		<progress
			id="file"
			max="100"
			value={stopwatch.progressPercentage}
			class="absolute -top-2 left-0 h-2 w-full">{stopwatch.progressPercentage}%</progress
		>
		<button
			class="inline-flex items-center justify-center rounded-lg bg-gray-700 p-3 text-lg text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500"
			disabled={!stopwatch.isRunning}
			onclick={stopwatch.stopTimer}><LucidePause /></button
		>
		{#if canStart()}
			<button
				class="inline-flex w-full max-w-48 items-center justify-center rounded-full bg-green-600 px-4 py-3 tracking-wide text-white uppercase hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
				onclick={stopwatch.startTimer}>{stopwatch.elapsedTime > 0 ? 'Продовжити' : 'Старт'}</button
			>
		{:else if canAddLap()}
			<button
				class="inline-flex w-full max-w-48 items-center justify-center rounded-full bg-blue-600 px-4 py-3 tracking-wide text-white uppercase hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-600"
				onclick={stopwatch.addLap}
			>
				Коло
			</button>
		{/if}
		<button
			class="inline-flex items-center justify-center rounded-lg bg-gray-700 p-3 text-lg text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500"
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
		background-color: #e5e7eb; /* gray-200 */
	}
	progress::-webkit-progress-value {
		background-color: #ec4899; /* pink-500 */
	}
	progress::-moz-progress-bar {
		background-color: #e5e7eb;
	}

	:global(.dark) progress::-webkit-progress-bar {
		background-color: #374151; /* gray-700 */
	}
	:global(.dark) progress::-webkit-progress-value {
		background-color: #f472b6; /* pink-400 */
	}
</style>
