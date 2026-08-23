// Electron Forge config (CJS). The QVAC plugin bundles the Bare worker + native
// addons and prunes prebuilds to the target hosts. asar MUST stay false — the
// Bare worker can't load from an asar archive.
const path = require('node:path');
const QvacForgePlugin = require('@qvac/sdk/electron-forge');
const { MakerZIP } = require('@electron-forge/maker-zip');
const { MakerAppImage } = require('@reforged/maker-appimage');

module.exports = {
  packagerConfig: {
    name: 'Clara',
    asar: false,
    // Ship only what the app needs at runtime (main.mjs bundles the rest).
    ignore: [
      /^\/src($|\/)/,
      /^\/forge\.config\.cjs$/,
      /^\/tsconfig\.json$/,
    ],
  },
  makers: [
    // Linux → AppImage (single portable file).
    new MakerAppImage({ options: { name: 'Clara', productName: 'Clara', bin: 'Clara' } }, ['linux']),
    // Windows → portable zip (installer/Squirrel needs wine+mono; do that on CI).
    new MakerZIP({}, ['win32']),
  ],
  plugins: [
    new QvacForgePlugin({
      hosts: ['linux-x64', 'win32-x64'],
      projectDir: path.resolve(__dirname),
      logLevel: 'info',
    }),
  ],
};
