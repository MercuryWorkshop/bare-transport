import { Client } from "./Client";
import { BareError } from "./BareTypes";
import type {
	BareResponseHeaders,
	SocketClientToServer,
	SocketServerToClient,
} from "./V3Types.js";
import md5 from "./md5.js";
import { WebSocketFields } from "./snapshot.js";
import { joinHeaders, splitHeaders } from "./splitHeaderUtil.js";
import type {
	ProxyTransport,
	RawHeaders,
	TransferrableResponse,
} from "@mercuryworkshop/proxy-transports";

export default class ClientV3 extends Client implements ProxyTransport {
	ws: URL;
	http: URL;
	ready = true;

	constructor(server: URL) {
		super(3, server);

		this.ws = new URL(this.base);
		this.http = new URL(this.base);

		if (this.ws.protocol === "https:") {
			this.ws.protocol = "wss:";
		} else {
			this.ws.protocol = "ws:";
		}
	}

	async init() {
		this.ready = true;
	}
	connect(
		url: URL,
		protocols: string[],
		requestHeaders: RawHeaders = [],
		onopen: (protocol: string, extensions: string) => void,
		onmessage: (data: Blob | ArrayBuffer | string) => void,
		onclose: (code: number, reason: string) => void,
		onerror: (error: string) => void
	): [
		(data: Blob | ArrayBuffer | string) => void,
		(code: number, reason: string) => void,
	] {
		const ws = new WebSocket(this.ws);
		requestHeaders.push(["Host", url.host])
		requestHeaders.push(["Upgrade", "websocket"])
		requestHeaders.push(["Connection", "Upgrade"])

		const cleanup = () => {
			ws.removeEventListener("close", closeListener);
			ws.removeEventListener("message", messageListener);
		};

		const messageListener = (event: MessageEvent) => {
			cleanup();

			// ws.binaryType is irrelevant when sending text
			if (typeof event.data !== "string")
				throw new TypeError("the first websocket message was not a text frame");

			const message = JSON.parse(event.data) as SocketServerToClient;

			// finally
			if (message.type !== "open")
				throw new TypeError("message was not of open type");


			onopen(message.protocol, "");

			ws.addEventListener("message", (ev) => {
				onmessage(ev.data);
			});

			ws.addEventListener("close", (ev) => {
				onclose(ev.code, ev.reason);
			});
		};

		const closeListener = (event: CloseEvent) => {
			onclose(event.code, event.reason);
			cleanup();
		};

		ws.addEventListener("message", messageListener);
		ws.addEventListener("close", closeListener);

		// CONNECTED TO THE BARE SERVER, NOT THE REMOTE
		ws.addEventListener(
			"open",
			(event) => {
				WebSocketFields.prototype.send.call(
					ws,
					JSON.stringify({
						type: "connect",
						remote: url.toString(),
						protocols,
						headers: Object.fromEntries(requestHeaders),
						forwardHeaders: [],
					} as unknown as SocketClientToServer)
				);
			},
			// only block the open event once
			{ once: true }
		);

		return [ws.send.bind(ws), ws.close.bind(ws)];
	}

	async request(
		remote: URL,
		method: string,
		body: BodyInit | null,
		headers: RawHeaders,
		signal: AbortSignal | undefined
	): Promise<TransferrableResponse> {
		const options: RequestInit = {
			credentials: "omit",
			method: method,
			signal,
			//@ts-expect-error this exists but isnt typed ig
			duplex: "half",
		};

		if (body !== undefined) {
			options.body = body;
		}
		
		headers.push(["Host", remote.host])
		options.headers = this.createBareHeaders(remote, headers);

		const response = await fetch(
			this.http + "?cache=" + md5(remote.toString()),
			options
		);

		const readResponse = await this.readBareResponse(response);

		return {
			body: response.body!,
			headers: readResponse.headers,
			status: readResponse.status,
			statusText: readResponse.statusText,
		};
	}

	private async readBareResponse(response: Response) {
		if (!response.ok) {
			throw new BareError(response.status, await response.json());
		}

		const responseHeaders = joinHeaders(response.headers);

		const result: Partial<BareResponseHeaders> = {};

		const xBareStatus = responseHeaders.get("x-bare-status");
		if (xBareStatus !== null) result.status = parseInt(xBareStatus);

		const xBareStatusText = responseHeaders.get("x-bare-status-text");
		if (xBareStatusText !== null) result.statusText = xBareStatusText;

		const xBareHeaders = responseHeaders.get("x-bare-headers");
		if (xBareHeaders !== null) result.headers = Object.entries(JSON.parse(xBareHeaders));

		return result as BareResponseHeaders;
	}
	createBareHeaders(
		remote: URL,
		bareHeaders: RawHeaders,
		forwardHeaders: string[] = [],
		passHeaders: string[] = [],
		passStatus: number[] = []
	) {
		const headers = new Headers();

		headers.set("x-bare-url", remote.toString());
		headers.set("x-bare-headers", JSON.stringify(Object.fromEntries(bareHeaders)));

		for (const header of forwardHeaders) {
			headers.append("x-bare-forward-headers", header);
		}

		for (const header of passHeaders) {
			headers.append("x-bare-pass-headers", header);
		}

		for (const status of passStatus) {
			headers.append("x-bare-pass-status", status.toString());
		}

		splitHeaders(headers);

		return headers;
	}
}
