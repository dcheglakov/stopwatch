// Receives lap signals from TrackTime (the phone at the finish line).
//
// TrackTime publishes a small JSON message for each lead crossing to two public
// MQTT brokers and to ntfy.sh, all under a channel named by a short pairing
// code. We listen on all three and keep the first copy of each message, so one
// broker being down or blocked by the venue Wi-Fi does not lose laps.
//
// Each message carries the phone's own time of the crossing (`at`). Network
// delay varies, so we map phone time to laptop time with the smallest offset
// seen so far: the gaps between laps then match the phone exactly.

import { MqttClient, type LinkStatus } from './mqtt';

export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const DEFAULT_BROKERS = [
	'wss://broker.hivemq.com:8884/mqtt',
	'wss://broker.emqx.io:8084/mqtt'
];
export const DEFAULT_NTFY = 'https://ntfy.sh';

export const mqttTopic = (code: string) => `tracktime/v1/${code}`;
export const ntfyTopic = (code: string) => `tracktime-v1-${code}`;

export interface LinkMessage {
	v: 1;
	type: 'lap' | 'ping';
	dev: string; // random id of the sending phone
	seq: number; // per-device counter, for de-duplication
	at: number; // phone clock (epoch ms) of the crossing or ping
	lap?: number; // TrackTime's own lap number (0 = the first crossing)
}

export function newCode(len = 6): string {
	const bytes = crypto.getRandomValues(new Uint8Array(len));
	return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

export function normalizeCode(s: string): string {
	return s.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

export function parseMessage(text: string): LinkMessage | null {
	try {
		const m = JSON.parse(text);
		if (
			m &&
			m.v === 1 &&
			(m.type === 'lap' || m.type === 'ping') &&
			typeof m.dev === 'string' &&
			Number.isFinite(m.seq) &&
			Number.isFinite(m.at)
		)
			return m as LinkMessage;
	} catch {
		/* not ours */
	}
	return null;
}

/** Maps phone time to laptop time using the smallest offset seen per device. */
export class ClockMap {
	private minOff = new Map<string, number>();
	// A jump this large means a clock was changed, not a slow network: start over.
	constructor(private resetAfterMs = 5000) {}

	/** Returns the laptop time (epoch ms) of the event and the estimated network delay. */
	toLocal(dev: string, at: number, receivedAt: number): { local: number; delay: number } {
		const off = receivedAt - at;
		let m = this.minOff.get(dev);
		if (m === undefined || off < m || off - m > this.resetAfterMs) {
			m = off;
			this.minOff.set(dev, m);
		}
		return { local: at + m, delay: off - m };
	}
}

/** Remembers recently seen message ids. */
class Seen {
	private set = new Set<string>();
	add(key: string): boolean {
		if (this.set.has(key)) return false;
		this.set.add(key);
		if (this.set.size > 1000) this.set.delete(this.set.values().next().value!);
		return true;
	}
}

class NtfyListener {
	status: LinkStatus = 'closed';
	private ws: WebSocket | null = null;
	private retryTimer: ReturnType<typeof setTimeout> | undefined;
	private retryMs = 1000;
	private stopped = true;

	constructor(
		private url: string,
		private onMessage: (text: string) => void,
		private onStatus: (s: LinkStatus) => void
	) {}

	start() {
		this.stopped = false;
		this.open();
	}

	stop() {
		this.stopped = true;
		clearTimeout(this.retryTimer);
		this.close();
		this.set('closed');
	}

	private set(s: LinkStatus) {
		if (this.status !== s) {
			this.status = s;
			this.onStatus(s);
		}
	}

	private close() {
		const ws = this.ws;
		this.ws = null;
		if (ws) {
			ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
			try {
				ws.close();
			} catch {
				/* ignore */
			}
		}
	}

	private open() {
		this.close();
		this.set('connecting');
		let ws: WebSocket;
		try {
			ws = new WebSocket(this.url);
		} catch {
			this.retry();
			return;
		}
		this.ws = ws;
		ws.onmessage = (e) => {
			try {
				const ev = JSON.parse(String(e.data));
				if (ev.event === 'open') {
					this.retryMs = 1000;
					this.set('open');
				} else if (ev.event === 'message' && typeof ev.message === 'string') {
					this.onMessage(ev.message);
				}
			} catch {
				/* ignore */
			}
		};
		ws.onclose = () => {
			if (this.ws === ws) this.retry();
		};
		ws.onerror = () => ws.close();
	}

	private retry() {
		this.close();
		if (this.stopped) return;
		this.set('connecting');
		clearTimeout(this.retryTimer);
		this.retryTimer = setTimeout(() => this.open(), this.retryMs);
		this.retryMs = Math.min(this.retryMs * 2, 30000);
	}
}

export interface LinkState {
	links: { name: string; status: LinkStatus }[];
	lastSeen: number | null; // laptop time of the last message from TrackTime
}

export interface ReceiverOptions {
	code: string;
	onLap: (localTime: number, msg: LinkMessage) => void;
	onState?: (state: LinkState) => void;
	brokers?: string[];
	ntfy?: string | null;
}

export class LapReceiver {
	private clients: { name: string; link: MqttClient | NtfyListener }[] = [];
	private seen = new Seen();
	private clock = new ClockMap();
	private lastSeen: number | null = null;

	constructor(private opts: ReceiverOptions) {
		const topic = mqttTopic(opts.code);
		const brokers = opts.brokers ?? DEFAULT_BROKERS;
		const onStatus = () => this.emit();
		for (const url of brokers) {
			const c = new MqttClient({
				url,
				onMessage: (_t, payload) => this.handle(payload),
				onStatus
			});
			c.subscribe(topic);
			this.clients.push({ name: new URL(url).host, link: c });
		}
		const ntfy = opts.ntfy === undefined ? DEFAULT_NTFY : opts.ntfy;
		if (ntfy) {
			const wsUrl = ntfy.replace(/^http/, 'ws') + '/' + ntfyTopic(opts.code) + '/ws';
			this.clients.push({
				name: new URL(ntfy).host,
				link: new NtfyListener(wsUrl, (m) => this.handle(m), onStatus)
			});
		}
	}

	start() {
		for (const c of this.clients) c.link.start();
		this.emit();
	}

	stop() {
		for (const c of this.clients) c.link.stop();
	}

	private handle(text: string) {
		const now = Date.now();
		const msg = parseMessage(text);
		if (!msg || !this.seen.add(`${msg.dev}:${msg.seq}`)) return;
		const { local } = this.clock.toLocal(msg.dev, msg.at, now);
		this.lastSeen = now;
		if (msg.type === 'lap') this.opts.onLap(Math.min(local, now), msg);
		this.emit();
	}

	private emit() {
		this.opts.onState?.({
			links: this.clients.map((c) => ({ name: c.name, status: c.link.status })),
			lastSeen: this.lastSeen
		});
	}
}

/** Test hook: `?relay=ws://host:port[,more]` replaces the brokers, `?ntfy=off|URL`. */
export function linkOverrides(search: string): Pick<ReceiverOptions, 'brokers' | 'ntfy'> {
	const p = new URLSearchParams(search);
	const out: Pick<ReceiverOptions, 'brokers' | 'ntfy'> = {};
	const relay = p.get('relay');
	if (relay) out.brokers = relay.split(',').filter(Boolean);
	const ntfy = p.get('ntfy');
	if (ntfy) out.ntfy = ntfy === 'off' ? null : ntfy;
	return out;
}
