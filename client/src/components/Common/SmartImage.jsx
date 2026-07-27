import { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import { getHighResThumbnail, getFallbackThumbnails, extractVideoIdFromUrl } from '../../utils/thumbnail';

export default function SmartImage({ 
  src, 
  videoId, 
  alt = '', 
  className = '', 
  size = 512,
  iconSize = 24,
  style = {}
}) {
  const [stage, setStage] = useState(0);

  // Extract effective videoId
  const effectiveVideoId = videoId || extractVideoIdFromUrl(src);

  // Build bulletproof sources array
  const sources = [];
  
  if (src) {
    const highRes = getHighResThumbnail(src, size);
    if (highRes) sources.push(highRes);
    if (highRes !== src && src) sources.push(src);
  }

  if (effectiveVideoId) {
    const videoFallbacks = getFallbackThumbnails(effectiveVideoId);
    videoFallbacks.forEach(url => {
      if (!sources.includes(url)) {
        sources.push(url);
      }
    });
  }

  // Reset stage when src or videoId changes
  useEffect(() => {
    setStage(0);
  }, [src, videoId]);

  const handleError = () => {
    if (stage < sources.length - 1) {
      setStage(prev => prev + 1);
    } else {
      setStage(sources.length); // Final fallback (Placeholder Icon)
    }
  };

  const currentSrc = sources[stage];

  if (!currentSrc || stage >= sources.length) {
    return (
      <div 
        className={`smart-image-placeholder ${className}`} 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.15) 0%, rgba(15, 23, 42, 0.8) 100%)',
          color: 'rgba(255, 255, 255, 0.6)',
          borderRadius: 'inherit',
          width: '100%',
          height: '100%',
          aspectRatio: '1',
          ...style
        }}
      >
        <Music size={iconSize} className="placeholder-icon" style={{ opacity: 0.7 }} />
      </div>
    );
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={handleError}
    />
  );
}
