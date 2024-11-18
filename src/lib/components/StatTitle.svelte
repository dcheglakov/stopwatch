<script lang="ts">
	let { title, value } = $props();
</script>

<div class="rounded-2xl border-2 border-gray-7 bg-gray-3 px-4 py-2 text-center lg:px-6 lg:py-4">
	<h2 class="pb-2 font-light uppercase tracking-wider text-gray-11">{title}</h2>
	<p
		class="flex items-end justify-center font-mono text-8xl font-semibold text-gray-12 xl:text-[12rem]"
	>
		{value}
	</p>
</div>
