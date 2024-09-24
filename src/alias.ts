const Module = require("module");
const RESOLVER_MAP: Record<string, typeof Module._resolveFilename> = {};
export const addResolveAlias = (
	name: string,
	aliasMap: Record<string, string>
) => {
	const modulePath = require.resolve(name);
	if (RESOLVER_MAP[modulePath]) {
		throw new Error(`Should not add resolve alias to ${name} again.`);
	}
	RESOLVER_MAP[modulePath] = Module._resolveFilename;
	Module._resolveFilename = Module._resolveFilename = (request: string, mod: NodeModule, ...args: unknown[]) => {
			if (mod.filename === modulePath && aliasMap[request]) {
				return aliasMap[request];
			}
			return RESOLVER_MAP[modulePath](request, mod, ...args);
	};
};

export const removeResolveAlias = (name: string) => {
	const modulePath = require.resolve(name);
	if (!RESOLVER_MAP[modulePath]) {
		return;
	}
	const m = require.cache[modulePath];
	if (!m) {
		throw new Error("Failed to resolve webpack-dev-server");
	}
	if (RESOLVER_MAP[modulePath]) {
		Module._resolveFilename = RESOLVER_MAP[modulePath]!;
		delete RESOLVER_MAP[modulePath];
	}
};
