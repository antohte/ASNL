import { defineConfig } from 'vite';
import { accountMiddleware } from './server/accounts.mjs';

export default defineConfig({
  server: {
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.asnl-data/**', '**/accounts.sqlite*'] },
  },
  plugins: [{
    name: 'asnl-accounts',
    configureServer(server) { server.middlewares.use(accountMiddleware); },
    configurePreviewServer(server) { server.middlewares.use(accountMiddleware); },
  }],
  build: {
    rollupOptions: {
      input: { compte: 'compte/index.html', accueil: 'index.html', boutique: 'boutique/index.html', billetterie: 'billetterie/index.html', reservation: 'billetterie/reservation/index.html', parking: 'billetterie/parking/index.html' },
    },
  },
});
