import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifestVersion: 3,
  manifest: {
    name: 'Clara — your crypto, in plain language',
    description: 'Explains what you sign before you sign it. 100% on-device via a local engine.',
    permissions: ['sidePanel', 'notifications'],
    icons: { 16: 'icon-16.png', 48: 'icon-48.png', 128: 'icon-128.png' },
    action: { default_title: 'Open Clara' },
  },
});
