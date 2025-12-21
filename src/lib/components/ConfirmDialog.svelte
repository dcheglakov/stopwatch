<script lang="ts">
	import type { ClickHandler } from '$lib/types/events';

	let {
		dialog = $bindable(),
		title,
		message,
		confirmText = 'Підтвердити',
		cancelText = 'Скасувати',
		onconfirm,
		oncancel
	}: {
		dialog: HTMLDialogElement | null;
		title: string;
		message: string;
		confirmText?: string;
		cancelText?: string;
		onconfirm?: () => void;
		oncancel?: () => void;
	} = $props();

	const handleConfirm: ClickHandler = () => {
		onconfirm?.();
		dialog?.close();
	};

	const handleCancel: ClickHandler = () => {
		oncancel?.();
		dialog?.close();
	};
</script>

<dialog
	bind:this={dialog}
	class="border-gray-6 bg-gray-2 text-gray-11 m-auto max-w-md rounded-xl border-2 p-0 backdrop:bg-black/40 backdrop:backdrop-blur-sm"
>
	<div class="p-6">
		<h2 class="text-gray-12 mb-2 text-xl font-bold">{title}</h2>
		<p class="text-gray-11 mb-6">{message}</p>

		<div class="flex justify-end gap-3">
			<button
				class="bg-gray-5 text-gray-11 hover:bg-gray-6 rounded-lg px-4 py-2"
				onclick={handleCancel}
			>
				{cancelText}
			</button>
			<button
				class="bg-danger-9 text-danger-1 hover:bg-danger-10 rounded-lg px-4 py-2"
				onclick={handleConfirm}
			>
				{confirmText}
			</button>
		</div>
	</div>
</dialog>
