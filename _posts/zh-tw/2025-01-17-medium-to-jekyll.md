---
title: "[正體中文] Medium to Jekyll 安裝設定教學"
author: ZhgChgLi
date: 2025-01-17T00:00:00.000+0000
last_modified_at: 2025-01-17T00:00:00.000+0000
categories: ["tools"]
tags: [meidum,github,jekyll,ruby]
description: Meidum to Jekyll 安裝設定教學
hidden: true
image:
  path: /assets/images/zmediumtomarkdown.jpeg
render_with_liquid: false
---

[简体中文](/posts/cn/medium-to-jekyll/) | [English](/posts/en/medium-to-jekyll/)

# Start!
[![](https://opengraph.githubassets.com/91a5dd913bf4d51e6b76fbcc7442c845023bdf93cb1a0ce1ac1c8a40d554f781/ZhgChgLi/medium-to-jekyll-starter.github.io)](https://github.com/ZhgChgLi/medium-to-jekyll-starter.github.io)

## 1. 前往 Template Repo -> [medium-to-jekyll-starter.github.io](https://github.com/ZhgChgLi/medium-to-jekyll-starter.github.io)

![](/assets/medium-to-jekyll-starter/start-6.png)

點擊右上角「Use this template」->「Create a new repository」

## 2. Create a new repository

![](/assets/medium-to-jekyll-starter/start-2.png)

- Repository name: 通常為 `帳號或組織名稱.github.io`，必須以 `*.github.io` 為結尾。
- 必須為 `Public` Repo 才能使用 Github Pages

## 3. Create gh-pages branch if needed
![](/assets/medium-to-jekyll-starter/start-3.png)

- 在 Repo 主頁點擊「`main`」分支選單，輸入「`gh-pages`」，若無則選擇「Create branch `gh-pages` from `main`」
- 若 `gh-pages` 分支已存在、或建立時出現「Sorry, that branch already exists.」則可跳過此步驟

## 4. Enable Github Pages，前往 Settings -> Pages -> Build and deployment
![](/assets/medium-to-jekyll-starter/start-4.png)

- 選擇「`gh-pages`」分支，點擊「`Save`」儲存設定

## 5. 等待所有部署工作完成
![](/assets/medium-to-jekyll-starter/start-5.png)

- 🟢 pages build and deployment
- 🟢 Build and Deploy

## 6. 前往網站查看結果
> https://`帳號或組織名稱.github.io`

![](/assets/medium-to-jekyll-starter/done.png)

成功！🎉🎉🎉

# Github Repo (Github Actions) 設定
## 1. 前往所屬 Github Repo 的 Github Actions 頁面 -> 點擊「ZMediumToMarkdown」-> 點擊「ZMediumToMarkdown.yml」
![](/assets/medium-to-jekyll-starter/github-1.png)
> https://github.com/{ORG}/{REPO_NAME}/blob/main/.github/workflows/ZMediumToMarkdown.yml
## 2. 點擊右方編輯按鈕
![](/assets/medium-to-jekyll-starter/github-2.png)

## 3. 設定 Medium 文章自動同步參數
![](/assets/medium-to-jekyll-starter/github-3.png)

```yaml
name: ZMediumToMarkdown
on:
  workflow_dispatch:
  schedule:
    - cron: "10 1 15 * *" # Runs at 01:10(UTC), everyday.
    # 設定排程多久自動同步一次
    # ref: https://crontab.guru/

jobs:
  ZMediumToMarkdown:
    runs-on: ubuntu-latest
    steps:
    - name: ZMediumToMarkdown Automatic Bot
      uses: ZhgChgLi/ZMediumToMarkdown@main
      with:
        command: "--cookie_uid ${{ secrets.MEDIUM_COOKIE_UID }} --cookie_sid ${{ secrets.MEDIUM_COOKIE_SID }} -j zhgchgli_test"
        # zhgchgli_test 替換成你的 Meidum 使用者
        # 例如 https://medium.com/@zhgchgli -> zhgchgli
        # ref: https://github.com/ZhgChgLi/ZMediumToMarkdown?tab=readme-ov-file#usage
```

### 有付費牆文章，需提供有存取權限的 Medium 帳號 Cookies。 (作者本人 or Medium Member)

#### 取得 Meidum 帳號 Cookies MEDIUM_COOKIE_UID & MEDIUM_COOKIE_SID 步驟：

![](/assets/medium-to-jekyll-starter/github-4.png)
1. 登入擁有存取權限的 Medium 帳號，進入 [Medium 後台](https://medium.com/me/stats)
2. 在空白處點擊右鍵
3. 選擇「Inspect」
4. 出現 Developer Console 後選擇「Application」
5. 選擇「Cookies」->「https://medium.com」
6. 往下滾動找到「`sid`」「`uid`」
7. 點兩下複製這兩個欄位的值

#### 將 Meidum 帳號 Cookies 安全存放在 Github Repo Secrets
##### 1. 前往 Github Repo Settings -> Secrets and variables -> Actions -> New repository secret
![](/assets/medium-to-jekyll-starter/github-5.png)
> https://github.com/{ORG}/{REPO_NAME}/settings/secrets/actions/new
##### 2. New secret - MEDIUM_COOKIE_SID
![](/assets/medium-to-jekyll-starter/github-6.png)
- Name: `MEDIUM_COOKIE_SID`
- Secret: 貼上上一步複製的 Medium 帳號 `sid` 值
##### 3. New secret - MEDIUM_COOKIE_UID
![](/assets/medium-to-jekyll-starter/github-7.png)
- Name: `MEDIUM_COOKIE_UID`
- Secret: 貼上上一步複製的 Medium 帳號 `uid` 值

##### 完成
帳號無特別登出或遇到問題，Cookies 不會失效。

如果在同步中出現以下訊息並且同步的文章不完整：
```
This post is behind Medium's paywall. You must provide valid Medium Member login cookies to download the full post.
```
代表 Cookies 已失效，請重新照上述步驟重新設定。

## 4. 首次手動同步，Repo -> Github Actions -> 點擊「ZMediumToMarkdown」-> 點擊「Enable workflow」
初次執行，我們可以自己手動同步一次檢查設定是否正確。
![](/assets/medium-to-jekyll-starter/github-9.png)

## 5. 等待同步文章與網站部署工作完成
![](/assets/medium-to-jekyll-starter/github-10.png)

等待以下三個 Actions 工作執行完成並且沒有錯誤：
- 🟢 ZMediumToMarkdown
- 🟢 pages build and deployment
- 🟢 Build and Deploy

## 6. 重整網頁查看結果，Enjoy!

> ⚠️ 請注意！所有檔案變更都會觸發：
>
> - 🟢 pages build and deployment
> - 🟢 Build and Deploy
>
> 需等待以上兩個部署工作完成，網站更改才會生效。

---

# Jekyll 網站設定

## 網站基本設定
- `./_config.yml`
- 分享功能設定：`./_data/share.yml`
- 定義文章作者資訊：`./_data/authors.yml`

## 左側 Sidebar 設定
- `./tabs`
- 底部連結按鈕：`./_data/contact.yml`

## 網站底部及其他文字內容設定
- `./locales/{Lang}.yml` default is `/locales/en.yml`

## 本地測試
1. 確定你的環境有安裝並使用 Ruby >= 3.1 版本
2. `cd ./`
3. `bundle install`
4. `bundle exec jekyll s`
5. Go to [http://127.0.0.1:4000/](http://127.0.0.1:4000/) 查看結果
6. Press `Ctrl-c` to stop.

*網站基本設定檔案有調整需要重新執行才會生效。