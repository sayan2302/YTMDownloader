/**
 * Upgrade any YouTube or YouTube Music thumbnail URL to high definition.
 * Safely caps dimension to 512px to prevent 404 CDN errors on Google UserContent.
 * 
 * @param {string} url - Raw thumbnail URL from YouTube Music API or ytimg
 * @param {number} size - Desired dimension in pixels (default: 512)
 * @returns {string} High resolution thumbnail URL
 */
export function getHighResThumbnail(url, size = 512) {
  if (!url || typeof url !== 'string') return url;
  const safeSize = Math.min(size || 512, 512);

  // 1. Google Content / YouTube Music Image URLs (lh3.googleusercontent.com, yt3.ggpht.com)
  if (url.includes('googleusercontent.com') || url.includes('ggpht.com')) {
    let highRes = url;
    if (/[=/-]w\d+-h\d+/i.test(highRes)) {
      highRes = highRes.replace(/([=/-])w\d+-h\d+/gi, `$1w${safeSize}-h${safeSize}`);
    } else if (/[=/-]s\d+/i.test(highRes)) {
      highRes = highRes.replace(/([=/-])s\d+/gi, `$1s${safeSize}`);
    } else if (/[=/-]w\d+/i.test(highRes)) {
      highRes = highRes.replace(/([=/-])w\d+/gi, `$1w${safeSize}`);
    } else if (!highRes.includes('=')) {
      highRes += `=w${safeSize}-h${safeSize}-l90-rj`;
    }
    return highRes;
  }

  // 2. Standard YouTube Video Thumbnail URLs (i.ytimg.com / img.youtube.com)
  if (url.includes('ytimg.com') || url.includes('youtube.com')) {
    if (/\/(default|mqdefault|hqdefault|sddefault|maxresdefault)\.jpg/i.test(url)) {
      return url.replace(/\/(default|mqdefault|hqdefault|sddefault|maxresdefault)\.jpg/gi, '/hqdefault.jpg');
    }
  }

  return url;
}

/**
 * Extract YouTube 11-char videoId from a thumbnail URL if available
 * @param {string} url 
 * @returns {string|null}
 */
export function extractVideoIdFromUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/(vi|vi_webp)\/([a-zA-Z0-9_-]{11})\//);
  return match ? match[2] : null;
}

/**
 * Generate bulletproof fallback thumbnail URLs for a given YouTube videoId
 * @param {string} videoId 
 * @returns {string[]} List of fallback URLs in order of preference
 */
export function getFallbackThumbnails(videoId) {
  if (!videoId) return [];
  return [
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/default.jpg`
  ];
}
