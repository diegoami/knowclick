import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { preparePagesRoutes } from './prepare-pages.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
if (!process.env.npm_execpath) throw new Error('Run npm run build:pages');
preparePagesRoutes(root);
const result = spawnSync(
	process.execPath,
	[process.env.npm_execpath, 'run', 'build', '--workspace=app'],
	{
		cwd: root,
		stdio: 'inherit',
		env: { ...process.env, VITE_GITHUB_PAGES: '1' }
	}
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
