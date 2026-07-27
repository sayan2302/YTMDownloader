#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

const net = require('net');

console.log('Starting OpenSpot...');

// Path to Express server index.js
const serverPath = path.join(__dirname, '../server/index.js');

function getFreePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(getFreePort(startPort + 1));
      }
    });
    server.once('listening', () => {
      server.close(() => {
        resolve(startPort);
      });
    });
    server.listen(startPort);
  });
}

async function run() {
  const defaultPort = parseInt(process.env.PORT || '3001', 10);
  const port = await getFreePort(defaultPort);

  // Spawn the backend server as a child process of Node.
  // This preserves the ESM package type requirements of the server directory.
  const server = spawn('node', [serverPath], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: port.toString()
    },
    stdio: 'inherit'
  });

  // Give the server a moment to spin up, then open the browser
  setTimeout(() => {
    const url = `http://127.0.0.1:${port}`;
    console.log(`Opening browser to ${url}`);
  
    // Launch default browser based on the operating system
    let opener;
    if (process.platform === 'darwin') {
      opener = spawn('open', [url]);
    } else if (process.platform === 'win32') {
      opener = spawn('cmd', ['/c', 'start', '""', url], { shell: true });
    } else {
      opener = spawn('xdg-open', [url]);
    }

    opener.on('error', (err) => {
      console.error('Failed to open browser:', err);
    });
  }, 1500);

  // Ensure the backend process is killed when the CLI process exits
  process.on('SIGINT', () => {
    server.kill('SIGINT');
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    server.kill('SIGTERM');
    process.exit(0);
  });
}

run();
