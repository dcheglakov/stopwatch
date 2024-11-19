<script lang="ts">
	let { timeDisplay }: { timeDisplay: string } = $props();
</script>

<div class="p-4 text-center font-mono">
	<span class="inline-flex items-center gap-2 rounded-full bg-gray-10 px-4 py-2 text-gray-1"
		>{timeDisplay}</span
	>
</div>
