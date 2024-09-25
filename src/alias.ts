const Module = require("module");
const MODULE_MAP: Record<string, typeof Module._resolveFilename> = {};
const RESOLVER_MAP: Record<string, typeof require.resolve> = {};
export const addResolveAlias = (
	name: string,
	aliasMap: Record<string, string>
) => {
	const modulePath = require.resolve(name);
	if (RESOLVER_MAP[modulePath]) {
		throw new Error(`Should not add resolve alias to ${name} again.`);
	}
	const m = require.cache[modulePath];
	if (!m) {
		throw new Error("Failed to resolve webpack-dev-server.");
	}
	RESOLVER_MAP[modulePath] = m.require.resolve;
	m.require.resolve = ((id: string, options?: any) =>
		aliasMap[id] ||
		RESOLVER_MAP[modulePath]!.apply(m.require, [
			id,
			options
		])) as typeof require.resolve;
	MODULE_MAP[modulePath] = Module._resolveFilename;
	Module._resolveFilename = Module._resolveFilename = (request: string, mod: NodeModule, ...args: unknown[]) => {
			if (mod.filename === modulePath && aliasMap[request]) {
				return aliasMap[request];
			}
			return MODULE_MAP[modulePath](request, mod, ...args);
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
		m.require.resolve = RESOLVER_MAP[modulePath]!;
		delete RESOLVER_MAP[modulePath];
	}
};
