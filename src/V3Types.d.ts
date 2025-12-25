import { RawHeaders } from "@mercuryworkshop/proxy-transports";

export interface BareResponseHeaders {
	headers: RawHeaders;
	status: number;
	statusText: string;
}

export interface SocketClientToServer {
	type: "connect";
	/**
	 * Remote to connect to
	 */
	remote: string;
	/**
	 * An array of protocols to attempt to connect to.
	 */
	protocols: string[];
	/**
	 * Headers to send to the remote. Usually Cookie, Origin, and User-Agent.
	 */
	headers: Record<string, string>;
	/**
	 * Forwards to forward from the WebSocket handshake (eg. User-Agent)
	 */
	forwardHeaders: string[];
}

export interface SocketServerToClient {
	type: "open";
	/**
	 * The protocl that the remote chose.
	 */
	protocol: string;
	/**
	 * A list of cookies that correspond to the remote's set-cookies
	 */
	setCookies: string[];
}

