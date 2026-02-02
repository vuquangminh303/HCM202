// Helper function to extract YouTube video ID from various URL formats
export function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Regular expression to match YouTube video IDs from various URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  }

  // Additional pattern for shortened URLs
  const shortUrlMatch = url.match(/youtu.be\/([a-zA-Z0-9_-]{11})/);
  if (shortUrlMatch) {
    return shortUrlMatch[1];
  }

  return null;
}

// Helper function to check if a URL is a YouTube URL
export function isYouTubeUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  return /youtube\.com|youtu\.be/.test(url.toLowerCase());
}
