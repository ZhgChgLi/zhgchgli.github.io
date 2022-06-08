---
title: iOS Deferred Deep Link 延遲深度連結實作(Swift)
author: ZhgChgLi
date: 2019-11-11T22:34:57.966Z
categories: ZRealm Dev.
tags: [deeplink,ios-app-development,swift,universal-links,app-store]
---

### iOS Deferred Deep Link 延遲深度連結實作(Swift)

動手打造適應所有場景、不中斷的App轉跳流程
### [2020/07/02] 更新
- [因應 iOS 14 更新，讀取剪貼簿時會提示使用者，如要實作請一併參考此篇文章。](../ios-14-%E5%89%AA%E8%B2%BC%E7%B0%BF%E7%AB%8A%E8%B3%87%E6%81%90%E6%85%8C-%E9%9A%B1%E7%A7%81%E8%88%87%E4%BE%BF%E5%88%A9%E7%9A%84%E5%85%A9%E9%9B%A3-8a04443024e2)

#### 無關

畢業當完兵到現在庸庸碌碌工作了快三年，成長已趨於平緩，開始進入舒適圈，所幸心一橫提了離職，沈澱重新出發。

在閱讀 [做自己的生命設計師](https://www.books.com.tw/products/0010733134) 重新梳理自己的人生規劃時，回顧了一下工作跟人生，雖然本身技術能力沒有很好，但在寫 Medium 與大家分享能讓我進入「心流」跟獲得大量的精力；剛好前陣子有朋友在問 Deep Link 問題，藉此整理了我研究的做法，也順便補充下自己的精力！
### 場景

首先要先說明實際應用場景。

1.當使用者有裝 APP 時點擊網址連結(Google搜尋來源、FB貼文、Line連結…) 則直接開 APP 呈現目標畫面，若無則跳轉到 APP Store 安裝 APP； **安裝完後打開APP，要能重現之前欲前往的畫面** 。

[![iOS Deferred Deep Link Demo](/assets/b08ef940c196/249b_hqdefault.jpg "iOS Deferred Deep Link Demo")](https://www.youtube.com/watch?v=sY6-Q7BFUOM)

2.APP 下載和開啟數據追蹤，我們想知道 APP 推廣連結有多少人確實從這個入口下載和開啟 APP 的。

3.特殊活動入口，例如透過特定網址下載後開啟能獲得獎勵。
#### 支援度：

iOS ≥ 9
### 何謂 Deferred Deep Link 與 Deep Link 的差別？
#### 純 Deep Link 本身：

![](/assets/b08ef940c196/1*15arO4L94ZoEyOLtFARtsA.jpeg)

可以看到 iOS Deep Link 本身運作機制只有判斷 APP 有無安裝，有則開 APP，無則不處理．
#### 首先我們要先加上「無則跳轉到 APP Store」提示使用者安裝 APP：

**URL Scheme** 的部分是由系統控制，一般用於 APP 內呼叫鮮少公開出來；因為如果觸發點在自己無法控制的區域(如：Line連結)，則無法處理。

若觸發點在自身網頁上可以使用些小技巧處理，請參考 [**這裡**](https://stackoverflow.com/questions/627916/check-if-url-scheme-is-supported-in-javascript) ：
```html
<html>
<head>
  <title>Redirect...</title>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <script>
    var appurl = 'marry://open';
    var appstore = 'https://apps.apple.com/tw/app/%E7%B5%90%E5%A9%9A%E5%90%A7-%E6%9C%80%E5%A4%A7%E5%A9%9A%E7%A6%AE%E7%B1%8C%E5%82%99app/id1356057329';

    var timeout;
    function start() {
      window.location = appurl;
      timeout = setTimeout(function(){
        if(confirm('馬上安裝結婚吧APP?')){
          document.location = appstore;
        }
      }, 1000);
    }

    window.onload = function() {
      start()
    }
  </script>
</head>
<body>

</body>
</html>
```

大略邏輯是 **一樣呼叫 URL Scheme，然後設個 Timeout，時間到若還在本頁沒跳轉就當沒安裝 Call 不到 Scheme，轉而導 APP Store 頁面** (但體驗還是不好還是會跳網址錯誤提示，只是多了自動轉址)。

**Universal Link** 本身就是個自己的網頁，若無跳轉，預設就是使用網頁瀏覽器呈現，這邊有網頁服務的可以選擇直接跳網頁瀏覽、沒有的就直接導 APP Store 頁面。

有網頁服務的網站可以在 `<head></head>` 中加入：

[`<meta name=”apple-itunes-app” content=”app-id=APPID, app-argument=頁面參數”>`](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/PromotingAppswithAppBanners/PromotingAppswithAppBanners.html)

![](/assets/b08ef940c196/1*nC1JytAwIwKU04EMBBvf0A.jpeg)

使用 iPhone Safari 瀏覽網頁版上方就會出現 APP 安裝提示、使用 APP 開啟本頁的按鈕； 參數 `app-argument` 就是用來帶入頁面值，並傳遞到 APP 用的。

![加上「無則跳轉到 APP Store」的流程圖](/assets/b08ef940c196/1*B-_5tIDWQpNO8NxpXQsEcA.jpeg "加上「無則跳轉到 APP Store」的流程圖")
#### 完善 Deep Link APP 端處理：

我們要的當然不只是「當使用者有安裝 APP 則開啟 APP」，我們還要將來源資訊與 APP 串起，讓 APP 開啟後自動呈現目標頁面的 APP 畫面。

**URL Scheme** 方式可在 AppDelegate 中的 **`func`** `application( **_** application: UIApplication, open url: URL, sourceApplication: String?, annotation: **Any** ) -> Bool` 進行處理：
```swift
func application(_ application: UIApplication, open url: URL, sourceApplication: String?, annotation: Any) -> Bool {
    if url.scheme == "marry",let params = url.queryParameters {
      if params["type"] == "topic" {
        let VC = TopicViewController(topicID:params["id"])
        UIApplication.shared.keyWindow?.rootViewController?.present(VC,animated: true)
      }    
    }
    return true
}
```

**Universal Link** 則是在 AppDelegate 中的 **`func`** `application( **_** application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: **@escaping** ([ **Any** ]?) -> Void) -> Bool` 進行處理：
```swift
extension URL {
    /// test=1&a=b&c=d => ["test":"1","a":"b","c":"d"]
    /// 解析網址query轉換成[String: String]數組資料
    public var queryParameters: [String: String]? {
        guard let components = URLComponents(url: self, resolvingAgainstBaseURL: true), let queryItems = components.queryItems else {
            return nil
        }
        
        var parameters = [String: String]()
        for item in queryItems {
            parameters[item.name] = item.value
        }
        
        return parameters
    }
    
}
```

先附上一個 URL 的擴充方法 queryParameters，用於方便將 URL Query 轉換成 Swift Dictionary。
```swift
func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([Any]?) -> Void) -> Bool {
        
  if userActivity.activityType == NSUserActivityTypeBrowsingWeb, webpageURL = userActivity.webpageURL {
    /// 如果是universal link url來源...
    let params = webpageURL.queryParameters
    
    if params["type"] == "topic" {
      let VC = TopicViewController(topicID:params["id"])
      UIApplication.shared.keyWindow?.rootViewController?.present(VC,animated: true)
    }
  }
  
  return true  
}
```

![](/assets/b08ef940c196/1*zhtWK56EqWpE91yTVu64Lg.jpeg)

完成！
#### 那還缺什麼？

目前看來已經很完美了，我們處理了所有會遇到的狀況，那還缺什麼？

![](/assets/b08ef940c196/1*ulrLKyvTKoChPScWD9wHyA.jpeg)

如圖所示，如果是 未安裝 -> APP Store 安裝 -> APP Store 打開，來源所帶的資料就會中斷，APP 不知道來源所以就只會顯示首頁；使用者要再回到上一步網頁再點一次開啟，APP 才會驅動跳頁。

![](/assets/b08ef940c196/1*dFdvCRRdM3vrN3lnyG8Diw.jpeg)
> _雖然這樣也不是不行，但考慮到跳出流失率，多一個步驟就是多一層流失，還有使用者體驗起來不順暢；更何況使用者未必這麼聰明。_

#### 進入本文重點

何謂 Deferred Deep Link？，延遲深度連結；就是讓我們的 Deep Link 可以延伸到 APP Store 安裝完後依然保有來源資料。

據 Android 工程師表示 Android 本身就有此功能，但在 iOS 上並不支援此設定、要達到此功能的做法也不友善，請繼續看下去。
### Deferred Deep Link
> _如果不想花時間自己做的話可以直接使用 [branch.io](http://branch.io) 或 [Firebase Dynamic Links](https://firebase.google.com/docs/dynamic-links) 本文介紹的方法就是 Firebase 使用的方式。_


**要達成 Deferred Deep Link 的效果網路上有兩種做法：**

一種是透過使用者裝置、IP、環境…等等參數計算出一個雜湊值，在網頁端存入資料到伺服器；當 APP 安裝後打開用同樣方式計算，如果值相同則取出資料恢復（branch.io 的做法）。

另一種是本文要介紹的方法，同 Firebase 作法；使用 iPhone 剪貼簿和 Safari 與 APP Cookie 共享機制的方法，等於是把資料存在剪貼簿或Cookie，APP安裝完成後再去讀出來使用。

![](/assets/b08ef940c196/1*VVahSlHV2N2jcIw4afzr2g.jpeg)
```
點擊「Open」後你的剪貼簿就會被 JavaScript 自動覆蓋複製上跳轉相關資訊：https://XXX.app.goo.gl/?link=https://XXX.net/topicID=1&type=topic
```

相信有套過 Firebase Dynamic Links 的人一定不陌生這個開啟跳轉頁，了解到原理之後就知道這頁在流程中是無法移除的！

另外 Firebase 也不提供進行樣式修改。
#### 支援度

首先講個坑，支援度問題；如前所說的「不友善」！

![](/assets/b08ef940c196/1*LR3MSAcwjaoSQhwvtD2sUQ.png)

如果 APP 只考慮 iOS ≥ 10 以上的話容易許多，APP 實作剪貼簿存取、Web 使用 JavaScript 將資訊覆蓋到剪貼簿，然後再跳轉到 APP Store 導下載就好。

iOS = 9 不支援JavaScript自動剪貼簿但支援 **Safari 與 APP SFSafariViewController「Cookie 互通大法」**

另外在 APP 需要偷偷在背景加入 SFSafariViewController 載入 Web，再從 Web 取得剛才點連結時存的Cookie資訊。
> _步驟繁瑣＆連結點擊僅限 Safari瀏覽器。_


![[SFSafariViewController](https://developer.apple.com/documentation/safariservices/sfsafariviewcontroller)](/assets/b08ef940c196/1*tPXHlrQE3MdrjMzFbnS_4w.png "[SFSafariViewController](https://developer.apple.com/documentation/safariservices/sfsafariviewcontroller)")
> _根據官方文件，iOS 11 已無法取得使用者的 Safari Cookie，若有這方面需求可使用 SFAuthenticationSession，但此方法無法在背景偷執行，每次載入前都會跳出以下詢問視窗：_


![_SFAuthenticationSession 詢問視窗_](/assets/b08ef940c196/1*eisreftWPWn9PTCbuLQqdw.jpeg "_SFAuthenticationSession 詢問視窗_")
> _還有就是 APP審查是不允許將SFSafariViewController放在使用者看不到的地方的。(用程式觸發再 addSubview 不太容易被發現)_

### 動手做

先講簡單的，只考慮 iOS ≥ 10 以上的用戶，單純使用 iPhone 剪貼簿轉傳資訊。
#### Web 端：

![](/assets/b08ef940c196/1*P2saSHeIX7TZyCQY0StN1Q.jpeg)

我們仿造 Firebase Dynamic Links 客製化刻了自己的頁面，使用 [`clipboard.js`](https://clipboardjs.com/) 這個套件讓使用者點擊「立即前往」時先將我們要帶給 APP 的資訊複製到剪貼簿 `（marry://topicID=1&type=topic）` ，然後再使用 `location.href` 跳轉到 APP Store 商城頁。
#### APP 端：

在 AppDelegate 或 主頁 UIViewController 中讀取剪貼簿的值：

**`let`** `pasteData = UIPasteboard.general.string`

這邊建議還是將資訊使用 URL Scheme 方式包裝，方便進行辨識、資料反解：
```swift
if let pasteData = UIPasteboard.general.string,let url = URL(string: pasteData),url.scheme == "marry",let params = url.queryParameters {
    if params["type"] == "topic" {
      let VC = TopicViewController(topicID:params["id"])
      UIApplication.shared.keyWindow?.rootViewController?.present(VC,animated: true)
    }
}
```

最後在處理完動作後使用 `UIPasteboard.general.string = “”` 將剪貼簿中的資訊清除。
### 動手做 — 支援 iOS 9 版本

麻煩的來了，支援 iOS 9 版，前文有說由於不支援剪貼簿，要使用 **Cookie 互通大法** 。
#### Web 端：

web 端也算好處理，就是改成使用者點擊「立即前往」時將我們要帶給 APP 的資訊存到 Cookie `（marry://topicID=1&type=topic）` ，然後再使用 `location.href` 跳轉到 APP Store 商城頁。

這裡提供兩個封裝好的 JavaScript 處理 Cookie 的方法，加速開發：
```javascript
/// name: Cookie 名稱
/// val: Cookie 值
/// day: Cookie 有效期限，預設１天
/// EX1: setcookie("iosDeepLinkData","marry://topicID=1&type=topic")
/// EX2: setcookie("hey","hi",365) = 一年有效
function setcookie(name, val, day) {
    var exdate = new Date();
    day = day || 1;
    exdate.setDate(exdate.getDate() + day);
    document.cookie = "" + name + "=" + val + ";expires=" + exdate.toGMTString();
}

/// getCookie("iosDeepLinkData") => marry://topicID=1&type=topic
function getCookie(name) {
    var arr = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
    if (arr != null) return decodeURI(arr[2]);
    return null;
}
```
#### APP 端：

本文最麻煩的地方來了。

前文有提到原理，我們要在主頁的UIViewController用程式偷偷加載一個SFSafariViewController 在背景不讓使用者察覺。

**再說個坑：** 偷偷加載這件事，iOS ≥ 10 SFSafariViewController 的 View如果大小設定小於1、透明度小於0.05、設成 isHidden，SFSafariViewController 就 **不會載入** 。
> p.s iOS = 10 同時支援 Cookie 及 剪貼簿。


![[https://stackoverflow.com/questions/39019352/ios10-sfsafariviewcontroller-not-working-when-alpha-is-set-to-0/39216788](https://stackoverflow.com/questions/39019352/ios10-sfsafariviewcontroller-not-working-when-alpha-is-set-to-0/39216788)](/assets/b08ef940c196/1*ab-6ppwHU72AsKKLYBitbw.png "[https://stackoverflow.com/questions/39019352/ios10-sfsafariviewcontroller-not-working-when-alpha-is-set-to-0/39216788](https://stackoverflow.com/questions/39019352/ios10-sfsafariviewcontroller-not-working-when-alpha-is-set-to-0/39216788)")

我這邊的做法是在 主頁的UIViewController 上方放一個 UIView 隨便給個高度，但底部對齊 主頁面 UIView 上方，然後拉 IBOutlet `（sharedCookieView）` 到 Class；在 viewDidLoad() 時 init SFSafariViewController 並將其 View 加入到 `sharedCookieView` 上，所以他實際有顯示有載入，只是跑出畫面了，使用者看不到🌝。

**SFSafariViewController 的 URL 該指向？**

同 Web 端分享頁面，我們要再刻一個 For 讀取 Cookie 的頁面，並將兩個頁面放在同個網域之下避免跨網域Cookie問題，頁面內容稍後附上。
```swift
@IBOutlet weak var SharedCookieView: UIView!

override func viewDidLoad() {
    super.viewDidLoad()
    
    let url = URL(string:"http://app.marry.com.tw/loadCookie.html")
    let sharedCookieViewController = SFSafariViewController(url: url)
    VC.view.frame = CGRect(x: 0, y: 0, width: 200, height: 200)
    sharedCookieViewController.delegate = self
    
    self.addChildViewController(sharedCookieViewController)
    self.SharedCookieView.addSubview(sharedCookieViewController.view)
    
    sharedCookieViewController.beginAppearanceTransition(true, animated: false)
    sharedCookieViewController.didMove(toParentViewController: self)
    sharedCookieViewController.endAppearanceTransition()
}
```

`sharedCookieViewController.delegate = self`

**`class`** `HomeViewController: UIViewController, SFSafariViewControllerDelegate`

需要加上這個 Delegate 才能捕獲載入完成後的 CallBack 處理。

我們可以在：

**`func`** `safariViewController( **_** controller: SFSafariViewController, didCompleteInitialLoad didLoadSuccessfully: Bool) {`

方法中捕獲載入完成事件。

到這步，你可能會想再來就是在 `didCompleteInitialLoad` 中讀取 網頁內的 Cookie 就完成了！

在這裡我沒找到讀取 SFSafariViewController Cookie 的方法，使用網路的方法讀出來都是空的。
> _或可能要使用 JavaScript 與頁面內容進行交互，叫 JavaScript 讀 Cookie 回傳給 UIViewController。_

#### Tricky 的 URL Scheme 法

既然 iOS 不知到如何取得共享的 Cookie，那我們就直接交由「讀取 Cookie 的頁面」去幫我們「讀取 Cookie」。

前文附上的 JavaScript 處理 Cookie 的方法中的 getCookie() 就是用在這，我們的「讀取 Cookie 的頁面」內容是個空白頁(反正使用者看不到)，但是在 JavaScript 部分要在 body onload 之後去讀取 Cookie：
```html
<html>
<head>
  <title>Load iOS Deep Link Saved Cookie...</title>
  <script>
  function checkCookie() {
    var iOSDeepLinkData = getCookie("iOSDeepLinkData");
    if (iOSDeepLinkData && iOSDeepLinkData != '') {
        setcookie("iOSDeepLinkData", "", -1);
        window.location.href = iOSDeepLinkData; /// marry://topicID=1&type=topic
    }
  }
  </script>
</head>

<body onload="checkCookie();">

</body>

</html>

```

實際的原理總結就是：在 `HomeViewController viewDidLoad` 時加入 `SFSafariViewController` 偷加載 `loadCookie.html` 頁面， `loadCookie.html` 頁面讀取檢查先前存的 Cookie，若有則讀出清除，然後使用 `window.location.href` 呼叫，觸發 `URL Scheme` 機制。

所以之後對應的 CallBack 處理就會回到 `AppDelegate` 中的 **`func`** `application( **_** application: UIApplication, open url: URL, sourceApplication: String?, annotation: **Any** ) -> Bool` 進行處理。
### 完工！總結：

![](/assets/b08ef940c196/1*kp26TdlJBW5sVxw4zYa9Rg.jpeg)

如果覺得煩瑣，可以直接使用 [branch.io](http://branch.io) 或 [Firebase Dynamic](https://firebase.google.com/docs/dynamic-links) 沒必要重造輪子，這邊是因為介面客製化及一些複雜需求，只好自己打造。

iOS=9 的用戶已經非常稀少，不是很必要的話可以直接忽略；使用剪貼簿的方法快又有效率，而且用剪貼簿就不用局限連結一定要用 Safari 開啟！

[Medium 原文](https://medium.com/zrealm-ios-dev/ios-deferred-deep-link-%E5%BB%B6%E9%81%B2%E6%B7%B1%E5%BA%A6%E9%80%A3%E7%B5%90%E5%AF%A6%E4%BD%9C-swift-b08ef940c196)
