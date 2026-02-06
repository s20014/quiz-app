# Quiz App - 開発ガイドライン

## 📋 プロジェクト概要

リアルタイムクイズアプリケーション。ホストが問題を画面に表示し、参加者はQRコードからスマホで参加して回答する。

### 主な機能
- **ホスト側**: QRコード生成、参加者管理、問題形式選択、スコア管理、リーダーボード表示
- **参加者側**: QRコードから参加、名前入力、リアルタイム回答、スコア表示
- **問題形式**: マルバツ、4択、テキスト入力
- **スコアリング**: 自動計算、手動調整機能

**重要**: 問題の出題は別のスライド等で行う想定。アプリは回答の収集とスコア計算に特化。

---

## 🛠 技術スタック

### フロントエンド
- **React 18** (TypeScript)
- **Inertia.js** - Laravel × React のブリッジ
- **Tailwind CSS** - スタイリング
- **shadcn/ui** - UIコンポーネント（既存Figmaコードで使用）
- **Vite** - ビルドツール
- **react-qr-code** - QRコード生成

### バックエンド
- **Laravel 12** (PHP 8.4)
- **MySQL 8.0** - メインデータベース
- **Redis** - セッション/キャッシュ/リアルタイム通信
- **Laravel Breeze (Inertia)** - 認証スターター（必要に応じて）

### インフラ
- **Docker** - 開発環境
- **Docker Compose** - サービス構成
- **Apache** - Webサーバー
- **phpMyAdmin** - DB管理ツール
- **MailHog** - メールテスト

---

## 🏗 アーキテクチャ

### ディレクトリ構成

```
quiz-app/
├── docker/
│   └── mysql/
│       └── initdb.d/          # MySQL初期化スクリプト
├── app/                        # Laravelアプリケーションロジック
│   ├── Models/
│   ├── Http/
│   │   └── Controllers/       # Inertiaコントローラー
│   └── Events/                # WebSocketイベント
├── database/
│   ├── migrations/
│   └── seeders/
├── resources/
│   ├── js/
│   │   ├── Pages/             # Inertia Pages（既存Figmaコードを移植）
│   │   │   ├── Home.tsx
│   │   │   ├── Host.tsx
│   │   │   ├── PlayerJoin.tsx
│   │   │   ├── PlayerAnswer.tsx
│   │   │   └── Leaderboard.tsx
│   │   ├── Components/
│   │   │   └── ui/            # shadcn/uiコンポーネント
│   │   ├── Contexts/          # React Context（必要に応じて）
│   │   └── app.tsx            # Inertiaエントリーポイント
│   └── css/
│       └── app.css            # Tailwind設定
├── routes/
│   └── web.php                # Inertiaルート定義
├── Dockerfile
├── docker-compose.yml
├── composer.json
├── package.json
└── CLAUDE.md                  # このファイル
```

### データフロー
1. **ルーム作成**: ホストがルーム作成 → Laravel が room_id 生成 → QRコード表示
2. **参加**: 参加者がQRコードスキャン → 名前入力 → Laravel に登録
3. **問題出題**: ホストが問題形式を選択 → Laravel に送信 → Redis経由で参加者に通知（WebSocket/Polling）
4. **回答**: 参加者が回答 → Laravel に送信 → Redis で集計
5. **採点**: ホストが正解を設定 → Laravel で自動採点 → スコア更新

---

## 🐳 Docker環境設定

### サービス構成

| サービス | イメージ | ポート | 用途 |
|---------|---------|-------|------|
| app | php:8.4-apache + Node.js 22 | 80, 5173 | Laravel + Vite |
| db | mysql:8.0 | 3307 | データベース |
| redis | redis:alpine | 6380 | キャッシュ/セッション/リアルタイム |
| phpmyadmin | phpmyadmin | 8081 | DB管理 |
| mailhog | mailhog | 8026 (UI), 1026 (SMTP) | メールテスト |

### 環境変数 (.env)

```env
APP_NAME="Quiz App"
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=quiz_app
DB_USERNAME=user
DB_PASSWORD=password

REDIS_HOST=redis
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
```

---

## 📐 コーディング規約

### TypeScript/React

#### ✅ 推奨
- **関数コンポーネント** + **Hooks** を使用
- **TypeScript** の型を明示的に定義
- **Inertia.js** のページコンポーネントは `resources/js/Pages/` に配置
- **shadcn/ui** コンポーネントを活用（カスタマイズ可）
- **Tailwind CSS** でスタイリング（インラインクラス）
- ファイル名は **PascalCase** (例: `Host.tsx`)
- コンポーネント名とファイル名を一致させる

#### ❌ 避ける
- クラスコンポーネントの使用
- CSS Modules や styled-components（Tailwindに統一）
- `any` 型の多用

### Laravel

#### ✅ 推奨
- **リソースコントローラー** でInertiaレスポンスを返す
- **Eloquent ORM** でDB操作
- **バリデーション** はFormRequestクラスで実装
- **イベント/リスナー** でリアルタイム通知
- PSR-12 コーディング規約に準拠

#### ❌ 避ける
- 生のSQLクエリ（セキュリティリスク）
- コントローラーへのビジネスロジック集中（Serviceクラスに分離）

### データベース

- テーブル名: **複数形・スネークケース** (例: `quiz_rooms`, `players`)
- カラム名: **スネークケース** (例: `room_id`, `created_at`)
- 外部キー: `{テーブル名}_id` (例: `room_id`)
- **マイグレーション** で必ず管理（直接DBを編集しない）

---

## 🚀 開発ワークフロー

### 1. 環境構築（これから実施）

```bash
# Dockerコンテナ起動
docker-compose up -d

# コンテナに入る
docker exec -it quiz_app bash

# Laravel依存関係インストール
composer install

# Node.js依存関係インストール
npm install

# .envファイル作成
cp .env.example .env
php artisan key:generate

# マイグレーション実行
php artisan migrate

# Vite開発サーバー起動
npm run dev
```

### 2. 開発時の作業フロー

1. **機能追加時**:
   - マイグレーション作成 → モデル作成 → コントローラー作成 → ルート定義 → Inertiaページ作成

2. **フロントエンド開発**:
   - 既存の `src/` にあるFigmaコードを `resources/js/Pages/` に移植
   - Inertia の `usePage()` や `useForm()` を活用
   - Viteのホットリロードで即座に反映

3. **テスト**:
   - `php artisan test` でバックエンドテスト
   - 必要に応じてVitestでフロントエンドテスト

### 3. Git運用

- **ブランチ戦略**: feature/* → develop → main
- **コミットメッセージ**: 日本語OK、変更内容を簡潔に記載
- `.env` や `node_modules/` は `.gitignore` で除外

---

## 🎯 実装の優先順位

### Phase 1: 環境構築（最初に実施）
- [ ] Dockerファイル作成（Dockerfile, docker-compose.yml）
- [ ] Laravel 12 インストール + Inertia設定
- [ ] Tailwind CSS + shadcn/ui セットアップ
- [ ] 基本ルーティング確認

### Phase 2: 基本機能実装
- [ ] ルーム作成・管理機能
- [ ] 参加者登録機能
- [ ] 問題形式選択UI
- [ ] 回答収集機能
- [ ] スコア計算機能

### Phase 3: リアルタイム機能
- [ ] Redis + Laravel Echo でWebSocket接続
- [ ] リアルタイム参加者表示
- [ ] リアルタイム回答状況更新

### Phase 4: 追加機能
- [ ] QRコード生成（react-qr-code）
- [ ] スコア手動編集ダイアログ
- [ ] リーダーボード

---

## 🔒 セキュリティ

- **CSRF保護**: LaravelのCSRFトークンを全てのフォームに含める（Inertiaが自動処理）
- **XSS対策**: Reactが自動エスケープ（`dangerouslySetInnerHTML` は使用禁止）
- **SQLインジェクション対策**: Eloquent ORMを使用（プレースホルダ自動適用）
- **認証**: 必要に応じてLaravel Breezeを導入（ホスト専用機能に使用）

---

## 📝 Inertia.js 固有の注意事項

### ページコンポーネントの定義

```typescript
// resources/js/Pages/Host.tsx
import { Head } from '@inertiajs/react';

interface Props {
  room: {
    id: string;
    code: string;
  };
  players: Array<{
    id: number;
    name: string;
    score: number;
  }>;
}

export default function Host({ room, players }: Props) {
  return (
    <>
      <Head title="ホスト画面" />
      {/* コンポーネント内容 */}
    </>
  );
}
```

### データの受け渡し

- **Laravel → React**: `Inertia::render('PageName', ['data' => $data])`
- **React → Laravel**: `router.post('/endpoint', data)` または `useForm()`

### フォーム送信

```typescript
import { useForm } from '@inertiajs/react';

const { data, setData, post, processing } = useForm({
  name: '',
});

const submit = (e: React.FormEvent) => {
  e.preventDefault();
  post('/players');
};
```

---

## 🚫 やってはいけないこと

1. **既存のFigmaコードを完全に捨てない**: shadcn/uiコンポーネントは再利用する
2. **Dockerを使わずにローカル環境構築しない**: 環境差異を防ぐため
3. **マイグレーションなしにDBスキーマを変更しない**: バージョン管理が崩れる
4. **エラーハンドリングを省略しない**: ユーザー体験が悪化する
5. **レスポンシブ対応を後回しにしない**: Tailwindで最初から対応
6. **過度な最適化をしない**: まずは動作する実装を優先
7. **認証が不要な機能に認証を追加しない**: 参加者は匿名参加が基本

---

## 🔧 トラブルシューティング

### Viteがホットリロードされない
```bash
# docker-compose.ymlでViteポート5173を開放しているか確認
# vite.config.jsでserverのhostを'0.0.0.0'に設定
```

### Inertiaページが真っ白
```bash
# ブラウザコンソールでエラー確認
# resources/js/app.tsxでInertiaが正しくマウントされているか確認
```

### MySQLに接続できない
```bash
# .envのDB_HOSTが'db'になっているか確認
# docker-compose.ymlでdbサービスが起動しているか確認
docker-compose ps
```

---

## 📚 参考資料

- [Laravel 12 公式ドキュメント](https://laravel.com/docs/12.x)
- [Inertia.js 公式ドキュメント](https://inertiajs.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app)

---

**作成日**: 2026年2月6日
**バージョン**: 1.0
**最終更新**: 環境構築前
