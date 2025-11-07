'use strict';

const { createServer, start } = require('../../src/index');

describe('HTTP server', () => {
  let server;

  async function closeServer() {
    if (!server) {
      return;
    }

    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    server = undefined;
  }

  async function listen(serverInstance) {
    await new Promise((resolve, reject) => {
      const handleError = (error) => {
        serverInstance.off('error', handleError);
        reject(error);
      };
      serverInstance.once('error', handleError);
      serverInstance.listen(0, () => {
        serverInstance.off('error', handleError);
        resolve();
      });
    });
    return serverInstance.address();
  }

  afterEach(async () => {
    await closeServer();
  });

  test('responds with service description at root path', async () => {
    server = createServer();
    const address = await listen(server);
    const response = await fetch(`http://127.0.0.1:${address.port}/`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toMatch(/application\/json/);
    expect(body).toEqual({
      message: 'Railway deployment automation placeholder service',
      healthcheck: '/healthz',
    });
  });

  test('reports healthy status on /healthz', async () => {
    server = createServer();
    const address = await listen(server);
    const response = await fetch(`http://127.0.0.1:${address.port}/healthz`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(typeof body.uptimeSeconds).toBe('number');
    expect(typeof body.timestamp).toBe('string');
  });

  test('start listens on provided port', async () => {
    server = start(0);

    await new Promise((resolve) => {
      if (server.listening) {
        resolve();
        return;
      }

      server.once('listening', resolve);
    });

    const address = server.address();
    expect(address && address.port).toBeGreaterThan(0);
  });
});
