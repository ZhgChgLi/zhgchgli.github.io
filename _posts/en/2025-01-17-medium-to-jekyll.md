---
title: "[English] Medium to Jekyll Installation and Configuration Guide"
author: ZhgChgLi
date: 2025-01-17T00:00:00.000+0000
last_modified_at: 2025-01-17T00:00:00.000+0000
categories: ["tools"]
tags: [medium, github, jekyll, ruby]
description: Medium to Jekyll Installation and Configuration Guide
image:
  path: /assets/images/zmediumtomarkdown.jpeg
render_with_liquid: false
---

[简体中文](/posts/cn/medium-to-jekyll/) | [正體中文](/posts/medium-to-jekyll/)

# Start!
[![](https://opengraph.githubassets.com/91a5dd913bf4d51e6b76fbcc7442c845023bdf93cb1a0ce1ac1c8a40d554f781/ZhgChgLi/medium-to-jekyll-starter.github.io)](https://github.com/ZhgChgLi/medium-to-jekyll-starter.github.io)

## 1. Go to Template Repo -> [medium-to-jekyll-starter.github.io](https://github.com/ZhgChgLi/medium-to-jekyll-starter.github.io)

![](/assets/medium-to-jekyll-starter/start-6.png)

Click "Use this template" in the upper right corner -> "Create a new repository"

## 2. Create a new repository

![](/assets/medium-to-jekyll-starter/start-2.png)

- Repository name: Usually `account or organization name.github.io`, must end with `*.github.io`.
- Must be a `Public` Repo to use Github Pages

## 3. Create gh-pages branch if needed
![](/assets/medium-to-jekyll-starter/start-3.png)

- On the Repo homepage, click the "`main`" branch dropdown, enter "`gh-pages`", if it does not exist, select "Create branch `gh-pages` from `main`"
- If the `gh-pages` branch already exists, or if you see "Sorry, that branch already exists." when creating, you can skip this step

## 4. Enable Github Pages, go to Settings -> Pages -> Build and deployment
![](/assets/medium-to-jekyll-starter/start-4.png)

- Select the "`gh-pages`" branch, click "`Save`" to save the settings

## 5. Wait for all deployment work to complete
![](/assets/medium-to-jekyll-starter/start-5.png)

- 🟢 pages build and deployment
- 🟢 Build and Deploy

## 6. Go to the website to check the results
> https://`account_or_organization_name.github.io`

![](/assets/medium-to-jekyll-starter/done.png)

Success! 🎉🎉🎉

# Github Repo (Github Actions) Setup
## 1. Go to the Github Actions page of your Github Repo -> Click on "ZMediumToMarkdown" -> Click on "ZMediumToMarkdown.yml"
![](/assets/medium-to-jekyll-starter/github-1.png)
> https://github.com/{ORG}/{REPO_NAME}/blob/main/.github/workflows/ZMediumToMarkdown.yml
## 2. Click the edit button on the right
![](/assets/medium-to-jekyll-starter/github-2.png)

## 3. Set up the parameters for automatic synchronization of Medium articles
![](/assets/medium-to-jekyll-starter/github-3.png)

```yaml
name: ZMediumToMarkdown
on:
  workflow_dispatch:
  schedule:
    - cron: "10 1 15 * *" # Runs at 01:10 (UTC) on the 15th of every month.
    # Schedule to automatically sync at specified intervals
    # Reference: https://crontab.guru/

jobs:
  ZMediumToMarkdown:
    runs-on: ubuntu-latest
    steps:
    - name: ZMediumToMarkdown Automatic Bot
      uses: ZhgChgLi/ZMediumToMarkdown@main
      with:
        command: "--cookie_uid ${{ secrets.MEDIUM_COOKIE_UID }} --cookie_sid ${{ secrets.MEDIUM_COOKIE_SID }} -j zhgchgli_test"
        # Replace 'zhgchgli_test' with your Medium username
        # For example, https://medium.com/@zhgchgli -> zhgchgli
        # Reference: https://github.com/ZhgChgLi/ZMediumToMarkdown?tab=readme-ov-file#usage
```

### Paywall posts require a Medium account with access permissions and cookies. (Author or Medium Member)

#### Steps to obtain Medium account cookies MEDIUM_COOKIE_UID & MEDIUM_COOKIE_SID:
![](/assets/medium-to-jekyll-starter/github-4.png)

1. Log in to a Medium account with access permissions and go to the [Medium Dashboard](https://medium.com/me/stats)
2. Right-click in a blank area
3. Select "Inspect"
4. Once the Developer Console appears, select "Application"
5. Choose "Cookies" -> "https://medium.com"
6. Scroll down to find "`sid`" and "`uid`"
7. Double-click to copy the values of these two fields

#### Safely store Medium account cookies in GitHub Repo Secrets
##### 1. Go to GitHub Repo Settings -> Secrets and variables -> Actions -> New repository secret
![](/assets/medium-to-jekyll-starter/github-5.png)
> https://github.com/{ORG}/{REPO_NAME}/settings/secrets/actions/new
##### 2. New secret - MEDIUM_COOKIE_SID
![](/assets/medium-to-jekyll-starter/github-6.png)
- Name: `MEDIUM_COOKIE_SID`
- Secret: Paste the `sid` value copied from the previous step
##### 3. New secret - MEDIUM_COOKIE_UID
![](/assets/medium-to-jekyll-starter/github-7.png)
- Name: `MEDIUM_COOKIE_UID`
- Secret: Paste the `uid` value copied from the previous step

##### Completion
If there is no special logout or issues, the cookies will not expire.

If the following message appears during synchronization and the articles are incomplete:
```
This post is behind Medium's paywall. You must provide valid Medium Member login cookies to download the full post.
```
It means the cookies have expired; please reset them by following the steps above.

## 4. First manual synchronization, Repo -> GitHub Actions -> Click "ZMediumToMarkdown" -> Click "Enable workflow"
![](/assets/medium-to-jekyll-starter/github-9.png)
On the first run, we can manually synchronize once to check if the settings are correct.

## 5. Wait for the synchronization of articles and website deployment to complete.
![](/assets/medium-to-jekyll-starter/github-10.png)

Wait for the following three Actions to complete without errors:
- 🟢 ZMediumToMarkdown
- 🟢 pages build and deployment
- 🟢 Build and Deploy

## 6. Refresh the webpage to see the results, Enjoy!

> ⚠️ Please note! All file changes will trigger:
>
> - 🟢 pages build and deployment
> - 🟢 Build and Deploy
>
> You need to wait for the above two deployment tasks to complete for the website changes to take effect.

---

# Jekyll Website Configuration

## Basic Website Settings
- `./_config.yml`
- Share feature settings: `./_data/share.yml`
- Define author information for articles: `./_data/authors.yml`

## Left Sidebar Settings
- `./tabs`
- Bottom link buttons: `./_data/contact.yml`

## Website Footer and Other Text Content Settings
- `./locales/{Lang}.yml` default is `/locales/en.yml`

## Local Testing
1. Ensure your environment has Ruby >= 3.1 installed and in use.
2. `cd ./`
3. `bundle install`
4. `bundle exec jekyll s`
5. Go to [http://127.0.0.1:4000/](http://127.0.0.1:4000/) to see the results.
6. Press `Ctrl-c` to stop.

*Adjustments to the basic website configuration file require re-execution to take effect.*