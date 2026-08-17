/**
 * Servidor estático mínimo — apenas para desenvolvimento local.
 * Não faz parte da entrega da landing page.
 *
 * Uso:  node .claude/preview-server.js   →  http://localhost:5173
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = 5173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

http
  .createServer((req, res) => {
    let rel = decodeURIComponent(req.url.split('?')[0]);
    if (rel === '/') rel = '/index.html';

    const filePath = path.join(ROOT, rel);

    // Impede acesso a arquivos fora da pasta do projeto
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    const tipo = TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

    fs.stat(filePath, (erroStat, info) => {
      if (erroStat || !info.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('404 — não encontrado');
        return;
      }

      // Requisição parcial (Range): é o que permite arrastar a linha do tempo
      // do vídeo. Sem isso o navegador só consegue tocar do início ao fim.
      const range = req.headers.range;
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        const ini = m && m[1] ? parseInt(m[1], 10) : 0;
        const fim = m && m[2] ? parseInt(m[2], 10) : info.size - 1;

        if (ini >= info.size || fim >= info.size || ini > fim) {
          res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end();
          return;
        }

        res.writeHead(206, {
          'Content-Type': tipo,
          'Content-Range': `bytes ${ini}-${fim}/${info.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': fim - ini + 1,
          'Cache-Control': 'no-store',
        });
        fs.createReadStream(filePath, { start: ini, end: fim }).pipe(res);
        return;
      }

      res.writeHead(200, {
        'Content-Type': tipo,
        'Content-Length': info.size,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      });
      fs.createReadStream(filePath).pipe(res);
    });
  })
  .listen(PORT, () => console.log('FloreSer em http://localhost:' + PORT));
