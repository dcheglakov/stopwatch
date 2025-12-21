<script lang="ts">
	import LucideX from '~icons/lucide/x';
	import type { ClickHandler } from '$lib/types/events';
	import type { Snippet } from 'svelte';

	let { children, isOpen = $bindable(false) }: { children?: Snippet; isOpen?: boolean } = $props();

	const handleClose: ClickHandler = () => {
		isOpen = false;
	};
</script>

{#if isOpen}
	<aside
		class="fixed inset-y-0 left-0 z-50 w-full max-w-lg overflow-y-auto bg-white shadow-lg shadow-gray-400 dark:bg-gray-800 dark:shadow-gray-900"
	>
		<header
			class="sticky top-0 flex h-16 items-center justify-between gap-4 bg-white px-4 dark:bg-gray-800"
		>
			<h2 class="text-gray-900 dark:text-white">Статистика</h2>
			<button
				class="rounded bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
				onclick={handleClose}><LucideX /></button
			>
		</header>
		{#if children}
			{@render children()}
		{/if}
	</aside>
{/if}
