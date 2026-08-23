// Clara desktop — Electron main process (ESM: @qvac/sdk is ESM-only).
// Runs the local engine IN-PROCESS (no external node/tsx), so a packaged build
// is self-contained. If a dev daemon is already listening, it reuses that instead.
import { app, BrowserWindow, shell } from 'electron';
import { createConnection } from 'node:net';
import path from 'node:path';

const ENGINE_PORT = 8787;
let engineClose: (() => Promise<void>) | null = null;

function portOpen(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const sock = createConnection({ host: '127.0.0.1', port }, () => { sock.destroy(); resolve(true); });
    sock.on('error', () => resolve(false));
    sock.setTimeout(800, () => { sock.destroy(); resolve(false); });
  });
}

async function ensureEngine(): Promise<void> {
  if (await portOpen(ENGINE_PORT)) return; // reuse a running dev daemon
  // Embed the engine + its WebSocket server directly. @qvac/sdk stays external
  // (native Bare worker) and is resolved from node_modules the Forge plugin ships.
  const { startDaemon } = await import('@clara/engine/daemon-core');
  const handle = await startDaemon({ port: ENGINE_PORT });
  engineClose = handle.close;
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1300,
    height: 860,
    minWidth: 1040,
    minHeight: 680,
    title: 'Clara',
    backgroundColor: '#0a0e1f',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.loadFile(path.join(import.meta.dirname, 'renderer', 'index.html'));
}

app.whenReady().then(async () => {
  createWindow();          // show the shell immediately
  ensureEngine().catch((e) => console.error('[clara-desktop] engine failed to start:', e));
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('quit', () => { engineClose?.(); });
