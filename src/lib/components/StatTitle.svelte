<script lang="ts">
	let { title, value } = $props();
</script>

<div class="rounded-lg bg-slate-950 px-4 py-2 text-slate-200 lg:px-6 lg:py-4">
	<h2 class="pb-2 font-semibold uppercase tracking-wider">{title}</h2>
	<p class="flex items-end font-mono text-6xl font-semibold md:text-8xl xl:text-[9rem]">
		{value}
	</p>
</div>
