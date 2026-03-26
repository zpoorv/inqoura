import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = 4173;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = __dirname;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function parseEnvFile(content) {
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const separatorIndex = line.indexOf('=');
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      })
  );
}

async function buildConfigScript() {
  const envPath = path.join(projectRoot, '.env.local');
  const envContent = await readFile(envPath, 'utf8').catch(() => '');
  const env = parseEnvFile(envContent);
  const config = {
    apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    appId: env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
    authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
    storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  };

  return `window.__ADMIN_PANEL_CONFIG__ = ${JSON.stringify(config)};`;
}

createServer(async (request, response) => {
  const requestUrl = new URL(request.url || '/', `http://${request.headers.host}`);
  const pathname = requestUrl.pathname === '/' ? '/login.html' : requestUrl.pathname;

  if (pathname === '/config.js') {
    const body = await buildConfigScript();
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/javascript; charset=utf-8',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
    });
    response.end(body);
    return;
  }

  const targetPath = path.join(publicDir, pathname);

  if (!targetPath.startsWith(publicDir)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const body = await readFile(targetPath);
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': MIME_TYPES[path.extname(targetPath)] || 'text/plain; charset=utf-8',
      'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY',
    });
    response.end(body);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Admin panel running at http://127.0.0.1:${PORT}`);
});
