<script lang="ts">
	import type { Lap } from '$lib/types';

	let { laps }: { laps: Lap[] } = $props();
</script>

{#snippet th(title: string)}
	<th class="border-b border-gray-400 px-4 py-2 text-right text-sm font-medium">{title}</th>
{/snippet}

{#snippet td(value: number | string)}
	<td class="border-b border-gray-400 px-4 py-2 text-right text-sm">{value}</td>
{/snippet}

{#if laps.length === 0}
	<div class="flex h-full items-center justify-center text-slate-800">
		<p>Немає кіл</p>
	</div>
{:else}
	<table class="m-auto w-full table-auto">
		<thead class="sticky top-12 bg-gray-700 text-white">
			<tr>
				{@render th('Коло')}
				{@render th('Час на коло')}
				{@render th('Загальний час')}
				{@render th('Швидкість (км/год)')}
			</tr>
		</thead>
		<tbody>
			{#each laps as lap, index}
				<tr
					class={lap.isFastest
						? 'bg-purple-500 text-purple-100'
						: lap.isSlowest
							? 'bg-red-600 text-red-100'
							: 'bg-gray-600 even:bg-gray-500'}
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
