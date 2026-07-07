<script lang="ts">
	import { Tooltip } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { ClickHandler } from '$lib/types/events';

	type Props = {
		tooltip: string;
		children: Snippet;
		class?: string;
		disabled?: boolean;
		onclick?: ClickHandler;
		type?: 'button' | 'submit' | 'reset';
	};

	let {
		tooltip,
		children,
		class: className = '',
		disabled = false,
		onclick,
		type = 'button'
	}: Props = $props();
</script>

<Tooltip.Root>
	<Tooltip.Trigger {disabled} {onclick} {type} class={className} aria-label={tooltip}>
		{@render children()}
	</Tooltip.Trigger>
	<Tooltip.Content
		sideOffset={8}
		collisionPadding={8}
		strategy="fixed"
		class="animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--bits-tooltip-content-transform-origin) z-50"
	>
		<div
			class="max-w-[calc(100vw-1rem)] rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-md dark:bg-gray-100 dark:text-gray-900"
		>
			{tooltip}
		</div>
	</Tooltip.Content>
</Tooltip.Root>
