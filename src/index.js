'use strict';

const http = require('node:http');
const { URL } = require('node:url');

const DEFAULT_PORT = Number.parseInt(process.env.PORT || '3000', 10);

function createRequestHandler() {
  return (req, res) => {
    const host = req.headers.host || `localhost:${DEFAULT_PORT}`;
    const requestUrl = new URL(req.url, `http://${host}`);

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
  };
}

function createServer() {
  return http.createServer(createRequestHandler());
}

function start(port = DEFAULT_PORT) {
  const server = createServer();
  server.listen(port, () => {
    console.log(`HTTP server listening on port ${server.address().port}`);
  });
  return server;
}

if (require.main === module) {
  start();
}

module.exports = {
  createServer,
  start,
};
