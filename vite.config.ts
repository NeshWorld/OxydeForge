import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri ouvre sa fenêtre sur ce port (voir src-tauri/tauri.conf.json).
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  // src-tauri bouge à chaque compilation Rust : Vite n'a pas à le surveiller.
  server: { port: 5299, strictPort: true, watch: { ignored: ['**/src-tauri/**'] } },
  build: { target: 'es2022' },
});
