<script lang="ts">
	import helpMarko from '$lib/assets/help_marko.webp';
	import LucideTrophy from '~icons/lucide/trophy';
	import LucideTimerReset from '~icons/lucide/timer-reset';
	import LucidePause from '~icons/lucide/pause';
	import LucideBike from '~icons/lucide/bike';
	import LucideSun from '~icons/lucide/sun';
	import LucideMoon from '~icons/lucide/moon';
	import Dialog from '$lib/components/Dialog.svelte';
	import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
	import SettingsButton from '$lib/components/SettingsButton.svelte';
	import { PersistedState } from 'runed';
	import { useStopwatch } from '$lib/runes/useStopwatch.svelte';
	import type { KeyboardHandler, ClickHandler } from '$lib/types/events';
	import LapTimeTile from '$lib/components/LapTimeTile.svelte';
	import Timer from '$lib/components/Timer.svelte';

	let dialog = $state<HTMLDialogElement | null>(null);
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
	const canStart = $derived(!stopwatch.isRunning && !stopwatch.isFinished);
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Elevidys для Марчика</title>
	<meta name="description" content="Stopwatch" />
</svelte:head>

<div class="{isDark.current ? 'dark' : ''} contents font-mono">
	<header
		class="flex items-center justify-between gap-5 bg-gray-100 p-2 px-6 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
	>
		<h1 class="flex items-center gap-2 text-lg tracking-wide uppercase">
			<LucideBike /> Elevidys для Марчика
		</h1>
		<nav class="flex items-center gap-2">
			{#if stopwatch.isFinished}
				<button
					class="rounded-lg bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
					onclick={() => dialog?.showModal()}><LucideTrophy /></button
				>
			{/if}
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

	<main
		class="grid h-full w-full grid-cols-1 content-center overflow-hidden bg-white dark:bg-gray-900"
	>
		<Dialog bind:dialog>
			<div class="grid grid-cols-1 sm:grid-cols-2">
				<div class="p-6">
					<h2 class="pb-4 text-3xl font-bold">Ціль виконано</h2>
					<p>Таймер зупинено.</p>
				</div>
				<img src={helpMarko} alt="Logo" class="hidden h-auto w-full sm:block" />
			</div>
		</Dialog>

		<LapTimeTile
			title="Час на коло (сек)"
			value={stopwatch.laps.length ? stopwatch.laps[0].lapTime : '00.00'}
		/>
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
		<button
			class="inline-flex items-center justify-center rounded-lg bg-gray-700 p-3 text-lg text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500"
			disabled={!stopwatch.isRunning}
			onclick={stopwatch.stopTimer}><LucidePause /></button
		>
		{#if canStart}
			<button
				class="inline-flex w-full max-w-48 items-center justify-center rounded-full bg-green-600 px-4 py-3 tracking-wide text-white uppercase transition-transform hover:bg-green-700 active:scale-97 dark:bg-green-700 dark:hover:bg-green-600"
				onclick={stopwatch.startTimer}>{stopwatch.elapsedTime > 0 ? 'Продовжити' : 'Старт'}</button
			>
		{:else if canAddLap}
			<button
				class="inline-flex w-full max-w-48 items-center justify-center rounded-full bg-pink-600 px-4 py-3 tracking-wide text-white uppercase transition-transform hover:bg-pink-500 active:scale-97 disabled:opacity-50 dark:bg-pink-700 dark:hover:bg-pink-600"
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
