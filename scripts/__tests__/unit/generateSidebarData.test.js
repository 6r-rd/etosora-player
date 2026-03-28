import { describe, expect, it } from 'vitest';
import { createSidebarDataPayload } from '../../generateSidebarData.js';

describe('createSidebarDataPayload', () => {
  it('builds a deterministic sidebar payload from source data', () => {
    const payload = createSidebarDataPayload({
      artistsJson: {
        artists: [
          { artist_id: 'artist-b', name: 'Artist B' },
          { artist_id: 'artist-a', name: 'Artist A' },
        ],
      },
      songsJson: {
        songs: [
          {
            song_id: 'song-1',
            title: 'Song 1',
            artist_ids: ['artist-a'],
            alternate_titles: ['Alt Song 1'],
          },
        ],
      },
      videos: [
        {
          video_id: 'video-1',
          title: 'Video 1',
          start_datetime: '2026-03-28T00:00:00Z',
          thumbnail_url: 'https://example.com/thumb.webp',
          timestamps: [
            {
              song_id: 'song-1',
              time: 12,
              original_time: '00:12',
              comment_source: 'description',
              description: 'ignored',
            },
          ],
          extra_field: 'ignored',
        },
      ],
    });

    expect(payload).toEqual({
      songs: [
        {
          song_id: 'song-1',
          title: 'Song 1',
          artist_ids: ['artist-a'],
          alternate_titles: ['Alt Song 1'],
        },
      ],
      artists: {
        'artist-b': 'Artist B',
        'artist-a': 'Artist A',
      },
      videos: [
        {
          video_id: 'video-1',
          title: 'Video 1',
          start_datetime: '2026-03-28T00:00:00Z',
          thumbnail_url: 'https://example.com/thumb.webp',
          timestamps: [
            {
              song_id: 'song-1',
              time: 12,
              original_time: '00:12',
            },
          ],
        },
      ],
    });
  });

  it('handles missing arrays without throwing', () => {
    const payload = createSidebarDataPayload({
      artistsJson: {},
      songsJson: {},
      videos: [
        {
          video_id: 'video-1',
          title: 'Video 1',
          start_datetime: '2026-03-28T00:00:00Z',
          thumbnail_url: 'https://example.com/thumb.webp',
        },
      ],
    });

    expect(payload).toEqual({
      songs: [],
      artists: {},
      videos: [
        {
          video_id: 'video-1',
          title: 'Video 1',
          start_datetime: '2026-03-28T00:00:00Z',
          thumbnail_url: 'https://example.com/thumb.webp',
          timestamps: [],
        },
      ],
    });
  });
});
