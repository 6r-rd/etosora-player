import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import { isJsonString, processSongArtist, processSongArtistList } from '../../linkArtists.js';
import { findOrCreateArtist } from '../../updateVideoData.js';
import { generateSongId } from '../../generateId.js';

// Mock dependencies
vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(true)
}));

vi.mock('../../updateVideoData.js', () => ({
  findOrCreateArtist: vi.fn()
}));

vi.mock('../../generateId.js', () => ({
  generateSongId: vi.fn()
}));

vi.mock('../../debug.js', () => ({
  createNamespacedLogger: () => ({
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}));

// Mock the module-level variables and functions
vi.mock('../../linkArtists.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    // Only export the functions we want to test
    isJsonString: actual.isJsonString,
    processSongArtist: actual.processSongArtist,
    processSongArtistList: actual.processSongArtistList
  };
});

describe('linkArtists', () => {
  // テスト用のデータ
  let songsData;
  let artistsData;

  beforeEach(() => {
    // テストごとにデータをリセット
    songsData = {
      songs: [
        {
          song_id: 'existing123',
          title: '既存の曲',
          artist_ids: ['artist123']
        },
        {
          song_id: 'duplicate123',
          title: '重複する曲名',
          artist_ids: ['artist123']
        }
      ]
    };
    
    artistsData = {
      artists: [
        {
          artist_id: 'artist123',
          name: '既存のアーティスト'
        }
      ]
    };

    // モックのリセット
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('isJsonString', () => {
    it('should return true for valid JSON objects', () => {
      expect(isJsonString('{"key": "value"}')).toBe(true);
      expect(isJsonString('[{"artist": "YOASOBI", "songs": ["アイドル"]}]')).toBe(true);
    });

    it('should return false for invalid JSON strings', () => {
      expect(isJsonString('not a json')).toBe(false);
      expect(isJsonString('{invalid json}')).toBe(false);
    });

    it('should return false for JSON non-objects', () => {
      expect(isJsonString('"string"')).toBe(false);
      expect(isJsonString('123')).toBe(false);
      expect(isJsonString('true')).toBe(false);
    });
  });

  describe('processSongArtist', () => {
    it('should create new song when title exists but with different artist', () => {
      // モックの設定
      findOrCreateArtist.mockReturnValue({ artistId: 'newArtist', isNew: true });
      generateSongId.mockReturnValue('newSong123');
      
      // 既存の曲と同じ名前だが異なるアーティスト
      const result = processSongArtist('重複する曲名', '新しいアーティスト', songsData, artistsData);
      
      expect(result).toBe(true);
      expect(songsData.songs).toHaveLength(3);
      expect(songsData.songs[2].title).toBe('重複する曲名');
      expect(songsData.songs[2].artist_ids).toContain('newArtist');
      expect(artistsData.artists).toHaveLength(2);
    });

    it('should not add song when title and artist already exist', () => {
      // モックの設定
      findOrCreateArtist.mockReturnValue({ artistId: 'artist123', isNew: false });
      
      // 既存の曲と同じ名前、同じアーティスト
      const result = processSongArtist('既存の曲', '既存のアーティスト', songsData, artistsData);
      
      expect(result).toBe(false);
      expect(songsData.songs).toHaveLength(2);
    });

    it('should create new song when title does not exist', () => {
      // モックの設定
      findOrCreateArtist.mockReturnValue({ artistId: 'artist123', isNew: false });
      generateSongId.mockReturnValue('newSong123');
      
      const result = processSongArtist('新しい曲', '既存のアーティスト', songsData, artistsData);
      
      expect(result).toBe(true);
      expect(songsData.songs).toHaveLength(3);
      expect(songsData.songs[2].title).toBe('新しい曲');
      expect(songsData.songs[2].artist_ids).toContain('artist123');
    });

    it('should skip if song title is empty', () => {
      const result = processSongArtist('', 'アーティスト', songsData, artistsData);
      
      expect(result).toBe(false);
      expect(findOrCreateArtist).not.toHaveBeenCalled();
    });

    it('should skip if artist name is empty', () => {
      const result = processSongArtist('曲名', '', songsData, artistsData);
      
      expect(result).toBe(false);
      expect(findOrCreateArtist).not.toHaveBeenCalled();
    });
  });

  describe('processSongArtistList', () => {
    it('should process multiple songs and artists from list', () => {
      // processSongArtistをモック化
      const originalProcessSongArtist = global.processSongArtist;
      global.processSongArtist = vi.fn()
        .mockReturnValueOnce(true)  // YOASOBI - アイドル
        .mockReturnValueOnce(true)  // YOASOBI - 夜に駆ける
        .mockReturnValueOnce(false) // ヨルシカ - だから僕は音楽を辞めた (すでに存在すると仮定)
        .mockReturnValueOnce(true); // 米津玄師 - Lemon
      
      const songArtistList = [
        { artist: "YOASOBI", songs: ["アイドル", "夜に駆ける"] },
        { artist: "ヨルシカ", songs: ["だから僕は音楽を辞めた"] },
        { artist: "米津玄師", songs: ["Lemon"] }
      ];
      
      processSongArtistList(songArtistList, songsData, artistsData);
      
      expect(global.processSongArtist).toHaveBeenCalledTimes(4);
      expect(global.processSongArtist).toHaveBeenCalledWith("アイドル", "YOASOBI", songsData, artistsData);
      expect(global.processSongArtist).toHaveBeenCalledWith("夜に駆ける", "YOASOBI", songsData, artistsData);
      expect(global.processSongArtist).toHaveBeenCalledWith("だから僕は音楽を辞めた", "ヨルシカ", songsData, artistsData);
      expect(global.processSongArtist).toHaveBeenCalledWith("Lemon", "米津玄師", songsData, artistsData);
      
      // 元の関数を復元
      global.processSongArtist = originalProcessSongArtist;
    });

    it('should handle empty songs array', () => {
      // processSongArtistをモック化
      const originalProcessSongArtist = global.processSongArtist;
      global.processSongArtist = vi.fn();
      
      const songArtistList = [
        { artist: "YOASOBI", songs: [] },
        { artist: "ヨルシカ" } // songs プロパティなし
      ];
      
      processSongArtistList(songArtistList, songsData, artistsData);
      
      expect(global.processSongArtist).not.toHaveBeenCalled();
      
      // 元の関数を復元
      global.processSongArtist = originalProcessSongArtist;
    });
  });
});
