<script lang="ts">
	import { Popover, Tooltip } from 'bits-ui';
	import LucideRadioTower from '~icons/lucide/radio-tower';
	import LucideX from '~icons/lucide/x';
	import TooltipButton from '$lib/components/TooltipButton.svelte';
	import type { useRemoteLaps } from '$lib/runes/useRemoteLaps.svelte';

	interface Props {
		remote: ReturnType<typeof useRemoteLaps>;
	}

	let { remote }: Props = $props();
	let open = $state(false);
	let flash = $state(false);
	let flashTimeout: ReturnType<typeof setTimeout> | undefined;

	$effect(() => {
		if (!remote.lastSignal) return;
		flash = true;
		clearTimeout(flashTimeout);
		flashTimeout = setTimeout(() => (flash = false), 600);
	});

	const STATUS_TEXT = { open: 'підключено', connecting: 'підключення…', closed: 'вимкнено' };
	const RESULT_TEXT = {
		lap: 'додано коло',
		start: 'секундомір запущено',
		ignored: 'пропущено (секундомір не працює)'
	};

	const dotClass = $derived(
		!remote.enabled
			? 'hidden'
			: flash
				? 'bg-blue-500'
				: remote.connected
					? 'bg-green-500'
					: 'bg-amber-500'
	);
	const tooltip = $derived(
		!remote.enabled
			? 'Кола з TrackTime'
			: remote.direct
				? 'TrackTime: підключено напряму'
				: remote.connected
					? 'TrackTime: підключено'
					: 'TrackTime: підключення…'
	);

	function clock(t: number) {
		return new Date(t).toLocaleTimeString('uk-UA');
	}
</script>

{#snippet trigger({ props }: { props: Record<string, unknown> })}
	<Popover.Trigger
		{...props}
		aria-label={tooltip}
		class="relative rounded-lg bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
	>
		<LucideRadioTower />
		<span class="absolute top-1 right-1 h-2.5 w-2.5 rounded-full {dotClass}"></span>
	</Popover.Trigger>
{/snippet}

<Popover.Root bind:open>
	<Tooltip.Root>
		<Tooltip.Trigger child={trigger} />
		<Tooltip.Content sideOffset={8} collisionPadding={8} strategy="fixed" class="z-50">
			<div
				class="max-w-[calc(100vw-1rem)] rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-md dark:bg-gray-100 dark:text-gray-900"
			>
				{tooltip}
			</div>
		</Tooltip.Content>
	</Tooltip.Root>
	<Popover.Portal>
		<Popover.Content class="w-full max-w-md" sideOffset={12} collisionPadding={16}>
			<div
				class="flex flex-col gap-4 rounded-xl border-2 border-gray-300 bg-white p-6 text-gray-900 shadow-lg dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
			>
				<div class="flex items-center justify-between gap-4">
					<h3 class="text-lg font-semibold">Кола з TrackTime</h3>
					<TooltipButton
						tooltip="Закрити"
						class="rounded-lg bg-gray-100 p-2 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
						onclick={() => (open = false)}><LucideX /></TooltipButton
					>
				</div>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Телефон на фініші (TrackTime) сам додає коло, коли лідер групи перетинає лінію. Для
					підключення потрібен інтернет. Якщо обидва пристрої в одній Wi-Fi мережі (хотспоті),
					з'являється пряме з'єднання, і кола йдуть далі навіть без інтернету.
				</p>

				<label class="flex items-center gap-3 text-sm font-medium">
					<input
						type="checkbox"
						class="h-4 w-4"
						checked={remote.enabled}
						onchange={(e) => remote.setEnabled(e.currentTarget.checked)}
						data-testid="remote-enabled"
					/>
					Приймати кола з TrackTime
				</label>

				{#if remote.enabled}
					<div class="rounded-lg bg-gray-100 p-4 dark:bg-gray-900">
						<div class="text-xs text-gray-600 dark:text-gray-400">
							Код для TrackTime (Налаштування → Секундомір)
						</div>
						<div class="flex items-center justify-between gap-3">
							<span class="text-3xl font-bold tracking-[0.3em]" data-testid="remote-code"
								>{remote.code}</span
							>
							<button
								type="button"
								class="rounded-lg bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
								onclick={remote.regenerateCode}>Новий код</button
							>
						</div>
					</div>

					<label class="flex items-center gap-3 text-sm">
						<input
							type="checkbox"
							class="h-4 w-4"
							checked={remote.autoStart}
							onchange={(e) => (remote.autoStart = e.currentTarget.checked)}
						/>
						Перший сигнал запускає секундомір
					</label>

					<div class="text-sm" data-testid="remote-status">
						<ul class="space-y-1">
							{#each remote.linkState.links as link, i (i)}
								<li class="flex items-center gap-2">
									<span
										class="h-2 w-2 rounded-full {link.status === 'open'
											? 'bg-green-500'
											: link.status === 'connecting'
												? 'bg-amber-500'
												: 'bg-gray-400'}"
									></span>
									<span class="text-gray-600 dark:text-gray-400">{link.name}</span>
									<span>{STATUS_TEXT[link.status]}</span>
								</li>
							{/each}
							{#if remote.linkState.direct}
								<li class="flex items-center gap-2" data-testid="remote-direct">
									<span
										class="h-2 w-2 rounded-full {remote.linkState.direct === 'open'
											? 'bg-green-500'
											: remote.linkState.direct === 'connecting'
												? 'bg-amber-500'
												: 'bg-gray-400'}"
									></span>
									<span class="text-gray-600 dark:text-gray-400">напряму (без інтернету)</span>
									<span
										>{remote.linkState.direct === 'closed'
											? 'немає'
											: STATUS_TEXT[remote.linkState.direct]}</span
									>
								</li>
								{#if remote.linkState.direct !== 'open' && remote.linkState.directDetail}
									<li class="pl-4 text-xs text-gray-500" data-testid="remote-direct-detail">
										{remote.linkState.directDetail}
									</li>
								{/if}
							{/if}
						</ul>
						<p class="pt-2 text-gray-600 dark:text-gray-400">
							{#if remote.lastSignal}
								Останній сигнал: {clock(remote.lastSignal.at)}, {RESULT_TEXT[
									remote.lastSignal.result
								]}
							{:else if remote.linkState.lastSeen}
								TrackTime на зв'язку: {clock(remote.linkState.lastSeen)}
							{:else}
								Сигналів від TrackTime ще не було.
							{/if}
						</p>
					</div>
				{/if}
			</div>
		</Popover.Content>
	</Popover.Portal>
</Popover.Root>
