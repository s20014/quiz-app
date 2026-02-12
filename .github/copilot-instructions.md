# GitHub Copilot Instructions

## プロジェクト概要

リアルタイムクイズアプリケーション。ホストが問題を表示し、参加者はQRコードからスマホで参加して回答。

## 技術スタック

- **フロントエンド**: React 18 (TypeScript) + Inertia.js + Tailwind CSS + shadcn/ui
- **バックエンド**: Laravel 12 (PHP 8.4) + MySQL 8.0 + Redis
- **リアルタイム**: Laravel Reverb + @laravel/echo-react
- **開発環境**: Docker + Vite

## コーディング規約

### React/TypeScript

- 関数コンポーネント + Hooks を使用
- TypeScript の型を明示的に定義（`any` 禁止）
- Inertia.js のページは `resources/js/Pages/` に配置
- shadcn/ui コンポーネントを活用
- Tailwind CSS でスタイリング（インラインクラス）
- ファイル名は PascalCase（例: `Host.tsx`）
- CSS Modules や styled-components は使用禁止

### Inertia.js パターン

```typescript
// ページコンポーネント
import { Head } from '@inertiajs/react';

interface Props {
  room: { id: string; code: string };
  players: Array<{ id: number; name: string; score: number }>;
}

export default function Host({ room, players }: Props) {
  return (
    <>
      <Head title="ホスト画面" />
      {/* コンポーネント */}
    </>
  );
}

// フォーム送信
import { useForm } from '@inertiajs/react';

const { data, setData, post, processing } = useForm({ name: '' });
const submit = (e: React.FormEvent) => {
  e.preventDefault();
  post('/players');
};
```

### Laravel Echo React パターン

```typescript
import { useEcho } from "@laravel/echo-react";

// リアルタイムイベントのリッスン
useEcho(
    roomId ? `room.${roomId}` : "",
    "PlayerJoinedEvent",
    (event: { player: Player }) => {
        // イベント処理
    },
);
```

### Laravel

- リソースコントローラー + Inertia レスポンス
- Eloquent ORM でDB操作（生SQLは禁止）
- バリデーションは FormRequest クラスで実装
- PSR-12 コーディング規約に準拠
- イベント/リスナーでリアルタイム通知

### データベース

- テーブル名: 複数形・スネークケース（例: `quiz_rooms`, `players`）
- カラム名: スネークケース（例: `room_id`, `created_at`）
- 外部キー: `{テーブル名}_id`
- マイグレーションで必ず管理

## ディレクトリ構成

```
resources/js/
├── Pages/              # Inertia ページコンポーネント
│   ├── Home.tsx
│   ├── Host.tsx
│   ├── PlayerJoin.tsx
│   ├── PlayerAnswer.tsx
│   └── Leaderboard.tsx
├── Components/
│   └── ui/            # shadcn/ui コンポーネント
├── Contexts/          # React Context
├── services/          # API クライアント
└── app.tsx            # Inertia エントリーポイント

app/
├── Models/
├── Http/
│   └── Controllers/   # Inertia コントローラー
├── Events/            # WebSocket イベント
└── Services/          # ビジネスロジック
```

## 重要な制約

1. 問題の出題は外部で行う（アプリは回答収集とスコア計算に特化）
2. 参加者は匿名参加（認証不要）
3. ホスト機能のみ認証が必要な場合あり
4. `dangerouslySetInnerHTML` は使用禁止
5. レスポンシブ対応必須（Tailwind で実装）

## データフロー

1. ホスト: ルーム作成 → QRコード生成
2. 参加者: QRコードスキャン → 名前入力 → 登録
3. ホスト: 問題形式選択 → 参加者に通知
4. 参加者: 回答送信 → Redis で集計
5. ホスト: 正解設定 → 自動採点 → スコア更新

## Docker環境

- app: php:8.4-apache + Node.js 22（ポート 80, 5173）
- db: mysql:8.0（ポート 3307）
- redis: redis:alpine（ポート 6380）
- reverb: Laravel Reverb サーバー

## セキュリティ

- CSRF保護: Inertia が自動処理
- XSS対策: React が自動エスケープ
- SQLインジェクション対策: Eloquent ORM 使用必須
- バリデーションは必ず実施

## コード生成時の注意

- 既存の shadcn/ui コンポーネントを活用
- TypeScript の型を必ず定義
- エラーハンドリングを省略しない
- コメントは日本語でOK
- 過度な最適化より動作する実装を優先
