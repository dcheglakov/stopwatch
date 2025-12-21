<script lang="ts">
	type Props = {
		title: string;
		value: string;
	};
	let { title, value }: Props = $props();
</script>

<div class="bg-gray-100 p-6 lg:px-6 dark:bg-gray-950">
	<h2 class="pb-2 font-light tracking-wider text-gray-600 uppercase dark:text-gray-400">{title}</h2>
	<p class={['font-medium text-gray-900 dark:text-gray-100', 'text-3xl md:text-5xl']}>
		{value}
	</p>
</div>
