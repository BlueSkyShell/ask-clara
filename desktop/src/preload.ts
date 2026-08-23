// Minimal, safe surface exposed to the renderer. Engine calls go directly over a
// loopback WebSocket from the renderer; nothing privileged is bridged here.
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('claraDesktop', {
  engineUrl: 'ws://127.0.0.1:8787',
  platform: process.platform,
});
