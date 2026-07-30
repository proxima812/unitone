import { spawn } from "node:child_process";
import { cleanupScheduledPosts, generateScheduledPosts } from "./generate-scheduled-posts.mjs";

function run(command, args) {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { stdio: "inherit", shell: process.platform === "win32" });
		child.on("error", reject);
		child.on("exit", (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
		});
	});
}

try {
	const result = generateScheduledPosts();
	console.log(`Generated ${result.generated} scheduled archive posts for ${result.today}.`);
	await run("astro", ["build"]);
} finally {
	const removed = cleanupScheduledPosts();
	console.log(`Removed ${removed} scheduled archive posts.`);
}
