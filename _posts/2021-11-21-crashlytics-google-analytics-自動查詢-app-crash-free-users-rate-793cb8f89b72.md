---
title: Crashlytics + Google Analytics 自動查詢 App Crash-Free Users Rate
author: ZhgChgLi
date: 2021-11-21T22:47:10.076Z
categories: ZRealm Dev.
tags: [crashlytics,ios-app-development,google-analytics,google-apps-script,google-sheets]
---

### Crashlytics + Google Analytics 自動查詢 App Crash-Free Users Rate

使用 Google Apps Script 透過 Google Analytics 查詢 Crashlytics 自動填入到 Google Sheet
![](/assets/793cb8f89b72/1*yPSS8J7o-jowQ6NRYArzjQ.png)
> _上篇「 [Crashlytics + Big Query 打造更即時便利的 Crash 追蹤工具](https://medium.com/zrealm-ios-dev/crashlytics-big-query-%E6%89%93%E9%80%A0%E6%9B%B4%E5%8D%B3%E6%99%82%E4%BE%BF%E5%88%A9%E7%9A%84-crash-%E8%BF%BD%E8%B9%A4%E5%B7%A5%E5%85%B7-e77b80cc6f89) 」我們將 Crashlytics 閃退紀錄 Export Raw Data 到 Big Query，並使用 Google Apps Script 自動排程查詢 Top 10 Crash & 發布訊息到 Slack Channel。_


本篇接續自動化一個與 App 閃退相關的重要數據 — **Crash-Free Users Rate 不受影響使用者的百分比** ，想必很多 App Team 都會持續追縱、紀錄此數據，以往都是傳統人工手動查詢，本篇目標是將此重複性工作自動化、也能避免人工查詢時可能貼錯數據的狀況；同之前所述，Firebase Crashlytics 沒有提供任何 API 供使用者查詢，所以我們同樣要借助將 Firebase 數據串接到其他 Google 服務，再透過該服務 API 查詢相關數據。
![](/assets/793cb8f89b72/1*nvZXYgkj_8AdqHdR_yTCWg.png)

一開始我以為這個數據同樣能從 Big Query 查詢出來；但其實這方向完全錯誤，因為 Big Query 是 Crash 的 Raw Data，不會有沒有閃退的人的數據，因此也算不出 Crash-Free Users Rate；關於這個需求在網路上的資料不多，查詢許久才找到有人提到 Google Analytics 這個關鍵字；我知道 Firebase 的 Analytics、Event 都能串到 GA 查詢使用，但沒想到 Crash-Free Users Rate 這個數據也包含在內，翻閱了 GA 的 API 後，Bingo！
![[API Dimensions & Metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema?hl=en)](/assets/793cb8f89b72/1*4BVf-FMVcY1UbVuLwfKOQg.png "[API Dimensions & Metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema?hl=en)")

[Google Analytics Data API (GA4)](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema#metrics) 提供兩個 Metrics：
- **crashAffectedUsers** ：受閃退影響的使用者數量
- **crashFreeUsersRate** ：不受閃退影響的使用者百分比(小數表示)


知道路通之後，就可以開始動手實作了！
#### 串接 Firebase -> Google Analytics

可參考 [官方說明](https://support.google.com/analytics/answer/9289234?hl=zh-Hant) 步驟設定，本篇省略。
#### GA4 Query Explorer Tool

開始寫 Code 之前，我們可以先用官方提供的 Web GUI Tool 來快速建造查詢條件、取得查詢結果；實驗完結果是我們想要的之後，再開始寫 Code。前

[前往 >>> GA4 Query Explorer](https://ga-dev-tools.web.app/ga4/query-explorer/)
![](/assets/793cb8f89b72/1*qsCMVfWIAzWdZ78LBj8n2A.jpeg)
- 在左上方記得選到 GA4
- 右方登入完帳號後，選擇相應的 GA Account & Property

![](/assets/793cb8f89b72/1*hFJ9KYfecVNmdi4VfDAyIw.png)
- Start Date、EndDate：可直接輸入日期或用特殊變數表示日期 ( `ysterday` , `today` , `30daysAgo` , `7daysAgo` )

![](/assets/793cb8f89b72/1*GEa3BNpUAqoPD07gE-N21A.png)
- metrics：增加 `crashFreeUsersRate`

![](/assets/793cb8f89b72/1*WygzFvmOLp2kUQC3H_lh2g.png)
- dimensions：增加 `platform` (設備類型 iOS/Android/Desktop...)

![](/assets/793cb8f89b72/1*RE8SIIVx4PUkqnHQVsJcTg.png)
- dimension filter：增加 `platform` 、 `string` 、 `exact` 、 `iOS` or `Android`


針對雙平台的 Crash Free Users Rate 分別查詢。
![](/assets/793cb8f89b72/1*1NJNUZscuU2XIicgRPGFYg.png)

拉到最下面點擊「Make Request」查看結果，我們就能得到指定日期範圍內的 Crash-Free Users Rate。
> _可以回頭打開 Firebase Crashlytics 比對同樣條件數據是否相同。_ 
_這邊有發現兩邊數字可能會有微微差距(我們有一項數字差了 0.0002)，原因不明，不過在可以接受的誤差範圍內；若統一都使用 GA Crash-Free Users Rate 那也不能算是誤差了。_

#### 使用 Google Apps Script 自動填入數據到 Google Sheet

再來就是自動化的部分，我們將使用 Google Apps Script 查詢 GA Crash-Free Users Rate 數據後自動填入到我們的 Google Sheet 表單；已達自動填寫、自動追蹤的目標。
![](/assets/793cb8f89b72/1*kMByIU9_6mxg8-F4BbwLuw.png)

假設我們的 Google Sheet 如上圖。
![](/assets/793cb8f89b72/1*pnJ7gmjDefB9OLl0NgceLA.png)

可以點擊 Google Sheet 上方的 Extensions -> Apps Script 建立 Google Apps Script 或是 [點此前網 Google Apps Script](https://script.google.com/home/start) -> 左上方 新增專案即可。
![](/assets/793cb8f89b72/1*81_RPPZgBDvW4XplOHGmVg.png)

進來後可以先點上方未命名專案名稱，給個專案名稱。
![](/assets/793cb8f89b72/1*C4qUfJr2UHAzbcksP2zYWA.jpeg)

在左方的「Services」點「+」加上「Google Analytics Data API」。
![](/assets/793cb8f89b72/1*FfWGQiV2IpOAsQB6TN887g.png)

回到剛剛的 [GA4 Query Explorer](https://ga-dev-tools.web.app/ga4/query-explorer/) 工具，在 Make Request 按鈕旁邊可以勾選「Show Request JSON」取得此條件的 Request JSON。

將此 Request JSON 轉換成 Google Apps Script 後如下：
```javascript
// Remeber add Google Analytics Data API to Services, or you'll see this error: ReferenceError: AnalyticsData is not defined
// https://ga-dev-tools.web.app/ga4/query-explorer/ -> property id
const propertyId = "";
// https://docs.google.com/spreadsheets/d/googleSheetID/
const googleSheetID = "";
// Google Sheet 名稱
const googleSheetName = "App Crash-Free Users Rate";

function execute() {
  Logger.log(fetchCrashFreeUsersRate())
}

function fetchCrashFreeUsersRate(platform = "iOS", startDate = "30daysAgo", endDate = "today") {
  const dimensionPlatform = AnalyticsData.newDimension();
  dimensionPlatform.name = "platform";

  const metric = AnalyticsData.newMetric();
  metric.name = "crashFreeUsersRate";

  const dateRange = AnalyticsData.newDateRange();
  dateRange.startDate = startDate;
  dateRange.endDate = endDate;

  const filterExpression = AnalyticsData.newFilterExpression();
  const filter = AnalyticsData.newFilter();
  filter.fieldName = "platform";
  const stringFilter = AnalyticsData.newStringFilter()
  stringFilter.value = platform;
  stringFilter.matchType = "EXACT";
  filter.stringFilter = stringFilter;
  filterExpression.filter = filter;

  const request = AnalyticsData.newRunReportRequest();
  request.dimensions = [dimensionPlatform];
  request.metrics = [metric];
  request.dateRanges = dateRange;
  request.dimensionFilter = filterExpression;

  const report = AnalyticsData.Properties.runReport(request, "properties/" + propertyId);

  return parseFloat(report.rows[0].metricValues[0].value) * 100;
}

```
- GA Property ID：一樣也可以由剛剛的 [GA4 Query Explorer](https://ga-dev-tools.web.app/ga4/query-explorer/) 工具取得：

![](/assets/793cb8f89b72/1*_ypOYamULlL_dcDsph4KiQ.jpeg)

在一開始的選擇 Property 選單中，選擇的 Property 下方的數字就是 `propertyId` 。
- googleSheetID：可以由 Google Sheet 網址中取得 [https://docs.google.com/spreadsheets/d/ `googleSheetID` /edit](https://docs.google.com/spreadsheets/d/googleSheetID/edit)
- googleSheetName：Google Sheet 中閃退紀錄的 Sheet 名稱

![](/assets/793cb8f89b72/1*5lCtwwr3kZlBEEoW_D33gw.jpeg)

將以上程式碼貼到 Google Apps Script 右方程式碼區塊＆上方執行方法選擇「execute」function 後可以點擊 Debug 測試看看是否能正常取得資料：
![](/assets/793cb8f89b72/1*patatPx4XveqzXfkmetZyA.jpeg)

第一次執行會出現要求授權視窗：
![](/assets/793cb8f89b72/1*6997jA1kINxLfhcxx2NcDQ.png)

按照步驟完成帳號授權即可。
![](/assets/793cb8f89b72/1*_UjZ9Gx3TEvuxZd4ypaYsw.png)

執行成功會在下方 Log Print 出 Crash-Free Users Rate，代表查詢成功。

再來我們只要再加上自動填入 Google Sheet 就大功告成了！

**完整 Code：**
```javascript
// Remeber add Google Analytics Data API to Services, or you'll see this error: ReferenceError: AnalyticsData is not defined

// https://ga-dev-tools.web.app/ga4/query-explorer/ -> property id
const propertyId = "";
// https://docs.google.com/spreadsheets/d/googleSheetID/
const googleSheetID = "";
// Google Sheet 名稱
const googleSheetName = "";

function execute() {
  const today = new Date();
  const daysAgo7 = new Date(new Date().setDate(today.getDate() - 6)); // 今天不算，所以是 -6

  const spreadsheet = SpreadsheetApp.openById(googleSheetID);
  const sheet = spreadsheet.getSheetByName(googleSheetName);
  
  var rows = [];
  rows[0] = Utilities.formatDate(daysAgo7, "GMT+8", "MM/dd")+"~"+Utilities.formatDate(today, "GMT+8", "MM/dd");
  rows[1] = fetchCrashFreeUsersRate("iOS", Utilities.formatDate(daysAgo7, "GMT+8", "yyyy-MM-dd"), Utilities.formatDate(today, "GMT+8", "yyyy-MM-dd"));
  rows[2] = fetchCrashFreeUsersRate("android", Utilities.formatDate(daysAgo7, "GMT+8", "yyyy-MM-dd"), Utilities.formatDate(today, "GMT+8", "yyyy-MM-dd"));
  sheet.appendRow(rows);
}

function fetchCrashFreeUsersRate(platform = "iOS", startDate = "30daysAgo", endDate = "today") {
  const dimensionPlatform = AnalyticsData.newDimension();
  dimensionPlatform.name = "platform";

  const metric = AnalyticsData.newMetric();
  metric.name = "crashFreeUsersRate";

  const dateRange = AnalyticsData.newDateRange();
  dateRange.startDate = startDate;
  dateRange.endDate = endDate;

  const filterExpression = AnalyticsData.newFilterExpression();
  const filter = AnalyticsData.newFilter();
  filter.fieldName = "platform";
  const stringFilter = AnalyticsData.newStringFilter()
  stringFilter.value = platform;
  stringFilter.matchType = "EXACT";
  filter.stringFilter = stringFilter;
  filterExpression.filter = filter;

  const request = AnalyticsData.newRunReportRequest();
  request.dimensions = [dimensionPlatform];
  request.metrics = [metric];
  request.dateRanges = dateRange;
  request.dimensionFilter = filterExpression;

  const report = AnalyticsData.Properties.runReport(request, "properties/" + propertyId);

  return parseFloat(report.rows[0].metricValues[0].value) * 100;
}

```

再次點擊上方 Run or Debug 執行「execute」。
![](/assets/793cb8f89b72/1*tO7f0t5if6Db_eiv5BLOUQ.png)

回到 Google Sheet，數據新增成功！
#### 新增 Trigger 排程自動執行
![](/assets/793cb8f89b72/1*MGO4FhC_8N8ul9dXZRYaMg.jpeg)

選擇左方時鐘按鈕 -> 右下方「+ Add Trigger」。
![](/assets/793cb8f89b72/1*EArxafXakAcfuPWcr1wtIg.png)
- 第一個 function 選擇「execute」
- time based trigger 可選擇 week timer 每週追蹤＆新增一次數據


設定完點擊 Save 即可。
### 完成

現在開始，紀錄追蹤 App Crash-Free Users Rate 數據完全自動化；不需要人工手動查詢＆填入；全部交給機器自動處理！
> 我們只需專注在解決 App Crash 問題！
> _p.s. 不同於上一篇使用 Big Query 需要花錢查詢資料，此篇查詢 Crash-Free Users Rate、Google Apps Script 都是完全免費，可以放心使用。_


如果想將結果同步發送到 Slack Channel 可參考 [上一篇文章](https://medium.com/zrealm-ios-dev/crashlytics-big-query-%E6%89%93%E9%80%A0%E6%9B%B4%E5%8D%B3%E6%99%82%E4%BE%BF%E5%88%A9%E7%9A%84-crash-%E8%BF%BD%E8%B9%A4%E5%B7%A5%E5%85%B7-e77b80cc6f89) ：
![](/assets/793cb8f89b72/1*0VfbK9BIt13LsIEeHGc2LQ.jpeg)
### 延伸閱讀
- [Crashlytics + Big Query 打造更即時便利的 Crash 追蹤工具](https://medium.com/zrealm-ios-dev/crashlytics-big-query-%E6%89%93%E9%80%A0%E6%9B%B4%E5%8D%B3%E6%99%82%E4%BE%BF%E5%88%A9%E7%9A%84-crash-%E8%BF%BD%E8%B9%A4%E5%B7%A5%E5%85%B7-e77b80cc6f89)
- [使用 Python+Google Cloud Platform+Line Bot 自動執行例行瑣事](https://medium.com/zrealm-ios-dev/%E4%BD%BF%E7%94%A8-python-google-cloud-platform-line-bot-%E8%87%AA%E5%8B%95%E5%9F%B7%E8%A1%8C%E4%BE%8B%E8%A1%8C%E7%91%A3%E4%BA%8B-70a1409b149a)
- [Slack 打造全自動 WFH 員工健康狀況回報系統](https://blog.zhgchg.li/slack-%E6%89%93%E9%80%A0%E5%85%A8%E8%87%AA%E5%8B%95-wfh-%E5%93%A1%E5%B7%A5%E5%81%A5%E5%BA%B7%E7%8B%80%E6%B3%81%E5%9B%9E%E5%A0%B1%E7%B3%BB%E7%B5%B1-d61062833c1a)
- [運用 Google Apps Script 轉發 Gmail 信件到 Slack](https://medium.com/zrealm-ios-dev/%E9%81%8B%E7%94%A8-google-apps-script-%E8%BD%89%E7%99%BC-gmail-%E4%BF%A1%E4%BB%B6%E5%88%B0-slack-d414bdbdb8c9)

[Like Z Realm's work](https://cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fbutton.like.co%2Fin%2Fembed%2Fzhgchgli%2Fbutton&display_name=LikeCoin&url=https%3A%2F%2Fbutton.like.co%2Fzhgchgli&image=https%3A%2F%2Fstorage.googleapis.com%2Flikecoin-foundation.appspot.com%2Flikecoin_store_user_zhgchgli_main%3FGoogleAccessId%3Dfirebase-adminsdk-eyzut%2540likecoin-foundation.iam.gserviceaccount.com%26Expires%3D2430432000%26Signature%3DgFRSNto%252BjjxXpRoYyuEMD5Ecm7mLK2uVo1vGz4NinmwLnAK0BGjcfKnItFpt%252BcYurx3wiwKTvrxvU019ruiCeNav7s7QUs5lgDDBc7c6zSVRbgcWhnJoKgReRkRu6Gd93WvGf%252BOdm4FPPgvpaJV9UE7h2MySR6%252B%252F4a%252B4kJCspzCTmLgIewm8W99pSbkX%252BQSlZ4t5Pw22SANS%252BlGl1nBCX48fGg%252Btg0vTghBGrAD2%252FMEXpGNJCdTPx8Gd9urOpqtwV4L1I2e2kYSC4YPDBD6pof1O6fKX%252BI8lGLEYiYP1sthjgf8Y4ZbgQr4Kt%252BRYIicx%252Bg6w3YWTg5zgHxAYhOINXw%253D%253D&key=a19fcc184b9711e1b4764040d3dc5c07&type=text%2Fhtml&schema=like)

有任何問題及指教歡迎 [與我聯絡](https://www.zhgchg.li/contact) 。



+-----------------------------------------------------------------------------------+

| **[View original post on Medium](https://medium.com/zrealm-ios-dev/crashlytics-google-analytics-%E8%87%AA%E5%8B%95%E6%9F%A5%E8%A9%A2-app-crash-free-users-rate-793cb8f89b72) - Converted by [ZhgChgLi](https://blog.zhgchg.li)/[ZMediumToMarkdown](https://github.com/ZhgChgLi/ZMediumToMarkdown)** |

+-----------------------------------------------------------------------------------+
