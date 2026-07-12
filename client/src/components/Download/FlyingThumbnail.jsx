import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './FlyingThumbnail.css';

export default function FlyingThumbnail({ id, thumbnailSrc, startRect, endRect, onComplete }) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Small delay to ensure DOM is ready and CSS transitions can catch the change
    const raf = requestAnimationFrame(() => {
      setIsAnimating(true);
    });
    
    // Animation duration is 600ms
    const timer = setTimeout(() => {
      onComplete(id);
    }, 600);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [id, onComplete]);

  // Initial position
  const style = {
    top: startRect.top,
    left: startRect.left,
    width: startRect.width || 40,
    height: startRect.height || 40,
    '--end-x': `${endRect.left - startRect.left}px`,
    '--end-y': `${endRect.top - startRect.top}px`,
  };

  return createPortal(
    <div 
      className={`flying-thumbnail ${isAnimating ? 'animate' : ''}`} 
      style={style}
    >
      {thumbnailSrc ? (
        <img src={thumbnailSrc} alt="fly" />
      ) : (
        <div className="placeholder-thumb">🎵</div>
      )}
    </div>,
    document.body
  );
}
