<script lang="ts">
	import type { Lap } from '$lib/types';

	let { laps }: { laps: Lap[] } = $props();
</script>

{#snippet th(title: string)}
	<th
		class="border-b border-gray-300 px-4 py-2 text-right text-sm font-bold text-gray-900 dark:border-gray-600 dark:text-white"
		>{title}</th
	>
{/snippet}

{#snippet td(value: number | string)}
	<td class="border-b border-gray-200 px-4 py-2 text-right text-sm dark:border-gray-700">{value}</td
	>
{/snippet}

{#if laps.length === 0}
	<div class="flex items-center justify-center text-gray-600 dark:text-gray-400">
		<p>Немає кіл</p>
	</div>
{:else}
	<table class="m-auto w-full table-auto">
		<thead class="sticky top-16 bg-gray-200 dark:bg-gray-700">
			<tr>
				{@render th('Коло')}
				{@render th('Час')}
				{@render th('Загальний час')}
				{@render th('Швидкість')}
			</tr>
		</thead>
		<tbody>
			{#each laps as lap, index (lap)}
				<tr
					class={lap.isFastest
						? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
						: lap.isSlowest
							? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
							: 'dark:even:bg-gray-750 bg-white text-gray-700 even:bg-gray-50 dark:bg-gray-800 dark:text-gray-300'}
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
