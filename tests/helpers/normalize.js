const path = require("path");

const CURRENT_CWD = process.cwd();
const ROOT = path.resolve(__dirname, "../../");

const normalize = str => {
	let normalizedStr = str.replace(/(\\)+/g, "/");
	
	normalizedStr = normalizedStr.split(
		CURRENT_CWD.replace(/(\\)+/g, "/")
	).join("<cwd>");

	normalizedStr = normalizedStr.split(
		ROOT.replace(/(\\)+/g, "/")
	).join("<root>");

	normalizedStr = normalizedStr.replace(/:\d+:\d+/g, ":<line>:<row>");
	normalizedStr = normalizedStr.replace(
		/@@ -\d+,\d+ \+\d+,\d+ @@/g,
		"@@ ... @@"
	);
	return normalizedStr;
};

expect.addSnapshotSerializer({
	test(value) {
		return typeof value === "string";
	},
	print(received) {
		return normalize(received);
	}
});
