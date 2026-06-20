# Crowd Light

Cloudflare Workers + Durable Objects で動作する、複数スマートフォン向けの
リアルタイム・ライト制御アプリです。

## ローカル開発

```sh
npm install
npm --prefix client install
npm run dev
```

- クライアント: `https://localhost:5173`
- 管理画面: `https://localhost:5173/admin`
- Worker: `http://localhost:8787`

ローカルの管理トークンは `.dev.vars` に設定します。

```env
ADMIN_TOKEN=change-this-token
```

## Cloudflare へデプロイ

初回のみ Cloudflare にログインし、管理トークンを Secret として登録します。

```sh
npx wrangler login
npx wrangler secret put ADMIN_TOKEN
npm run deploy
```

デプロイ後:

- 観客用: `https://<your-worker-domain>/`
- 管理用: `https://<your-worker-domain>/admin`

独自ドメインは Cloudflare Dashboard の Workers & Pages から追加できます。
`ADMIN_TOKEN` は十分に長いランダムな値を使用し、公開リポジトリや
`wrangler.jsonc` には保存しないでください。
