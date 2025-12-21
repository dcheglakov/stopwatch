<script lang="ts">
	let { timeDisplay }: { timeDisplay: string } = $props();
</script>

<div class="p-4 text-center font-mono">
	<span
		class="inline-flex items-center gap-2 rounded-full bg-gray-700 px-4 py-2 text-white dark:bg-gray-600"
		>{timeDisplay}</span
	>
</div>
