// Bundles the Electron main process to ESM (@qvac/sdk is ESM-only). Bundled CJS
// deps (ws, etc.) expect require/__filename/__dirname — provide them from the
// module URL so they resolve inside the ESM output.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/main.mjs',
  external: ['@qvac/sdk', 'electron'],
  banner: {
    js: [
      "import { createRequire as __cr } from 'module';",
      "import { fileURLToPath as __f2p } from 'url';",
      "import { dirname as __dn } from 'path';",
      "const require = __cr(import.meta.url);",
      "const __filename = __f2p(import.meta.url);",
      "const __dirname = __dn(__filename);",
    ].join('\n'),
  },
});
console.log('built dist/main.mjs');
