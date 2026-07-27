import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

import searchRoutes from './routes/search.js';
import playlistRoutes from './routes/playlist.js';
import downloadRoutes from './routes/download.js';
import browseRoutes from './routes/browse.js';
import streamRoutes from './routes/stream.js';
import playLocalRoutes from './routes/playLocal.js';
import lyricsRoutes from './routes/lyrics.js';
import triviaRoutes from './routes/trivia.js';
import { checkAndSetupDependencies, getDependencyStatus } from './utils/dependencyChecker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static assets from the client build folder in production
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/playlist', playlistRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/play-local', playLocalRoutes);
app.use('/api/lyrics', lyricsRoutes);
app.use('/api/trivia', triviaRoutes);

// System Check Endpoint
app.get('/api/system-check', (req, res) => {
  res.json({
    ...getDependencyStatus(),
    defaultOutputDir: path.join(os.homedir(), 'Downloads')
  });
});

// Fallback for Single Page App routing (redirect all non-api routes to index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.listen(PORT, async () => {
  console.log(`OpenSpot Backend running on http://127.0.0.1:${PORT}`);
  // Run async setup check
  await checkAndSetupDependencies();
});
