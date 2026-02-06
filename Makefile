# Quiz App - Makefile
# Docker環境での開発を効率化するコマンド集

.PHONY: help init start stop restart logs clean
.PHONY: app-ssh db-ssh redis-cli
.PHONY: composer-install npm-install
.PHONY: npm-dev npm-dev-stop npm-build
.PHONY: migrate migrate-fresh migrate-rollback seed
.PHONY: test test-coverage
.PHONY: artisan tinker

# デフォルトターゲット（help表示）
.DEFAULT_GOAL := help

help: ## このヘルプを表示
	@echo "Quiz App - 利用可能なコマンド:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36mmake %-20s\033[0m %s\n", $$1, $$2}'

##################################################
# 初期セットアップ
##################################################

init: ## 初期環境構築（初回のみ実行）
	@echo "🚀 Quiz App 環境構築開始..."
	@docker compose build --no-cache
	@docker compose up -d
	@if [ ! -f .env ]; then cp .env.example .env; fi
	@make composer-install
	@docker compose exec -T app php artisan key:generate
	@make migrate
	@make npm-install
	@make npm-build
	@echo "✅ 環境構築完了！ http://localhost でアクセスできます"

##################################################
# Docker操作
##################################################

start: ## Dockerコンテナを起動
	@echo "🐳 Dockerコンテナを起動中..."
	@docker compose up -d
	@echo "✅ 起動完了！"

stop: ## Dockerコンテナを停止
	@echo "🛑 Dockerコンテナを停止中..."
	@docker compose down
	@echo "✅ 停止完了！"

restart: ## Dockerコンテナを再起動
	@make stop
	@make start

logs: ## Dockerコンテナのログを表示（Ctrl+Cで終了）
	@docker compose logs -f

clean: ## Dockerコンテナ・ボリューム・イメージを削除
	@echo "🧹 クリーンアップ中..."
	@docker compose down -v --rmi all
	@echo "✅ クリーンアップ完了！"

##################################################
# コンテナ接続
##################################################

app-ssh: ## appコンテナにSSH接続
	@docker compose exec app bash

db-ssh: ## MySQLコンテナにSSH接続
	@docker compose exec db bash

redis-cli: ## Redis CLIに接続
	@docker compose exec redis redis-cli

##################################################
# 依存関係管理
##################################################

composer-install: ## Composer依存関係をインストール
	@echo "📦 Composer依存関係をインストール中..."
	@docker compose exec -T app composer install
	@echo "✅ Composerインストール完了！"

npm-install: ## npm依存関係をインストール
	@echo "📦 npm依存関係をインストール中..."
	@docker compose exec -T app npm install
	@echo "✅ npmインストール完了！"

##################################################
# フロントエンド開発
##################################################

npm-dev: ## Vite開発サーバーを起動（ホットリロード有効）
	@echo "🔥 既存のViteプロセスを停止中..."
	@docker compose exec app pkill -f "vite" || true
	@echo "🚀 Vite開発サーバーを起動中..."
	@docker compose exec app npm run dev

npm-dev-stop: ## Vite開発サーバーを停止
	@echo "🛑 Viteプロセスを停止中..."
	@docker compose exec app pkill -f "vite" || true
	@echo "✅ Viteプロセスを停止しました"

npm-build: ## 本番用ビルド
	@echo "🏗️  本番用ビルド中..."
	@docker compose exec -T app npm run build
	@echo "✅ ビルド完了！"

##################################################
# データベース操作
##################################################

migrate: ## マイグレーションを実行
	@echo "🗄️  マイグレーション実行中..."
	@docker compose exec -T app php artisan migrate
	@echo "✅ マイグレーション完了！"

migrate-fresh: ## マイグレーションをリセット（全データ削除）
	@echo "⚠️  全データを削除してマイグレーションを実行します"
	@docker compose exec -T app php artisan migrate:fresh
	@echo "✅ マイグレーションリセット完了！"

migrate-rollback: ## 最後のマイグレーションをロールバック
	@echo "↩️  マイグレーションをロールバック中..."
	@docker compose exec -T app php artisan migrate:rollback
	@echo "✅ ロールバック完了！"

seed: ## シーダーを実行
	@echo "🌱 シーダー実行中..."
	@docker compose exec -T app php artisan db:seed
	@echo "✅ シーダー完了！"

##################################################
# テスト
##################################################

test: ## PHPUnitテストを実行
	@echo "🧪 テスト実行中..."
	@docker compose exec -T app php artisan test
	@echo "✅ テスト完了！"

test-coverage: ## カバレッジ付きでテスト実行
	@echo "🧪 カバレッジ付きテスト実行中..."
	@docker compose exec -T app php artisan test --coverage
	@echo "✅ テスト完了！"

##################################################
# Laravel Artisan
##################################################

artisan: ## Artisanコマンドを実行（例: make artisan cmd="route:list"）
	@docker compose exec -T app php artisan $(cmd)

tinker: ## Laravel Tinkerを起動
	@docker compose exec app php artisan tinker

##################################################
# その他
##################################################

cache-clear: ## キャッシュをクリア
	@echo "🧹 キャッシュクリア中..."
	@docker compose exec -T app php artisan cache:clear
	@docker compose exec -T app php artisan config:clear
	@docker compose exec -T app php artisan route:clear
	@docker compose exec -T app php artisan view:clear
	@echo "✅ キャッシュクリア完了！"

optimize: ## Laravel最適化（本番環境用）
	@echo "⚡ Laravel最適化中..."
	@docker compose exec -T app php artisan config:cache
	@docker compose exec -T app php artisan route:cache
	@docker compose exec -T app php artisan view:cache
	@echo "✅ 最適化完了！"
