<script lang="ts">
	import type { Lap } from '$lib/types';

	let { laps }: { laps: Lap[] } = $props();
</script>

{#snippet th(title: string)}
	<th class="border-b border-gray-6 px-4 py-2 text-right text-sm font-bold text-gray-12">{title}</th
	>
{/snippet}

{#snippet td(value: number | string)}
	<td class="border-b border-gray-7 px-4 py-2 text-right text-sm">{value}</td>
{/snippet}

{#if laps.length === 0}
	<div class="flex h-full items-center justify-center text-gray-11">
		<p>Немає кіл</p>
	</div>
{:else}
	<table class="m-auto w-full table-auto">
		<thead class="sticky top-16 bg-gray-5">
			<tr>
				{@render th('Коло')}
				{@render th('Час')}
				{@render th('Загальний час')}
				{@render th('Швидкість')}
			</tr>
		</thead>
		<tbody>
			{#each laps as lap, index}
				<tr
					class={lap.isFastest
						? 'bg-brand-4 text-brand-11'
						: lap.isSlowest
							? 'bg-danger-4 text-danger-11'
							: 'bg-gray-4 text-gray-11 even:bg-gray-6'}
				>
					{@render td(laps.length - index)}
					{@render td(lap.lapTime)}
					{@render td(lap.totalTime)}
					{@render td(lap.averageSpeed)}
				</tr>
			{/each}
		</tbody>
	</table>
{/if}
