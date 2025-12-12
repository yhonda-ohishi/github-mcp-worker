# GitHub MCP Server

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/yhonda-ohishi/github-mcp-worker)

Claude.ai用のGitHub MCP（Model Context Protocol）サーバー。Cloudflare Workersで動作。

## 機能

- OAuth 2.1認証（PKCE対応）
- GitHub API連携
  - リポジトリ操作（一覧/取得/作成）
  - ファイル操作（取得/作成/更新）
  - Issue操作（一覧/取得/作成/更新）
  - ブランチ一覧
  - コード検索

## セットアップ

### 1. GitHub OAuth App作成

1. https://github.com/settings/developers にアクセス
2. "New OAuth App" をクリック
3. 以下を入力:
   - Application name: `GitHub MCP Server`
   - Homepage URL: `https://github-mcp-server.<your-account>.workers.dev`
   - Authorization callback URL: `https://github-mcp-server.<your-account>.workers.dev/oauth/callback`
4. Client ID と Client Secret をメモ

### 2. Cloudflare KV作成

```bash
# KV Namespace作成
wrangler kv:namespace create SESSIONS

# 出力されたIDをwrangler.tomlに設定
```

### 3. 環境変数設定

```bash
# Secrets設定
wrangler secret put GITHUB_CLIENT_ID
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put JWT_SECRET
wrangler secret put SERVER_URL
```

JWT_SECRETは32文字以上のランダム文字列を生成:
```bash
openssl rand -base64 32
```

SERVER_URLはデプロイ後のWorkers URL:
```
https://github-mcp-server.<your-account>.workers.dev
```

### 4. デプロイ

```bash
npm install
npm run deploy
```

### 5. Claude.aiで設定

1. Claude.ai Settings → Integrations
2. "Add Integration"
3. Name: `GitHub`
4. URL: `https://github-mcp-server.<your-account>.workers.dev`
5. "Connect" → GitHubで認証

## wrangler.toml設定

```toml
name = "github-mcp-server"
main = "src/index.ts"
compatibility_date = "2024-12-01"

[[kv_namespaces]]
binding = "SESSIONS"
id = "<YOUR_KV_NAMESPACE_ID>"

[vars]
OAUTH_SCOPES = "repo,read:user"
```

## ローカル開発

```bash
# 開発サーバー起動
npm run dev

# ログ確認
npm run tail
```

## エンドポイント一覧

| Path | Method | Description |
|------|--------|-------------|
| `/.well-known/oauth-protected-resource` | GET | RFC 9728 リソースメタデータ |
| `/.well-known/oauth-authorization-server` | GET | RFC 8414 認証サーバーメタデータ |
| `/oauth/authorize` | GET | OAuth認証開始 |
| `/oauth/callback` | GET | GitHubコールバック |
| `/oauth/token` | POST | トークン発行 |
| `/oauth/register` | POST | 動的クライアント登録 |
| `/mcp` | POST | MCP JSON-RPC |
| `/docs` | GET | ドキュメント |

## MCP Tools

| Tool | Description |
|------|-------------|
| `list_repos` | リポジトリ一覧 |
| `get_repo` | リポジトリ詳細 |
| `create_repo` | リポジトリ作成 |
| `get_contents` | ファイル/ディレクトリ内容 |
| `get_file_content` | ファイル内容（デコード済み） |
| `create_or_update_file` | ファイル作成/更新 |
| `list_issues` | Issue一覧 |
| `get_issue` | Issue詳細 |
| `create_issue` | Issue作成 |
| `update_issue` | Issue更新 |
| `list_branches` | ブランチ一覧 |
| `search_repos` | リポジトリ検索 |
| `search_code` | コード検索 |

## トラブルシューティング

### 接続エラー

1. SERVER_URLが正しいか確認
2. GitHub OAuth AppのCallback URLが正しいか確認
3. `wrangler tail`でログを確認

### 認証エラー

1. GitHub OAuth AppのClient ID/Secretが正しいか確認
2. JWT_SECRETが設定されているか確認
3. KV Namespaceが正しくバインドされているか確認

## License

MIT
