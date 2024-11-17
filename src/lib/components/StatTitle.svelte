<script lang="ts">
	let { title, value } = $props();
</script>

<div class="rounded-lg bg-slate-950 px-8 py-6 text-slate-200">
	<h2 class="pb-2 font-semibold uppercase tracking-wider">{title}</h2>
	<p class="flex items-end font-mono text-8xl font-semibold xl:text-[9rem]">
		{value}
	</p>
</div>
