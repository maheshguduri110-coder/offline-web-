/**
 * Offline Verification Suite for OfflineWeb AI
 * Validates:
 * 1. Build directory assets (HTML, CSS, JS, Manifest, Icons, Service Worker)
 * 2. Service worker precache array integrity
 * 3. Fallback page presence
 * 4. Zero external network resources (no CDNs, no Google fonts, no remote scripts)
 * 5. Production server response and headers
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('  🧪 Running OfflineWeb AI Comprehensive Test Suite');
  console.log('======================================================\n');

  // Test 1: Verify dist directory exists
  assert(fs.existsSync(DIST_DIR), 'Production build directory "dist/" exists');

  // Test 2: Verify essential root assets
  const requiredFiles = [
    'index.html',
    'service-worker.js',
    'manifest.webmanifest',
    'offline-fallback.html',
    'icons/icon-192.svg',
    'icons/icon-512.svg'
  ];

  requiredFiles.forEach((file) => {
    assert(fs.existsSync(path.join(DIST_DIR, file)), `Essential asset "${file}" exists in dist`);
  });

  // Test 3: Verify zero external CDN / remote fonts / external scripts in index.html
  const indexHtml = fs.readFileSync(path.join(DIST_DIR, 'index.html'), 'utf-8');
  assert(!indexHtml.includes('https://fonts.googleapis.com'), 'index.html has zero Google Fonts dependencies');
  assert(!indexHtml.includes('https://cdn.'), 'index.html has zero external CDN dependencies');
  assert(!indexHtml.includes('https://unpkg.com'), 'index.html has zero unpkg references');
  assert(!indexHtml.includes('https://cdnjs.cloudflare.com'), 'index.html has zero cloudflare CDN references');

  // Test 4: Verify Service Worker precache list has entries and includes compiled bundle
  const swContent = fs.readFileSync(path.join(DIST_DIR, 'service-worker.js'), 'utf-8');
  assert(swContent.includes('offlineweb-core-'), 'Service worker has valid cache version naming');
  assert(swContent.includes('/assets/index-'), 'Service worker has production JS bundle injected into PRECACHE_ASSETS');
  assert(swContent.includes('/offline-fallback.html'), 'Service worker precaches offline-fallback.html');

  // Test 5: Verify Web Manifest
  const manifest = JSON.parse(fs.readFileSync(path.join(DIST_DIR, 'manifest.webmanifest'), 'utf-8'));
  assert(manifest.name === 'OfflineWeb AI', 'Manifest has valid app name');
  assert(manifest.display === 'standalone', 'Manifest is configured as standalone PWA');
  assert(manifest.icons && manifest.icons.length >= 2, 'Manifest includes 192px and 512px local icons');

  // Test 6: Verify offline fallback HTML is self-contained
  const fallbackHtml = fs.readFileSync(path.join(DIST_DIR, 'offline-fallback.html'), 'utf-8');
  assert(!fallbackHtml.includes('http://') && !fallbackHtml.includes('https://'), 'Offline fallback HTML has no external remote links');

  // Test 7: Start local production server and test HTTP responses
  console.log('\n--- Testing Production Server Endpoints ---');
  const serverModule = await import('../server.js');
  // Wait 500ms for server to bind
  await new Promise((r) => setTimeout(r, 600));

  await testEndpoint('http://127.0.0.1:4173/', (res, data) => {
    assert(res.statusCode === 200, 'GET / returns 200 OK');
    assert(res.headers['content-type'].includes('text/html'), 'GET / returns text/html content-type');
    assert(data.includes('OfflineWeb AI'), 'GET / serves OfflineWeb AI HTML payload');
  });

  await testEndpoint('http://127.0.0.1:4173/service-worker.js', (res, data) => {
    assert(res.statusCode === 200, 'GET /service-worker.js returns 200 OK');
    assert(res.headers['content-type'].includes('application/javascript'), 'service-worker.js has javascript mime-type');
    assert(res.headers['service-worker-allowed'] === '/', 'Service-Worker-Allowed header is "/"');
  });

  await testEndpoint('http://127.0.0.1:4173/manifest.webmanifest', (res, data) => {
    assert(res.statusCode === 200, 'GET /manifest.webmanifest returns 200 OK');
  });

  await testEndpoint('http://127.0.0.1:4173/non-existent-route', (res, data) => {
    // SPA fallback should serve index.html for unknown routes
    assert(res.statusCode === 200, 'SPA fallback serves index.html for uncached client routes');
  });

  console.log('\n======================================================');
  console.log(`  📊 Results: ${passedTests} / ${totalTests} tests passed`);
  if (passedTests === totalTests) {
    console.log('  🎉 All verification checks passed with 100% success!');
    console.log('======================================================\n');
    process.exit(0);
  } else {
    console.error('  ⚠️ Some verification checks failed.');
    console.log('======================================================\n');
    process.exit(1);
  }
}

function testEndpoint(url, validator) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        validator(res, data);
        resolve();
      });
    }).on('error', (err) => {
      console.error('Request failed:', err.message);
      assert(false, `Request to ${url} failed: ${err.message}`);
      resolve();
    });
  });
}

runTestSuite();
