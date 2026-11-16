// A very small MQTT 3.1.1 client over WebSocket: connect, subscribe and publish
// at QoS 0, with keep-alive pings and automatic reconnects. Enough to pass lap
// messages through a public broker; no dependencies.

export type LinkStatus = 'connecting' | 'open' | 'closed';

const enc = new TextEncoder();
const dec = new TextDecoder();

function str(s: string): number[] {
	const b = enc.encode(s);
	return [b.length >> 8, b.length & 0xff, ...b];
}

function packet(type: number, body: number[]): Uint8Array<ArrayBuffer> {
	const len: number[] = [];
	let n = body.length;
	do {
		let byte = n % 128;
		n = Math.floor(n / 128);
		if (n > 0) byte |= 0x80;
		len.push(byte);
	} while (n > 0);
	return new Uint8Array([type, ...len, ...body]);
}

export interface MqttOptions {
	url: string;
	clientId?: string;
	keepAliveSec?: number;
	onMessage?: (topic: string, payload: string) => void;
	onStatus?: (status: LinkStatus) => void;
}

export class MqttClient {
	status: LinkStatus = 'closed';
	private ws: WebSocket | null = null;
	private buf = new Uint8Array(0);
	private topics = new Set<string>();
	private pingTimer: ReturnType<typeof setInterval> | undefined;
	private retryTimer: ReturnType<typeof setTimeout> | undefined;
	private retryMs = 1000;
	private lastRx = 0;
	private packetId = 1;
	private stopped = true;
	private readonly keepAlive: number;
	private readonly clientId: string;

	constructor(private opts: MqttOptions) {
		this.keepAlive = opts.keepAliveSec ?? 20;
		this.clientId = opts.clientId ?? 'tt-' + Math.random().toString(36).slice(2, 12);
	}

	start() {
		this.stopped = false;
		this.open();
	}

	stop() {
		this.stopped = true;
		clearTimeout(this.retryTimer);
		this.teardown();
		this.setStatus('closed');
	}

	subscribe(topic: string) {
		this.topics.add(topic);
		if (this.status === 'open') this.sendSubscribe(topic);
	}

	/** Sends at QoS 0. Returns false when not connected (the message is dropped). */
	publish(topic: string, payload: string): boolean {
		if (this.status !== 'open' || !this.ws) return false;
		this.ws.send(packet(0x30, [...str(topic), ...enc.encode(payload)]));
		return true;
	}

	private setStatus(s: LinkStatus) {
		if (this.status === s) return;
		this.status = s;
		this.opts.onStatus?.(s);
	}

	private open() {
		this.teardown();
		this.setStatus('connecting');
		let ws: WebSocket;
		try {
			ws = new WebSocket(this.opts.url, 'mqtt');
		} catch {
			this.scheduleRetry();
			return;
		}
		ws.binaryType = 'arraybuffer';
		this.ws = ws;
		ws.onopen = () => {
			const flags = 0x02; // clean session
			ws.send(
				packet(0x10, [
					...str('MQTT'),
					4,
					flags,
					this.keepAlive >> 8,
					this.keepAlive & 0xff,
					...str(this.clientId)
				])
			);
		};
		ws.onmessage = (e) => this.onData(new Uint8Array(e.data as ArrayBuffer));
		ws.onclose = () => {
			if (this.ws !== ws) return;
			this.teardown();
			this.scheduleRetry();
		};
		ws.onerror = () => ws.close();
	}

	private teardown() {
		clearInterval(this.pingTimer);
		this.pingTimer = undefined;
		this.buf = new Uint8Array(0);
		const ws = this.ws;
		this.ws = null;
		if (ws) {
			ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
			try {
				ws.close();
			} catch {
				/* already closed */
			}
		}
	}

	private scheduleRetry() {
		if (this.stopped) return;
		this.setStatus('connecting');
		clearTimeout(this.retryTimer);
		this.retryTimer = setTimeout(() => this.open(), this.retryMs);
		this.retryMs = Math.min(this.retryMs * 2, 15000);
	}

	private sendSubscribe(topic: string) {
		const id = this.packetId++ & 0xffff || 1;
		this.ws?.send(packet(0x82, [id >> 8, id & 0xff, ...str(topic), 0]));
	}

	private onData(chunk: Uint8Array) {
		this.lastRx = Date.now();
		const merged = new Uint8Array(this.buf.length + chunk.length);
		merged.set(this.buf);
		merged.set(chunk, this.buf.length);
		this.buf = merged;
		for (;;) {
			// Fixed header: type byte + variable-length "remaining length".
			let mult = 1,
				len = 0,
				i = 1,
				byte: number;
			do {
				if (i >= this.buf.length) return;
				byte = this.buf[i++];
				len += (byte & 0x7f) * mult;
				mult *= 128;
			} while (byte & 0x80);
			if (this.buf.length < i + len) return;
			const type = this.buf[0] >> 4;
			const body = this.buf.subarray(i, i + len);
			this.buf = this.buf.slice(i + len);
			this.onPacket(type, body);
		}
	}

	private onPacket(type: number, body: Uint8Array) {
		if (type === 2) {
			// CONNACK
			if (body[1] !== 0) {
				this.ws?.close();
				return;
			}
			this.retryMs = 1000;
			this.setStatus('open');
			for (const t of this.topics) this.sendSubscribe(t);
			clearInterval(this.pingTimer);
			this.pingTimer = setInterval(() => {
				if (Date.now() - this.lastRx > this.keepAlive * 2500) {
					this.ws?.close(); // dead link: reconnect
					return;
				}
				this.ws?.send(new Uint8Array([0xc0, 0]));
			}, this.keepAlive * 500);
		} else if (type === 3) {
			// PUBLISH (we only subscribe at QoS 0, so there is no packet id)
			const tlen = (body[0] << 8) | body[1];
			const topic = dec.decode(body.subarray(2, 2 + tlen));
			const payload = dec.decode(body.subarray(2 + tlen));
			this.opts.onMessage?.(topic, payload);
		}
	}
}
