# 日暮里 斉藤湯ガイド

東京都荒川区「日暮里 斉藤湯」の日本語・単ページ観光ガイドです。銭湯の空気に合わせ、藍色ののれん、湯気、白いタイル、木の温度感を組み合わせたデザインにしています。

## 実装内容

- 日暮里 斉藤湯の基本情報、浴槽の特徴、初回利用ガイド
- 周辺グルメ、詳しいアクセス、周辺スポット、半日散歩コース
- スマートフォン対応のレスポンシブ単ページ
- Google Analytics 4（`G-HXM22WWPKP`）
- Cloudflare Workers 用 Astro アダプターと Wrangler 設定
- DB、ログイン、CMS、外部APIなし
- 外部フォントなし。画像は `public/images` に配置
- 端末内だけで動作する Canvas 記念カード

## 旅の記念カードのプライバシー

記念カードはブラウザの File API と Canvas API だけで動きます。

- カメラ撮影、セルフィー、アルバム選択に対応
- 1:1、はがき縦版、9:16
- 藍のれん、湯けむり、谷中の夕暮れ、銭湯タイル
- スポット名と日付を編集可能
- 写真の拡大・上下位置を調整可能
- PNGとして端末に保存
- 写真、入力文字、完成画像をサーバーへ送信しない
- ページを閉じると編集中データは破棄

## 技術構成

- Astro `7.1.6`
- Tailwind CSS `4.3.3`
- TypeScript `6.0.2`
- pnpm `11.18.0`
- `@astrojs/cloudflare` `14.1.7`
- Wrangler `4.113.0`

## ローカル起動

Node.js 22 以降を推奨します。

```bash
corepack enable
pnpm install
pnpm dev
```

本番ビルド：

```bash
pnpm build
pnpm preview
```

## Cloudflare Workers へデプロイ

最初に Cloudflare へログインします。

```bash
pnpm wrangler login
```

仮ドメインのままデプロイ：

```bash
pnpm deploy
```

別のドメインで公開する場合は、ビルド時に `SITE_URL` を設定してください。未指定時は `https://saitoyu.com` が使用されます。

```bash
SITE_URL=https://saitoyu.com pnpm deploy
```

Cloudflare ダッシュボードの Workers Builds を使う場合：

- Build command: `pnpm build`
- Deploy command: `pnpm wrangler deploy`
- Build variable: `SITE_URL=https://saitoyu.com`
- Node.js: 22 以降

`wrangler.jsonc` は Astro 6 以降の統一エントリーポイント `@astrojs/cloudflare/entrypoints/server` を使っています。

## 公開前に確認する箇所

1. `SITE_URL` が `https://saitoyu.com` になっていることを確認
2. 営業時間、定休日、料金、備品を施設へ再確認
3. 周辺店舗の営業情報を再確認
4. 写真の掲載許諾を確認し、必要なら権利処理済み写真へ差し替え
5. Cloudflare 側で GA4 リクエストと Cookie/同意方針を確認

## 写真について

`public/images` の写真は、実景を使ったレイアウト確認用のローカル素材です。出典は `SOURCES.md` にまとめています。第三者サイトの写真には各権利者の著作権があるため、公開運用前に必ず掲載許諾を得るか、施設から提供を受けた写真・自分で撮影した写真へ差し替えてください。

差し替え時は同じファイル名・同程度の縦横比にするとレイアウトを変更せず利用できます。

## 検証

- Canvas 用 TypeScript は `tsc --noEmit` で型検査済み
- この実行環境では npm レジストリの名前解決ができなかったため、依存関係の取得を伴う `pnpm install` / `astro build` は実行していません
