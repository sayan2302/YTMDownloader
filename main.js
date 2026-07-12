const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const net = require('net');

let serverProcess = null;
let mainWindow = null;

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

function startBackend(port) {
  const serverPath = path.join(__dirname, 'server/index.js');
  
  // Fork the Express backend process
  serverProcess = fork(serverPath, [], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: port.toString()
    }
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`Backend process exited with code ${code} and signal ${signal}`);
  });

  serverProcess.on('error', (err) => {
    console.error('Backend process error:', err);
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'YTM',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = !app.isPackaged;
  
  const loadURL = () => {
    const url = isDev ? 'http://127.0.0.1:5173' : `http://127.0.0.1:${port}`;
    mainWindow.loadURL(url).catch((err) => {
      console.log(`Frontend port not ready yet, retrying in 200ms...`);
      setTimeout(loadURL, 200);
    });
  };

  loadURL();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const isDev = !app.isPackaged;
  const port = isDev ? 3001 : await getFreePort(3001);

  startBackend(port);
  createWindow(port);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(port);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (serverProcess) {
    console.log('[Electron] Killing backend child process...');
    serverProcess.kill('SIGTERM');
  }
});
