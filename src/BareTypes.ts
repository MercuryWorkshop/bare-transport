export type BareCache =
	| "default"
	| "no-store"
	| "reload"
	| "no-cache"
	| "force-cache"
	| "only-if-cached"
	| string;

export interface BareWebSocketMeta {
	protocol: string;
	setCookies: string[];
}

export type BareHTTPProtocol = "blob:" | "http:" | "https:" | string;
export type BareWSProtocol = "ws:" | "wss:" | string;

export const maxRedirects = 20;

export interface BareMaintainer {
	email?: string;
	website?: string;
}

export interface BareProject {
	name?: string;
	description?: string;
	email?: string;
	website?: string;
	repository?: string;
	version?: string;
}

export type BareLanguage =
	| "NodeJS"
	| "ServiceWorker"
	| "Deno"
	| "Java"
	| "PHP"
	| "Rust"
	| "C"
	| "C++"
	| "C#"
	| "Ruby"
	| "Go"
	| "Crystal"
	| "Shell"
	| string;

export interface BareManifest {
	maintainer?: BareMaintainer;
	project?: BareProject;
	versions: string[];
	language: BareLanguage;
	memoryUsage?: number;
}


export interface BareErrorBody {
	code: string;
	id: string;
	message?: string;
	stack?: string;
}

export class BareError extends Error {
	status: number;
	body: BareErrorBody;
	constructor(status: number, body: BareErrorBody) {
		super(body.message || body.code);
		this.status = status;
		this.body = body;
	}
}