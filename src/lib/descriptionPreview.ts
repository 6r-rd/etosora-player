const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const YOUTUBE_VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;

const YOUTUBE_THUMBNAIL_QUALITIES = [
  'maxresdefault',
  'sddefault',
  'hqdefault',
  'mqdefault',
  'default',
] as const;

export interface DescriptionPreview {
  firstUrl: string | null;
  text: string;
  youtubeVideoId: string | null;
  youtubeThumbnailCandidates: string[];
}

export function extractFirstUrl(text: string): string | null {
  if (!text) {
    return null;
  }

  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}

export function getDescriptionTextWithoutUrls(text: string): string {
  if (!text) {
    return '';
  }

  return text
    .replace(URL_REGEX, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    const normalizedHost = hostname.startsWith('www.') ? hostname.slice(4) : hostname;

    if (normalizedHost !== 'youtube.com' && normalizedHost !== 'm.youtube.com') {
      return null;
    }

    if (parsedUrl.pathname === '/watch') {
      const videoId = parsedUrl.searchParams.get('v');
      return videoId && YOUTUBE_VIDEO_ID_REGEX.test(videoId) ? videoId : null;
    }

    if (parsedUrl.pathname.startsWith('/shorts/')) {
      const segments = parsedUrl.pathname.split('/').filter(Boolean);
      const videoId = segments[1];
      return videoId && YOUTUBE_VIDEO_ID_REGEX.test(videoId) ? videoId : null;
    }

    return null;
  } catch (_error) {
    return null;
  }
}

export function getYouTubeThumbnailCandidates(videoId: string): string[] {
  if (!YOUTUBE_VIDEO_ID_REGEX.test(videoId)) {
    return [];
  }

  return YOUTUBE_THUMBNAIL_QUALITIES.map(
    (quality) => `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`,
  );
}

export function getDescriptionPreview(description: string): DescriptionPreview {
  const firstUrl = extractFirstUrl(description);
  const text = getDescriptionTextWithoutUrls(description);
  const youtubeVideoId = firstUrl ? extractYouTubeVideoId(firstUrl) : null;
  const youtubeThumbnailCandidates = youtubeVideoId
    ? getYouTubeThumbnailCandidates(youtubeVideoId)
    : [];

  return {
    firstUrl,
    text,
    youtubeVideoId,
    youtubeThumbnailCandidates,
  };
}
