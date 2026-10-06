import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const siteDir = join(projectRoot, 'site');
const distDir = join(projectRoot, 'dist');

export async function buildPages() {
  await build({ root: projectRoot, logLevel: 'error' });
  await rm(siteDir, { recursive: true, force: true });
  await mkdir(siteDir, { recursive: true });
  await cp(distDir, siteDir, { recursive: true });
  const indexPath = join(siteDir, 'index.html');
  const index = await readFile(indexPath, 'utf8');
  await writeFile(indexPath, index.replace('data-static-demo="false"', 'data-static-demo="true"'), 'utf8');
  await cp(join(projectRoot, 'fixtures', 'catalog.json'), join(siteDir, 'catalog.json'));
  await writeFile(join(siteDir, '.nojekyll'), '', 'utf8');
  return siteDir;
}

if (process.argv[1]?.endsWith('/build-pages.js')) {
  buildPages().then((output) => console.log(`Built ${output}`)).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
