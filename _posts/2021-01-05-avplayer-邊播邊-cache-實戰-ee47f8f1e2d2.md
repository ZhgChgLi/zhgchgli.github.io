---
title: AVPlayer 邊播邊 Cache 實戰
author: ZhgChgLi
date: 2021-01-05T22:27:52.843Z
categories: 
tags: [ios,ios-app-development,cache,avplayer,music-player]
---

### [舊]AVPlayer 邊播邊 Cache 實戰

摸清 AVPlayer/AVQueuePlayer with AVURLAsset 實作 AVAssetResourceLoaderDelegate 的脈絡
### [2021–01–31] 文章公告：文章編修完成

在此要先對所有已讀原本文章的朋友深深一鞠躬道歉，因為自己的魯莽沒有徹底研究完成就發表文章；導致部分內容有誤、浪費您寶貴的時間。

目前已從頭把脈絡梳理完成，重新撰寫了篇文章；內含完整專案程式共大家參考，謝謝！

**變更內容：** 約 30%

**新增內容：** 約 60%
> [AVPlayer 實踐本地 Cache 功能大全 點我查看](avplayer-%E5%AF%A6%E8%B8%90%E6%9C%AC%E5%9C%B0-cache-%E5%8A%9F%E8%83%BD%E5%A4%A7%E5%85%A8-6ce488898003)
[Like Z Realm's work](https://cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fbutton.like.co%2Fin%2Fembed%2Fzhgchgli%2Fbutton&display_name=LikeCoin&url=https%3A%2F%2Fbutton.like.co%2Fzhgchgli&image=https%3A%2F%2Fstorage.googleapis.com%2Flikecoin-foundation.appspot.com%2Flikecoin_store_user_zhgchgli_main%3FGoogleAccessId%3Dfirebase-adminsdk-eyzut%2540likecoin-foundation.iam.gserviceaccount.com%26Expires%3D2430432000%26Signature%3DgFRSNto%252BjjxXpRoYyuEMD5Ecm7mLK2uVo1vGz4NinmwLnAK0BGjcfKnItFpt%252BcYurx3wiwKTvrxvU019ruiCeNav7s7QUs5lgDDBc7c6zSVRbgcWhnJoKgReRkRu6Gd93WvGf%252BOdm4FPPgvpaJV9UE7h2MySR6%252B%252F4a%252B4kJCspzCTmLgIewm8W99pSbkX%252BQSlZ4t5Pw22SANS%252BlGl1nBCX48fGg%252Btg0vTghBGrAD2%252FMEXpGNJCdTPx8Gd9urOpqtwV4L1I2e2kYSC4YPDBD6pof1O6fKX%252BI8lGLEYiYP1sthjgf8Y4ZbgQr4Kt%252BRYIicx%252Bg6w3YWTg5zgHxAYhOINXw%253D%253D&key=a19fcc184b9711e1b4764040d3dc5c07&type=text%2Fhtml&schema=like)



+-----------------------------------------------------------------------------------+

| **[View original post on Medium](https://blog.zhgchg.li/avplayer-%E9%82%8A%E6%92%AD%E9%82%8A-cache-%E5%AF%A6%E6%88%B0-ee47f8f1e2d2) - Converted by [ZhgChgLi](https://blog.zhgchg.li)/[ZMediumToMarkdown](https://github.com/ZhgChgLi/ZMediumToMarkdown)** |

+-----------------------------------------------------------------------------------+
