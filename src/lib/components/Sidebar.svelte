<script lang="ts">
	let { children, isOpen = $bindable(false) } = $props();
</script>

{#if isOpen}
	<aside
		class="fixed inset-y-4 left-1 z-50 w-full max-w-xl overflow-y-auto rounded-xl bg-gray-400 !text-white shadow-2xl"
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
