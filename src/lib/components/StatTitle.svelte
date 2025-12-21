<script lang="ts">
	let { title, value } = $props();

	// Перевірка чи значення містить багато тексту (наприклад "5.2 / 250.0 км")
	const isLongValue = $derived(value.length > 4);
</script>

<div class="px-4 py-2 text-center lg:px-6">
	<h2 class="font-light tracking-wider text-gray-600 uppercase dark:text-gray-400">{title}</h2>
	<p
		class="flex items-end justify-center font-semibold text-gray-900 dark:text-gray-100 {isLongValue
			? 'text-5xl md:text-7xl'
			: 'text-9xl md:text-[18rem]'}"
	>
		{value}
	</p>
</div>
