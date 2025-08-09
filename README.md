# ai-line

顧客サポート用の公式 LINE と Gemini を使った RAG チャットボット。Firebase Cloud Functions (2nd gen) 上で動作し、社内資料（Markdown）を取り込んで回答します。

- Webhook（ヘルス）: https://us-central1-ai-line-01.cloudfunctions.net/lineWebhook
- Webhook（本体）: https://us-central1-ai-line-01.cloudfunctions.net/lineWebhook/line/webhook
  - Cloud Run URL が表示された場合は、ベースURLに `/line/webhook` を付けて設定してください。

## 構成
- 受信: LINE Messaging API → Express on Firebase Functions v2（`lineWebhook`）
- LLM: Gemini (Google AI Studio API)
- 埋め込み: Gemini Embeddings `text-embedding-004`
- RAG ストア: Firestore コレクション `chunks`
- ドキュメント取り込み: Markdown（推奨）

## 前提
- Node.js 22
- Firebase CLI `firebase-tools`
- （任意）Google Cloud SDK（ローカルから Firestore 本番へ書き込む場合に便利）

## セットアップ
1) 依存関係（`functions` ディレクトリ）
```powershell
cd functions
npm ci
```

2) Secrets（機密値）
```powershell
firebase functions:secrets:set LINE_CHANNEL_SECRET
firebase functions:secrets:set LINE_CHANNEL_ACCESS_TOKEN
firebase functions:secrets:set GENAI_API_KEY
```

3) .env（非機密）
`functions/.env`
```
LINE_CHANNEL_ID=1234567890
```

4) デプロイ
```powershell
firebase deploy --only functions
```
- 関数 URL（ベース）が表示されます。Webhook は末尾に `/line/webhook` を付与して設定します。

## LINE 側設定
- Webhook URL 例）`https://us-central1-<PROJECT_ID>.cloudfunctions.net/lineWebhook/line/webhook`
- Use webhook: ON
- Response mode: Bot
- 自動応答/あいさつメッセージ: OFF（ダブル返信防止）

## ローカルテスト
- ユニットテスト
```powershell
cd functions
npm test
```
- エミュレータ（関数）
```powershell
cd functions
npm run serve
# ヘルスチェック
Invoke-WebRequest -Uri "http://127.0.0.1:5001/<PROJECT_ID>/us-central1/lineWebhook/line/webhook"
```

## ナレッジ取り込み（RAG）
Firestore の `chunks` コレクションへチャンクを保存します。

### 推奨: Markdown 取り込み
```powershell
cd functions
$env:GENAI_API_KEY="<YOUR_AI_STUDIO_API_KEY>"
npx tsx src/rag/ingestMarkdown.ts "C:\path\to\doc.md"
```
- 分割: LangChain（チャンク 800字/オーバーラップ120字）
- 埋め込み: Gemini `text-embedding-004`

<!-- HTML 前処理は現状サポート外 -->

## アーキテクチャ概要
- `functions/src/index.ts`: Functions v2 エントリ。`lineWebhook` を公開
- `functions/src/line/app.ts`: Express アプリ（署名検証→RAG回答→返信）
- `functions/src/line/signature.ts`: HMAC-SHA256 署名検証
- `functions/src/line/reply.ts`: `@line/bot-sdk` による reply API 呼び出し
- `functions/src/rag/ragAnswerer.ts`: Firestore 類似検索＋Gemini 生成
- `functions/src/rag/store.ts`: Firestore I/O（`chunks`）
- `functions/src/rag/split.ts`: テキスト分割
- `functions/src/rag/ingestMarkdown.ts`: 取り込み CLI
- テスト: `functions/test/*.test.ts`（Vitest）

## 運用・コスト
- Functions 2nd gen・`minInstances` 未設定のため、アイドル時の課金はほぼゼロ。リクエストに応じて従量課金。
- コンテナイメージ保管で微少課金が発生する場合があります（レジストリのクリーンアップは設定済み）。

### 一時的に止めたい場合
- LINE 側の Webhook を無効化（推奨・リクエストが来なくなります）
- もしくは関数を削除/再作成
```powershell
firebase functions:delete lineWebhook --region=us-central1
firebase deploy --only functions
```

## トラブルシューティング
- RAG が効かない
  - デプロイが最新か / 取り込み後にデプロイしたか
  - Firestore `chunks` にデータが入っているか（同一プロジェクト）
  - `GENAI_API_KEY` や LINE Secrets が正しいか
- 署名エラー: `LINE_CHANNEL_SECRET` を再確認
- 返信エラー: `LINE_CHANNEL_ACCESS_TOKEN` の権限/期限を再確認、再発行→デプロイ

## セキュリティ
- Secrets は Secret Manager（`functions:secrets:set`）で管理。リポジトリに直書きしない。
- 必要に応じてキーのローテーションを実施。

## ライセンス
MIT（必要に応じて変更してください）
