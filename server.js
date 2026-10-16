/**
 * Standalone Local Production Server for OfflineWeb AI
 * Serves static build files from dist/ with proper MIME types,
 * Service Worker headers, and zero external dependencies.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, 'dist');
const PORT = process.env.PORT || 4173;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  // Parse URL and sanitize path
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Security: prevent directory traversal
  let safePath = path.normalize(path.join(DIST_DIR, pathname));
  if (!safePath.startsWith(DIST_DIR)) {
    res.statusCode = 403;
    res.end('403 Forbidden');
    return;
  }

  // Check if file exists, or map directory to index.html
  if (fs.existsSync(safePath) && fs.statSync(safePath).isDirectory()) {
    safePath = path.join(safePath, 'index.html');
  }

  // SPA fallback: if file does not exist, and request has no extension or accepts HTML, serve index.html
  if (!fs.existsSync(safePath)) {
    const hasExtension = path.extname(pathname) !== '';
    const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');

    if (!hasExtension || acceptsHtml) {
      safePath = path.join(DIST_DIR, 'index.html');
    } else {
      res.statusCode = 404;
      res.end('404 Not Found');
      return;
    }
  }

  const ext = path.extname(safePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Security and caching headers
  res.setHeader('Content-Type', contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // Service worker headers (prevent aggressive proxy caching for service-worker.js)
  if (path.basename(safePath) === 'service-worker.js') {
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  } else if (safePath.includes(path.join(DIST_DIR, 'assets'))) {
    // Content-hashed assets can be cached aggressively
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  } else {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }

  const stream = fs.createReadStream(safePath);
  stream.pipe(res);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n======================================================`);
  console.log(`  ⚡ OfflineWeb AI — Production Server Running!`);
  console.log(`  🔗 Local URL: http://127.0.0.1:${PORT}`);
  console.log(`  📦 Serving from: ${DIST_DIR}`);
  console.log(`  🛡️ Offline Mode: Service Worker & IndexedDB Enabled`);
  console.log(`======================================================\n`);
});
