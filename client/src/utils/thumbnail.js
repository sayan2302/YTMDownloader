/**
 * Upgrade any YouTube or YouTube Music thumbnail URL to high definition (540px/800px / maxresdefault).
 * 
 * @param {string} url - Raw thumbnail URL from YouTube Music API or ytimg
 * @param {number} size - Desired width/height dimension in pixels (default: 800)
 * @returns {string} High resolution thumbnail URL
 */
export function getHighResThumbnail(url, size = 800) {
  if (!url || typeof url !== 'string') return url;

  // 1. Google Content / YouTube Music Image URLs (lh3.googleusercontent.com, yt3.ggpht.com)
  if (url.includes('googleusercontent.com') || url.includes('ggpht.com')) {
    let highRes = url;
    
    // Replace width-height parameters like =w120-h120, =w60-h60, =w226-h226
    if (/[=/-]w\d+-h\d+/i.test(highRes)) {
      highRes = highRes.replace(/([=/-])w\d+-h\d+/gi, `$1w${size}-h${size}`);
    } 
    // Replace size parameters like =s120, =s60, =s226
    else if (/[=/-]s\d+/i.test(highRes)) {
      highRes = highRes.replace(/([=/-])s\d+/gi, `$1s${size}`);
    } 
    // Replace single width parameters like =w120
    else if (/[=/-]w\d+/i.test(highRes)) {
      highRes = highRes.replace(/([=/-])w\d+/gi, `$1w${size}`);
    } 
    // Append quality parameters if no modifier exists
    else if (!highRes.includes('=')) {
      highRes += `=w${size}-h${size}-l90-rj`;
    }
    
    return highRes;
  }

  // 2. Standard YouTube Video Thumbnail URLs (i.ytimg.com / img.youtube.com)
  if (url.includes('ytimg.com') || url.includes('youtube.com')) {
    if (/\/(default|mqdefault|hqdefault|sddefault)\.jpg/i.test(url)) {
      return url.replace(/\/(default|mqdefault|hqdefault|sddefault)\.jpg/gi, '/maxresdefault.jpg');
    }
  }

  return url;
}
