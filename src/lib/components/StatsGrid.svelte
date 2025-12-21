<script lang="ts">
	let { children } = $props();
</script>

<div class="grid h-full w-full grid-cols-1 content-center overflow-hidden">
	{@render children()}
</div>
