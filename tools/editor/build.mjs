// Builds the two browser bundles used by the blog:
//   assets/admin/editor-bundle.js  (Tiptap editor, admin editor page only)
//   assets/sanitize-bundle.js      (DOMPurify wrapper, admin + public pages)
// Usage: cd tools/editor && npm install && npm run build
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..', '..');

const common = {
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  legalComments: 'none',
  logLevel: 'info',
};

await build({
  ...common,
  entryPoints: [path.join(here, 'src', 'editor-entry.js')],
  outfile: path.join(root, 'assets', 'admin', 'editor-bundle.js'),
});

await build({
  ...common,
  entryPoints: [path.join(here, 'src', 'sanitize-entry.js')],
  outfile: path.join(root, 'assets', 'sanitize-bundle.js'),
});
