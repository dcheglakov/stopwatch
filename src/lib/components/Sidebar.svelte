<script lang="ts">
	import LucideX from '~icons/lucide/x';
	import type { ClickHandler } from '$lib/types/events';
	import type { Snippet } from 'svelte';

	let { children, isOpen = $bindable(false) }: { children: Snippet; isOpen?: boolean } = $props();

	const handleClose: ClickHandler = () => {
		isOpen = false;
	};
</script>

{#if isOpen}
	<aside
		class="bg-gray-2 shadow-gray-8 fixed inset-y-0 left-0 z-50 w-full max-w-lg overflow-y-auto shadow-lg"
	>
		<header class="bg-gray-2 sticky top-0 flex h-16 items-center justify-between gap-4 px-4">
			<h2 class="text-gray-12">Статистика</h2>
			<button class="bg-gray-4 text-gray-11 hover:bg-gray-5 rounded p-2" onclick={handleClose}
				><LucideX /></button
			>
		</header>
		{@render children()}
	</aside>
{/if}
