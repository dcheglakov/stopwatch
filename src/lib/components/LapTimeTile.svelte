<script lang="ts">
	type Props = {
		title: string;
		value: string;
	};
	let { title, value }: Props = $props();
</script>

<div class="px-4 py-2 text-center lg:px-6">
	<h2 class="font-light tracking-wider text-gray-600 uppercase dark:text-gray-400">{title}</h2>
	<p
		class={[
			'flex items-end justify-center font-bold text-gray-900 dark:text-gray-100',
			'text-9xl md:text-[16rem] lg:text-[20rem] xl:text-[24rem] 2xl:text-[28rem]'
		]}
	>
		{value}
	</p>
</div>
