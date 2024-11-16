<script lang="ts">
	interface Lap {
		lapTime: string;
		totalTime: string;
		elapsedTime: number;
		isFastest: boolean;
		isSlowest: boolean;
	}

	const INITIAL_TIME_DISPLAY = '00:00:00.00';
	const LAP_DISTANCE_METERS = 250;

	let isRunning = $state(false);
	let timeDisplay = $state(INITIAL_TIME_DISPLAY);
	let laps = $state<Lap[]>([]);
	let elapsedTime = $state(0);

	let startTime: number = 0;
	let interval: number | undefined;

	function startStopTimer() {
		if (isRunning) {
			clearInterval(interval);
		} else {
			startTime = Date.now() - elapsedTime;
			interval = setInterval(updateTime, 10);
		}
		isRunning = !isRunning;
	}

	function updateTime() {
		elapsedTime = Date.now() - startTime;
		timeDisplay = formatTime(elapsedTime);
	}

	function formatTime(ms: number) {
		let milliseconds = Math.floor((ms % 1000) / 10);
		let seconds = Math.floor((ms / 1000) % 60);
		let minutes = Math.floor((ms / (1000 * 60)) % 60);
		let hours = Math.floor(ms / (1000 * 60 * 60));

		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
	}

	function addLap() {
		if (isRunning) {
			const lapTime = elapsedTime - (laps.length ? laps[0].elapsedTime : 0);
			const totalTime = elapsedTime;
			const lap: Lap = {
				lapTime: formatTime(lapTime),
				totalTime: formatTime(totalTime),
				elapsedTime: totalTime,
				isFastest: false,
				isSlowest: false
			};
			laps = [lap, ...laps]; // Додаємо нове коло на початок списку

			markFastestSlowestLaps();
		}
	}

	function markFastestSlowestLaps() {
		if (laps.length < 2) return;

		let fastestLapTime = Math.min(...laps.map((lap) => parseTime(lap.lapTime)));
		let slowestLapTime = Math.max(...laps.map((lap) => parseTime(lap.lapTime)));

		laps = laps.map((lap) => ({
			...lap,
			isFastest: parseTime(lap.lapTime) === fastestLapTime,
			isSlowest: parseTime(lap.lapTime) === slowestLapTime
		}));
	}

	function parseTime(timeString: string) {
		const [hours, minutes, secondsMilliseconds] = timeString.split(':');
		const [seconds, milliseconds] = secondsMilliseconds.split('.');
		return (
			parseInt(hours) * 60 * 60 * 1000 +
			parseInt(minutes) * 60 * 1000 +
			parseInt(seconds) * 1000 +
			parseInt(milliseconds) * 10
		);
	}

	function resetTimer() {
		clearInterval(interval);
		elapsedTime = 0;
		timeDisplay = INITIAL_TIME_DISPLAY;
		laps = [];
		isRunning = false;
	}
</script>

<main class="stopwatch">
	<h1 class="px-4 py-24 text-center font-mono text-9xl">{timeDisplay}</h1>
	<table class="m-auto font-mono">
		<thead>
			<tr>
				<th>Lap</th>
				<th>Lap Time</th>
				<th>Total Time</th>
			</tr>
		</thead>
		<tbody>
			{#each laps as lap, index}
				<tr class="{lap.isFastest ? 'fastest' : ''} {lap.isSlowest ? 'slowest' : ''}">
					<td>{laps.length - index}</td>
					<td>{lap.lapTime}</td>
					<td>{lap.totalTime}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</main>

<footer
	class="fixed inset-x-0 bottom-0 flex items-center justify-center gap-5 bg-gray-900 p-4 text-white"
>
	<button onclick={startStopTimer}>{isRunning ? 'Stop' : 'Start'}</button>
	<button onclick={addLap} disabled={!isRunning}>Lap</button>
	<button onclick={resetTimer} disabled={isRunning || elapsedTime === 0}>Reset</button>
</footer>

<style>
	.fastest {
		color: green;
		font-weight: bold;
	}
	.slowest {
		color: red;
		font-weight: bold;
	}
</style>
