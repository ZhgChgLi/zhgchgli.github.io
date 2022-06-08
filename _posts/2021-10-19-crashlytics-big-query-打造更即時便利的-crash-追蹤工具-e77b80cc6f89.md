---
title: Crashlytics + Big Query 打造更即時便利的 Crash 追蹤工具
author: ZhgChgLi
date: 2021-10-19T22:33:30.948Z
categories: ZRealm Dev.
tags: [ios-app-development,crashlytics,firebase,bigquery,slack]
---

### Crashlytics + Big Query 打造更即時便利的 Crash 追蹤工具

串接 Crashlytics 和 Big Query 自動轉發閃退記錄到 Slack Channel
![](/assets/e77b80cc6f89/1*-luP3wtJr1XJ9Vq3M0sQLA.png)
### 成果
![Pinkoi iOS Team 實拍圖](/assets/e77b80cc6f89/1*gJhRllB0sQb-W3P7tQAQ6g.jpeg "Pinkoi iOS Team 實拍圖")

先上成果圖，每週定時查詢 Crashlytics 閃退紀錄；篩選出閃退次數前 10 多的問題；將訊息發送到 Slack Channel，方便所有 iOS 隊友快速了解目前穩定性。
### 問題

於 App 開發者來說 Crash-Free Rate 可以說是最重要的衡量指標；數據代表的意思是 App 的使用者 **沒遇到** 閃退的比例，我想不管是什麼 App 都應該希望自己的 Crash-Free Rate ~= 99.9%；但現實是不可能的，只要是程式就可能會有 Bug 更何況有的閃退問題是底層(Apple)或第三方 SDK 造成的，另外隨著 DAU 體量不同，也會對 Crash-Free Rate 有一定影響，DAU 越高越容易踩到很多偶發的閃退問題。

既然 100% 不會閃退的 App 並不存在，那如何追蹤、處理閃退就是一件很重要的事；除了最常見的 [Google Firebase Crashlytics](https://firebase.google.com/products/crashlytics) (前生 Fabric) 外其實還有其他選擇 [Bugsnag](https://www.bugsnag.com/) 、 [Bugfender](https://bugfender.com/) …各工具我沒有實際比較過，有興趣的朋友可以自行研究；如果是用其他工具就用不到本篇文章要介紹的內容了。
#### Crashlytics

**選擇使用 Crashlytics 有以下好處：**
- 穩定，由 Google 撐腰
- 免費、安裝便利快速
- 除閃退外，也可 Log Error Event (EX: Decode Error)
- 一套 Firebase 即可打天下：其他服務還有 Google Analytics、Realtime Database、Remote Config、Authentication、Cloud Messaging、Cloud Storage…

> _題外話：不建議正式的服務完全使用 Firebase 搭建，因為後期流量起來後的收費會很貴…就是個養套殺的概念。_

[zonble 🍺 ゾンビル on Twitter: "聽說從前有個美食外送平台用 Firebase 來做整套後段的建置，然後，就聽說這個平台付不出給廠商的貨款了。 / Twitter"](https://cdn.embedly.com/widgets/media.html?type=text%2Fhtml&key=a19fcc184b9711e1b4764040d3dc5c07&schema=twitter&url=https%3A//twitter.com/zonble/status/1180768179674472448&image=https%3A//i.embed.ly/1/image%3Furl%3Dhttps%253A%252F%252Fabs.twimg.com%252Ferrors%252Flogo46x38.png%26key%3Da19fcc184b9711e1b4764040d3dc5c07)

**Crashlytics 缺點也很多：**
- Crashlytics 不提供 API 查詢閃退資料
- Crashlytics 僅會儲存近 90 天閃退紀錄
- Crashlytics 的 Integrations 支援跟彈性極差


最痛的就是 Integrations 支援跟彈性極差再加上又沒有 API 可以自己寫腳本串閃退資料；只能三不五時靠人工手動上 Crashlytics 查看閃退紀錄，追蹤閃退問題。
#### **Crashlytics 只支援的 Integrations：**
. [Email 通知] — Trending stability issues (越來越多人遇到的閃退問題)
. [Slack, Email 通知] — New Fatal Issue (閃退問題)
. [Slack, Email 通知] — New Non-Fatal Issue (非閃退問題)
. [Slack, Email 通知] — Velocity Alert (數量突然一直上升的閃退問題)
. [Slack, Email 通知] — Regression Alert (已 Solved 但又出現的問題)
. Crashlytics to Jira issue


以上 Integrations 的內容、規則都無法客製化。

最一開始我們直接使用 2.New Fatal Issue to Slack or Email，to Email 的話再由 [Google Apps Script 觸發後續處理腳本](../%E9%81%8B%E7%94%A8-google-apps-script-%E8%BD%89%E7%99%BC-gmail-%E4%BF%A1%E4%BB%B6%E5%88%B0-slack-d414bdbdb8c9) ；但是這個通知會瘋狂轟炸通知頻道，因為不管是大是小或只是使用者裝置、iOS 本身很零星的問題造成的閃退都會通知；隨著 DAU 增長每天都被這通知狂轟濫炸，而其中真的有價值，很多人踩到而且是跟我們程式錯誤有關的通知大概只佔其中的 10%。

以至於根本沒有解決 Crashlytics 難以自動追蹤的問題，一樣要花很多時間在審閱這個問題究竟重不重要之上。
### Crashlytics + Big Query
![](/assets/e77b80cc6f89/1*ABFLOY1AEKkSJah6EVJEkg.png)

轉來轉去只找到這個方法，官方也只提供這個方法；這就是免費糖衣下的陷阱，我猜不管是 Crashlytics 或 Analytics Event 都不會也沒有計劃推出 API 讓使用者可以串 API 查資料；因為官方的唯一建議就是把資料匯入到 Big Query 使用，而 Big Query 超過免費儲存與查詢額度是要收費的。
> _儲存：每個月前 10 GB 為免費。_ 
_查詢：每個月前 1 TB 為免費。 (查詢額度的意思是下 Select 時處理了多少容量的資料)_ 
_詳細可參考 Big Query 定價說明_


Crashlytics to Big Query 的設定細節可參考 [**官方文件**](https://firebase.google.com/docs/crashlytics/bigquery-export) ，需啟用 GCP 服務、綁定信用卡…等等。
### 開始使用 Big Query 查詢 Crashlytics Log

設好 Crashlytics Log to Big Query 匯入週期＆完成第一次匯入有資料後，我們就能開始查詢資料囉。
![](/assets/e77b80cc6f89/1*dvjnubHWwYF7Bhz8SiuuLA.jpeg)

首先到 Firebase 專案 -> Crashlytics -> 列表右上方的「•••」-> 點擊前往「BigQuery dataset」。
![](/assets/e77b80cc6f89/1*TEJY6kH9guplY1kZvOfxzw.jpeg)

前往 GCP -> Big Query 後可在左方「Exploer」中選擇「firebase_crashlytics」->選擇你的 Table 名稱 ->「Detail」 -> 右邊可查看 Table 資訊，包含最新修改時間、已使用容量、儲存期限…等等。
> _確認已有匯入的資料可查詢。_

![](/assets/e77b80cc6f89/1*4atxy5aRHkQrVvRE1GE2AQ.jpeg)

上方 Tab 可切換到「SCHEMA」查看 Table 的欄位資訊或參考 [官方文件](https://firebase.google.com/docs/crashlytics/bigquery-export#without_stack_traces) 。
![](/assets/e77b80cc6f89/1*K0got1UinY2y4cFxZ2HM3w.jpeg)

點擊右上方的「Query」可開啟帶有輔助 SQL Builder 的介面(如對 SQL 不熟建議使用這個)：
![](/assets/e77b80cc6f89/1*fxget7SOAb7hlnKDWhvmFQ.jpeg)

或直接點「COMPOSE NEW QUERY」開一個空白的 Query Editor：
![](/assets/e77b80cc6f89/1*3T7vHuR4LoojnZ5xe6LWfg.png)

不管是哪種方法，都是同個文字編輯器；在輸入完 SQL 之後可以預先在右上方自動完成 SQL 語法檢查和預計會花費的查詢額度( `This query will process XXX when run.` )：
![](/assets/e77b80cc6f89/1*wGMkfqGPg277BzuUgOag1w.jpeg)

確認要查詢後點左上方「RUN」執行查詢，結果會在下方 Query results 區塊顯示。
> **_⚠️ 按下「RUN」執行查詢後就會累積到查詢額度，然後進行收費；所以請注意不要亂下 Query。_**

#### **如對 SQL 較陌生可以先了解基本用法，然後參考 Crashlytics [官方的範例下去魔改](https://firebase.google.com/docs/crashlytics/bigquery-export) ：**

**1.統計近 30 日每天的閃退次數：**
```
SELECT
  COUNT(DISTINCT event_id) AS number_of_crashes,
  FORMAT_TIMESTAMP("%F", event_timestamp) AS date_of_crashes
FROM
 `你的ProjectID.firebase_crashlytics.你的TableName`
GROUP BY
  date_of_crashes
ORDER BY
  date_of_crashes DESC
LIMIT 30;
```

**2.查詢近 7 天最常出現的 TOP 10 閃退：**
```
SELECT
  DISTINCT issue_id,
  COUNT(DISTINCT event_id) AS number_of_crashes,
  COUNT(DISTINCT installation_uuid) AS number_of_impacted_user,
  blame_frame.file,
  blame_frame.line
FROM
  `你的ProjectID.firebase_crashlytics.你的TableName`
WHERE
  event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(),INTERVAL 168 HOUR)
  AND event_timestamp < CURRENT_TIMESTAMP()
GROUP BY
  issue_id,
  blame_frame.file,
  blame_frame.line
ORDER BY
  number_of_crashes DESC
LIMIT 10;
```
> _但官方範例這個下法查出來的資料跟 Crashlytics 看到的排序不一樣，應該是它用 blame_frame.file (nullable), blame_frame.line (nullable) 去 Group 的原因導致。_


**3.查詢近 7 天最常閃退的 10 種裝置：**
```
SELECT
  device.model,
COUNT(DISTINCT event_id) AS number_of_crashes
FROM
  `你的ProjectID.firebase_crashlytics.你的TableName`
WHERE
  event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 168 HOUR)
  AND event_timestamp < CURRENT_TIMESTAMP()
GROUP BY
  device.model
ORDER BY
  number_of_crashes DESC
LIMIT 10;
```

更多範例請參考 [官方文件](https://firebase.google.com/docs/crashlytics/bigquery-export#example_4_filter_by_custom_key) 。
> _如果你下的 SQL 無任何資料，請先確定指定條件的 Crashlytics 資料已匯入 Big Query（例如預設的 SQL 範例會查當天 Crash 紀錄，但其實資料還沒同步匯入進來，所以會查不到）；如果確定有資料，再來檢查篩選條件是否正確。_

#### Top 10 Crashlytics Issue Big Query SQL

這邊參考第 2. 的官方範例修改，我們希望的結果是跟我們看 Crashlytics 第一頁時一樣的閃退問題及排序資料。

**近 7 日閃退問題的 Top 10：**
```
SELECT 
  DISTINCT issue_id, 
  issue_title, 
  issue_subtitle, 
  COUNT(DISTINCT event_id) AS number_of_crashes, 
  COUNT(DISTINCT installation_uuid) AS number_of_impacted_user 
FROM 
  `你的ProjectID.firebase_crashlytics.你的TableName`
WHERE 
  is_fatal = true 
  AND event_timestamp >= TIMESTAMP_SUB(
    CURRENT_TIMESTAMP(), 
    INTERVAL 7 DAY
  ) 
GROUP BY 
  issue_id, 
  issue_title, 
  issue_subtitle 
ORDER BY 
  number_of_crashes DESC 
LIMIT 
  10;
```
![](/assets/e77b80cc6f89/1*YtbpV4tm0Z_iwrOA0AJ9Jg.jpeg)

比對 Crashlytics 的 Top 10 閃退問題結果，符合✅。
### 使用 Google Apps Script 定期查詢＆轉發到 Slack

前往 [Google Apps Script 首頁](https://script.google.com/home) -> 登入與 Big Query 同個帳戶 -> 點左上角「新專案」，開啟新專案後可點左上方重新命名專案。
#### 首先我們先完成串接 Big Query 取得查詢資料：

參考 [官方文件](https://developers.google.com/apps-script/advanced/bigquery) 範例，將上面的 Query SQL 帶入。
```javascript
function queryiOSTop10Crashes() {
  var request = {
    query: 'SELECT DISTINCT issue_id, issue_title, issue_subtitle, COUNT(DISTINCT event_id) AS number_of_crashes, COUNT(DISTINCT installation_uuid) AS number_of_impacted_user FROM `firebase_crashlytics.你的TableName` WHERE is_fatal = true AND event_timestamp >= TIMESTAMP_SUB( CURRENT_TIMESTAMP(), INTERVAL 7 DAY ) GROUP BY issue_id, issue_title, issue_subtitle ORDER BY number_of_crashes DESC LIMIT 10;',
    useLegacySql: false
  };
  var queryResults = BigQuery.Jobs.query(request, '你的ProjectID');
  var jobId = queryResults.jobReference.jobId;

  // Check on status of the Query Job.
  var sleepTimeMs = 500;
  while (!queryResults.jobComplete) {
    Utilities.sleep(sleepTimeMs);
    sleepTimeMs *= 2;
    queryResults = BigQuery.Jobs.getQueryResults(projectId, jobId);
  }

  // Get all the rows of results.
  var rows = queryResults.rows;
  while (queryResults.pageToken) {
    queryResults = BigQuery.Jobs.getQueryResults(projectId, jobId, {
      pageToken: queryResults.pageToken
    });
    Logger.log(queryResults.rows);
    rows = rows.concat(queryResults.rows);
  }

  var data = new Array(rows.length);
  for (var i = 0; i < rows.length; i++) {
    var cols = rows[i].f;
    data[i] = new Array(cols.length);
    for (var j = 0; j < cols.length; j++) {
      data[i][j] = cols[j].v;
    }
  }

  return data
}
```

**query：** 餐數可任意更換成寫好的 Query SQL。

**回傳的物件結構如下：**
```json
[
  [
    "67583e77da3b9b9d3bd8feffeb13c8d0",
    "<compiler-generated> line 2147483647",
    "specialized @nonobjc NSAttributedString.init(data:options:documentAttributes:)",
    "417",
    "355"
  ],
  [
    "a590d76bc71fd2f88132845af5455c12",
    "libnetwork.dylib",
    "nw_endpoint_flow_copy_path",
    "259",
    "207"
  ],
  [
    "d7c3b750c3e5587c91119c72f9f6514d",
    "libnetwork.dylib",
    "nw_endpoint_flow_copy_path",
    "138",
    "118"
  ],
  [
    "5bab14b8f8b88c296354cd2e",
    "CoreFoundation",
    "-[NSCache init]",
    "131",
    "117"
  ],
  [
    "c6ce52f4771294f9abaefe5c596b3433",
    "XXX.m line 975",
    "-[XXXX scrollToMessageBottom]",
    "85",
    "57"
  ],
  [
    "712765cb58d97d253ec9cc3f4b579fe1",
    "<compiler-generated> line 2147483647",
    "XXXXX.heightForRow(at:tableViewWidth:)",
    "67",
    "66"
  ],
  [
    "3ccd93daaefe80f024cc8a7d0dc20f76",
    "<compiler-generated> line 2147483647",
    "XXXX.tableView(_:cellForRowAt:)",
    "59",
    "59"
  ],
  [
    "f31a6d464301980a41367b8d14f880a3",
    "XXXX.m line 46",
    "-[XXXX XXX:XXXX:]",
    "50",
    "41"
  ],
  [
    "c149e1dfccecff848d551b501caf41cc",
    "XXXX.m line 554",
    "-[XXXX tableView:didSelectRowAtIndexPath:]",
    "48",
    "47"
  ],
  [
    "609e79f399b1e6727222a8dc75474788",
    "Pinkoi",
    "specialized JSONDecoder.decode<A>(_:from:)",
    "47",
    "38"
  ]
]
```

可以看到是一個二維陣列。
#### 加上轉發 Slack 的 Function：

在上述程式碼下方繼續加入新 Function。
```javascript
function sendTop10CrashToSlack() {

  var iOSTop10Crashes = queryiOSTop10Crashes();
  var top10Tasks = new Array();
  
  for (var i = 0; i < iOSTop10Crashes.length ; i++) {
    var issue_id = iOSTop10Crashes[i][0];
    var issue_title = iOSTop10Crashes[i][1];
    var issue_subtitle = iOSTop10Crashes[i][2];
    var number_of_crashes = iOSTop10Crashes[i][3];
    var number_of_impacted_user = iOSTop10Crashes[i][4];

    var strip_title = issue_title.replace(/[\<|\>]/g, '');
    var strip_subtitle = issue_subtitle.replace(/[\<|\>]/g, '');
    
    top10Tasks.push("<https://console.firebase.google.com/u/1/project/你的ProjectID/crashlytics/app/你的專案ID/issues/"+issue_id+"|"+(i+1)+". Crash: "+number_of_crashes+" 次 ("+number_of_impacted_user+"人) - "+strip_title+" "+strip_subtitle+">");
  }

  var messages = top10Tasks.join("\n");
  var payload = {
    "blocks": [
      {
        "type": "header",
        "text": {
          "type": "plain_text",
          "text": ":bug::bug::bug: iOS 近 7 天閃退問題排行榜 :bug::bug::bug:",
          "emoji": true
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": messages
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "前往 Crashlytics 查看近 7 天紀錄",
              "emoji": true
            },
            "url": "https://console.firebase.google.com/u/1/project/你的ProjectID/crashlytics/app/你的專案ID/issues?time=last-seven-days&state=open&type=crash&tag=all"
          },
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "前往 Crashlytics 查看近 30 天紀錄",
              "emoji": true
            },
            "url": "https://console.firebase.google.com/u/1/project/你的ProjectID/crashlytics/app/你的專案ID/issues?time=last-thirty-days&state=open&type=crash&tag=all"
          }
        ]
      },
      {
        "type": "context",
        "elements": [
          {
            "type": "plain_text",
            "text": "Crash 次數及發生版本僅統計近 7 天之間數據，並非所有資料。",
            "emoji": true
          }
        ]
      }
    ]
  };
      

  var slackWebHookURL = "https://hooks.slack.com/services/XXXXX"; //更換成你的 in-coming webhook url
  UrlFetchApp.fetch(slackWebHookURL,{
    method             : 'post',
    contentType        : 'application/json',
    payload            : JSON.stringify(payload)
  })
}
```
> _如果不知道怎麼取得 in-cming WebHook URL 可以參考 [此篇文章](../%E9%81%8B%E7%94%A8-google-apps-script-%E8%BD%89%E7%99%BC-gmail-%E4%BF%A1%E4%BB%B6%E5%88%B0-slack-d414bdbdb8c9) 的「取得 Incoming WebHooks App URL」章節。_

#### 測試＆設定排程
![](/assets/e77b80cc6f89/1*epwnVrltY7ei8_osPnbaww.jpeg)

此時你的 Google Apps Script 專案應該會有上述兩個 Function。

接下來請在上方的選擇「sendTop10CrashToSlack」Function，然後點擊 Debug 或 Run 執行測試一次；因第一次執行需要完成身份驗證，所以請至少執行過一次再進行下一步。
![](/assets/e77b80cc6f89/1*Pt-falvO3uCtfSrJpNZeZQ.png)

**執行測試一次沒問題後，可以開始設定排程自動執行：**
![](/assets/e77b80cc6f89/1*-lI8vcewsS5ZRt5vR1iAkg.jpeg)

於左方選擇鬧鐘圖案，再選擇右下方「+ Add Trigger」。
![](/assets/e77b80cc6f89/1*V20eoW30mHYnHkhUk5uKnw.png)

第一個「Choose which function to run」(需要執行的 function 入口) 請改為 `sendTop10CrashToSlack` ，時間週期可依個人喜好設定。
> _⚠️⚠️⚠️_ **_請特別注意每次查詢都會累積然後收費的，所以千萬不要亂設定；否則可能被排程自動執行搞到破產。_**

### 完成
![範例成果圖](/assets/e77b80cc6f89/1*J4k9SMFX8hU7-M_zX3wDtw.jpeg "範例成果圖")

現在起，你只要在 Slack 上就能快速追蹤當前 App 閃退問題；甚至直接在上面進行討論。
### App Crash-Free Users Rate？

如果你想追的是 App Crash-Free Users Rate，可參考下篇「 [Crashlytics + Google Analytics 自動查詢 App Crash-Free Users Rate](../crashlytics-google-analytics-%E8%87%AA%E5%8B%95%E6%9F%A5%E8%A9%A2-app-crash-free-users-rate-793cb8f89b72) 」
