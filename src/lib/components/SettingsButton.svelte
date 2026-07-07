<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Popover, Tooltip } from 'bits-ui';
	import LucideSettings from '~icons/lucide/settings';
	import LucideX from '~icons/lucide/x';
	import TooltipButton from '$lib/components/TooltipButton.svelte';
	import { DEFAULT_SETTINGS, type StopwatchSettings, type TrackMode } from '$lib/types/settings';

	interface Props {
		settings: StopwatchSettings;
		onSettingsChange: (settings: StopwatchSettings) => void;
		disabled?: boolean;
	}

	let { settings, onSettingsChange, disabled = false }: Props = $props();

	let mode = $state<TrackMode>(DEFAULT_SETTINGS.mode);
	let lapDistance = $state(DEFAULT_SETTINGS.lapDistance);
	let targetTime = $state(DEFAULT_SETTINGS.targetTime);
	let targetLaps = $state(DEFAULT_SETTINGS.targetLaps);
	let targetDistance = $state(DEFAULT_SETTINGS.targetDistance);
	let applied = $state(false);
	let open = $state(false);
	let appliedTimeout: number | undefined;

	$effect(() => {
		mode = settings.mode;
		lapDistance = validateLapDistance(settings.lapDistance);
		targetTime = parseTimeInput(formatTimeInput(settings.targetTime));
		targetLaps = validateTargetLaps(settings.targetLaps);
		targetDistance = parseDistanceInput(formatDistanceInput(settings.targetDistance));
	});

	function applySettings() {
		if (disabled) return;
		onSettingsChange({ mode, lapDistance, targetTime, targetLaps, targetDistance });
		applied = true;
		clearTimeout(appliedTimeout);
		appliedTimeout = window.setTimeout(() => (applied = false), 2000);
	}

	function resetDraft() {
		mode = DEFAULT_SETTINGS.mode;
		lapDistance = DEFAULT_SETTINGS.lapDistance;
		targetTime = DEFAULT_SETTINGS.targetTime;
		targetLaps = DEFAULT_SETTINGS.targetLaps;
		targetDistance = DEFAULT_SETTINGS.targetDistance;
	}

	function formatTimeInput(ms: number): string {
		const hours = Math.floor(ms / 3600000);
		return hours.toString();
	}

	function parseTimeInput(value: string): number {
		const hours = Math.max(1, parseInt(value) || 1);
		return hours * 3600000;
	}

	function formatDistanceInput(meters: number): string {
		const km = Math.floor(meters / 1000);
		return km.toString();
	}

	function parseDistanceInput(value: string): number {
		const km = Math.max(1, parseInt(value) || 1);
		return km * 1000;
	}

	function validateLapDistance(value: number): number {
		return Math.max(100, Math.min(10000, value));
	}

	function validateTargetLaps(value: number): number {
		return Math.max(1, Math.min(1000, value));
	}

	onDestroy(() => clearTimeout(appliedTimeout));
</script>

{#snippet settingsTrigger({ props }: { props: Record<string, unknown> })}
	<Popover.Trigger
		{...props}
		aria-label="Налаштування"
		class="rounded-lg bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
	>
		<LucideSettings />
	</Popover.Trigger>
{/snippet}

<Popover.Root bind:open>
	<Tooltip.Root>
		<Tooltip.Trigger child={settingsTrigger} />
		<Tooltip.Content
			sideOffset={8}
			collisionPadding={8}
			strategy="fixed"
			class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--bits-tooltip-content-transform-origin) z-50"
		>
			<div
				class="max-w-[calc(100vw-1rem)] rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-md dark:bg-gray-100 dark:text-gray-900"
			>
				Налаштування
			</div>
		</Tooltip.Content>
	</Tooltip.Root>
	<Popover.Portal>
		<Popover.Content class="w-full max-w-md" sideOffset={12} collisionPadding={16}>
			<div
				class="flex flex-col gap-4 rounded-xl border-2 border-gray-300 bg-white p-6 shadow-lg dark:border-gray-600 dark:bg-gray-800"
			>
				<div class="flex items-center justify-between gap-4">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Налаштування</h3>
					<div class="flex items-center gap-2">
						{#if applied}
							<span
								class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300"
							>
								Застосовано
							</span>
						{/if}
						<TooltipButton
							tooltip="Закрити налаштування"
							class="rounded-lg bg-gray-100 p-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
							onclick={() => (open = false)}><LucideX /></TooltipButton
						>
					</div>
				</div>
				{#if disabled}
					<p
						class="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200"
					>
						Змінити налаштування можна тільки до старту заїзду.
					</p>
				{/if}

				<div class="flex flex-col gap-2">
					<label for="lap-distance" class="text-sm font-medium text-gray-700 dark:text-gray-300">
						Довжина кола (метри)
					</label>
					<input
						id="lap-distance"
						type="number"
						bind:value={lapDistance}
						oninput={(e) =>
							(lapDistance = validateLapDistance(parseInt(e.currentTarget.value) || 100))}
						min="100"
						max="10000"
						step="50"
						class="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
					/>
				</div>

				<div class="flex flex-col gap-2">
					<div class="text-sm font-medium text-gray-700 dark:text-gray-300">Режим</div>
					<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
						<button
							type="button"
							onclick={() => (mode = 'free')}
							class="rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors {mode ===
							'free'
								? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900 dark:text-blue-100'
								: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}"
						>
							Вільний
						</button>
						<button
							type="button"
							onclick={() => (mode = 'time')}
							class="rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors {mode ===
							'time'
								? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900 dark:text-blue-100'
								: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}"
						>
							Час
						</button>
						<button
							type="button"
							onclick={() => (mode = 'laps')}
							class="rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors {mode ===
							'laps'
								? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900 dark:text-blue-100'
								: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}"
						>
							Кола
						</button>
						<button
							type="button"
							onclick={() => (mode = 'distance')}
							class="rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors {mode ===
							'distance'
								? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-900 dark:text-blue-100'
								: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'}"
						>
							Дистанція
						</button>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					{#if mode === 'free'}
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Вільний заїзд триває, поки ви не натиснете «Зупинити».
						</p>
					{:else if mode === 'time'}
						<label for="target-time" class="text-sm font-medium text-gray-700 dark:text-gray-300">
							Цільовий час (години)
						</label>
						<input
							id="target-time"
							type="number"
							value={formatTimeInput(targetTime)}
							oninput={(e) => (targetTime = parseTimeInput(e.currentTarget.value))}
							min="1"
							max="24"
							step="1"
							class="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
						/>
					{:else if mode === 'laps'}
						<label for="target-laps" class="text-sm font-medium text-gray-700 dark:text-gray-300">
							Кількість кіл
						</label>
						<input
							id="target-laps"
							type="number"
							value={targetLaps}
							oninput={(e) =>
								(targetLaps = validateTargetLaps(parseInt(e.currentTarget.value) || 1))}
							min="1"
							max="1000"
							step="10"
							class="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
						/>
					{:else if mode === 'distance'}
						<label
							for="target-distance"
							class="text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Цільова дистанція (кілометри)
						</label>
						<input
							id="target-distance"
							type="number"
							value={formatDistanceInput(targetDistance)}
							oninput={(e) => (targetDistance = parseDistanceInput(e.currentTarget.value))}
							min="1"
							max="1000"
							step="5"
							class="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
						/>
					{/if}
				</div>

				<div class="flex justify-end gap-2">
					<button
						type="button"
						class="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
						onclick={resetDraft}
					>
						Скинути
					</button>
					<button
						type="button"
						class="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600"
						{disabled}
						onclick={applySettings}
					>
						Застосувати
					</button>
				</div>
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
