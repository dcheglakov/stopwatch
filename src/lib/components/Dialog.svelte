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
	class="border-gray-6 bg-gray-2 text-gray-11 max-w-2xl rounded-xl border-4 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
>
	<button
		class="bg-gray-5 text-gray-11 hover:bg-gray-6 absolute top-4 right-4 rounded-full p-2"
		onclick={handleClose}><LucideX /></button
	>
	{@render children()}
</dialog>
