import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const workflowDirectory = join(repositoryRoot, ".github", "workflows");
const deploymentWorkflowPath = join(workflowDirectory, "deploy.yml");
const customDomain = "playground.writebetacode.com";

function readFile(absolutePath: string): string {
	return readFileSync(absolutePath, "utf8");
}

function readDeploymentWorkflow(): string {
	return readFile(deploymentWorkflowPath);
}

/** Every workflow in the repository, as { name, contents } pairs, for the rules that hold across all of them. */
function readAllWorkflows(): ReadonlyArray<{
	name: string;
	contents: string;
}> {
	if (existsSync(workflowDirectory) === false) {
		return [];
	}
	return readdirSync(workflowDirectory, { withFileTypes: true })
		.filter(
			(entry) =>
				entry.isFile() &&
				(entry.name.endsWith(".yml") || entry.name.endsWith(".yaml")),
		)
		.map((entry) => ({
			name: entry.name,
			contents: readFile(join(workflowDirectory, entry.name)),
		}));
}

/** Each `uses:` reference in a workflow, split into the action and the major version it is pinned to. */
function listUsedActions(
	contents: string,
): ReadonlyArray<{ action: string; major: number | null }> {
	const used: Array<{ action: string; major: number | null }> = [];
	for (const line of contents.split("\n")) {
		const match = line.match(/^\s*(?:-\s*)?uses:\s*["']?([^"'\s]+)["']?\s*$/);
		if (match === null) {
			continue;
		}
		const [action, reference = ""] = match[1].split("@");
		const majorMatch = reference.match(/^v?(\d+)/);
		used.push({
			action,
			major: majorMatch === null ? null : Number(majorMatch[1]),
		});
	}
	return used;
}

describe("pushing to the default branch publishes the site", () => {
	it("no longer carries the retired third-party deploy workflow", () => {
		expect(existsSync(join(workflowDirectory, "deploy-to-gh-pages.yml"))).toBe(
			false,
		);
	});

	it("installs a deployment workflow at .github/workflows/deploy.yml", () => {
		expect(existsSync(deploymentWorkflowPath)).toBe(true);
	});

	const triggerRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{ label: "runs on push", pattern: /^on:[\s\S]*?^\s+push:/m },
		{
			label: "restricts the push trigger to the default branch",
			pattern:
				/branches:\s*(?:\n\s*-\s*["']?main["']?|\[\s*["']?main["']?\s*\])/,
		},
		{
			label: "can also be started by hand",
			pattern: /^\s+workflow_dispatch:/m,
		},
	];

	it.each(triggerRules)("the workflow $label", ({ pattern }) => {
		expect(readDeploymentWorkflow()).toMatch(pattern);
	});

	const tokenRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{
			label: "grants the Pages write permission the deploy needs",
			pattern: /^\s+pages:\s*write\s*$/m,
		},
		{
			label: "grants the id-token write permission the deploy needs",
			pattern: /^\s+id-token:\s*write\s*$/m,
		},
		{
			label: "serialises deploys through a pages concurrency group",
			pattern: /^\s*concurrency:[\s\S]*?^\s+group:\s*["']?pages/m,
		},
		{
			label: "deploys into the github-pages environment",
			pattern: /^\s+environment:[\s\S]*?name:\s*github-pages/m,
		},
	];

	it.each(tokenRules)("the workflow $label", ({ pattern }) => {
		expect(readDeploymentWorkflow()).toMatch(pattern);
	});

	const requiredActions: ReadonlyArray<{
		label: string;
		action: string;
		minimumMajor: number;
	}> = [
		{
			label: "checks the repository out",
			action: "actions/checkout",
			minimumMajor: 7,
		},
		{ label: "installs pnpm", action: "pnpm/action-setup", minimumMajor: 6 },
		{ label: "installs Node", action: "actions/setup-node", minimumMajor: 7 },
		{
			label: "configures Pages",
			action: "actions/configure-pages",
			minimumMajor: 6,
		},
		{
			label: "uploads the build as a Pages artifact",
			action: "actions/upload-pages-artifact",
			minimumMajor: 5,
		},
		{
			label: "deploys through GitHub's own Pages action",
			action: "actions/deploy-pages",
			minimumMajor: 5,
		},
	];

	it.each(requiredActions)(
		"the workflow $label with $action, pinned no older than v$minimumMajor",
		({ action, minimumMajor }) => {
			const matches = listUsedActions(readDeploymentWorkflow()).filter(
				(used) => used.action === action,
			);
			expect(matches).toHaveLength(1);
			expect(matches[0].major).toBeGreaterThanOrEqual(minimumMajor);
		},
	);

	const wiringRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{
			label: "reads the Node version from the repository's pin",
			pattern: /node-version-file:\s*["']?\.?\/?\.node-version["']?/,
		},
		{
			label: "caches pnpm's store between runs",
			pattern: /cache:\s*["']?pnpm["']?/,
		},
		{
			label: "uploads the Vite output directory",
			pattern: /path:\s*["']?\.?\/?dist\/?["']?/,
		},
	];

	it.each(wiringRules)("the workflow $label", ({ pattern }) => {
		expect(readDeploymentWorkflow()).toMatch(pattern);
	});
});

describe("no branch in the repository holds build output", () => {
	it("keeps the build output out of version control", () => {
		const ignored = readFile(join(repositoryRoot, ".gitignore"))
			.split("\n")
			.map((line) => line.trim());
		expect(ignored).toContain("dist");
	});

	const forbiddenPublishRules: ReadonlyArray<{
		label: string;
		pattern: RegExp;
	}> = [
		{
			label: "the retired third-party publishing action",
			pattern: /peaceiris\/actions-gh-pages/,
		},
		{
			label: "a publish directory pushed to a branch",
			pattern: /publish_dir/,
		},
		{ label: "the retired gh-pages branch", pattern: /gh-pages/ },
		{
			label: "a push of build output back into the repository",
			pattern: /git\s+push/,
		},
	];

	const workflows = readAllWorkflows();
	const publishCases = workflows.flatMap((workflow) =>
		forbiddenPublishRules.map((rule) => ({
			workflow: workflow.name,
			contents: workflow.contents,
			label: rule.label,
			pattern: rule.pattern,
		})),
	);

	it.each(publishCases)(
		"$workflow does not commit build output through $label",
		({ contents, pattern }) => {
			expect(contents).not.toMatch(pattern);
		},
	);
});

describe("the workflow performs installation, build, and deploy only", () => {
	const requiredSteps: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{
			label: "installs dependencies with pnpm",
			pattern: /run:\s*pnpm\s+install/,
		},
		{
			label: "builds the site with the project's build script",
			pattern: /run:\s*pnpm\s+(?:run\s+)?build\b/,
		},
	];

	it.each(requiredSteps)("the workflow $label", ({ pattern }) => {
		expect(readDeploymentWorkflow()).toMatch(pattern);
	});

	const forbiddenWorkRules: ReadonlyArray<{ label: string; pattern: RegExp }> =
		[
			{ label: "a Biome check", pattern: /biome|pnpm\s+(?:run\s+)?check\b/i },
			{ label: "a type check", pattern: /\btsc\b|typecheck/i },
			{ label: "a unit test run", pattern: /vitest|pnpm\s+(?:run\s+)?test\b/i },
			{ label: "a lint step", pattern: /\blint\b/i },
			{ label: "the retired Makefile build", pattern: /make\s+build/ },
			{ label: "the retired prototype directory", pattern: /\bsolid\// },
		];

	const workflows = readAllWorkflows();
	const forbiddenCases = workflows.flatMap((workflow) =>
		forbiddenWorkRules.map((rule) => ({
			workflow: workflow.name,
			contents: workflow.contents,
			label: rule.label,
			pattern: rule.pattern,
		})),
	);

	it.each(forbiddenCases)(
		"$workflow does not run $label",
		({ contents, pattern }) => {
			expect(contents).not.toMatch(pattern);
		},
	);
});

describe("the custom domain survives a deploy", () => {
	const cnamePath = join(repositoryRoot, "public", "CNAME");

	it("records the custom domain in a CNAME file the build copies into the site", () => {
		expect(existsSync(cnamePath)).toBe(true);
	});

	const cnameRules: ReadonlyArray<{ label: string; pattern: RegExp }> = [
		{ label: "holds a single line", pattern: /^[^\n]+\n?$/ },
		{
			label: "records the playground's custom domain and nothing else",
			pattern: new RegExp(`^${customDomain.replace(/\./g, "\\.")}\n?$`),
		},
	];

	it.each(cnameRules)("the CNAME $label", ({ pattern }) => {
		expect(readFile(cnamePath)).toMatch(pattern);
	});

	const workflows = readAllWorkflows();

	it.each(workflows)(
		"$name leaves the custom domain to repository settings rather than rewriting it",
		({ contents }) => {
			expect(contents).not.toMatch(/cname:/i);
			expect(contents).not.toContain(customDomain);
		},
	);
});
