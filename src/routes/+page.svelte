<script lang="ts">
	import LucideTimerReset from '~icons/lucide/timer-reset';
	import LucideSquare from '~icons/lucide/square';
	import LucidePause from '~icons/lucide/pause';
	import LucideCircleHelp from '~icons/lucide/circle-help';
	import MakiRacetrackCycling from '~icons/maki/racetrack-cycling';
	import LucideSun from '~icons/lucide/sun';
	import LucideMoon from '~icons/lucide/moon';
	import Dialog from '$lib/components/Dialog.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import SettingsButton from '$lib/components/SettingsButton.svelte';
	import TooltipButton from '$lib/components/TooltipButton.svelte';
	import { PersistedState } from 'runed';
	import { useStopwatch } from '$lib/runes/useStopwatch.svelte';
	import type { KeyboardHandler, ClickHandler } from '$lib/types/events';
	import LapTimeTile from '$lib/components/LapTimeTile.svelte';
	import Timer from '$lib/components/Timer.svelte';
	import { formatTime } from '$lib';

	let dialog = $state<HTMLDialogElement | null>(null);
	let guideDialog = $state<HTMLDialogElement | null>(null);
	let confirmDialog = $state<HTMLDialogElement | null>(null);

	const stopwatch = useStopwatch();
	const isDark = new PersistedState<boolean>('stopwatch-dark-mode', false);

	const handleKeydown: KeyboardHandler = (event) => {
		if (event.key === ' ' || event.key === 'l') {
			if (stopwatch.isRunning) stopwatch.addLap();
			event.preventDefault();
		}
	};

	$effect(() => {
		if (stopwatch.isFinished && dialog) dialog.showModal();
	});

	const handleResetClick: ClickHandler = () => {
		confirmDialog?.showModal();
	};

	const canAddLap = $derived(stopwatch.isRunning && !stopwatch.isFinished);
	const canStopFreeRide = $derived(canAddLap && stopwatch.settings.mode === 'free');
	const canStart = $derived(!stopwatch.isRunning && !stopwatch.isFinished);
	const modeLabel = $derived(
		{
			free: 'Вільний заїзд',
			time: 'За часом',
			laps: 'За колами',
			distance: 'За дистанцією'
		}[stopwatch.settings.mode]
	);
	const distanceMeters = $derived(stopwatch.laps.length * stopwatch.settings.lapDistance);
	const distanceKm = $derived(distanceMeters / 1000);
	const progressLabel = $derived(() => {
		const settings = stopwatch.settings;
		switch (settings.mode) {
			case 'free':
				return formatDistance(distanceMeters);
			case 'laps':
				return `${stopwatch.laps.length} з ${settings.targetLaps} кіл`;
			case 'distance':
				return `${formatDistance(distanceMeters)} з ${formatDistance(settings.targetDistance)}`;
			case 'time':
				return `Залишилось ${formatDuration(settings.targetTime - stopwatch.elapsedTime)} з ${formatDuration(settings.targetTime)}`;
		}
	});
	const averageSpeed = $derived(() => {
		const hours = stopwatch.elapsedTime / 3600000;
		return hours > 0 ? (distanceKm / hours).toFixed(2) : '0.00';
	});
	const bestLap = $derived(() => {
		if (!stopwatch.laps.length) return '—';
		const lapTimes = stopwatch.laps.map(
			(lap, index) => lap.elapsedTime - (stopwatch.laps[index + 1]?.elapsedTime ?? 0)
		);
		return formatTime(Math.min(...lapTimes));
	});

	function formatDistance(meters: number) {
		const km = Math.floor(meters / 1000);
		const m = meters % 1000;
		if (!km) return `${m} м`;
		return m ? `${km} км ${m} м` : `${km} км`;
	}

	function formatDuration(ms: number) {
		const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		if (hours) return minutes ? `${hours} год ${minutes} хв` : `${hours} год`;
		if (minutes) return `${minutes} хв ${seconds} сек`;
		return `${seconds} сек`;
	}

	function confirmNewRide() {
		dialog?.close();
		confirmDialog?.showModal();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Velodrome Timing System</title>
	<meta name="description" content="Stopwatch" />
</svelte:head>

<div class="{isDark.current ? 'dark' : ''} contents font-mono">
	<header
		class="flex items-center justify-between gap-5 bg-gray-100 p-2 px-6 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
	>
		<h1 class="flex items-center gap-2 text-lg tracking-wide uppercase">
			<MakiRacetrackCycling class="shrink-0" />
			<span class="hidden md:inline-block">Velodrome Timing System</span>
			<span class="md:hidden inline-block">VTS</span>
		</h1>
		<nav class="flex items-center gap-2">
			<SettingsButton
				settings={stopwatch.settings}
				onSettingsChange={stopwatch.updateSettings}
				disabled={stopwatch.isRunning || stopwatch.elapsedTime > 0}
			/>
			<TooltipButton
				tooltip="Як користуватись"
				class="rounded-lg bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
				onclick={() => guideDialog?.showModal()}><LucideCircleHelp /></TooltipButton
			>
			<TooltipButton
				tooltip={isDark.current ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
				class="rounded-lg bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
				onclick={() => (isDark.current = !isDark.current)}
			>
				{#if isDark.current}
					<LucideMoon />
				{:else}
					<LucideSun />
				{/if}
			</TooltipButton>
		</nav>
	</header>

	<main
		class="relative grid h-full w-full grid-cols-1 content-center overflow-hidden bg-white dark:bg-gray-900"
	>
		<Dialog bind:dialog>
			<div class="space-y-6 p-6">
				<div>
					<h2 class="pb-2 text-3xl font-bold">Заїзд завершено</h2>
					<p class="text-gray-600 dark:text-gray-300">Підсумок заїзду</p>
				</div>
				<dl class="grid grid-cols-2 gap-3 sm:grid-cols-3">
					<div class="rounded-xl bg-gray-100 p-4 dark:bg-gray-900">
						<dt class="text-sm text-gray-600 dark:text-gray-400">Час</dt>
						<dd class="text-xl font-semibold">{stopwatch.timeDisplay}</dd>
					</div>
					<div class="rounded-xl bg-gray-100 p-4 dark:bg-gray-900">
						<dt class="text-sm text-gray-600 dark:text-gray-400">Дистанція</dt>
						<dd class="text-xl font-semibold">{distanceKm.toFixed(2)} км</dd>
					</div>
					<div class="rounded-xl bg-gray-100 p-4 dark:bg-gray-900">
						<dt class="text-sm text-gray-600 dark:text-gray-400">Кола</dt>
						<dd class="text-xl font-semibold">{stopwatch.laps.length}</dd>
					</div>
					<div class="rounded-xl bg-gray-100 p-4 dark:bg-gray-900">
						<dt class="text-sm text-gray-600 dark:text-gray-400">Середня швидкість</dt>
						<dd class="text-xl font-semibold">{averageSpeed()} км/год</dd>
					</div>
					<div class="rounded-xl bg-gray-100 p-4 dark:bg-gray-900">
						<dt class="text-sm text-gray-600 dark:text-gray-400">Найкраще коло</dt>
						<dd class="text-xl font-semibold">{bestLap()}</dd>
					</div>
					<div class="rounded-xl bg-gray-100 p-4 dark:bg-gray-900">
						<dt class="text-sm text-gray-600 dark:text-gray-400">Режим</dt>
						<dd class="text-xl font-semibold">{modeLabel}</dd>
					</div>
				</dl>
				<div class="flex justify-end gap-3">
					<button
						class="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
						onclick={() => dialog?.close()}
					>
						Закрити
					</button>
					<button
						class="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
						onclick={confirmNewRide}
					>
						Почати новий заїзд
					</button>
				</div>
			</div>
		</Dialog>

		<Dialog bind:dialog={guideDialog}>
			<div class="space-y-4 p-6">
				<h2 class="text-3xl font-bold">Як користуватись</h2>
				<ul class="list-disc space-y-2 pl-5 text-sm leading-6 text-gray-700 dark:text-gray-300">
					<li><b>Старт</b> запускає заїзд. Після старту налаштування вже не застосовуються.</li>
					<li><b>Пауза</b> тимчасово зупиняє таймер, <b>Продовжити</b> запускає його далі.</li>
					<li><b>Коло</b> фіксує час поточного кола. Також працюють клавіші пробіл або L.</li>
					<li><b>Вільний</b> режим не має цілі. Натисніть <b>Зупинити</b>, щоб завершити заїзд.</li>
					<li>
						<b>Час</b>, <b>Кола</b> і <b>Дистанція</b> завершуються автоматично при досягненні цілі.
					</li>
					<li><b>Скинути таймер</b> очищає час і кола, після цього можна змінити налаштування.</li>
				</ul>
			</div>
		</Dialog>

		<LapTimeTile
			title="Час на коло (сек)"
			value={stopwatch.laps.length ? stopwatch.laps[0].lapTime : '00.00'}
		/>
		<div class="absolute right-0 bottom-4 left-0 text-center">
			<span
				class="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-200"
			>
				Режим: {modeLabel}{progressLabel() ? ` · ${progressLabel()}` : ''}
			</span>
		</div>
		<Timer timeDisplay={stopwatch.timeDisplay} />
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
		<TooltipButton
			tooltip="Пауза"
			class="inline-flex items-center justify-center rounded-lg bg-gray-700 p-3 text-lg text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500"
			disabled={!stopwatch.isRunning}
			onclick={stopwatch.stopTimer}><LucidePause /></TooltipButton
		>
		{#if canStart}
			<button
				class="inline-flex w-full max-w-48 items-center justify-center rounded-full bg-green-600 px-4 py-3 tracking-wide text-white uppercase transition-transform hover:bg-green-700 active:scale-97 dark:bg-green-700 dark:hover:bg-green-600"
				onclick={stopwatch.startTimer}
			>
				{stopwatch.elapsedTime > 0 ? 'Продовжити' : 'Старт'}
			</button>
		{:else if canAddLap}
			<button
				class="inline-flex w-full max-w-48 items-center justify-center rounded-full bg-pink-600 px-4 py-3 tracking-wide text-white uppercase transition-transform hover:bg-pink-500 active:scale-97 disabled:opacity-50 dark:bg-pink-700 dark:hover:bg-pink-600"
				onclick={stopwatch.addLap}
			>
				Коло
			</button>
		{:else if stopwatch.isFinished}
			<button
				class="inline-flex w-full max-w-48 items-center justify-center rounded-full bg-pink-600 px-4 py-3 font-semibold tracking-wide text-white uppercase shadow-sm transition-transform hover:bg-pink-700 active:scale-97 dark:bg-pink-500 dark:text-gray-950 dark:hover:bg-pink-400"
				onclick={() => dialog?.showModal()}
			>
				Результат
			</button>
		{/if}
		{#if stopwatch.settings.mode === 'free'}
			<TooltipButton
				tooltip="Завершити вільний заїзд"
				class="inline-flex items-center justify-center rounded-lg bg-red-700 p-3 text-lg text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
				disabled={!canStopFreeRide}
				onclick={stopwatch.finishTimer}><LucideSquare /></TooltipButton
			>
		{:else}
			<TooltipButton
				tooltip="Скинути таймер"
				class="inline-flex items-center justify-center rounded-lg bg-gray-700 p-3 text-lg text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500"
				onclick={handleResetClick}
				disabled={stopwatch.isRunning || stopwatch.elapsedTime === 0}
				><LucideTimerReset /></TooltipButton
			>
		{/if}
	</footer>

	<ConfirmDialog
		bind:dialog={confirmDialog}
		title="Скинути таймер?"
		message="Всі дані про кола та час будуть втрачені. Ця дія незворотня."
		confirmText="Скинути"
		cancelText="Скасувати"
		onconfirm={stopwatch.resetTimer}
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
