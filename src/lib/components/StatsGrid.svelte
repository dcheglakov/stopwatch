<script lang="ts">
	let { children } = $props();
</script>

<div class="grid h-full grid-cols-1 content-center gap-4 p-12 lg:grid-cols-2">
	{@render children()}
</div>
