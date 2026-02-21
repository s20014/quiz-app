# 本番デプロイ手順書

- **サーバーIP**: 133.242.19.6
- **ドメイン**: quiz-app.to-kome.com
- **OS**: Ubuntu
- **構成**: ホスト Nginx (SSL終端) + Docker (アプリケーション)

---

## 前提条件

- サーバーに SSH 接続できること
- Docker / Docker Compose がインストール済み
- ドメイン (quiz-app.to-kome.com) の DNS A レコードが 133.242.19.6 に向いていること

---

## 1. 初回セットアップ

### 1-1. サーバーにSSH接続

```bash
ssh <ユーザー名>@133.242.19.6
```

### 1-2. Nginx と certbot をインストール

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 1-3. リポジトリをクローン

```bash
cd /var/www  # または任意のディレクトリ
git clone <リポジトリURL> quiz-app
cd quiz-app
```

### 1-4. .env ファイルを作成

```bash
cp .env.production.example .env
```

以下のプレースホルダーを実際の値に変更する:

| 項目 | 説明 |
|------|------|
| `APP_KEY` | `docker compose -f docker-compose.prod.yml run --rm app php artisan key:generate --show` で生成 |
| `DB_PASSWORD` | MySQL ユーザーパスワード (強力なものに変更) |
| `DB_ROOT_PASSWORD` | MySQL root パスワード (強力なものに変更) |
| `REDIS_PASSWORD` | Redis パスワード (任意の文字列) |
| `REVERB_APP_KEY` | `openssl rand -hex 16` で生成 |
| `REVERB_APP_SECRET` | `openssl rand -hex 16` で生成 |
| `VITE_REVERB_APP_KEY` | REVERB_APP_KEY と同じ値 |
| `MAIL_*` | 使用する SMTP サービスの情報 (不要なら後回しOK) |

### 1-5. Nginx 設定を配置

```bash
sudo cp docker/nginx/quiz-app.to-kome.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/quiz-app.to-kome.com.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
```

### 1-6. Let's Encrypt SSL 証明書を取得

```bash
# まず SSL 行をコメントアウトして HTTP のみで起動
sudo sed -i 's/listen 443 ssl http2;/#listen 443 ssl http2;/' /etc/nginx/sites-available/quiz-app.to-kome.com.conf
sudo sed -i 's/ssl_/#ssl_/g' /etc/nginx/sites-available/quiz-app.to-kome.com.conf
sudo nginx -t && sudo systemctl restart nginx

# certbot で証明書取得 (nginx 設定も自動修正される)
sudo certbot --nginx -d quiz-app.to-kome.com

# 自動更新の確認
sudo certbot renew --dry-run
```

> certbot --nginx は SSL 設定を自動で書き換えてくれるため、
> 手動でコメントアウトを戻す必要はありません。

### 1-7. Docker コンテナを起動

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### 1-8. Laravel の初期設定

```bash
# APP_KEY 生成 (.env に書き込まれる)
docker exec quiz_app php artisan key:generate

# マイグレーション実行
docker exec quiz_app php artisan migrate --force

# ストレージのシンボリックリンク作成
docker exec quiz_app php artisan storage:link
```

### 1-9. 動作確認

- https://quiz-app.to-kome.com にアクセス → アプリが表示されること
- http://quiz-app.to-kome.com にアクセス → HTTPS にリダイレクトされること
- ブラウザ DevTools の Network タブで `wss://quiz-app.to-kome.com/app/...` の WebSocket 接続を確認

---

## 2. コード更新 (デプロイ)

サーバーにSSH接続して以下を実行:

```bash
cd /var/www/quiz-app

# 最新コードを取得
git pull origin main

# コンテナを再ビルドして再起動
docker compose -f docker-compose.prod.yml up -d --build

# マイグレーションがある場合
docker exec quiz_app php artisan migrate --force
```

---

## 3. よく使うコマンド

### コンテナ操作

```bash
# 状態確認
docker compose -f docker-compose.prod.yml ps

# ログ確認
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml logs -f reverb

# コンテナに入る
docker exec -it quiz_app bash

# 全コンテナ停止
docker compose -f docker-compose.prod.yml down

# 全コンテナ停止 + ボリューム削除 (DBデータも消える！)
docker compose -f docker-compose.prod.yml down -v
```

### Laravel Artisan

```bash
# キャッシュクリア
docker exec quiz_app php artisan cache:clear
docker exec quiz_app php artisan config:clear

# メンテナンスモード
docker exec quiz_app php artisan down
docker exec quiz_app php artisan up

# キューの再起動
docker compose -f docker-compose.prod.yml restart queue
```

### Nginx (ホスト側)

```bash
# 設定テスト
sudo nginx -t

# 再起動
sudo systemctl restart nginx

# ログ確認
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### SSL 証明書

```bash
# 証明書の有効期限確認
sudo certbot certificates

# 手動で更新
sudo certbot renew

# 自動更新は certbot が cron/systemd timer で設定済み
```

---

## 4. トラブルシューティング

### サイトが表示されない

```bash
# Nginx が動いているか
sudo systemctl status nginx

# Docker コンテナが動いているか
docker compose -f docker-compose.prod.yml ps

# app コンテナのログを確認
docker compose -f docker-compose.prod.yml logs app
```

### 502 Bad Gateway

Nginx は動いているが Docker コンテナに接続できない状態。

```bash
# app コンテナが起動しているか確認
docker compose -f docker-compose.prod.yml ps app

# ポートが正しくバインドされているか
curl http://127.0.0.1:8080
```

### WebSocket が繋がらない

```bash
# reverb コンテナが動いているか
docker compose -f docker-compose.prod.yml ps reverb
docker compose -f docker-compose.prod.yml logs reverb

# ポートが正しくバインドされているか
curl http://127.0.0.1:8081
```

### DB 接続エラー

```bash
# db コンテナの状態確認
docker compose -f docker-compose.prod.yml logs db

# コンテナ内から接続テスト
docker exec quiz_app php artisan tinker --execute="DB::connection()->getPdo();"
```

### SSL 証明書の期限切れ

```bash
# 手動更新
sudo certbot renew
sudo systemctl reload nginx
```

---

## 5. アーキテクチャ図

```
                    Internet
                       |
                       v
              +-----------------+
              |     Nginx       |  ← ホストに直接インストール
              |  (SSL 終端)     |     Let's Encrypt 証明書
              |  :80 → :443    |
              +--------+--------+
                       |
          +------------+------------+
          |                         |
          v                         v
  +---------------+        +----------------+
  | Docker: app   |        | Docker: reverb |
  | 127.0.0.1:8080|        | 127.0.0.1:8081 |
  | (Apache+PHP)  |        | (WebSocket)    |
  +-------+-------+        +----------------+
          |
  +-------+-------+
  | Docker: queue  |
  | (Worker)       |
  +-------+-------+
          |
  +-------+-------+--------+
  |                         |
  v                         v
  +----------+       +-----------+
  | Docker:  |       | Docker:   |
  | db       |       | redis     |
  | (MySQL)  |       | (Cache)   |
  +----------+       +-----------+
```
