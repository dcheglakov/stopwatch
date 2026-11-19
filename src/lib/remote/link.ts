// Receives lap signals from TrackTime (the phone at the finish line).
//
// TrackTime publishes a small JSON message for each lead crossing to two public
// MQTT brokers and to ntfy.sh, all under a channel named by a short pairing
// code. We listen on all three and keep the first copy of each message, so one
// broker being down or blocked by the venue Wi-Fi does not lose laps.
//
// Each message carries the phone's own time of the crossing (`at`). Network
// delay varies, so we map phone time to laptop time with the smallest offset
// seen so far: the gaps between laps then match the phone exactly. A lap that
// arrives late (the phone queued it while offline) keeps its real time.
//
// Direct link: the phone also sends a WebRTC offer through the brokers and we
// answer it. The data channel then runs over the local network only, so laps
// keep coming when the hotspot loses its internet.

import { MqttClient, type LinkStatus } from './mqtt';

export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const DEFAULT_BROKERS = [
	'wss://broker.hivemq.com:8884/mqtt',
	'wss://broker.emqx.io:8084/mqtt'
];
export const DEFAULT_NTFY = 'https://ntfy.sh';

export const mqttTopic = (code: string) => `tracktime/v1/${code}`;
export const rtcTopic = (code: string) => `tracktime/v1/${code}/rtc`;
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

/**
 * Maps phone time to laptop time using the smallest offset seen per device.
 *
 * Laps can arrive late (queued on the phone while it was offline), so a lap
 * never moves the offset up. Pings are only ever sent live, so two pings in a
 * row that agree on a much larger offset mean a clock was changed: start over.
 */
export class ClockMap {
	private minOff = new Map<string, number>();
	private bigPing = new Map<string, number>();
	constructor(private resetAfterMs = 5000) {}

	/** Returns the laptop time (epoch ms) of the event and the estimated network delay. */
	toLocal(
		dev: string,
		at: number,
		receivedAt: number,
		live = true
	): { local: number; delay: number } {
		const off = receivedAt - at;
		let m = this.minOff.get(dev);
		if (m === undefined || off < m) {
			m = off;
			this.minOff.set(dev, m);
			this.bigPing.delete(dev);
		} else if (live && off - m > this.resetAfterMs) {
			const prev = this.bigPing.get(dev);
			if (prev !== undefined && Math.abs(prev - off) < 1000) {
				m = off;
				this.minOff.set(dev, m);
				this.bigPing.delete(dev);
			} else {
				this.bigPing.set(dev, off);
			}
		} else if (live) {
			this.bigPing.delete(dev);
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

interface SignalMessage {
	v: 1;
	type: 'offer' | 'answer' | 'hello';
	dev?: string;
	to?: string;
	sid?: string;
	sdp?: string;
}

/** Waits until ICE gathering is complete (or `ms` passes), so one message carries all candidates. */
function gathered(pc: RTCPeerConnection, ms: number): Promise<void> {
	if (pc.iceGatheringState === 'complete') return Promise.resolve();
	return new Promise((resolve) => {
		const t = setTimeout(done, ms);
		function done() {
			clearTimeout(t);
			pc.removeEventListener('icegatheringstatechange', check);
			resolve();
		}
		function check() {
			if (pc.iceGatheringState === 'complete') done();
		}
		pc.addEventListener('icegatheringstatechange', check);
	});
}

/** The laptop's side of the direct link: answers the phone's WebRTC offer. */
class DirectAnswerer {
	status: LinkStatus = 'closed';
	private pc: RTCPeerConnection | null = null;
	private sid = '';
	private seenSids = new Set<string>();

	constructor(
		private signal: (m: SignalMessage) => void,
		private onMessage: (text: string) => void,
		private onStatus: () => void,
		private gatherMs = 3000
	) {}

	static get supported() {
		return typeof RTCPeerConnection === 'function';
	}

	private set(s: LinkStatus) {
		if (this.status !== s) {
			this.status = s;
			this.onStatus();
		}
	}

	async onSignal(m: SignalMessage) {
		if (m.type !== 'offer' || typeof m.sdp !== 'string' || !m.sid || !m.dev) return;
		if (this.seenSids.has(m.sid)) return; // the copy from the other broker
		this.seenSids.add(m.sid);
		// The phone only offers again when its link is gone, so replace ours.
		this.close();
		const pc = new RTCPeerConnection({ iceServers: [] });
		this.pc = pc;
		this.sid = m.sid;
		this.set('connecting');
		pc.ondatachannel = (e) => {
			const dc = e.channel;
			dc.onopen = () => {
				if (this.pc === pc) this.set('open');
			};
			dc.onmessage = (ev) => {
				if (typeof ev.data === 'string') this.onMessage(ev.data);
			};
			dc.onclose = () => {
				if (this.pc === pc) this.close();
			};
			if (dc.readyState === 'open' && this.pc === pc) this.set('open');
		};
		pc.onconnectionstatechange = () => {
			if (this.pc === pc && (pc.connectionState === 'failed' || pc.connectionState === 'closed'))
				this.close();
		};
		try {
			await pc.setRemoteDescription({ type: 'offer', sdp: m.sdp });
			await pc.setLocalDescription(await pc.createAnswer());
			await gathered(pc, this.gatherMs);
			if (this.pc !== pc || !pc.localDescription) return;
			this.signal({ v: 1, type: 'answer', to: m.dev, sid: m.sid, sdp: pc.localDescription.sdp });
		} catch {
			if (this.pc === pc) this.close();
		}
	}

	close() {
		const pc = this.pc;
		this.pc = null;
		try {
			pc?.close();
		} catch {
			/* ignore */
		}
		this.set('closed');
	}
}

export interface LinkState {
	links: { name: string; status: LinkStatus }[];
	direct: LinkStatus | null; // the WebRTC link over the local network (null: not supported)
	lastSeen: number | null; // laptop time of the last message from TrackTime
}

export interface ReceiverOptions {
	code: string;
	onLap: (localTime: number, msg: LinkMessage) => void;
	onState?: (state: LinkState) => void;
	brokers?: string[];
	ntfy?: string | null;
	direct?: boolean;
}

export class LapReceiver {
	private clients: { name: string; link: MqttClient | NtfyListener }[] = [];
	private seen = new Seen();
	private clock = new ClockMap();
	private lastSeen: number | null = null;
	private direct: DirectAnswerer | null = null;
	private maxSeq = new Map<string, number>(); // highest lap message number seen per phone

	private lastSeq(): Record<string, number> {
		return Object.fromEntries(this.maxSeq);
	}

	constructor(private opts: ReceiverOptions) {
		const topic = mqttTopic(opts.code);
		const rtc = rtcTopic(opts.code);
		const brokers = opts.brokers ?? DEFAULT_BROKERS;
		const mqtt: MqttClient[] = [];
		if (opts.direct !== false && DirectAnswerer.supported) {
			this.direct = new DirectAnswerer(
				(m) => {
					const text = JSON.stringify(m);
					for (const c of mqtt) c.publish(rtc, text);
				},
				(text) => this.handle(text),
				() => this.emit()
			);
		}
		for (const url of brokers) {
			const c: MqttClient = new MqttClient({
				url,
				onMessage: (t, payload) => {
					if (t === topic) this.handle(payload);
					else if (t === rtc) this.onSignal(payload);
				},
				onStatus: (s) => {
					// Tell the phone we are (back) here: it re-sends laps after the last
					// one we got, and makes a fresh direct-link offer if it has none.
					if (s === 'open')
						c.publish(rtc, JSON.stringify({ v: 1, type: 'hello', seen: this.lastSeq() }));
					this.emit();
				}
			});
			c.subscribe(topic);
			c.subscribe(rtc);
			mqtt.push(c);
			this.clients.push({ name: new URL(url).host, link: c });
		}
		const onStatus = () => this.emit();
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
		this.direct?.close();
	}

	private onSignal(text: string) {
		try {
			const m = JSON.parse(text);
			if (m && m.v === 1 && m.type === 'offer') this.direct?.onSignal(m as SignalMessage);
		} catch {
			/* not ours */
		}
	}

	private handle(text: string) {
		const now = Date.now();
		const msg = parseMessage(text);
		if (!msg || !this.seen.add(`${msg.dev}:${msg.seq}`)) return;
		if (msg.type === 'lap' && msg.seq > (this.maxSeq.get(msg.dev) ?? 0))
			this.maxSeq.set(msg.dev, msg.seq);
		const { local } = this.clock.toLocal(msg.dev, msg.at, now, msg.type === 'ping');
		this.lastSeen = now;
		if (msg.type === 'lap') this.opts.onLap(Math.min(local, now), msg);
		this.emit();
	}

	private emit() {
		this.opts.onState?.({
			links: this.clients.map((c) => ({ name: c.name, status: c.link.status })),
			direct: this.direct ? this.direct.status : null,
			lastSeen: this.lastSeen
		});
	}
}

/** Test hook: `?relay=ws://host:port[,more]` replaces the brokers, `?ntfy=off|URL`, `?direct=off`. */
export function linkOverrides(
	search: string
): Pick<ReceiverOptions, 'brokers' | 'ntfy' | 'direct'> {
	const p = new URLSearchParams(search);
	const out: Pick<ReceiverOptions, 'brokers' | 'ntfy' | 'direct'> = {};
	if (p.get('direct') === 'off') out.direct = false;
	const relay = p.get('relay');
	if (relay) out.brokers = relay.split(',').filter(Boolean);
	const ntfy = p.get('ntfy');
	if (ntfy) out.ntfy = ntfy === 'off' ? null : ntfy;
	return out;
}
