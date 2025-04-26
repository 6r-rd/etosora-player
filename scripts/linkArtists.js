/**
 * Script to link artists to songs without artists
 * Usage: node linkArtists.js --song "曲名" --artist "アーティスト名"
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { findOrCreateArtist } from './updateVideoData.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SONGS_JSON_PATH = path.join(PUBLIC_DIR, 'songs.json');
const ARTISTS_JSON_PATH = path.join(PUBLIC_DIR, 'artists.json');

// Parse command line arguments
const args = process.argv.slice(2);
let songTitle = '';
let artistName = '';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--song' && i + 1 < args.length) {
    songTitle = args[i + 1];
    i++;
  } else if (args[i] === '--artist' && i + 1 < args.length) {
    artistName = args[i + 1];
    i++;
  }
}

if (!songTitle || !artistName) {
  console.error('Usage: node linkArtists.js --song "曲名" --artist "アーティスト名"');
  process.exit(1);
}

// Load existing data
const songsData = JSON.parse(fs.readFileSync(SONGS_JSON_PATH, 'utf8'));
const artistsData = JSON.parse(fs.readFileSync(ARTISTS_JSON_PATH, 'utf8'));

// Find song by title
const normalizedTitle = songTitle.normalize('NFC').toLocaleLowerCase('ja');
const song = songsData.songs.find(s => 
  s.title.normalize('NFC').toLocaleLowerCase('ja') === normalizedTitle
);

if (!song) {
  console.error(`Song "${songTitle}" not found`);
  process.exit(1);
}

// Find or create artist
const { artistId, isNew } = findOrCreateArtist(artistName, artistsData.artists);

// Add artist to song if not already present
if (!song.artist_ids.includes(artistId)) {
  song.artist_ids.push(artistId);
  console.log(`Added artist "${artistName}" (${artistId}) to song "${songTitle}"`);
  
  // Save updated songs.json
  fs.writeFileSync(SONGS_JSON_PATH, JSON.stringify(songsData, null, 2));
  
  // If artist is new, add to artists.json
  if (isNew) {
    artistsData.artists.push({
      artist_id: artistId,
      name: artistName
    });
    fs.writeFileSync(ARTISTS_JSON_PATH, JSON.stringify(artistsData, null, 2));
    console.log(`Added new artist "${artistName}" (${artistId})`);
  }
} else {
  console.log(`Artist "${artistName}" already linked to song "${songTitle}"`);
}
