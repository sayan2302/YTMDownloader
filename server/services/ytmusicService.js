import YTMusic from 'ytmusic-api';

const ytmusic = new YTMusic();
let isInitialized = false;
let initializing = null;

async function ensureInitialized() {
  if (isInitialized) return;
  if (initializing) return initializing;

  initializing = (async () => {
    try {
      console.log('[YTMusic] Attempting initialization with music.youtube.com...');
      await ytmusic.initialize();
      isInitialized = true;
      console.log('[YTMusic] Initialized successfully with music.youtube.com!');
    } catch (error) {
      console.warn(`[YTMusic] music.youtube.com initialization failed (${error.message}). Attempting fallback to www.youtube.com...`);
      try {
        // Fallback implementation: bypass music.youtube.com SNI block
        ytmusic.client.defaults.baseURL = 'https://www.youtube.com/';
        
        // 1. Fetch homepage HTML
        const html = (await ytmusic.client.get('/')).data;
        
        // 2. Parse configs (using global regex to search all blocks)
        const setConfigs = html.match(/ytcfg\.set\(.*?\);/g) || [];
        const configs = setConfigs.map((c) => c.slice(10, -2)).map((s) => {
          try {
            return JSON.parse(s);
          } catch {
            return null;
          }
        }).filter((j) => !!j);
        
        ytmusic.config = {};
        for (const config of configs) {
          ytmusic.config = {
            ...ytmusic.config,
            ...config
          };
        }
        
        // 3. Override client version & context to WEB_REMIX (YouTube Music)
        ytmusic.config.INNERTUBE_CLIENT_NAME = 'WEB_REMIX';
        ytmusic.config.INNERTUBE_CONTEXT_CLIENT_NAME = 67; 
        ytmusic.config.INNERTUBE_CLIENT_VERSION = '1.20240701.01.00';
        
        // 4. Register headers interceptor to avoid GFE "Origin doesn't match Host"
        ytmusic.client.interceptors.request.use((config) => {
          config.headers['Origin'] = 'https://www.youtube.com';
          config.headers['Referer'] = 'https://www.youtube.com/';
          config.headers['x-origin'] = 'https://www.youtube.com';
          return config;
        });

        isInitialized = true;
        console.log('[YTMusic] Fallback initialization with www.youtube.com successful!');
      } catch (fallbackError) {
        console.error('[YTMusic] Fallback initialization failed:', fallbackError.message);
        initializing = null;
        throw new Error(`Failed to initialize YTMusic: ${fallbackError.message}`);
      }
    } finally {
      initializing = null;
    }
  })();

  return initializing;
}

// Start initial setup in the background, but do not crash the server on failure
ensureInitialized().catch((err) => {
  console.warn('[YTMusic] Initial startup check failed. Will retry on demand.', err.message);
});

export async function searchSongs(query) {
  await ensureInitialized();
  try {
    const results = await ytmusic.searchSongs(query);
    return results.slice(0, 20).map(result => ({
      videoId: result.videoId,
      title: result.name,
      artist: result.artist?.name || 'Unknown Artist',
      album: result.album?.name || null,
      duration: result.duration,
      thumbnail: result.thumbnails?.[result.thumbnails.length - 1]?.url || null
    }));
  } catch (error) {
    console.error('ytmusicService search error:', error);
    throw new Error('Failed to search songs');
  }
}

export async function getPlaylist(playlistId) {
  await ensureInitialized();
  try {
    const playlist = await ytmusic.getPlaylist(playlistId);
    if (!playlist) throw new Error('Playlist not found');
    
    // In ytmusic-api, getPlaylist gets the metadata but NOT the tracks/videos.
    // We must call getPlaylistVideos to retrieve the tracklist.
    const videos = await ytmusic.getPlaylistVideos(playlistId);
    
    return {
      title: playlist.name || 'Unknown Playlist',
      trackCount: videos.length || playlist.trackCount || 0,
      tracks: videos.map(result => ({
        videoId: result.videoId,
        title: result.name,
        artist: result.artist?.name || 'Unknown Artist',
        album: null, // Playlists usually don't return album names in basic response
        duration: result.duration,
        thumbnail: result.thumbnails?.[result.thumbnails.length - 1]?.url || null
      }))
    };
  } catch (error) {
    console.error('ytmusicService getPlaylist error:', error);
    throw new Error('Failed to fetch playlist');
  }
}

export async function getLyricsText(videoId) {
  await ensureInitialized();
  try {
    const lines = await ytmusic.getLyrics(videoId);
    if (!lines || lines.length === 0) return null;
    return lines.join('\n');
  } catch (error) {
    console.warn(`[ytmusicService] Lyrics not available for video ${videoId}:`, error.message);
    return null;
  }
}

