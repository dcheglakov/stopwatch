<script lang="ts">
	let { title, value } = $props();
</script>

<div class="px-4 text-center lg:px-6 lg:py-4">
	<h2 class="font-light uppercase tracking-wider text-gray-11">{title}</h2>
	<p
		class="flex items-end justify-center font-mono text-8xl font-semibold text-gray-12 xl:text-[17rem]"
	>
		{value}
	</p>
</div>
