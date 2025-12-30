---
author: ZhgChgLi
categories:
- tools
date: 2025-01-17T00:00:00.000+0000
description: MediumからJekyllへの移行で悩む開発者向けに、インストールから設定までの手順を具体的に解説。効率的なブログ構築を実現し、サイト運用の自由度を大幅に向上させます。
image:
  path: /assets/images/zmediumtomarkdown.jpeg
last_modified_at: 2025-01-17T00:00:00.000+0000
render_with_liquid: false
tags:
- meidum
- github
- jekyll
- ruby
- japanese
- ai-translation
title: MediumからJekyllへ｜インストールと設定の完全ガイド
---

# 開始！

[![](https://opengraph.githubassets.com/91a5dd913bf4d51e6b76fbcc7442c845023bdf93cb1a0ce1ac1c8a40d554f781/ZhgChgLi/medium-to-jekyll-starter.github.io)](https://github.com/ZhgChgLi/medium-to-jekyll-starter.github.io)

## 1. テンプレートリポジトリへ移動 -> [medium-to-jekyll-starter.github.io](https://github.com/ZhgChgLi/medium-to-jekyll-starter.github.io)

![](/assets/medium-to-jekyll-starter/start-6.png)

右上の「Use this template」→「Create a new repository」をクリックしてください

## 2. 新しいリポジトリを作成する

![](/assets/medium-to-jekyll-starter/start-2.png)

- リポジトリ名：通常は `アカウント名または組織名.github.io` で、必ず `*.github.io` で終わる必要があります。

- `Public` リポジトリでなければ GitHub Pages は使用できません

### GitHub Actions の実行権限の調整

![](/assets/medium-to-jekyll-starter/github-action-permissions.png)

- 作成後、GitHubのセキュリティ設定により、リポジトリの設定でGitHub Actionsの実行権限を有効にする必要があります。

## 3. 必要に応じて gh-pages ブランチを作成する

![](/assets/medium-to-jekyll-starter/start-3.png)

- リポジトリのトップページで「`main`」ブランチのメニューをクリックし、「`gh-pages`」と入力します。存在しない場合は「Create branch `gh-pages` from `main`」を選択してください。

- `gh-pages` ブランチが既に存在する場合、または作成時に「Sorry, that branch already exists.」と表示された場合は、この手順をスキップしてください。

## 4. Enable Github Pages，Settings -> Pages -> Build and deployment に移動してください

![](/assets/medium-to-jekyll-starter/start-4.png)

- 「`gh-pages`」ブランチを選択し、「`Save`」をクリックして設定を保存してください

### 初回デプロイの実行

![](/assets/medium-to-jekyll-starter/first-deploy.png)

- Repo -> 「Actions」->「Build and Deploy」->「Run workflow」->「Branch: main, Run workflow」

## 5. すべてのデプロイ作業が完了するまで待つ

![](/assets/medium-to-jekyll-starter/start-5.png)

- 🟢 ページのビルドとデプロイメント

- 🟢 ビルドとデプロイ

## 6. サイトで結果を確認する

> https://`アカウント名または組織名.github.io`

![](/assets/medium-to-jekyll-starter/done.png)

### トラブルシューティング

もしページに以下だけが表示されている場合：

```
--- layout: home # インデックスページ ---
```

Github Pages の設定ミス、まだデプロイ中、または以前のページのキャッシュが原因の可能性があります。強制リロードやシークレットモードでブラウザを再起動して、もう一度ページを開いてください。

> 初回デプロイ成功！🎉🎉🎉続けて、Mediumアカウントの同期設定を行ってください。

***

# Github Repo (Github Actions) 設定

## 1. 所属の Github リポジトリの Github Actions ページに移動 -> 「ZMediumToMarkdown」をクリック -> 「ZMediumToMarkdown.yml」をクリック

![](/assets/medium-to-jekyll-starter/github-1.png)

> https://github.com/{ORG}/{REPO_NAME}/blob/main/.github/workflows/ZMediumToMarkdown.yml
> 
> ## 2. 右側の「編集」ボタンをクリックする
> 
> ![](/assets/medium-to-jekyll-starter/github-2.png)

## 3. Medium記事の自動同期パラメータ設定

![](/assets/medium-to-jekyll-starter/github-3.png)

```yaml
name: ZMediumToMarkdown
on:
  workflow_dispatch:
  schedule:
    - cron: "10 1 15 * *" # UTCの01:10に実行されます。毎日。
    # 自動同期のスケジュール設定
    # ref: https://crontab.guru/

jobs:
  ZMediumToMarkdown:
    runs-on: ubuntu-latest
    steps:
    - name: ZMediumToMarkdown 自動ボット
      uses: ZhgChgLi/ZMediumToMarkdown@main
      with:
        command: "--cookie_uid ${{ secrets.MEDIUM_COOKIE_UID }} --cookie_sid ${{ secrets.MEDIUM_COOKIE_SID }} -j zhgchgli_test"
        # zhgchgli_test をあなたの Medium ユーザー名に置き換えてください
        # 例: https://medium.com/@zhgchgli -> zhgchgli
        # ref: https://github.com/ZhgChgLi/ZMediumToMarkdown?tab=readme-ov-file#usage
```

### アクセス権のある Medium アカウントの Cookies を提供してください。

- ペイウォールの記事がある場合は、必ず提供してください

- もし Medium 記事の同期が不完全（記事が欠落）である場合、それは同期時に Medium のファイアウォールにブロックされたことを意味します。その場合も提供してください

#### Medium アカウントの Cookies MEDIUM_COOKIE_UID と MEDIUM_COOKIE_SID を取得する手順：

![](/assets/medium-to-jekyll-starter/github-4.png)

1. アクセス権のある Medium アカウントにログインし、[Medium ダッシュボード](https://medium.com/me/stats)にアクセスします。

2. 空白部分で右クリックします。

3. 「Inspect」を選択します。

4. Developer Console が表示されたら「Application」を選択します。

5. 「Cookies」->「https://medium.com」を選択します。

6. 下にスクロールして「`sid`」「`uid`」を探します。

7. これら2つのフィールドの値をダブルクリックしてコピーします。

#### Medium アカウントの Cookies を GitHub リポジトリの Secrets に安全に保存する

##### 1. Github リポジトリの Settings -> Secrets and variables -> Actions -> New repository secret に移動する

![](/assets/medium-to-jekyll-starter/github-5.png)

- 名前: `MEDIUM_COOKIE_SID`

- Secret: 前のステップでコピーした Medium アカウントの `sid` 値を貼り付けてください

> https://github.com/{ORG}/{REPO_NAME}/settings/secrets/actions/new
> 
> ##### 2. 新しいシークレット - MEDIUM_COOKIE_SID
> 
> ![](/assets/medium-to-jekyll-starter/github-6.png)

##### 3. 新しいシークレット - MEDIUM_COOKIE_UID

![](/assets/medium-to-jekyll-starter/github-7.png)

- 名前: `MEDIUM_COOKIE_UID`

- Secret: 前のステップでコピーした Medium アカウントの `uid` 値を貼り付けてください

##### 完了

アカウントが特別にログアウトされたり問題が発生しない限り、Cookies は無効になりません。

同期中に以下のメッセージが表示され、記事の同期が不完全な場合：

```
この投稿はMediumの有料会員限定です。全文をダウンロードするには、有効なMediumメンバーのログインクッキーを提供する必要があります。
```

Cookiesが無効になっているため、上記の手順に従って再設定してください。

## 4. 初回手動同期、Repo -> Github Actions -> 「ZMediumToMarkdown」をクリック -> 「Enable workflow」をクリック

初回実行時は、自分で手動同期を行い設定が正しいか確認できます。
![](/assets/medium-to-jekyll-starter/github-9.png)

## 5. 同期記事とサイトのデプロイ完了を待つ

![](/assets/medium-to-jekyll-starter/github-10.png)

以下の3つの Actions ワークフローが完了し、エラーがないことを確認してください：

- 🟢 ZMediumToMarkdown

- 🟢 ページのビルドとデプロイ

- 🟢 ビルドとデプロイ

## 6. ページをリロードして結果を確認しましょう、楽しんでください！

> ⚠️ ご注意ください！すべてのファイル変更は以下をトリガーします：
> 
> - 🟢 ページのビルドとデプロイメント
> 
> - 🟢 ビルドとデプロイ
> 
> 上記の2つのデプロイ作業が完了するまで待つ必要があり、その後にサイトの変更が反映されます。

***

# Jekyll サイト設定

## サイト基本設定

- `./_config.yml`

  **必ず調整してください** `url:` をご自身の Github Pages のURLおよびその他のサイト情報に変更してください。

- 共有機能の設定：`./_data/share.yml`

- 記事の著者情報を定義：`./_data/authors.yml`

## 左側 Sidebar 設定

- `./tabs`

- フッターリンクボタン：`./_data/contact.yml`

## サイトのフッターおよびその他のテキスト設定

- `./locales/{Lang}.yml` のデフォルトは `/locales/en.yml` です

## ローカルテスト

1. Ruby >= 3.1 バージョンがインストールされて使用されていることを確認してください

2. `cd ./`

3. `bundle install`

4. `bundle exec jekyll s`  
   （jekyll サーバーを起動）

5. <http://127.0.0.1:4000/> にアクセスして結果を確認してください

6. `Ctrl-c` を押して停止します。

*サイトの基本設定ファイルを変更した場合は、再度実行する必要があります。