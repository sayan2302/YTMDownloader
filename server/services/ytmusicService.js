import YTMusic from 'ytmusic-api';

const ytmusic = new YTMusic();
const initPromise = ytmusic.initialize();

export async function searchSongs(query) {
  await initPromise;
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
  await initPromise;
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
  await initPromise;
  try {
    const lines = await ytmusic.getLyrics(videoId);
    if (!lines || lines.length === 0) return null;
    return lines.join('\n');
  } catch (error) {
    console.warn(`[ytmusicService] Lyrics not available for video ${videoId}:`, error.message);
    return null;
  }
}
