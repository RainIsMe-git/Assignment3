import http from 'node:http';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer, instance } from './serve.mjs';

function existingGame(port) {
  return new Promise(done => {
    const request = http.get({ hostname: '127.0.0.1', port, path: '/__garden_gunners_health', timeout: 800 }, response => {
      let body = '';
      response.on('data', chunk => { body += chunk; if (body.length > 4096) request.destroy(); });
      response.on('end', () => {
        try { const value = JSON.parse(body); done(response.statusCode === 200 && value.app === 'garden-gunners' && value.instance === instance); }
        catch { done(false); }
      });
      response.on('error', () => done(false));
    });
    request.on('timeout', () => request.destroy());
    request.on('error', () => done(false));
  });
}

export function openInBrowser(url) {
  const [command, args] = process.platform === 'win32'
    ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]]
    : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  const child = spawn(command, args, { detached: true, stdio: 'ignore', windowsHide: true });
  child.on('error', () => console.log(`Please open this address in your browser: ${url}`));
  child.unref();
}

export async function launch({ ports = [...Array.from({ length: 10 }, (_, i) => 4173 + i), 0], openBrowser = true } = {}) {
  for (const port of ports) {
    let server;
    try { server = await startServer(port); }
    catch (error) {
      if (port === 0 || !['EADDRINUSE', 'EACCES'].includes(error.code)) throw error;
      if (error.code === 'EADDRINUSE' && await existingGame(port)) {
        const url = `http://127.0.0.1:${port}`;
        console.log(`Garden Gunners is already running. Opening ${url}`);
        if (openBrowser) openInBrowser(url);
        return { reused: true, server: null, url };
      }
      continue;
    }
    const url = `http://127.0.0.1:${server.address().port}`;
    console.log(`\nGarden Gunners is ready: ${url}`);
    console.log('Your browser will open automatically. Allow the camera only when you choose camera mode.');
    console.log('Keep this window open while playing. Close it or press Ctrl+C to stop the game.\n');
    if (openBrowser) openInBrowser(url);
    return { reused: false, server, url };
  }
  throw new Error('None of the requested ports are available. Run the launcher without a fixed port to select a free one.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (Number(process.versions.node.split('.')[0]) < 20) {
    console.error('Garden Gunners requires Node.js 20 or newer. Please update Node.js and try again.');
    process.exitCode = 1;
  } else launch().catch(error => { console.error(`Cannot launch: ${error.message}`); process.exitCode = 1; });
}
