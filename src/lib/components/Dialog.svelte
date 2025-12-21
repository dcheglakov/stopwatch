<script lang="ts">
	import LucideX from '~icons/lucide/x';
	import type { ClickHandler } from '$lib/types/events';
	import type { Snippet } from 'svelte';

	let {
		dialog = $bindable(),
		children,
		onclose
	}: {
		dialog: HTMLDialogElement | null;
		children: Snippet;
		onclose?: () => void;
	} = $props();

	const handleClose: ClickHandler = () => {
		onclose?.();
		dialog?.close();
	};
</script>

<dialog
	bind:this={dialog}
	class="max-w-2xl rounded-xl border-4 border-gray-300 bg-white text-gray-800 backdrop:bg-black/40 backdrop:backdrop-blur-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
>
	<button
		class="absolute top-4 right-4 rounded-full bg-gray-200 p-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
		onclick={handleClose}><LucideX /></button
	>
	{@render children()}
</dialog>
