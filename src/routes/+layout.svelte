<script lang="ts">
	import '../app.css';
	import { Tooltip } from 'bits-ui';

	let { children } = $props();
</script>

<Tooltip.Provider delayDuration={300}>
	{@render children()}
</Tooltip.Provider>
