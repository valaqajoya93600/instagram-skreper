'use strict';

const http = require('node:http');
const { URL } = require('node:url');

const PORT = Number.parseInt(process.env.PORT || '3000', 10);

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        uptimeSeconds: process.uptime(),
        timestamp: new Date().toISOString(),
      })
    );
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      message: 'Railway deployment automation placeholder service',
      healthcheck: '/healthz',
    })
  );
});

server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});
