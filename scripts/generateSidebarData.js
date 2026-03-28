/**
 * Script to generate sidebar data for client-side loading.
 */
import * as fs from 'fs';
import * as path from 'path';
import { createNamespacedLogger } from './debug.js';

const logger = createNamespacedLogger('script:generateSidebarData');

const PUBLIC_DIR = path.join(process.cwd(), 'public');
const VIDEOS_DIR = path.join(PUBLIC_DIR, 'videos');
const API_DIR = path.join(PUBLIC_DIR, 'api');
const OUTPUT_PATH = path.join(API_DIR, 'sidebar-data.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function createSidebarDataPayload({
  artistsJson,
  songsJson,
  videos,
}) {
  const artists = {};

  for (const artist of artistsJson.artists || []) {
    artists[artist.artist_id] = artist.name;
  }

  return {
    songs: songsJson.songs || [],
    artists,
    videos: videos.map((video) => ({
      video_id: video.video_id,
      title: video.title,
      start_datetime: video.start_datetime,
      thumbnail_url: video.thumbnail_url,
      timestamps: (video.timestamps || []).map((timestamp) => ({
        song_id: timestamp.song_id,
        time: timestamp.time,
        original_time: timestamp.original_time,
      })),
    })),
  };
}

function loadVideos(videosDir = VIDEOS_DIR) {
  return fs
    .readdirSync(videosDir)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => readJson(path.join(videosDir, file)));
}

function generateSidebarData() {
  if (!fs.existsSync(API_DIR)) {
    fs.mkdirSync(API_DIR, { recursive: true });
  }

  const artistsJson = readJson(path.join(PUBLIC_DIR, 'artists.json'));
  const songsJson = readJson(path.join(PUBLIC_DIR, 'songs.json'));
  const videos = loadVideos();
  const payload = createSidebarDataPayload({
    artistsJson,
    songsJson,
    videos,
  });

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`);
  logger.log(`Generated sidebar-data.json with ${payload.videos.length} videos`);

  return payload;
}

if (import.meta.url.endsWith('generateSidebarData.js') && !process.env.VITEST) {
  generateSidebarData();
}

export { createSidebarDataPayload, generateSidebarData, loadVideos };
