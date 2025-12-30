---
author: ZhgChgLi
categories:
- tools
date: 2025-01-17T00:00:00.000+0000
description: Struggling to migrate your blog from Medium to Jekyll? This guide offers
  a clear, step-by-step installation and setup process to smoothly transfer your content
  and optimize your static site efficiently.
image:
  path: /assets/images/zmediumtomarkdown.jpeg
last_modified_at: 2025-01-17T00:00:00.000+0000
render_with_liquid: false
tags:
- meidum
- github
- jekyll
- ruby
- english
- ai-translation
title: Medium to Jekyll Migration｜Step-by-Step Installation and Setup Guide
---

# Start!

[![](https://opengraph.githubassets.com/91a5dd913bf4d51e6b76fbcc7442c845023bdf93cb1a0ce1ac1c8a40d554f781/ZhgChgLi/medium-to-jekyll-starter.github.io)](https://github.com/ZhgChgLi/medium-to-jekyll-starter.github.io)

## 1. Go to the Template Repo -> [medium-to-jekyll-starter.github.io](https://github.com/ZhgChgLi/medium-to-jekyll-starter.github.io)

![](/assets/medium-to-jekyll-starter/start-6.png)

Click the top right corner "Use this template" -> "Create a new repository"

## 2. Create a new repository

![](/assets/medium-to-jekyll-starter/start-2.png)

- Repository name: Usually `username or organization.github.io`, must end with `*.github.io`.

- The repository must be `Public` to use GitHub Pages.

### Adjust GitHub Actions Execution Permissions

![](/assets/medium-to-jekyll-starter/github-action-permissions.png)

- After creation, due to GitHub's security settings, you need to enable GitHub Actions execution permissions in the repository settings.

## 3. Create gh-pages branch if needed

![](/assets/medium-to-jekyll-starter/start-3.png)

- On the Repo homepage, click the "`main`" branch dropdown, type "`gh-pages`", and if it doesn't exist, select "Create branch `gh-pages` from `main`".

- If the `gh-pages` branch already exists, or you see the message "Sorry, that branch already exists." when creating it, you can skip this step.

## 4. Enable Github Pages, go to Settings -> Pages -> Build and deployment

![](/assets/medium-to-jekyll-starter/start-4.png)

- Select the `gh-pages` branch and click `Save` to save the settings

### Run the First Deployment

![](/assets/medium-to-jekyll-starter/first-deploy.png)

- Repo -> "Actions" -> "Build and Deploy" -> "Run workflow" -> "Branch: main, Run workflow"

## 5. Wait for All Deployment Jobs to Complete

![](/assets/medium-to-jekyll-starter/start-5.png)

- 🟢 pages build and deployment

## 6. Visit the Website to See the Results

> https://`username-or-organization.github.io`

![](/assets/medium-to-jekyll-starter/done.png)

### Troubleshooting

If the page only displays:

```
--- layout: home # Index page ---
```

This indicates a GitHub Pages configuration error, ongoing deployment, or cached previous page. Please use a hard refresh or open the webpage in an incognito browser window.

> First deployment successful! 🎉🎉🎉 Please continue setting up synchronization with your Medium account.

***

# Github Repo (Github Actions) Setup

## 1. Go to your Github Repo's Github Actions page -> Click "ZMediumToMarkdown" -> Click "ZMediumToMarkdown.yml"

![](/assets/medium-to-jekyll-starter/github-1.png)

> https://github.com/{ORG}/{REPO_NAME}/blob/main/.github/workflows/ZMediumToMarkdown.yml
> 
> ## 2. Click the Edit Button on the Right
> 
> ![](/assets/medium-to-jekyll-starter/github-2.png)

## 3. Set Parameters for Automatic Medium Article Sync

![](/assets/medium-to-jekyll-starter/github-3.png)

```yaml
name: ZMediumToMarkdown
on:
  workflow_dispatch:
  schedule:
    - cron: "10 1 15 * *" # Runs at 01:10(UTC), every day.
    # Set how often to auto-sync
    # ref: https://crontab.guru/

jobs:
  ZMediumToMarkdown:
    runs-on: ubuntu-latest
    steps:
    - name: ZMediumToMarkdown Automatic Bot
      uses: ZhgChgLi/ZMediumToMarkdown@main
      with:
        command: "--cookie_uid ${{ secrets.MEDIUM_COOKIE_UID }} --cookie_sid ${{ secrets.MEDIUM_COOKIE_SID }} -j zhgchgli_test"
        # Replace zhgchgli_test with your Medium username
        # For example https://medium.com/@zhgchgli -> zhgchgli
        # ref: https://github.com/ZhgChgLi/ZMediumToMarkdown?tab=readme-ov-file#usage
```

### Provide Medium account cookies with access permissions.

- If you have articles behind a paywall, you must provide

- If you find that Medium article synchronization is incomplete (missing articles), it means the synchronization was blocked by Medium's firewall and you must also provide

#### Steps to Obtain Medium Account Cookies MEDIUM_COOKIE_UID & MEDIUM_COOKIE_SID:

![](/assets/medium-to-jekyll-starter/github-4.png)

1. Log in to a Medium account with access rights and go to the [Medium dashboard](https://medium.com/me/stats)

2. Right-click on the blank area

3. Select "Inspect"

4. After the Developer Console appears, select "Application"

5. Select "Cookies" -> "https://medium.com"

6. Scroll down to find "`sid`" and "`uid`"

7. Double-click to copy the values of these two fields

#### Securely Store Medium Account Cookies in GitHub Repo Secrets

##### 1. Go to Github Repo Settings -> Secrets and variables -> Actions -> New repository secret

![](/assets/medium-to-jekyll-starter/github-5.png)

- Name: `MEDIUM_COOKIE_SID`

- Secret: Paste the `sid` value of the Medium account copied in the previous step

> https://github.com/{ORG}/{REPO_NAME}/settings/secrets/actions/new
> 
> ##### 2. New secret - MEDIUM_COOKIE_SID
> 
> ![](/assets/medium-to-jekyll-starter/github-6.png)

##### 3. New secret - MEDIUM_COOKIE_UID

![](/assets/medium-to-jekyll-starter/github-7.png)

- Name: `MEDIUM_COOKIE_UID`

- Secret: Paste the `uid` value copied from the previous step of the Medium account

##### Done

If the account is not explicitly logged out or encounters issues, the cookies will not expire.

If the following message appears during synchronization and the synced articles are incomplete:

```
This post is behind Medium's paywall. You must provide valid Medium Member login cookies to download the full post.
```

Indicates that the cookies have expired. Please follow the above steps to set them again.

## 4. First Manual Sync, Repo -> GitHub Actions -> Click "ZMediumToMarkdown" -> Click "Enable workflow"

For the first run, we can manually sync once to check if the settings are correct.  
![](/assets/medium-to-jekyll-starter/github-9.png)

## 5. Wait for the Article Synchronization and Website Deployment to Complete

![](/assets/medium-to-jekyll-starter/github-10.png)

Wait for the following three Actions jobs to complete without errors:

- 🟢 ZMediumToMarkdown

- 🟢 pages build and deployment

- 🟢 Build and Deploy

## 6. Refresh the page to see the results, Enjoy!

> ⚠️ Attention! All file changes will trigger:
> 
> - 🟢 pages build and deployment
> 
> You need to wait for both deployment jobs above to complete before the website changes take effect.

***

# Jekyll Website Configuration

## Basic Website Setup

- `./_config.yml`

  **Be sure to adjust** the `url:` to your GitHub Pages URL and other site settings.

- Share Feature Settings: `./_data/share.yml`

- Define article author information: `./_data/authors.yml`

## Left Sidebar Settings

- `./tabs`

- Footer link buttons: `./_data/contact.yml`

## Footer and Other Text Content Settings

- `./locales/{Lang}.yml` default is `/locales/en.yml`

## Local Testing

1. Make sure your environment has Ruby version 3.1 or higher installed and in use

2. `cd ./`

3. `bundle install`

4. `bundle exec jekyll s`

5. Go to <http://127.0.0.1:4000/> to see the result

6. Press `Ctrl-c` to stop.

*The basic site configuration files need to be re-run to take effect after adjustments.