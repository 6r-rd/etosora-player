# Astro Music Player

YouTube のアーカイブ動画を再生するための Web サイトです。YouTube Data API を使用して過去の配信データを取得し、タイムスタンプ付きで曲の情報を表示します。

## 1. Web サイトのユーザー向け情報

### 主な機能

- **アーカイブ動画の閲覧と再生**: サイドバーの `Archives` タブから過去の配信アーカイブを選択して視聴できます
- **曲ごとの詳細表示**: サイドバーの `Songs` タブから特定の曲が歌われた全ての動画を一覧表示します
- **タイムスタンプ**: 動画内の特定の曲の開始時間にタイムスタンプを通じて直接ジャンプできます
- **検索機能**: 曲名やアーティスト名で検索できます

### 使い方

1. トップページにアクセスします
2. サイドバーの「Archives」タブから視聴したい動画を選択します
3. または「Songs」タブから曲を選択すると、その曲が歌われた動画一覧が表示されます
4. 検索ボックスに曲名やアーティスト名を入力して検索できます

## 2. 開発者向け情報

### 技術スタック

- **[Astro](https://astro.build/)**: 静的サイト生成フレームワーク
- **[React](https://reactjs.org/)**: インタラクティブな UI コンポーネント
- **[Tailwind CSS](https://tailwindcss.com/)**: スタイリング
- **[shadcn/ui](https://ui.shadcn.com/)**: UI コンポーネントライブラリ
- **[YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)**: 動画再生

### 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/astro-player.git
cd astro-player

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

開発サーバーは http://localhost:4321 で起動します。

### プロジェクト構造

```
.
├── public/                 # 静的ファイルとデータ
│   ├── artists.json        # アーティスト情報
│   ├── songs.json          # 曲情報
│   └── videos/             # 動画ごとのJSONファイル
│       └── [video_id].json # 各動画の詳細情報
├── schema/                 # JSONスキーマ定義
├── scripts/                # ユーティリティスクリプト
└── src/                    # ソースコード
    ├── components/         # Reactコンポーネント
    │   └── ui/             # shadcn/uiコンポーネント
    ├── layouts/            # Astroレイアウト
    ├── lib/                # ユーティリティ関数
    ├── pages/              # Astroページ
    └── styles/             # グローバルスタイル
```

### ビルドとデプロイ

```bash
# 本番用ビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

ビルドされたファイルは `site/` ディレクトリに出力されます。これらのファイルを任意のウェブサーバーにデプロイできます。

### テスト

このプロジェクトは Vitest を使用してテストを実行します。

```bash
# すべてのテストを実行
npm test

# ウォッチモードでテストを実行
npm run test:watch

# UIでテストを実行
npm run test:ui

# カバレッジレポートを生成
npm run test:coverage
```

テストは以下のディレクトリに配置されています：

- `scripts/__tests__/unit/`: ユニットテスト
- `scripts/__tests__/integration/`: 統合テスト
- `scripts/__tests__/fixtures/`: テスト用のモックデータ
- `scripts/__tests__/utils/`: テスト用のユーティリティ関数

### GitHub Actions ワークフロー

このプロジェクトは以下の GitHub Actions ワークフローを使用しています：

1. **Deploy to GitHub Pages** (deploy.yml)

   - `main` ブランチへのプッシュ時に自動的にビルドとデプロイを実行
   - 設定：`.github/workflows/deploy.yml`

2. **Run Tests** (test.yml)

   - プッシュ、プルリクエスト、および他のワークフロー完了時にテストを実行
   - 設定：`.github/workflows/test.yml`

3. **Update Video Data** (update-video-data.yml)

   - 特定の YouTube 動画 ID からデータを取得して JSON ファイルを更新
   - 更新前に JSON スキーマ検証を実行
   - 手動トリガーで実行（GitHub Actions タブから）
   - 設定：`.github/workflows/update-video-data.yml`

4. **Fetch New Videos** (fetch-new-videos.yml)

   - YouTube チャンネルから新しい動画を自動的に取得
   - 更新前に JSON スキーマ検証を実行
   - 毎日深夜に自動実行または手動トリガーで実行
   - 設定：`.github/workflows/fetch-new-videos.yml`

5. **Validate JSON Files** (validate-json.yml)
   - プルリクエスト時に JSON ファイルをスキーマに対して検証
   - 変更された JSON ファイルのみを検証
   - 設定：`.github/workflows/validate-json.yml`

### GitHub Pages へのデプロイ

このプロジェクトは GitHub Pages を使用して自動的にデプロイするように設定されています。

1. **設定の確認**

   - `astro.config.mjs` ファイルで `base` パスがリポジトリ名と一致していることを確認します
   - 例: リポジトリ名が `astro-player` の場合、`base: '/astro-player'` と設定します

2. **GitHub リポジトリの設定**

   - リポジトリの "Settings" > "Pages" で、ソースを "GitHub Actions" に設定します
   - 初回デプロイ後、GitHub Pages の URL が表示されます（通常は `https://username.github.io/repository-name/`）

3. **手動デプロイ**
   - GitHub リポジトリの "Actions" タブから `Deploy to GitHub Pages` ワークフローを手動で実行することもできます

## 3. 運用者向け情報

### データ構造の仕様

#### songs.json

`songs.json` ファイルは、サイトで扱う全ての曲の情報を含みます。

```json
{
  "songs": [
    {
      "song_id": "T9nF-qT4Z6p", // 曲の一意のID（11文字）
      "title": "曲のタイトル", // 曲名
      "artist_ids": ["mS8q1D_fA7x"], // アーティストIDの配列（複数可）
      "alternate_titles": ["別名1", "別名2"] // 代替タイトル（オプション）
    }
  ]
}
```

#### artists.json

`artists.json` ファイルは、全てのアーティスト情報を含みます。

```json
{
  "artists": [
    {
      "artist_id": "mS8q1D_fA7x", // アーティストの一意のID（11文字）
      "name": "アーティスト名", // アーティスト名
      "aliases": ["別名1", "別名2"] // 別名（オプション）
    }
  ]
}
```

#### videos/[video_id].json

各動画の情報は `videos/` ディレクトリ内の個別の JSON ファイルに保存されます。

```json
{
  "video_id": "AZ6KhfbTPDk", // YouTubeの動画ID
  "title": "動画タイトル", // 動画のタイトル
  "start_datetime": "2025-03-31T18:00:00Z", // 配信開始日時（ISO 8601形式） UTC
  "thumbnail_url": "https://...", // サムネイルのURL
  "timestamps": [
    // タイムスタンプの配列
    {
      "time": 385, // 動画開始からの秒数
      "original_time": "00:06:25", // 元の時間表記（HH:MM:SS形式）
      "song_id": "T9nF-qT4Z6p", // 曲のID（songs.jsonの曲を参照）
      "comment_source": "comment", // タイムスタンプの出典（"comment"または"description"）
      "comment_date": "2025-04-01T19:30:00Z", // コメントの日時（オプション）
      "description": "" // 補足（例: 歌ってみた動画あります https://youtube.com/...
    }
  ]
}
```

`description` がある場合、ユーザーがタイムスタンプにマウスオーバーした際に popover を表示します。popover をクリックすると description に最初に記載された URL を開きます。

### データ更新プロセス

#### 新しいデータの追加

1. 適切な JSON ファイルを作成または編集します

   - 新しい曲を追加する場合: `songs.json` を編集
   - 新しいアーティストを追加する場合: `artists.json` を編集
   - 新しい動画を追加する場合: `videos/[video_id].json` を作成

2. スキーマに従っていることを確認します

   - 各 JSON ファイルは対応するスキーマ（`schema/` ディレクトリ内）に準拠している必要があります
   - ID は 11 文字の英数字とハイフン、アンダースコアのみを使用します

3. プルリクエスト（PR）を作成します
   - 変更内容を説明するコメントを付けてください
   - レビュアーが内容を確認します

#### データの検証

データを追加または編集する際は、以下の点に注意してください：

- **ID の一意性**: 各 `song_id` と `artist_id` は一意である必要があります
- **参照整合性**: `song.artist_ids` は必ず `artists.json` に存在する ID を参照してください
- **必須フィールド**: スキーマで定義された必須フィールドを全て含めてください
- **日付形式**: 日付は ISO 8601 形式（`YYYY-MM-DDTHH:MM:SSZ`）で記述してください

##### JSON スキーマ検証

このプロジェクトは JSON スキーマ検証を使用して、データの整合性を確保しています：

- 各 JSON ファイルは `schema/` ディレクトリ内の対応するスキーマに対して検証されます
- 検証は GitHub Actions ワークフローで自動的に実行されます
- ローカルでも検証できます：

```bash
# 全ての JSON ファイルを検証
npm run validate-json

# 特定のファイルを検証
npm run validate-json -- public/videos/videoId.json public/songs.json
```

詳細は `scripts/README-validation.md` を参照してください。

### 運用フロー

#### 新しい動画の追加手順

1. 動画 ID を確認します（YouTube の URL から取得）
2. `videos/[video_id].json` ファイルを作成します
3. 動画のタイトル、公開日時、サムネイル URL を入力します
4. タイムスタンプ情報を追加します
   - 各タイムスタンプには、時間と対応する曲の ID が必要です
   - 曲がまだ `songs.json` に存在しない場合は、先に追加してください
5. PR を作成してレビューを依頼します

#### 既存データの修正

1. 修正が必要な JSON ファイルを特定します
2. 必要な変更を加えます
3. スキーマに準拠していることを確認します
4. PR を作成して変更内容を説明します

#### データの整合性確認

定期的に以下の点を確認することをお勧めします：

- 全ての `song_id` と `artist_id` が一意であること
- 全ての参照（`song.artist_ids` など）が有効であること
- 必須フィールドが全て入力されていること
- 日付形式が正しいこと

## 4. ライセンス

MIT © Astro Music Player Contributors

---
