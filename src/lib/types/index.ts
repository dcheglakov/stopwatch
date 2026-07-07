export interface Lap {
	lapTime: string;
	totalTime: string;
	elapsedTime: number;
}

export type {
	ClickHandler,
	KeyboardHandler,
	SubmitHandler,
	InputHandler,
	ChangeHandler
} from './events';

export type { StopwatchSettings, TrackMode } from './settings';
