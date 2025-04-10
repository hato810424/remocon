# Remocon Monorepo
このプロジェクトは、フロントエンドとバックエンドを含むモノレポ構成のアプリケーションです。

## プロジェクト構成
```
/
├── packages/
│   ├── frontend/    # React + TypeScript + Vite
│   └── backend/     # Hono + Socket.IO
├── package.json     # ルートのpackage.json
└── pnpm-workspace.yaml
```

## 開発環境のセットアップ
### 依存関係のインストール
```bash
# グローバルにpnpmをインストール（まだの場合）
npm install -g pnpm

# プロジェクトの依存関係をインストール
pnpm -r install
```

### 開発サーバーの起動
```bash
# フロントエンドとバックエンドの両方を起動
pnpm run dev
```

開発サーバーは以下のポートで起動します：
- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:3001

## ビルドと本番環境
### ビルド
```bash
# フロントエンドとバックエンドの両方をビルド
pnpm run build
```

### 本番環境の起動
```bash
# 本番サーバーを起動
pnpm run prod
```

本番サーバーは以下の機能を提供します：
- フロントエンドのビルド済みファイルの配信
- バックエンドAPIの提供
- Socket.IOによるリアルタイム通信
