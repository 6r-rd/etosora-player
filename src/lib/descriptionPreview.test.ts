import { describe, expect, it } from 'vitest';
import {
  extractFirstUrl,
  getDescriptionPreview,
  getDescriptionTextWithoutUrls,
  extractYouTubeVideoId,
  getYouTubeThumbnailCandidates,
} from './descriptionPreview';

describe('descriptionPreview', () => {
  it('extracts the first URL in description text', () => {
    const text = 'cover available https://www.youtube.com/watch?v=bYmqhIHfFwc and more https://example.com';
    expect(extractFirstUrl(text)).toBe('https://www.youtube.com/watch?v=bYmqhIHfFwc');
  });

  it('removes URL text from description', () => {
    const text = '歌ってみたあります。 https://www.youtube.com/watch?v=bYmqhIHfFwc';
    expect(getDescriptionTextWithoutUrls(text)).toBe('歌ってみたあります。');
  });

  it('extracts video ID from watch URL', () => {
    const url = 'https://www.youtube.com/watch?v=bYmqhIHfFwc&list=PL123';
    expect(extractYouTubeVideoId(url)).toBe('bYmqhIHfFwc');
  });

  it('extracts video ID from shorts URL', () => {
    const url = 'https://www.youtube.com/shorts/sLV4zmG7-Ok';
    expect(extractYouTubeVideoId(url)).toBe('sLV4zmG7-Ok');
  });

  it('returns null for non-YouTube URL', () => {
    const url = 'https://example.com/watch?v=bYmqhIHfFwc';
    expect(extractYouTubeVideoId(url)).toBeNull();
  });

  it('returns thumbnail candidates in quality order', () => {
    const candidates = getYouTubeThumbnailCandidates('bYmqhIHfFwc');
    expect(candidates).toEqual([
      'https://i.ytimg.com/vi/bYmqhIHfFwc/maxresdefault.jpg',
      'https://i.ytimg.com/vi/bYmqhIHfFwc/sddefault.jpg',
      'https://i.ytimg.com/vi/bYmqhIHfFwc/hqdefault.jpg',
      'https://i.ytimg.com/vi/bYmqhIHfFwc/mqdefault.jpg',
      'https://i.ytimg.com/vi/bYmqhIHfFwc/default.jpg',
    ]);
  });

  it('builds description preview with text and thumbnail candidates', () => {
    const preview = getDescriptionPreview(
      'short でエトソラカバーあります https://www.youtube.com/shorts/sLV4zmG7-Ok',
    );

    expect(preview.text).toBe('short でエトソラカバーあります');
    expect(preview.firstUrl).toBe('https://www.youtube.com/shorts/sLV4zmG7-Ok');
    expect(preview.youtubeVideoId).toBe('sLV4zmG7-Ok');
    expect(preview.youtubeThumbnailCandidates[0]).toBe(
      'https://i.ytimg.com/vi/sLV4zmG7-Ok/maxresdefault.jpg',
    );
  });
});
