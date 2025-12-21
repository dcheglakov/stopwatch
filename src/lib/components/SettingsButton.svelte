<script lang="ts">
	import { Popover } from 'bits-ui';
	import LucideSettings from '~icons/lucide/settings';
	import type { StopwatchSettings, TrackMode } from '$lib/types/settings';

	interface Props {
		settings: StopwatchSettings;
		onSettingsChange: (settings: StopwatchSettings) => void;
		disabled?: boolean;
	}

	let { settings, onSettingsChange, disabled = false }: Props = $props();

	let mode = $state<TrackMode>('distance');
	let lapDistance = $derived(settings.lapDistance);
	let targetTime = $derived(settings.targetTime);
	let targetLaps = $derived(settings.targetLaps);
	let targetDistance = $derived(settings.targetDistance);

	// Оновлюємо локальний стан коли settings змінюються ззовні
	$effect(() => {
		mode = settings.mode;
		lapDistance = validateLapDistance(settings.lapDistance);
		targetTime = parseTimeInput(formatTimeInput(settings.targetTime));
		targetLaps = validateTargetLaps(settings.targetLaps);
		targetDistance = parseDistanceInput(formatDistanceInput(settings.targetDistance));
	});

	$effect(() => {
		onSettingsChange({
			mode,
			lapDistance,
			targetTime,
			targetLaps,
			targetDistance
		});
	});

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
</script>

<Popover.Root>
	<Popover.Trigger
		{disabled}
		class="rounded-lg bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
	>
		<LucideSettings />
	</Popover.Trigger>
	<Popover.Portal>
		<Popover.Content class="w-full max-w-md" sideOffset={12} collisionPadding={16}>
			<div
				class="flex flex-col gap-4 rounded-xl border-2 border-gray-300 bg-white p-6 shadow-lg dark:border-gray-600 dark:bg-gray-800"
			>
				<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Налаштування</h3>

				<!-- Довжина кола -->
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

				<!-- Режим роботи -->
				<div class="flex flex-col gap-2">
					<div class="text-sm font-medium text-gray-700 dark:text-gray-300">Режим</div>
					<div class="grid grid-cols-3 gap-2">
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

				<!-- Налаштування для обраного режиму -->
				<div class="flex flex-col gap-2">
					{#if mode === 'time'}
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
							min="0"
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
							min="0"
							max="1000"
							step="5"
							class="w-full rounded-lg border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:focus:border-blue-400"
						/>
					{/if}
				</div>
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
