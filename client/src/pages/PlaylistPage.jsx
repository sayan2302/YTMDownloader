import { usePlaylist } from '../hooks/usePlaylist';
import PlaylistInput from '../components/Playlist/PlaylistInput';
import PlaylistView from '../components/Playlist/PlaylistView';
import { ListMusic } from 'lucide-react';

export default function PlaylistPage({ outputDir, onDownloadSingle, onBulkDownload, onFlyAnimation, downloads, onPlay, currentSong }) {
  const { playlist, isLoading, error, fetchPlaylist, removeTrack } = usePlaylist();

  const handleDownloadAll = (tracks) => {
    onBulkDownload(tracks, outputDir);
  };

  const handleDownloadSingle = (song) => {
    onDownloadSingle(song, outputDir);
  };

  const handleFetch = (url) => {
    fetchPlaylist(url, outputDir);
  };

  return (
    <div className="playlist-page">
      <PlaylistInput onFetch={handleFetch} isLoading={isLoading} />
      
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      {!playlist && !isLoading && (
        <div className="empty-state">
          <ListMusic size={48} className="empty-state-icon" />
          <p>No playlist loaded yet</p>
        </div>
      )}

        <PlaylistView 
          playlist={playlist} 
          onDownloadSingle={(song) => onDownloadSingle(song, outputDir)}
          onDownloadAll={() => onBulkDownload(playlist.tracks, outputDir)}
          onFlyAnimation={onFlyAnimation}
          downloads={downloads}
          onPlay={onPlay}
          currentSong={currentSong}
          onRemoveTrack={removeTrack}
        />
    </div>
  );
}
