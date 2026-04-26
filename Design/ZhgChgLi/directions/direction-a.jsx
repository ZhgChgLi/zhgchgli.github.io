/* global React */
const { useState: useStateA } = React;

/* ============================================
   DIRECTION A — "Gallery" 編輯雜誌風
   大圖、襯線粗體、暖米白、Hero + 雙欄
   ============================================ */

window.DirectionA = {};

// ---------- A: Drawer ----------
function DrawerA({ open, onClose, page, onNav }) {
  const links = [
    { id: "home", label: "Home", zh: "首頁" },
    { id: "list", label: "Writing", zh: "文章" },
    { id: "category", label: "Categories", zh: "分類" },
    { id: "tag", label: "Tags", zh: "標籤" },
    { id: "archive", label: "Archive", zh: "歸檔" },
    { id: "post", label: "About", zh: "關於我" },
  ];
  return (
    <>
      <div className={"drawer-overlay " + (open ? "open" : "")} onClick={onClose}></div>
      <aside className={"drawer " + (open ? "open" : "")}>
        <button className="close" onClick={onClose}>×</button>
        <div className="avatar-row">
          <img className="avatar" src="https://avatars.githubusercontent.com/u/7194691?v=4" alt="" />
          <div>
            <div className="who">ZhgChgLi</div>
            <div className="who-sub">Harry Li · Taipei 🇹🇼</div>
          </div>
        </div>
        <p style={{fontSize:13, color:"var(--ink-500)", lineHeight:1.7, margin:"0 0 8px"}}>
          An iOS, web, and automation developer who also loves sharing, traveling, and writing.
        </p>
        <div className="nav-section">Navigate</div>
        <nav className="nav">
          {links.map(l => (
            <a key={l.id} onClick={() => { onNav?.(l.id); onClose(); }} style={{cursor:"pointer", color: page===l.id ? "var(--accent)" : undefined}}>
              <span>
                <span style={{fontFamily:"var(--font-display)", fontStyle:"italic", marginRight:10, color:"var(--ink-300)", fontSize:13}}>0{links.indexOf(l)+1}</span>
                {l.zh}
              </span>
              <span className="ar">→</span>
            </a>
          ))}
        </nav>
        <div className="socials">
          <a>Md</a><a>Gh</a><a>In</a><a>@</a><a>Rss</a>
        </div>
      </aside>
    </>
  );
}

// ---------- A: Topbar ----------
function TopbarA({ page, onNav, onMenu }) {
  return (
    <header className="topbar">
      <a className="brand" onClick={() => onNav?.("home")} style={{cursor:"pointer"}}>
        <b>Zhg</b><i>Chg</i>Li<span style={{color:"var(--accent)"}}>.</span>
      </a>
      <nav className="topnav">
        {[
          ["home","首頁"],["list","文章"],["category","分類"],["tag","標籤"],["archive","歸檔"]
        ].map(([id,l]) => (
          <a key={id} onClick={() => onNav?.(id)} className={page===id?"active":""} style={{cursor:"pointer"}}>{l}</a>
        ))}
      </nav>
      <div className="right">
        <span style={{fontSize:13}}>Search</span>
        <button className="menu-btn" onClick={onMenu}><span className="bar"></span></button>
      </div>
    </header>
  );
}

// ---------- A: Footer ----------
function FooterA() {
  return (
    <footer className="foot">
      <div>
        <div className="brand-foot">ZhgChgLi<span style={{color:"var(--accent)"}}>.</span></div>
        <div>An iOS / web developer from Taiwan, writing about craft, travel and the gentle in-between.</div>
        <div className="copy">© 2018–2025 Harry Li · Made with ☕ in Taipei</div>
      </div>
      <div>
        <h5>Read</h5>
        <a>iOS</a><a>Open Source</a><a>Career</a><a>隨筆</a>
      </div>
      <div>
        <h5>Connect</h5>
        <a>Medium</a><a>GitHub</a><a>LinkedIn</a><a>Email</a>
      </div>
      <div>
        <h5>Subscribe</h5>
        <div style={{display:"flex", gap:6, marginTop:10}}>
          <input placeholder="you@email.com" style={{flex:1, padding:"10px 12px", borderRadius:6, border:"1px solid var(--rule)", background:"var(--paper)", fontSize:13, fontFamily:"inherit"}}/>
          <button style={{padding:"10px 14px", borderRadius:6, background:"var(--ink-900)", color:"var(--paper)", border:"none", fontSize:12, cursor:"pointer"}}>Join</button>
        </div>
      </div>
    </footer>
  );
}

// ============================================
// A — HOME
// ============================================
function HomeA({ posts, onNav, onMenu, page }) {
  const [drawer, setDrawer] = useStateA(false);
  const hero = posts[0];
  const featured = posts.slice(1, 3);
  const grid = posts.slice(3);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarA page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerA open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      {/* Editorial Masthead */}
      <section style={{padding:"72px 56px 48px", borderBottom:"1px solid var(--rule)", background:"var(--cream-50)"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:40}}>
          <div>
            <div className="eyebrow" style={{marginBottom:18}}>Issue No.087 · September 2025</div>
            <h1 style={{
              fontFamily:"var(--font-display)",
              fontSize:96, lineHeight:0.95, fontWeight:400,
              margin:0, letterSpacing:"-0.03em", maxWidth:980
            }}>
              Crafting <i style={{fontWeight:300}}>quiet</i> software,<br/>
              <span style={{fontStyle:"italic", fontWeight:300, color:"var(--ink-500)"}}>one</span> field note at a time.
            </h1>
          </div>
          <div style={{textAlign:"right", fontSize:12, color:"var(--ink-500)", letterSpacing:"0.1em", textTransform:"uppercase", paddingBottom:12}}>
            087 essays<br/>since 2018
          </div>
        </div>
      </section>

      {/* Hero post */}
      <section style={{padding:"72px 56px", display:"grid", gridTemplateColumns:"1.15fr 1fr", gap:64, alignItems:"center"}}>
        <div style={{aspectRatio:"4/3", overflow:"hidden", borderRadius:2}}>
          <img src={hero.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
        </div>
        <div>
          <div className="eyebrow" style={{marginBottom:20}}>Featured · {hero.category}</div>
          <h2 style={{
            fontFamily:"var(--font-display)", fontSize:52, lineHeight:1.05, fontWeight:500,
            margin:"0 0 20px", letterSpacing:"-0.02em"
          }}>
            {hero.title}
          </h2>
          <p style={{fontSize:17, lineHeight:1.7, color:"var(--ink-500)", margin:"0 0 28px", maxWidth:480}}>
            {hero.excerpt}
          </p>
          <div style={{display:"flex", gap:14, alignItems:"center", fontSize:12, color:"var(--ink-500)", marginBottom:28}}>
            <span>{hero.date}</span>
            <span style={{width:3, height:3, background:"var(--ink-300)", borderRadius:999}}></span>
            <span>{hero.readTime} read</span>
            <span style={{width:3, height:3, background:"var(--ink-300)", borderRadius:999}}></span>
            <span>by Harry</span>
          </div>
          <a className="btn-pill" onClick={() => onNav?.("post")} style={{cursor:"pointer"}}>Read essay →</a>
        </div>
      </section>

      {/* Section title */}
      <section style={{padding:"32px 56px 16px", display:"flex", alignItems:"baseline", justifyContent:"space-between", borderTop:"1px solid var(--rule)"}}>
        <h3 style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:500, margin:0, letterSpacing:"-0.01em"}}>
          Latest <i style={{fontWeight:300, color:"var(--ink-400)"}}>writing</i>
        </h3>
        <a onClick={() => onNav?.("list")} style={{fontSize:13, color:"var(--ink-500)", cursor:"pointer"}}>View all 087 →</a>
      </section>

      {/* 2-column card grid */}
      <section style={{padding:"32px 56px 80px"}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, rowGap:64}}>
          {[...featured, ...grid].map((p, i) => (
            <article key={i} style={{cursor:"pointer"}} onClick={() => onNav?.("post")}>
              <div style={{aspectRatio:"5/3.4", overflow:"hidden", marginBottom:22, background:"var(--cream-100)"}}>
                <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover", transition:"transform .6s"}}/>
              </div>
              <div className="eyebrow" style={{marginBottom:12, color:"var(--ink-500)"}}>{p.category} · {p.date}</div>
              <h4 style={{fontFamily:"var(--font-display)", fontSize:30, lineHeight:1.15, fontWeight:500, margin:"0 0 12px", letterSpacing:"-0.015em"}}>
                {p.title}
              </h4>
              <p style={{fontSize:15, lineHeight:1.65, color:"var(--ink-500)", margin:"0 0 16px"}}>
                {p.excerpt}
              </p>
              <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                {p.tags.slice(0,3).map(t => <span key={t} className="chip">{t}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <FooterA />
    </div>
  );
}

// ============================================
// A — POST LIST
// ============================================
function PostListA({ posts, onNav, page }) {
  const [drawer, setDrawer] = useStateA(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarA page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerA open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      <section style={{padding:"80px 56px 48px", borderBottom:"1px solid var(--rule)"}}>
        <div className="eyebrow" style={{marginBottom:18}}>The Index</div>
        <h1 style={{fontFamily:"var(--font-display)", fontSize:80, lineHeight:1, fontWeight:400, margin:0, letterSpacing:"-0.025em"}}>
          All <i style={{fontWeight:300, color:"var(--ink-500)"}}>writing.</i>
        </h1>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginTop:32}}>
          <p style={{fontSize:16, color:"var(--ink-500)", maxWidth:540, margin:0, lineHeight:1.6}}>
            087 essays on iOS engineering, open source craft, productivity systems, and the occasional travelogue.
          </p>
          <div style={{display:"flex", gap:8}}>
            <button className="btn-pill">Newest</button>
            <button className="btn-ghost">Oldest</button>
            <button className="btn-ghost">A–Z</button>
          </div>
        </div>
      </section>

      {/* Dense left-image rows — fits ~12 posts / page */}
      <section style={{padding:"24px 56px 64px"}}>
        {posts.concat(posts).slice(0, 12).map((p, i) => (
          <article key={i} onClick={() => onNav?.("post")}
            style={{
              display:"grid",
              gridTemplateColumns:"180px 1fr 120px",
              gap:32,
              alignItems:"center",
              padding:"24px 0",
              borderBottom:"1px solid var(--rule-soft)",
              cursor:"pointer",
            }}>
            <div style={{width:180, height:120, overflow:"hidden", background:"var(--cream-100)"}}>
              <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
            </div>
            <div>
              <div className="eyebrow" style={{marginBottom:8, color:"var(--ink-500)"}}>{p.category}</div>
              <h4 style={{
                fontFamily:"var(--font-display)", fontSize:24, lineHeight:1.25,
                fontWeight:500, margin:"0 0 8px", letterSpacing:"-0.01em",
              }}>
                {p.title}
              </h4>
              <p style={{fontSize:14, lineHeight:1.55, color:"var(--ink-500)", margin:"0 0 8px",
                display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"}}>
                {p.excerpt}
              </p>
              <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                {p.tags.slice(0,3).map(t => <span key={t} className="chip" style={{fontSize:10, padding:"3px 8px"}}>{t}</span>)}
              </div>
            </div>
            <div style={{textAlign:"right", fontSize:12, color:"var(--ink-500)", letterSpacing:"0.05em"}}>
              {p.date}<br/>
              <span style={{color:"var(--ink-400)"}}>{p.readTime}</span>
            </div>
          </article>
        ))}
      </section>

      <div style={{padding:"0 56px 80px", display:"flex", justifyContent:"center", gap:8}}>
        <button className="btn-ghost" style={{width:40, padding:0, justifyContent:"center"}}>‹</button>
        <button className="btn-pill" style={{width:40, padding:0, justifyContent:"center"}}>1</button>
        <button className="btn-ghost" style={{width:40, padding:0, justifyContent:"center"}}>2</button>
        <button className="btn-ghost" style={{width:40, padding:0, justifyContent:"center"}}>3</button>
        <button className="btn-ghost" style={{width:40, padding:0, justifyContent:"center"}}>…</button>
        <button className="btn-ghost" style={{width:40, padding:0, justifyContent:"center"}}>9</button>
        <button className="btn-ghost" style={{width:40, padding:0, justifyContent:"center"}}>›</button>
      </div>

      <FooterA />
    </div>
  );
}

// ============================================
// A — POST (single)
// ============================================
function PostA({ posts, onNav, page }) {
  const [drawer, setDrawer] = useStateA(false);
  const p = posts[0];
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarA page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerA open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      <article>
        {/* Hero */}
        <header style={{padding:"80px 56px 56px", maxWidth:920, margin:"0 auto", textAlign:"center"}}>
          <div className="eyebrow" style={{marginBottom:24}}>{p.category} · Essay</div>
          <h1 style={{fontFamily:"var(--font-display)", fontSize:64, lineHeight:1.05, fontWeight:500, margin:"0 0 28px", letterSpacing:"-0.025em"}}>
            {p.title}
          </h1>
          <p style={{fontSize:21, lineHeight:1.55, color:"var(--ink-500)", margin:"0 0 32px", fontFamily:"var(--font-display)", fontStyle:"italic", fontWeight:300}}>
            {p.excerpt}
          </p>
          <div style={{display:"flex", gap:18, alignItems:"center", justifyContent:"center", fontSize:13, color:"var(--ink-500)"}}>
            <img src="https://avatars.githubusercontent.com/u/7194691?v=4" style={{width:32, height:32, borderRadius:999}}/>
            <span>by Harry Li</span>
            <span style={{width:3, height:3, background:"var(--ink-300)", borderRadius:999}}></span>
            <span>{p.date}</span>
            <span style={{width:3, height:3, background:"var(--ink-300)", borderRadius:999}}></span>
            <span>{p.readTime} read</span>
          </div>
        </header>

        <div style={{padding:"0 56px"}}>
          <img src={p.cover} style={{width:"100%", maxHeight:520, objectFit:"cover", borderRadius:2}}/>
          <div style={{textAlign:"center", fontSize:11, color:"var(--ink-400)", marginTop:10, letterSpacing:"0.05em"}}>
            上架前一晚的辦公室 · Photographed by Harry, 2025
          </div>
        </div>

        <div style={{maxWidth:680, margin:"64px auto", padding:"0 24px", fontFamily:"var(--font-display)", fontSize:19, lineHeight:1.8, color:"var(--ink-700)"}}>
          <p style={{marginTop:0}}>
            <span style={{
              float:"left", fontFamily:"var(--font-display)", fontSize:84, lineHeight:0.9,
              fontWeight:500, marginRight:12, marginTop:8, color:"var(--accent)"
            }}>三</span>
            年前的這個時候，我還在公司茶水間反覆練習怎麼跟主管說「我想做一個自己的 App」。三年後的今天，那個 App 上架了，下載量破萬，也讓我重新理解了一件事：寫程式是一回事，把它變成產品交到使用者手上，是另一回事。
          </p>
          <p>
            這篇文章想記錄的不是教學，而是過程裡那些細微的、難以對人說的轉折——關於團隊溝通、關於自我懷疑、關於凌晨三點看著建構失敗的紅字想放棄的時刻。
          </p>
          <h2 style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:500, marginTop:48, marginBottom:16, letterSpacing:"-0.01em"}}>
            一、從一行程式碼開始
          </h2>
          <p>
            最初的版本只有一個畫面、一個按鈕。但就是這個簡陋的原型，幫我打開了第一扇門。我學會的第一件事是：完成比完美更重要。
          </p>
          <blockquote style={{
            borderLeft:"3px solid var(--accent)", paddingLeft:24, margin:"36px 0",
            fontStyle:"italic", fontSize:24, color:"var(--ink-700)", lineHeight:1.5
          }}>
            「Done is better than perfect.」這句被引用到爛的話，當你真的做過一次，才會懂它的份量。
          </blockquote>
          <p>
            接下來的三個月，我每天下班後寫兩小時，週末再寫八小時。不是因為熱情多麼澎湃，而是因為害怕——害怕自己又是個只會說不會做的人。
          </p>
          <h2 style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:500, marginTop:48, marginBottom:16, letterSpacing:"-0.01em"}}>
            二、上架前夜
          </h2>
          <p>
            送審被拒了兩次。第一次是隱私權聲明寫得不清楚，第二次是 IPv6 環境下無法連線。每一次被拒都讓人沮喪，但也每一次都學到了一些書上不會教的事。
          </p>
        </div>

        {/* Tags + share */}
        <div style={{padding:"0 56px", maxWidth:680, margin:"0 auto 48px", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px solid var(--rule)", paddingTop:32}}>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            {p.tags.map(t => <span key={t} className="chip">#{t}</span>)}
          </div>
          <div style={{display:"flex", gap:8, fontSize:12, color:"var(--ink-500)"}}>
            <span style={{padding:"6px 12px", border:"1px solid var(--rule)", borderRadius:999}}>Share</span>
            <span style={{padding:"6px 12px", border:"1px solid var(--rule)", borderRadius:999}}>Copy link</span>
          </div>
        </div>

        {/* Author card */}
        <div style={{maxWidth:680, margin:"0 auto 80px", padding:"40px", background:"var(--cream-50)", display:"flex", gap:24, alignItems:"center", borderRadius:2}}>
          <img src="https://avatars.githubusercontent.com/u/7194691?v=4" style={{width:80, height:80, borderRadius:999}}/>
          <div>
            <div className="eyebrow" style={{marginBottom:6}}>Author</div>
            <h4 style={{fontFamily:"var(--font-display)", fontSize:24, fontWeight:600, margin:"0 0 6px"}}>Harry Li · ZhgChgLi</h4>
            <p style={{fontSize:14, color:"var(--ink-500)", lineHeight:1.6, margin:0}}>
              iOS / web developer in Taipei. Open-source maintainer. Sometimes writes about places, things, and the slow craft of making software.
            </p>
          </div>
        </div>

        {/* Related */}
        <section style={{padding:"40px 56px 80px", borderTop:"1px solid var(--rule)"}}>
          <h3 style={{fontFamily:"var(--font-display)", fontSize:28, fontWeight:500, margin:"0 0 32px"}}>You may also enjoy</h3>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:32}}>
            {posts.slice(1,4).map((rp, i) => (
              <article key={i}>
                <div style={{aspectRatio:"4/3", overflow:"hidden", marginBottom:14}}>
                  <img src={rp.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
                </div>
                <div className="eyebrow" style={{marginBottom:8, color:"var(--ink-500)"}}>{rp.category}</div>
                <h5 style={{fontFamily:"var(--font-display)", fontSize:20, lineHeight:1.25, margin:0, fontWeight:500}}>{rp.title}</h5>
              </article>
            ))}
          </div>
        </section>
      </article>

      <FooterA />
    </div>
  );
}

// ============================================
// A — CATEGORY
// ============================================
function CategoryA({ categories, posts, onNav, page }) {
  const [drawer, setDrawer] = useStateA(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarA page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerA open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      <section style={{padding:"80px 56px 56px", borderBottom:"1px solid var(--rule)"}}>
        <div className="eyebrow" style={{marginBottom:18}}>Browse by · Category</div>
        <h1 style={{fontFamily:"var(--font-display)", fontSize:80, lineHeight:1, fontWeight:400, margin:0, letterSpacing:"-0.025em"}}>
          Eight <i style={{fontWeight:300, color:"var(--ink-500)"}}>topics.</i>
        </h1>
      </section>

      {/* Categories list */}
      <section style={{padding:"48px 56px"}}>
        {categories.map((c, i) => (
          <a key={c.name} style={{
            display:"grid", gridTemplateColumns:"60px 1fr 100px 40px",
            alignItems:"baseline", gap:24, padding:"28px 0",
            borderBottom:"1px solid var(--rule)", cursor:"pointer"
          }}>
            <span style={{fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:18, color:"var(--ink-300)"}}>0{i+1}</span>
            <span style={{fontFamily:"var(--font-display)", fontSize:38, fontWeight:500, letterSpacing:"-0.015em"}}>
              {c.name}
            </span>
            <span style={{fontSize:13, color:"var(--ink-500)", textAlign:"right"}}>{c.count} posts</span>
            <span style={{fontSize:18, color:"var(--ink-300)"}}>→</span>
          </a>
        ))}
      </section>

      {/* Highlighted category preview */}
      <section style={{padding:"40px 56px 80px", background:"var(--cream-50)"}}>
        <div className="eyebrow" style={{marginBottom:18}}>Currently in · iOS</div>
        <h3 style={{fontFamily:"var(--font-display)", fontSize:42, fontWeight:500, margin:"0 0 32px", letterSpacing:"-0.02em"}}>
          Recent in <i>iOS</i>
        </h3>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:48}}>
          {posts.filter(p=>p.category==="iOS").slice(0,2).map((p,i)=>(
            <article key={i} style={{cursor:"pointer"}}>
              <div style={{aspectRatio:"5/3", overflow:"hidden", marginBottom:18}}>
                <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
              </div>
              <div className="eyebrow" style={{marginBottom:8, color:"var(--ink-500)"}}>{p.date}</div>
              <h4 style={{fontFamily:"var(--font-display)", fontSize:26, fontWeight:500, lineHeight:1.2, margin:0}}>{p.title}</h4>
            </article>
          ))}
        </div>
      </section>

      <FooterA />
    </div>
  );
}

// ============================================
// A — TAG
// ============================================
function TagA({ tags, posts, onNav, page }) {
  const [drawer, setDrawer] = useStateA(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarA page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerA open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      <section style={{padding:"80px 56px 56px", borderBottom:"1px solid var(--rule)"}}>
        <div className="eyebrow" style={{marginBottom:18}}>Browse by · Tag</div>
        <h1 style={{fontFamily:"var(--font-display)", fontSize:80, lineHeight:1, fontWeight:400, margin:0, letterSpacing:"-0.025em"}}>
          Tag <i style={{fontWeight:300, color:"var(--ink-500)"}}>cloud.</i>
        </h1>
        <p style={{fontSize:16, color:"var(--ink-500)", maxWidth:520, marginTop:24}}>
          Smaller threads running through the writing — pick one and pull.
        </p>
      </section>

      {/* Tag cloud */}
      <section style={{padding:"56px 56px", display:"flex", flexWrap:"wrap", gap:14, alignItems:"baseline"}}>
        {tags.map((t, i) => {
          const sizes = [38, 22, 30, 18, 26, 44, 24, 32, 20, 28];
          const sz = sizes[i % sizes.length];
          const bold = sz > 30;
          return (
            <a key={t} style={{
              fontFamily:"var(--font-display)",
              fontSize: sz,
              fontWeight: bold ? 600 : 400,
              fontStyle: i%3===1 ? "italic" : "normal",
              color: bold ? "var(--ink-900)" : "var(--ink-500)",
              letterSpacing:"-0.01em",
              cursor:"pointer", padding:"4px 8px",
              transition:"color .2s"
            }}>{t}</a>
          );
        })}
      </section>

      {/* Selected tag */}
      <section style={{padding:"32px 56px 80px", borderTop:"1px solid var(--rule)"}}>
        <div className="eyebrow" style={{marginBottom:14}}>Selected · #Swift</div>
        <h3 style={{fontFamily:"var(--font-display)", fontSize:38, fontWeight:500, margin:"0 0 32px", letterSpacing:"-0.02em"}}>
          12 posts tagged <i>#Swift</i>
        </h3>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, rowGap:48}}>
          {posts.slice(0,4).map((p, i) => (
            <article key={i} style={{display:"grid", gridTemplateColumns:"140px 1fr", gap:18, cursor:"pointer"}}>
              <img src={p.cover} style={{width:"100%", aspectRatio:"1/1", objectFit:"cover"}}/>
              <div>
                <div className="eyebrow" style={{marginBottom:8, color:"var(--ink-500)"}}>{p.date}</div>
                <h4 style={{fontFamily:"var(--font-display)", fontSize:20, lineHeight:1.25, margin:"0 0 8px", fontWeight:500}}>{p.title}</h4>
                <p style={{fontSize:13, color:"var(--ink-500)", lineHeight:1.5, margin:0}}>{p.excerpt}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <FooterA />
    </div>
  );
}

// ============================================
// A — ARCHIVE
// ============================================
function ArchiveA({ archives, onNav, page }) {
  const [drawer, setDrawer] = useStateA(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarA page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerA open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      <section style={{padding:"80px 56px 56px", borderBottom:"1px solid var(--rule)"}}>
        <div className="eyebrow" style={{marginBottom:18}}>Time · Archive</div>
        <h1 style={{fontFamily:"var(--font-display)", fontSize:80, lineHeight:1, fontWeight:400, margin:0, letterSpacing:"-0.025em"}}>
          Eight <i style={{fontWeight:300, color:"var(--ink-500)"}}>years</i> of writing.
        </h1>
        <div style={{display:"flex", gap:32, marginTop:32}}>
          <div><div style={{fontFamily:"var(--font-display)", fontSize:42, fontWeight:500}}>087</div><div style={{fontSize:12, color:"var(--ink-500)", textTransform:"uppercase", letterSpacing:"0.15em"}}>Essays</div></div>
          <div><div style={{fontFamily:"var(--font-display)", fontSize:42, fontWeight:500}}>342k</div><div style={{fontSize:12, color:"var(--ink-500)", textTransform:"uppercase", letterSpacing:"0.15em"}}>Words</div></div>
          <div><div style={{fontFamily:"var(--font-display)", fontSize:42, fontWeight:500}}>2018</div><div style={{fontSize:12, color:"var(--ink-500)", textTransform:"uppercase", letterSpacing:"0.15em"}}>Since</div></div>
        </div>
      </section>

      <section style={{padding:"56px 56px 80px"}}>
        {archives.map(yr => (
          <div key={yr.year} style={{marginBottom:56}}>
            <div style={{display:"grid", gridTemplateColumns:"160px 1fr", gap:48, alignItems:"start"}}>
              <h2 style={{
                fontFamily:"var(--font-display)", fontSize:80, fontWeight:300, fontStyle:"italic",
                margin:0, color:"var(--ink-900)", letterSpacing:"-0.03em",
                position:"sticky", top:88
              }}>
                {yr.year}
              </h2>
              <div>
                {yr.posts.map((p, i) => (
                  <a key={i} style={{
                    display:"grid", gridTemplateColumns:"80px 1fr 24px",
                    alignItems:"baseline", gap:24, padding:"18px 0",
                    borderBottom:"1px solid var(--rule-soft)", cursor:"pointer"
                  }}>
                    <span style={{fontSize:12, color:"var(--ink-400)", letterSpacing:"0.1em", textTransform:"uppercase"}}>{p.date}</span>
                    <span style={{fontFamily:"var(--font-display)", fontSize:20, fontWeight:400}}>{p.title}</span>
                    <span style={{color:"var(--ink-300)"}}>→</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      <FooterA />
    </div>
  );
}

// ============================================
// A — SEARCH
// ============================================
function SearchA({ posts, tags, onNav, page }) {
  const [drawer, setDrawer] = useStateA(false);
  const [q, setQ] = useStateA("Swift");
  const filtered = posts.filter(p =>
    !q || p.title.toLowerCase().includes(q.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(q.toLowerCase())) ||
    p.category.toLowerCase().includes(q.toLowerCase())
  );
  const popular = ["Swift", "SwiftUI", "WWDC", "京都", "Notion", "Career", "Open Source"];
  const recent = ["iOS 18 隱私權", "Pinkoi 離職", "GitHub Actions"];

  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarA page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerA open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      {/* Hero search */}
      <section style={{padding:"80px 56px 48px", borderBottom:"1px solid var(--rule)", background:"var(--cream-50)"}}>
        <div className="eyebrow" style={{marginBottom:18}}>The Index · Search</div>
        <h1 style={{
          fontFamily:"var(--font-display)", fontSize:80, lineHeight:1, fontWeight:400,
          margin:"0 0 40px", letterSpacing:"-0.025em",
        }}>
          Search the <i style={{fontWeight:300, color:"var(--ink-500)"}}>archive.</i>
        </h1>
        <div style={{
          display:"flex", alignItems:"center", gap:14,
          padding:"22px 28px", background:"var(--paper)", border:"1px solid var(--rule)",
          maxWidth:760,
        }}>
          <span style={{fontSize:22, color:"var(--ink-400)"}}>⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋文章標題、標籤、分類…"
            style={{
              flex:1, border:"none", outline:"none", background:"transparent",
              fontFamily:"var(--font-display)", fontSize:24, fontWeight:400,
              color:"var(--ink-900)", letterSpacing:"-0.01em",
            }}
          />
          <span style={{
            fontSize:11, padding:"4px 8px", border:"1px solid var(--rule)", borderRadius:4,
            color:"var(--ink-500)", letterSpacing:"0.1em", textTransform:"uppercase",
          }}>⌘ K</span>
        </div>
        <div style={{display:"flex", gap:8, marginTop:20, flexWrap:"wrap"}}>
          <span style={{fontSize:12, color:"var(--ink-500)", letterSpacing:"0.1em", textTransform:"uppercase", marginRight:8, alignSelf:"center"}}>Popular</span>
          {popular.map(p => (
            <button key={p} onClick={() => setQ(p)}
              className={p === q ? "btn-pill" : "btn-ghost"}
              style={{fontSize:12}}>
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Results header */}
      <section style={{padding:"40px 56px 16px", display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
        <h3 style={{fontFamily:"var(--font-display)", fontSize:28, fontWeight:500, margin:0}}>
          {filtered.length} <i style={{fontWeight:300, color:"var(--ink-500)"}}>results</i> for
          <span style={{color:"var(--accent)", marginLeft:10}}>"{q}"</span>
        </h3>
        <div style={{display:"flex", gap:8}}>
          <button className="btn-pill" style={{fontSize:12}}>All</button>
          <button className="btn-ghost" style={{fontSize:12}}>Posts · {filtered.length}</button>
          <button className="btn-ghost" style={{fontSize:12}}>Tags · 3</button>
        </div>
      </section>

      {/* Results — same dense list as PostList */}
      <section style={{padding:"16px 56px 64px"}}>
        {filtered.map((p, i) => {
          // highlight matched query in title
          const re = new RegExp(`(${q})`, "i");
          const parts = p.title.split(re);
          return (
            <article key={i} onClick={() => onNav?.("post")}
              style={{
                display:"grid", gridTemplateColumns:"160px 1fr 100px", gap:28,
                alignItems:"center", padding:"22px 0",
                borderBottom:"1px solid var(--rule-soft)", cursor:"pointer",
              }}>
              <div style={{width:160, height:108, overflow:"hidden"}}>
                <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
              </div>
              <div>
                <div className="eyebrow" style={{marginBottom:6, color:"var(--ink-500)"}}>{p.category}</div>
                <h4 style={{fontFamily:"var(--font-display)", fontSize:22, lineHeight:1.25, fontWeight:500, margin:"0 0 6px"}}>
                  {parts.map((part, j) =>
                    re.test(part) && q ?
                      <mark key={j} style={{background:"rgba(177,78,44,0.15)", color:"var(--accent)", padding:"0 2px"}}>{part}</mark>
                      : <span key={j}>{part}</span>
                  )}
                </h4>
                <p style={{fontSize:13.5, lineHeight:1.55, color:"var(--ink-500)", margin:0, display:"-webkit-box", WebkitLineClamp:1, WebkitBoxOrient:"vertical", overflow:"hidden"}}>
                  {p.excerpt}
                </p>
              </div>
              <div style={{textAlign:"right", fontSize:12, color:"var(--ink-500)"}}>
                {p.date}<br/>
                <span style={{color:"var(--ink-400)"}}>{p.readTime}</span>
              </div>
            </article>
          );
        })}
        {filtered.length === 0 && (
          <div style={{padding:"60px 0", textAlign:"center", color:"var(--ink-500)"}}>
            <div style={{fontFamily:"var(--font-display)", fontSize:48, fontStyle:"italic", color:"var(--ink-300)", marginBottom:16}}>—</div>
            找不到符合「{q}」的文章。試試別的關鍵字？
          </div>
        )}
      </section>

      {/* Recent + tag cloud */}
      <section style={{padding:"40px 56px 80px", borderTop:"1px solid var(--rule)", background:"var(--cream-50)", display:"grid", gridTemplateColumns:"1fr 2fr", gap:64}}>
        <div>
          <div className="eyebrow" style={{marginBottom:16}}>Recent searches</div>
          {recent.map(r => (
            <a key={r} onClick={() => setQ(r)} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"14px 0", borderBottom:"1px solid var(--rule-soft)",
              cursor:"pointer", fontSize:15, color:"var(--ink-700)",
            }}>
              <span style={{display:"flex", gap:10, alignItems:"center"}}>
                <span style={{color:"var(--ink-400)", fontSize:13}}>↺</span>
                {r}
              </span>
              <span style={{color:"var(--ink-300)"}}>→</span>
            </a>
          ))}
        </div>
        <div>
          <div className="eyebrow" style={{marginBottom:16}}>Browse by tag</div>
          <div style={{display:"flex", flexWrap:"wrap", gap:10}}>
            {tags.slice(0, 18).map(t => (
              <button key={t} onClick={() => setQ(t)} className="btn-ghost"
                style={{fontFamily:"var(--font-display)", fontSize:14, fontStyle: tags.indexOf(t)%3===1 ? "italic" : "normal"}}>
                #{t}
              </button>
            ))}
          </div>
        </div>
      </section>

      <FooterA />
    </div>
  );
}

// ============================================
// A — 404
// ============================================
function NotFoundA({ posts, onNav, page }) {
  const [drawer, setDrawer] = useStateA(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarA page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerA open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      {/* Massive editorial 404 */}
      <section style={{
        padding:"120px 56px 80px",
        background:"var(--cream-50)",
        borderBottom:"1px solid var(--rule)",
        position:"relative",
        overflow:"hidden",
      }}>
        {/* huge ghost number */}
        <div aria-hidden style={{
          position:"absolute", top:-80, right:-40,
          fontFamily:"var(--font-display)",
          fontSize:560, fontWeight:300, fontStyle:"italic",
          color:"var(--cream-200)",
          lineHeight:0.85, letterSpacing:"-0.05em",
          pointerEvents:"none", userSelect:"none",
          zIndex:0,
        }}>
          404
        </div>
        <div style={{position:"relative", zIndex:1, maxWidth:680}}>
          <div className="eyebrow" style={{marginBottom:22}}>Issue No.404 · Out of print</div>
          <h1 style={{
            fontFamily:"var(--font-display)", fontSize:96, lineHeight:0.98, fontWeight:400,
            margin:"0 0 28px", letterSpacing:"-0.03em",
          }}>
            This page is <i style={{fontWeight:300, color:"var(--ink-500)"}}>nowhere</i> to be found.
          </h1>
          <p style={{fontSize:19, lineHeight:1.65, color:"var(--ink-500)", maxWidth:520, margin:"0 0 36px"}}>
            可能這篇文章已經搬家、被改名，或從來不存在。
            像在京都的小巷裡迷路一樣 — 雖然找不到原本要去的地方，但也許會發現別的好東西。
          </p>
          <div style={{display:"flex", gap:10}}>
            <a className="btn-pill" onClick={() => onNav?.("home")} style={{cursor:"pointer"}}>← 回首頁</a>
            <a className="btn-ghost" onClick={() => onNav?.("search")} style={{cursor:"pointer"}}>⌕ 搜尋文章</a>
            <a className="btn-ghost" onClick={() => onNav?.("archive")} style={{cursor:"pointer"}}>翻翻歸檔</a>
          </div>
        </div>
      </section>

      {/* Postcard suggestion */}
      <section style={{padding:"56px 56px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:32}}>
          <h3 style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:500, margin:0, letterSpacing:"-0.01em"}}>
            既然來了，<i style={{fontWeight:300, color:"var(--ink-500)"}}>讀點別的？</i>
          </h3>
          <a onClick={() => onNav?.("list")} style={{fontSize:13, color:"var(--ink-500)", cursor:"pointer"}}>All writing →</a>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:32}}>
          {posts.slice(0, 3).map((p, i) => (
            <article key={i} onClick={() => onNav?.("post")} style={{cursor:"pointer"}}>
              <div style={{aspectRatio:"4/3", overflow:"hidden", marginBottom:16}}>
                <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
              </div>
              <div className="eyebrow" style={{marginBottom:8, color:"var(--ink-500)"}}>{p.category} · {p.date}</div>
              <h4 style={{fontFamily:"var(--font-display)", fontSize:22, lineHeight:1.2, fontWeight:500, margin:0}}>{p.title}</h4>
            </article>
          ))}
        </div>
      </section>

      {/* Tiny footer note */}
      <section style={{padding:"24px 56px 48px", borderTop:"1px solid var(--rule)", display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:12, color:"var(--ink-500)", letterSpacing:"0.08em"}}>
        <span>Error 404 · Page not found</span>
        <span style={{fontFamily:"var(--font-display)", fontStyle:"italic"}}>You are here, but not there.</span>
        <a onClick={() => onNav?.("home")} style={{cursor:"pointer", color:"var(--accent)"}}>Home →</a>
      </section>

      <FooterA />
    </div>
  );
}

window.DirectionA = { HomeA, PostListA, PostA, CategoryA, TagA, ArchiveA, SearchA, NotFoundA };
