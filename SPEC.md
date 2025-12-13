# プロジェクト仕様書: Remote Flashlight Control (Web)

## 1. プロジェクト概要
管理者がWeb画面から、QRコードを読み込んだ複数のスマートフォン（観客・ユーザー）のライト（フラッシュライト）をリアルタイムで一斉にON/OFF操作できるWebアプリケーション。
スマートフォン側はアプリのインストールを不要とし、標準ブラウザ（Chrome/Safari）で動作することを目標とする。

## 2. コア機能

### 管理者（Admin）側
- **セッション発行機能**: 一意の接続用URLを発行し、QRコードとして画面に表示する。
- **コントロールパネル**: 
  - 現在の接続台数をリアルタイム表示（例: "Users connected: 15"）。
  - 各クライアントのステータスログ。
- **一斉操作スイッチ**: 全接続端末のライトを同期してON/OFFするマスターボタン。
- **（オプション）パターン点滅**: 点滅パターン（ビート、SOS、ストロボ）の一斉送信。

### クライアント（Smartphone）側
- **QRスキャン**: 標準カメラアプリ等でQRコードを読み取り、指定URLへアクセス。
- **ペアリング**: サーバーへ接続し、管理者からの信号を待機する。
- **権限・機能チェック**: 
  - カメラ（フラッシュライト利用のため）へのアクセス許可。
  - **Screen Wake Lock**: 画面のスリープ（自動ロック）を防止し、接続を維持する許可。
- **ライト制御**: 管理者からの信号を受け取り、フラッシュライトを点灯・消灯する。
  - *フォールバック*: Web標準APIでフラッシュライトが操作できない端末（一部iOSなど）の場合、画面を最大輝度の白背景にする「スクリーンフラッシュ」モードへ自動で切り替える。

## 3. ユーザーフローとプライバシー
1. **管理者**がWebサイトにアクセスし、「ROOM作成」ボタンを押す。
2. 画面に**QRコード**が表示される。
3. **ユーザー**がスマホでQRコードを読み取る。
4. **プライバシー配慮**: 
   - 画面に「カメラ映像はサーバーに送信されません。ライトの制御のみに使用します」と大きく明示する。
   - 「Connect & Start」ボタンを押させる。
5. ブラウザが「カメラの使用」と「スリープの無効化」の権限を求める。
6. 許可後、画面は「待機中（Ready）」のステータス画面になる。
7. **管理者**が「FLASH ON」を押すと、**全ユーザー**のスマホが一斉に光る。

## 4. 技術スタック

### Frontend
- **Framework**: Vite (Vanilla JS or React)
- **Styling**: CSS Modules / Vanilla CSS (Cyberpunk / Dark premium theme)
- **Communication**: Socket.io-client
- **Hardware API**: 
  - `navigator.mediaDevices.getUserMedia` (`{ video: { advanced: [{ torch: true }] } }`)
  - `navigator.wakeLock` (Screen Wake Lock API)

### Backend
- **Runtime**: Node.js
- **Real-time**: Socket.io (Broadcast機能利用)

## 5. 技術的制約と必須要件 (Critical)

### 5.1. HTTPS / Secure Context 必須
`getUserMedia` および `WakeLock` API は **Secure Context (HTTPS)** でのみ動作する。
- **Local Network**: IPアドレス指定 (http://192.168.x.x) では動作しない場合がある。
- **開発・デモ時の対策**:
  - `ngrok`, `Cloudflare Tunnel`, `Localtunnel` 等を使用して、一時的な **HTTPS URL** を発行する運用とする。

### 5.2. iOS Safari の制約
- iOSのWebkitブラウザは `imageCapture` API のサポートが完全ではない場合がある。
- **対策**: `MediaStreamTrack.applyConstraints` が失敗した場合は、即座に「スクリーンフラッシュ（画面白点灯）」モードにフォールバックするロジックを実装する。

### 5.3. スリープ防止
- スマートフォンは操作しないと数十秒で画面が消え、WebSocket切断＋ライト消灯となる。
- **対策**: ページ読み込み完了後、ユーザーの初回インタラクション（ボタンクリック）をトリガーに `navigator.wakeLock.request('screen')` を呼び出し、永続的に画面をオンにする。

## 6. UI/UX デザインコンセプト
- **テーマ**: "Hive Mind" / "Synced Light"
- **インタラクション**:
  - 「自分が制御されている」感覚を与える、微細な振動（`navigator.vibrate`）もライト点灯と同時に発火させる。
  - 管理画面はDJコントローラーのようなメカニカルでレスポンシブなデザイン。

## 7. ディレクトリ構造案
```
/
├── server/
│   ├── index.js      # Socket.io Server (CORS, Broadcast logic)
│   └── package.json
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.js   # Entry point & WakeLock logic
│   │   ├── socket.js # Communication
│   │   ├── torch.js  # Light control & Fallback
│   │   └── style.css # Premium Dark UI
│   └── package.json
└── README.md         # Setup guide including ngrok usage
```
