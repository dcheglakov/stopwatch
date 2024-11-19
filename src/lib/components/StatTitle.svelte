<script lang="ts">
	let { title, value } = $props();
</script>

<div class="px-4 py-2 text-center lg:px-6">
	<h2 class="font-light uppercase tracking-wider text-gray-11">{title}</h2>
	<p class="flex items-end justify-center text-9xl font-semibold text-gray-12 md:text-[18rem]">
		{value}
	</p>
</div>
