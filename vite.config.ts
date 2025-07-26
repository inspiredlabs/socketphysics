// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { PhysicsServer } from './src/lib/server/physics.js';  // PHYSICS SIMULATOR

// Custom Vite plugin to integrate the WebSocket game server
const webSocketServer = {
  name: 'webSocketServer',
  configureServer(server) {
    if (server.httpServer) {
      new PhysicsServer(server.httpServer);
      // console.log('Socket.IO PhysicsServer has been attached to the Vite server.');
    }
  }
};

export default defineConfig({
  plugins: [
    sveltekit(),
    webSocketServer
  ]
});