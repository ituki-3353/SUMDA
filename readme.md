<!-- Version0.4 / SUMDAシステム -->
**法的警告**
本ソフトウェアはServer Union組織内限定。
組織外使用発覚時：損害賠償請求・刑事告訴を実行。


# SUMDA - Server Union Mainframe and Databace Administer System
Server Unionメインフレーム・データベース管理システム
Version 0.4 (For LTS/Now Dev)

## 注意
本システムはDiscordサーバー組織「SU | Server Union」内での使用を目的としたHTMLベースソフトウェア/データベースです。ソースコードの流出・APIへの悪意なアクセス・本Markdownファイル・その他SAMDAシステムに関わる全ての機能を有すソースコード及びデータの流出は「機密情報漏洩」と扱われ責任を問われるおそれがあります。

組織外での無断使用は情報漏洩につながり、本ソースを複製・使用した場合は個人商用問わずライセンス違反となりますのでご了承ください。

## 概要
SUMDA （サムダ）システムはSU内での情報管理・ユーザー同士の予定管理を目的としたHTMLベースのwebソフトウェアです。
DBシステムにAPIを使って情報を取得し、視覚的に情報を表示したり、APIを通してDBに情報を登録したりできます。

### 主な機能
- 管理者権限の付与
    DB側で管理権限フラグを読み取ることで権限を付与し、データの削除や編集をおこなるようになっています。

- カレンダー機能
    リスト型予定表とグリッド型カレンダーを切り替えて表示できます。

- 登録フォーム
    スッキリした見た目と登録名を明確化してわかりやすいUIのフォーム

## 使用言語

- HTML
    webページ表示とDB参照データ設定等
- CSS
    スタイルの変更
- JS (Java Script)
    API等内部処理とバック側のnode.jsの処理等

## 使用バックエンド
-  Ubuntu Server 24.04 LTS
    - node.js
    APiのエンドポイント等のサーバ側操作全般
    - MariaDB
    MySQLデータベース

## 使用プロバイダ
 - Tailscale
    - https://tailscale.com/

- Github Pages
    - https://docs.github.com/ja/pages/getting-started-with-github-pages/what-is-github-pages

## ライセンス
詳細はLICENSEを参照してください。
