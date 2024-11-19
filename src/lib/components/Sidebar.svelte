<script lang="ts">
	import LucideX from '~icons/lucide/x';
	let { children, isOpen = $bindable(false) } = $props();
</script>

{#if isOpen}
	<aside
		class="fixed inset-y-0 left-0 z-50 w-full max-w-lg overflow-y-auto bg-gray-2 shadow-lg shadow-gray-8"
	>
		<header class="sticky top-0 flex h-16 items-center justify-between gap-4 bg-gray-2 px-4">
			<h2 class="text-gray-12">Статистика</h2>
			<button
				class="rounded bg-gray-4 p-2 text-gray-11 hover:bg-gray-5"
				onclick={() => (isOpen = false)}><LucideX /></button
			>
		</header>
		{@render children()}
	</aside>
{/if}
