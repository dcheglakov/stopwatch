<script lang="ts">
	let { title, value } = $props();
</script>

<div class="rounded-lg bg-slate-950 px-4 py-2 text-slate-200 lg:px-6 lg:py-4">
	<h2 class="pb-2 font-semibold uppercase tracking-wider">{title}</h2>
	<p class="flex items-end font-mono text-8xl font-semibold xl:text-[12rem]">
		{value}
	</p>
</div>
