export const INITIAL_TIME_DISPLAY = '00:00:00.00';
export const LAP_DISTANCE_METERS = 250;
export const TOTAL_DISTANCE_METERS = 2_000;

export function formatTime(ms: number, includeHours: boolean = false) {
	let milliseconds = Math.floor((ms % 1000) / 10);
	let seconds = Math.floor((ms / 1000) % 60);
	let minutes = Math.floor((ms / (1000 * 60)) % 60);
	let hours = Math.floor(ms / (1000 * 60 * 60));

	if (includeHours) {
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
	} else {
		return `${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
	}
}

export function parseTime(timeString: string) {
	const [secondsMilliseconds] = timeString.split(':');
	const [seconds, milliseconds] = secondsMilliseconds.split('.');
	return parseInt(seconds) * 1000 + parseInt(milliseconds) * 10;
}
