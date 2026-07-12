import express from 'express';
import cors from 'cors';

import searchRoutes from './routes/search.js';
import playlistRoutes from './routes/playlist.js';
import downloadRoutes from './routes/download.js';
import browseRoutes from './routes/browse.js';
import streamRoutes from './routes/stream.js';
import playLocalRoutes from './routes/playLocal.js';
import { checkAndSetupDependencies, getDependencyStatus } from './utils/dependencyChecker.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes);
app.use('/api/playlist', playlistRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/browse', browseRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/play-local', playLocalRoutes);

// System Check Endpoint
app.get('/api/system-check', (req, res) => {
  res.json(getDependencyStatus());
});

app.listen(PORT, async () => {
  console.log(`YTMDownloader Backend running on http://localhost:${PORT}`);
  // Run async setup check
  await checkAndSetupDependencies();
});
