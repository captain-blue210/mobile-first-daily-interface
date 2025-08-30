# Mobile First Daily Interface (MFDI)

[![release](https://img.shields.io/github/release/tadashi-aikawa/mobile-first-daily-interface.svg)](https://github.com/tadashi-aikawa/mobile-first-daily-interface/releases/latest)
![downloads](https://img.shields.io/github/downloads/tadashi-aikawa/mobile-first-daily-interface/total)

![image](https://raw.githubusercontent.com/tadashi-aikawa/mobile-first-daily-interface/master/image.png)


[Obsidian]にてモバイルに最適なインターフェースでデイリーノートを扱うプラグインです。

- SNSやチャットツールのようなUI
- 記録先はデイリーノート

> **Note**
> 本プラグインは[Obsidian Memos] (現: [Thino]) の影響を強く受けています。そのため、[コミュニティプラグイン]には登録しません。また、英語のREADMEを記載する予定もありません。

## 対応OS

[Obsidian]がサポートする全てのプラットフォーム/OSに対応しているつもりです。

- Windows
- macOS (動作未確認)
- Linux (動作未確認)
- Android
- iOS (動作未確認)
- iPadOS (動作未確認)

画面はスマートフォンに最適化されていますが、PCやタブレットでも利用できます。

## ⏬インストール

[BRAT]を使って`tadashi-aikawa/mobile-first-daily-interface`でインストールします。

## 起動方法

[リボン]の『Mobile First Daily Interface』という鉛筆マークをクリックしてください。

デフォルトでは左サイドリーフに開かれます。

## 設定

### 投稿形式

`default: コードブロック`

MFDIの投稿がエディタ上でどのような形式になるかを指定します。

- コードブロック
- 見出し1
- 見出し2
- 見出し3
- 見出し4
- 見出し5
- 見出し6
- リスト

### 表示リーフ

`default: left`

MFDI Viewを表示するリーフを指定します。

| 設定値  | 意味                               |
| ------- | ---------------------------------- |
| left    | 左サイドリーフに表示します         |
| right   | 右サイドリーフに表示します         |
| current | **現在選択中のリーフ**に表示します |

### Obsidian起動時に自動起動・アクティブにする

`default: false`

有効にすると、Obsidian起動時にMFDIが立ち上がります。

- 1つ以上のMFDI Viewが存在する場合
    - 最初の1つをアクティブにします (**[表示リーフ]の設定は考慮しません**)
- MFDI Viewが存在しない場合
    - [表示リーフ]の設定に従い、Viewを新規作成してアクティブにします

### デイリーノート

#### デイリーノートのディレクトリ

`default: ''`（空）

Vault相対のフォルダを指定します。空の場合はObsidianの「Daily Notes」設定（フォルダ/フォーマット）に従います。

- 例: `Journal/Daily`
- 空でない場合は、そのフォルダ配下に `YYYY-MM-DD.md`（Daily Notesのフォーマットに準拠）を作成・利用します。
- 注意: ディレクトリを上書きしている場合、現時点ではDaily Notesのテンプレートは適用されず、空ファイルから作成します。

#### 追記先の見出し

`default: ''`（空）

追記先を“# …”のように指定します。該当見出しが存在しない場合は自動で見出しを作成して、そのセクション末尾に追記します。空の場合はファイル末尾に追記します。

- 例: `## つぶやき`
- 対象見出しの「同レベル以上の次見出し」直前、またはファイル末尾に追記します。

#### 追記区切り

`default: ''`（空）

指定された見出しの下からこの区切り文字列の上までが追記先になります。

#### 投稿日時フォーマット

`default: YYYY-MM-DD HH:mm`

投稿時に付与する日時のフォーマットを指定します。

#### 投稿見出しを自動で段下げ

`default: true`

「投稿形式」が見出しの場合、追記先見出しより1段下のレベルに自動調整します（例: 追記先が`##`なら投稿は`###`）。

- OFFにすると、設定した見出しレベルのまま投稿します。

## 対応機能/ロードマップ

- [x] メッセージの投稿
  - [x] Markdown形式に対応
  - [x] サイトや画像のURLはプレビュー展開
- [x] タスクの追加・完了/未完了の切り替え
- [x] デイリーノートの自動生成
- [x] カレンダーUI
- [x] サイドリーフ表示
- [x] 自動起動
- [x] Bluesky投稿機能
- [x] 見出しでの投稿
- [x] デイリーノートのディレクトリ指定
- [x] 指定見出し配下への追記

## FAQ

> **Warning**
> FAQの内容は[Thino]がリリースされる前、[Obsidian Memos]の時代のものです。[Thino]では解消している可能性があります。

### なぜMFDIを作ったのか?

[Obsidian Memos]を使わず、自作した背景には動作速度の問題があります。

デイリーノートが1000ファイル近くあるせいか、[Obsidian Memos]ではメモの表示や投稿時に3～5秒程度固まってしまい実用に支障がありました。また、[Obsidian Memos]はしばらく更新されていなそうだったため、自分で必要な機能のみを搭載したプラグインを開発した方が良いと判断しました。

### [Obsidian Memos]との違いは?

[Obsidian Memos]と一番異なるのは、**1度に1日分のデイリーノートしか読み込まない**点です。そのため、表示速度が速く、メモリ使用量が小さくなり、性能の悪い端末や大きなVaultでの利用に適しています。

また、タスク管理などデイリーに関連する機能は積極的にサポートしていく予定です。

### 投稿を編集/削除したい場合は?

デイリーノートを直接編集してください。

### [Obsidian起動時に自動起動・アクティブにする]を有効にしても自動起動しない

以下のケースに該当しないか確認してください。たとえば、カレントリーフへ自動起動したいのに、左サイドリーフにもMFDIのViewが存在する場合はそれを削除する必要があります。

> - 1つ以上のMFDI Viewが存在する場合
>     - 最初の1つをアクティブにします (**[表示リーフ]の設定は考慮しません**)

また、[表示リーフ]が左サイドリーフや右サイドリーフになっている場合は、サイドリーフ内でMFDIがアクティブになっているだけです。いきなりサイドリーフがOpenされるわけではありません。

## その他

Mobile First Daily Interfaceに関するブログ記事もご覧ください。

[📘Obsidian Memos みたいなプラグイン Mobile First Daily Interfaceを作ったワケ \- Minerva](https://minerva.mamansoft.net/%F0%9F%93%98Articles/%F0%9F%93%98Obsidian+Memos+%E3%81%BF%E3%81%9F%E3%81%84%E3%81%AA%E3%83%97%E3%83%A9%E3%82%B0%E3%82%A4%E3%83%B3+Mobile+First+Daily+Interface%E3%82%92%E4%BD%9C%E3%81%A3%E3%81%9F%E3%83%AF%E3%82%B1)

## 開発者向け

### Setup

```bash
git config core.hooksPath hooks
```

### リリース

[Release Action](https://github.com/tadashi-aikawa/mobile-first-daily-interface/actions/workflows/release.yaml) を実行。

[Obsidian]: https://obsidian.md/
[BRAT]: https://github.com/TfTHacker/obsidian42-brat
[Obsidian Memos]: https://github.com/Quorafind/Obsidian-Memos
[Thino]: https://github.com/Quorafind/Obsidian-Thino
[コミュニティプラグイン]: https://help.obsidian.md/Advanced+topics/Community+plugins
[表示リーフ]: #表示リーフ
[リボン]: https://minerva.mamansoft.net/Notes/%E3%83%AA%E3%83%9C%E3%83%B3%20(Obsidian)
[Obsidian起動時に自動起動・アクティブにする]: #obsidian起動時に自動起動・アクティブにする
