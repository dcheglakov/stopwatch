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
	class="m-auto max-w-md rounded-xl border-2 border-gray-300 bg-white p-0 text-gray-800 backdrop:bg-black/40 backdrop:backdrop-blur-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
>
	<div class="p-6">
		<h2 class="mb-2 text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
		<p class="mb-6 text-gray-700 dark:text-gray-300">{message}</p>

		<div class="flex justify-end gap-3">
			<button
				class="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
				onclick={handleCancel}
			>
				{cancelText}
			</button>
			<button
				class="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
				onclick={handleConfirm}
			>
				{confirmText}
			</button>
		</div>
	</div>
</dialog>
