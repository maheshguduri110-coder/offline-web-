import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const currentDir = typeof import.meta.dirname !== 'undefined'
  ? import.meta.dirname
  : path.dirname(fileURLToPath(import.meta.url));

// Custom lightweight plugin to inject built hashed assets into service-worker.js
function injectPrecacheAssets() {
  return {
    name: 'inject-precache-assets',
    closeBundle() {
      const distDir = path.resolve(currentDir, 'dist');
      const swPath = path.join(distDir, 'service-worker.js');
      if (!fs.existsSync(swPath)) return;

      const assetsDir = path.join(distDir, 'assets');
      const assetFiles = fs.existsSync(assetsDir)
        ? fs.readdirSync(assetsDir).map((f) => `/assets/${f}`)
        : [];

      let swContent = fs.readFileSync(swPath, 'utf-8');
      const extraAssets = JSON.stringify(assetFiles);

      // Append dynamically discovered hashed assets to PRECACHE_ASSETS array in built SW
      swContent = swContent.replace(
        'const PRECACHE_ASSETS = [',
        `const PRECACHE_ASSETS = [\n  ...${extraAssets},`
      );

      fs.writeFileSync(swPath, swContent, 'utf-8');
      console.log(`[OfflineWeb Build] Injected ${assetFiles.length} hashed production bundle assets into service-worker.js`);
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), injectPrecacheAssets()]
});
