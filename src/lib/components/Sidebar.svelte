<script lang="ts">
	let { children, isOpen = $bindable(false) } = $props();
</script>

{#if isOpen}
	<aside
		class="fixed inset-y-0 left-0 z-50 w-full max-w-xl overflow-y-auto bg-gray-400 !text-white"
	>
		<header
			class="sticky top-0 flex h-12 items-center justify-between gap-4 bg-gray-400 px-4 py-2 text-gray-900"
		>
			<h2 class="font-bold">Кола</h2>
			<button class="" onclick={() => (isOpen = false)}>Закрити</button>
		</header>
		{@render children()}
	</aside>
{/if}
