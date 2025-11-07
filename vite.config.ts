import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '*.ngrok-free.app',
      'unperturbedly-intermesenteric-lourie.ngrok-free.dev'
    ],
    host: '0.0.0.0',
    port: 4200
  }
});
