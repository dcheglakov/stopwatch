<script lang="ts">
	let { title, value } = $props();
</script>

<div class="px-4 py-2 text-center lg:px-6">
	<h2 class="font-light tracking-wider text-gray-600 uppercase dark:text-gray-400">{title}</h2>
	<p
		class="flex items-end justify-center text-9xl font-semibold text-gray-900 md:text-[18rem] dark:text-gray-100"
	>
		{value}
	</p>
</div>
