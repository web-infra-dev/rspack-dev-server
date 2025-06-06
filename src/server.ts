/**
 * The following code is modified based on
 * https://github.com/webpack/webpack-dev-server/blob/b0f15ace0123c125d5870609ef4691c141a6d187/lib/Server.js
 *
 * MIT Licensed
 * Author Tobias Koppers @sokra
 * Copyright (c) JS Foundation and other contributors
 * https://github.com/webpack/webpack-dev-server/blob/b0f15ace0123c125d5870609ef4691c141a6d187/LICENSE
 */
import type { Server } from "node:http";
import type { Socket } from "node:net";
import { type Compiler, MultiCompiler } from "@rspack/core";
import type { FSWatcher } from "chokidar";
import WebpackDevServer from "webpack-dev-server";
// @ts-ignore 'package.json' is not under 'rootDir'
import { version } from "../package.json";

import type { DevServer, ResolvedDevServer } from "./config";
import { applyDevServerPatch } from "./patch";

applyDevServerPatch();

const getFreePort = async function getFreePort(port: string, host: string) {
	if (typeof port !== "undefined" && port !== null && port !== "auto") {
		return port;
	}

	const { default: pRetry } = await import("p-retry");
	const getPort = require("webpack-dev-server/lib/getPort");
	const basePort =
		typeof process.env.WEBPACK_DEV_SERVER_BASE_PORT !== "undefined"
			? Number.parseInt(process.env.WEBPACK_DEV_SERVER_BASE_PORT, 10)
			: 8080;

	// Try to find unused port and listen on it for 3 times,
	// if port is not specified in options.
	const defaultPortRetry =
		typeof process.env.WEBPACK_DEV_SERVER_PORT_RETRY !== "undefined"
			? Number.parseInt(process.env.WEBPACK_DEV_SERVER_PORT_RETRY, 10)
			: 3;

	return pRetry(() => getPort(basePort, host), {
		retries: defaultPortRetry,
	});
};

WebpackDevServer.getFreePort = getFreePort;

export class RspackDevServer extends WebpackDevServer {
	static getFreePort = getFreePort;
	/**
	 * resolved after `normalizedOptions`
	 */
	/** @ts-ignore: types of path data of rspack is not compatible with webpack */
	declare options: ResolvedDevServer;

	declare staticWatchers: FSWatcher[];

	declare sockets: Socket[];

	declare server: Server;
	// TODO: remove @ts-ignore here
	/** @ts-ignore */
	public compiler: Compiler | MultiCompiler;
	public webSocketServer:
		| WebpackDevServer.WebSocketServerImplementation
		| undefined;
	static version: string = version;

	constructor(options: DevServer, compiler: Compiler | MultiCompiler) {
		// biome-ignore lint/suspicious/noExplicitAny: _
		super(options as WebpackDevServer.Configuration, compiler as any);
		// override
	}

	async initialize() {
		const compilers =
			this.compiler instanceof MultiCompiler
				? this.compiler.compilers
				: [this.compiler];

		for (const compiler of compilers) {
			const mode = compiler.options.mode || process.env.NODE_ENV;
			if (this.options.hot) {
				if (mode === "production") {
					this.logger.warn(
						"Hot Module Replacement (HMR) is enabled for the production build. \n" +
							"Make sure to disable HMR for production by setting `devServer.hot` to `false` in the configuration.",
					);
				}

				compiler.options.resolve.alias = {
					"ansi-html-community": require.resolve(
						"@rspack/dev-server/client/utils/ansiHTML",
					),
					...compiler.options.resolve.alias,
				};
			}
		}

		// @ts-expect-error
		await super.initialize();
	}

	getClientEntry(): string {
		return require.resolve("@rspack/dev-server/client/index");
	}

	getClientHotEntry(): string | undefined {
		if (this.options.hot === "only") {
			return require.resolve("@rspack/core/hot/only-dev-server");
		}
		if (this.options.hot) {
			return require.resolve("@rspack/core/hot/dev-server");
		}
	}
}
