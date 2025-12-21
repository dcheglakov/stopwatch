export const INITIAL_TIME_DISPLAY = '00:00:00.00';

export function formatTime(ms: number, includeHours: boolean = false) {
	const milliseconds = Math.floor((ms % 1000) / 10);
	const seconds = Math.floor((ms / 1000) % 60);
	const minutes = Math.floor((ms / (1000 * 60)) % 60);
	const hours = Math.floor(ms / (1000 * 60 * 60));

	if (includeHours) {
		return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
	} else if (minutes > 0 || hours > 0) {
		// Якщо є хвилини або години, показуємо формат MM:SS.mm
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
	} else {
		return `${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}`;
	}
}

export function parseTime(timeString: string) {
	// Підтримує формати: "SS.mm", "MM:SS.mm", "HH:MM:SS.mm"
	const parts = timeString.split(':');
	const [timePart, milliseconds] = parts[parts.length - 1].split('.');

	let totalMs = 0;

	if (parts.length === 1) {
		// Формат: "SS.mm"
		totalMs = parseInt(timePart) * 1000;
	} else if (parts.length === 2) {
		// Формат: "MM:SS.mm"
		const minutes = parseInt(parts[0]);
		const seconds = parseInt(timePart);
		totalMs = minutes * 60 * 1000 + seconds * 1000;
	} else if (parts.length === 3) {
		// Формат: "HH:MM:SS.mm"
		const hours = parseInt(parts[0]);
		const minutes = parseInt(parts[1]);
		const seconds = parseInt(timePart);
		totalMs = hours * 60 * 60 * 1000 + minutes * 60 * 1000 + seconds * 1000;
	}

	totalMs += parseInt(milliseconds) * 10;
	return totalMs;
}
