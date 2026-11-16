import { PersistedState } from 'runed';
import { onMount, onDestroy } from 'svelte';
import { LapReceiver, linkOverrides, newCode, type LinkState } from '$lib/remote/link';

interface StopwatchControls {
	readonly isRunning: boolean;
	readonly isFinished: boolean;
	readonly elapsedTime: number;
	startTimer: (at?: number) => void;
	addLap: (at?: number) => void;
}

/** Adds laps (and optionally starts the clock) from TrackTime's lap signals. */
export function useRemoteLaps(stopwatch: StopwatchControls) {
	const enabled = new PersistedState<boolean>('stopwatch-remote-enabled', false);
	const code = new PersistedState<string>('stopwatch-remote-code', '');
	const autoStart = new PersistedState<boolean>('stopwatch-remote-autostart', true);

	let linkState = $state<LinkState>({ links: [], lastSeen: null });
	let lastSignal = $state<{ at: number; result: 'lap' | 'start' | 'ignored' } | null>(null);
	let receiver: LapReceiver | null = null;
	let mounted = false;

	function onLap(localTime: number) {
		let result: 'lap' | 'start' | 'ignored' = 'ignored';
		if (stopwatch.isFinished) result = 'ignored';
		else if (stopwatch.isRunning) {
			stopwatch.addLap(localTime);
			result = 'lap';
		} else if (autoStart.current && stopwatch.elapsedTime === 0) {
			stopwatch.startTimer(localTime);
			result = 'start';
		}
		lastSignal = { at: Date.now(), result };
	}

	function restart() {
		receiver?.stop();
		receiver = null;
		linkState = { links: [], lastSeen: null };
		if (!mounted || !enabled.current || !code.current) return;
		receiver = new LapReceiver({
			code: code.current,
			onLap,
			onState: (s) => (linkState = s),
			...linkOverrides(location.search)
		});
		receiver.start();
	}

	function setEnabled(on: boolean) {
		if (on && !code.current) code.current = newCode();
		enabled.current = on;
		restart();
	}

	function regenerateCode() {
		code.current = newCode();
		restart();
	}

	onMount(() => {
		mounted = true;
		restart();
	});
	onDestroy(() => {
		mounted = false;
		receiver?.stop();
	});

	return {
		get enabled() {
			return enabled.current;
		},
		get code() {
			return code.current;
		},
		get autoStart() {
			return autoStart.current;
		},
		set autoStart(v: boolean) {
			autoStart.current = v;
		},
		get linkState() {
			return linkState;
		},
		get lastSignal() {
			return lastSignal;
		},
		/** At least one relay is connected. */
		get connected() {
			return linkState.links.some((l) => l.status === 'open');
		},
		setEnabled,
		regenerateCode
	};
}
