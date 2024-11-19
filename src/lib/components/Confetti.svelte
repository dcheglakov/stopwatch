<script lang="ts">
	import Confetti from 'svelte-confetti';
</script>

<div
	class="pointer-events-none fixed -top-12 left-0 flex h-screen w-screen justify-center overflow-hidden"
>
	<Confetti
		x={[-5, 5]}
		y={[0, 0.1]}
		delay={[500, 2000]}
		infinite
		duration={5000}
		amount={200}
		fallDistance="100vh"
	/>
</div>
