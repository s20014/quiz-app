# リアルタイムクイズアプリ

ホストが出題する問題にリアルタイムで回答できる、参加型クイズアプリケーションです。
QRコードでスマホから簡単に参加でき、WebSocketによる双方向通信で即座にスコアが反映されます。

![Laravel](https://img.shields.io/badge/Laravel-12-FF2D20?style=flat&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=flat&logo=mysql&logoColor=white)

---

## 📋 主な機能

### ホスト側
- ✅ QRコードによるルーム作成・共有
- ✅ 参加者のリアルタイム表示
- ✅ 3種類の問題形式（マルバツ / 4択 / テキスト入力）
- ✅ 回答状況のリアルタイム確認
- ✅ 自動採点とスコア手動調整
- ✅ リーダーボード表示

### 参加者側
- ✅ QRコードスキャンで簡単参加
- ✅ 名前入力のみ（認証不要）
- ✅ リアルタイム問題表示
- ✅ 即座に結果確認（正解/不正解）
- ✅ スコア表示

---

## 🛠 技術スタック

### フロントエンド
- **React 18** + **TypeScript**
- **Inertia.js** - Laravel × React のシームレスな統合
- **Tailwind CSS** - モダンなスタイリング
- **shadcn/ui** - 美しいUIコンポーネント
- **Vite** - 高速ビルドツール
- **react-qr-code** - QRコード生成

### バックエンド
- **Laravel 12** (PHP 8.4)
- **MySQL 8.0**
- **Redis** - セッション/キャッシュ管理
- **Laravel Reverb** - WebSocketサーバー（リアルタイム通信）

### 開発環境
- **Docker** + **Docker Compose**
- **Apache** (Webサーバー)
- **phpMyAdmin** (DB管理ツール)
- **MailHog** (メールテスト)

---

## 🚀 セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/s20014/quiz-app.git
cd quiz-app
```

### 2. Dockerコンテナの起動

```bash
docker-compose up -d
```

### 3. コンテナに入る

```bash
docker exec -it quiz_app bash
```

### 4. 依存関係のインストール

```bash
# Laravel依存関係
composer install

# Node.js依存関係
npm install
```

### 5. 環境設定

```bash
# .envファイルの作成
cp .env.example .env

# アプリケーションキーの生成
php artisan key:generate
```

### 6. データベースのセットアップ

```bash
# マイグレーション実行
php artisan migrate

# （オプション）サンプルデータの投入
php artisan db:seed
```

### 7. フロントエンドのビルド

```bash
# 開発サーバー起動（ホットリロード有効）
npm run dev

# 本番ビルド
npm run build
```

### 8. Reverbサーバーの起動（WebSocket）

別のターミナルで:

```bash
docker exec -it quiz_app bash
php artisan reverb:start
```

### 9. アプリケーションにアクセス

- **メインアプリ**: http://localhost
- **Vite開発サーバー**: http://localhost:5173
- **phpMyAdmin**: http://localhost:8081
- **MailHog**: http://localhost:8026

---

## 📐 ディレクトリ構成

```
quiz-app/
├── app/
│   ├── Events/              # WebSocketイベント
│   ├── Http/Controllers/    # APIコントローラー
│   └── Models/              # Eloquentモデル
├── database/
│   ├── migrations/          # DBマイグレーション
│   └── seeders/             # シーダー
├── resources/
│   ├── js/
│   │   ├── Pages/           # Inertia.jsページコンポーネント
│   │   │   ├── Home.tsx
│   │   │   ├── Host.tsx
│   │   │   ├── PlayerJoin.tsx
│   │   │   ├── PlayerAnswer.tsx
│   │   │   └── Leaderboard.tsx
│   │   ├── Components/ui/   # shadcn/uiコンポーネント
│   │   ├── Contexts/        # React Context
│   │   ├── services/        # API通信
│   │   └── echo.ts          # WebSocket設定
│   └── css/
│       └── app.css          # Tailwind設定
├── routes/
│   ├── api.php              # APIルート
│   ├── web.php              # Webルート
│   └── channels.php         # Broadcasting設定
├── docker-compose.yml
└── CLAUDE.md                # 開発ガイドライン
```

---

## 🎮 使い方

### ホストとして問題を出題する

1. トップページから「ホストとして開始」をクリック
2. ルームコードとQRコードが表示される
3. 問題形式を選択（マルバツ / 4択 / テキスト入力）
4. 正解を設定
5. 「回答受付開始」をクリック
6. 参加者が回答するのを待つ
7. 「回答締め切り・採点」で自動採点
8. 「次の問題へリセット」で次の問題へ

### 参加者として回答する

1. QRコードをスキャン、またはルームコードを入力
2. 名前を入力して参加
3. ホストが問題を出すまで待機
4. 問題が表示されたら回答を選択
5. 「送信」ボタンで回答
6. 結果発表を待つ（正解/不正解が表示される）
7. スコアがリアルタイムで更新される

---

## 🔧 開発コマンド

```bash
# Dockerコンテナ起動
docker-compose up -d

# コンテナ停止
docker-compose down

# ログ確認
docker-compose logs -f

# マイグレーション実行
docker exec -it quiz_app php artisan migrate

# マイグレーションリセット
docker exec -it quiz_app php artisan migrate:fresh

# Reverb起動
docker exec -it quiz_app php artisan reverb:start

# Vite開発サーバー起動
docker exec -it quiz_app npm run dev

# ビルド
docker exec -it quiz_app npm run build

# テスト実行
docker exec -it quiz_app php artisan test
```

---

## 🐛 トラブルシューティング

### WebSocketに接続できない

**症状**: 参加者が増えない、リアルタイム更新が動かない

**解決方法**:
```bash
# Reverbが起動しているか確認
docker exec -it quiz_app php artisan reverb:start

# .envの設定を確認
BROADCAST_CONNECTION=reverb
REVERB_HOST=reverb
REVERB_PORT=8080
```

### Viteがホットリロードされない

**解決方法**:
```bash
# vite.config.ts で server.host を '0.0.0.0' に設定
# docker-compose.yml でポート5173を開放
```

### MySQLに接続できない

**解決方法**:
```bash
# .envの設定を確認
DB_HOST=db
DB_PORT=3306
DB_DATABASE=quiz_app

# コンテナが起動しているか確認
docker-compose ps
```

### npm installでエラーが出る

**解決方法**:
```bash
# node_modulesを削除して再インストール
docker exec -it quiz_app rm -rf node_modules
docker exec -it quiz_app npm install
```

---

## 🔒 セキュリティ

- ✅ CSRF保護（Laravel自動処理）
- ✅ XSS対策（React自動エスケープ）
- ✅ SQLインジェクション対策（Eloquent ORM）
- ✅ 環境変数による機密情報管理

---

## 📝 ライセンス

このプロジェクトは [MIT License](https://opensource.org/licenses/MIT) の下で公開されています。

---

## 👥 開発者

- **GitHub**: [@s20014](https://github.com/s20014)
- **リポジトリ**: [quiz-app](https://github.com/s20014/quiz-app)

---

## 🙏 謝辞

- [Laravel](https://laravel.com) - Web application framework
- [React](https://react.dev) - UI library
- [Inertia.js](https://inertiajs.com) - Modern monolith framework
- [shadcn/ui](https://ui.shadcn.com) - Beautifully designed components
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework

---

**Happy Quizzing! 🎉**
