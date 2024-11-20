<script lang="ts">
	import LucideX from '~icons/lucide/x';
	let {
		dialog = $bindable(),
		children,
		onclose
	}: { dialog: HTMLDialogElement | null; children: any; onclose?: () => void } = $props();
</script>

<dialog
	bind:this={dialog}
	class="max-w-2xl rounded-xl border-4 border-gray-6 bg-gray-2 text-gray-11 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
>
	<button
		class="absolute right-4 top-4 rounded-full bg-gray-5 p-2 text-gray-11 hover:bg-gray-6"
		onclick={() => {
			onclose?.();
			dialog?.close();
		}}><LucideX /></button
	>
	{@render children()}
</dialog>
