<script lang="ts">
	let { children } = $props();
</script>

<div class="m-auto grid h-full w-full max-w-2xl grid-cols-1 content-center gap-6 p-4">
	{@render children()}
</div>
