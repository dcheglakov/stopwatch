<script lang="ts">
	let { timeDisplay }: { timeDisplay: string } = $props();
</script>

<div class="p-6 text-center font-mono lg:col-span-2">
	<span class="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-white"
		>{timeDisplay}</span
	>
</div>
