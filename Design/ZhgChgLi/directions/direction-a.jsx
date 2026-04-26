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
          <a><i className="fa-brands fa-medium"></i></a>
          <a><i className="fa-brands fa-github"></i></a>
          <a><i className="fa-brands fa-linkedin-in"></i></a>
          <a><i className="fa-solid fa-envelope"></i></a>
          <a><i className="fa-solid fa-rss"></i></a>
        </div>
      </aside>
    </>
  );
}

// ---------- A: Language switcher (global) ----------
const LANGS = [
  { code: "zh-TW", label: "繁體中文", short: "繁中", flag: "🇹🇼" },
  { code: "zh-CN", label: "简体中文", short: "简中", flag: "🇨🇳" },
  { code: "en",    label: "English",  short: "EN",   flag: "🇺🇸" },
  { code: "ja",    label: "日本語",   short: "日本",  flag: "🇯🇵" },
];

function LangSwitcher({ size = "sm" }) {
  const [open, setOpen] = useStateA(false);
  const [lang, setLang] = useStateA("zh-TW");
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  const cur = LANGS.find(l => l.code === lang);
  const big = size === "lg";
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          display:"flex", alignItems:"center", gap:8,
          padding: big ? "10px 18px" : "7px 12px",
          border:"1px solid var(--rule)", borderRadius:999,
          background: open ? "var(--cream-100)" : "var(--paper)",
          color:"var(--ink-700)", cursor:"pointer",
          fontFamily:"inherit", fontSize: big ? 13 : 12, letterSpacing:"0.04em",
        }}>
        <i className="fa-solid fa-globe" style={{fontSize: big ? 13 : 11, color:"var(--ink-500)"}}></i>
        <span style={{fontWeight:500}}>{cur.short}</span>
        <i className={"fa-solid " + (open ? "fa-chevron-up" : "fa-chevron-down")} style={{fontSize:9, color:"var(--ink-400)"}}></i>
      </button>
      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 6px)", right:0,
          background:"var(--paper)", border:"1px solid var(--rule)",
          minWidth: 180, boxShadow:"var(--shadow-card)",
          zIndex: 60, padding:6,
        }}>
          {LANGS.map(l => (
            <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
              style={{
                display:"flex", alignItems:"center", gap:10, width:"100%",
                padding:"10px 12px", border:"none", borderRadius:2,
                background: l.code === lang ? "var(--cream-100)" : "transparent",
                color:"var(--ink-900)", cursor:"pointer", fontFamily:"inherit",
                fontSize:13, textAlign:"left",
              }}>
              <span style={{fontSize:14}}>{l.flag}</span>
              <span style={{flex:1}}>{l.label}</span>
              {l.code === lang && <i className="fa-solid fa-check" style={{fontSize:11, color:"var(--accent)"}}></i>}
            </button>
          ))}
          <div style={{borderTop:"1px solid var(--rule-soft)", margin:"6px 0"}}></div>
          <div style={{padding:"8px 12px 4px", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--ink-400)"}}>
            <i className="fa-solid fa-circle-info" style={{marginRight:5}}></i>
            部分文章可能未翻譯
          </div>
        </div>
      )}
    </div>
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
        <LangSwitcher />
        <button onClick={() => onNav?.("search")} title="Search"
          style={{background:"transparent", border:"none", cursor:"pointer", color:"var(--ink-700)", fontSize:15}}>
          <i className="fa-solid fa-magnifying-glass"></i>
        </button>
        <button className="menu-btn" onClick={onMenu}>
          <i className="fa-solid fa-bars" style={{fontSize:14, color:"var(--ink-900)"}}></i>
        </button>
      </div>
    </header>
  );
}

// ---------- A: Pinned card (used on Home + List) ----------
function PinnedRibbon() {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6,
      padding:"4px 10px",
      background:"var(--accent)", color:"var(--paper)",
      fontSize:10, letterSpacing:"0.16em", textTransform:"uppercase", fontWeight:600,
      borderRadius:2,
    }}>
      <i className="fa-solid fa-thumbtack" style={{fontSize:10}}></i>
      Pinned
    </span>
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
        <a><i className="fa-brands fa-medium" style={{marginRight:8, width:14}}></i>Medium</a>
        <a><i className="fa-brands fa-github" style={{marginRight:8, width:14}}></i>GitHub</a>
        <a><i className="fa-brands fa-linkedin-in" style={{marginRight:8, width:14}}></i>LinkedIn</a>
        <a><i className="fa-solid fa-envelope" style={{marginRight:8, width:14}}></i>Email</a>
      </div>
      <div>
        <h5>Follow</h5>
        <a><i className="fa-solid fa-rss" style={{marginRight:8, width:14, color:"var(--accent)"}}></i>RSS Feed</a>
        <a><i className="fa-brands fa-x-twitter" style={{marginRight:8, width:14}}></i>X / Twitter</a>
        <a><i className="fa-brands fa-threads" style={{marginRight:8, width:14}}></i>Threads</a>
      </div>
    </footer>
  );
}

// ============================================
// A — HOME
// ============================================
function HomeA({ posts, onNav, onMenu, page }) {
  const [drawer, setDrawer] = useStateA(false);
  // Mark first 2 posts as pinned for demo
  const pinned = posts.slice(0, 2);
  const hero = posts[2];
  const grid = posts.slice(3);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarA page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerA open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      {/* Pinned essays — replaces the intro masthead */}
      <section style={{padding:"56px 56px 40px", background:"var(--cream-50)", borderBottom:"1px solid var(--rule)"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:24}}>
          <div style={{display:"flex", alignItems:"center", gap:14}}>
            <PinnedRibbon />
            <h3 style={{
              fontFamily:"var(--font-display)", fontSize:24, fontWeight:500, margin:0,
              letterSpacing:"-0.01em",
            }}>
              <i style={{fontWeight:300, color:"var(--ink-500)"}}>釘選</i> · 編輯精選
            </h3>
          </div>
          <span style={{fontSize:11, color:"var(--ink-400)", letterSpacing:"0.12em", textTransform:"uppercase"}}>
            Editor's picks · {String(pinned.length).padStart(2,"0")}
          </span>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:32}}>
          {pinned.map((p, i) => (
            <article key={i} onClick={() => onNav?.("post")}
              style={{
                cursor:"pointer", background:"var(--paper)",
                border:"1px solid var(--rule)",
                display:"grid", gridTemplateColumns:"180px 1fr",
                position:"relative", overflow:"hidden",
              }}>
              <div style={{height:"100%", minHeight:160, overflow:"hidden", background:"var(--cream-100)"}}>
                <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
              </div>
              <div style={{padding:"22px 24px", minWidth:0}}>
                <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                  <i className="fa-solid fa-thumbtack" style={{fontSize:11, color:"var(--accent)"}}></i>
                  <span className="eyebrow" style={{color:"var(--accent)"}}>Pinned · {p.category}</span>
                </div>
                <h4 style={{fontFamily:"var(--font-display)", fontSize:22, lineHeight:1.25, fontWeight:500, margin:"0 0 10px", letterSpacing:"-0.01em"}}>
                  {p.title}
                </h4>
                <p style={{fontSize:13, lineHeight:1.6, color:"var(--ink-500)", margin:"0 0 12px",
                  display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"}}>
                  {p.excerpt}
                </p>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:11, color:"var(--ink-400)"}}>
                  <span>{p.date} · {p.readTime}</span>
                  <span style={{color:"var(--accent)"}}>Read <i className="fa-solid fa-arrow-right" style={{fontSize:10}}></i></span>
                </div>
              </div>
            </article>
          ))}
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
            <i className="fa-regular fa-calendar" style={{fontSize:11}}></i>
            <span>{hero.date}</span>
            <span style={{width:3, height:3, background:"var(--ink-300)", borderRadius:999}}></span>
            <i className="fa-regular fa-clock" style={{fontSize:11}}></i>
            <span>{hero.readTime} read</span>
            <span style={{width:3, height:3, background:"var(--ink-300)", borderRadius:999}}></span>
            <i className="fa-regular fa-user" style={{fontSize:11}}></i>
            <span>by Harry</span>
          </div>
          <a className="btn-pill" onClick={() => onNav?.("post")} style={{cursor:"pointer"}}>
            Read essay <i className="fa-solid fa-arrow-right" style={{fontSize:11, marginLeft:4}}></i>
          </a>
        </div>
      </section>

      {/* Section title */}
      <section style={{padding:"32px 56px 16px", display:"flex", alignItems:"baseline", justifyContent:"space-between", borderTop:"1px solid var(--rule)"}}>
        <h3 style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:500, margin:0, letterSpacing:"-0.01em"}}>
          Latest <i style={{fontWeight:300, color:"var(--ink-400)"}}>writing</i>
        </h3>
        <a onClick={() => onNav?.("list")} style={{fontSize:13, color:"var(--ink-500)", cursor:"pointer"}}>
          View all 087 <i className="fa-solid fa-arrow-right" style={{fontSize:10, marginLeft:4}}></i>
        </a>
      </section>

      {/* 2-column card grid */}
      <section style={{padding:"32px 56px 80px"}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, rowGap:64}}>
          {grid.map((p, i) => (
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

      {/* Pinned strip */}
      <section style={{padding:"36px 56px 32px", background:"var(--cream-50)", borderBottom:"1px solid var(--rule-soft)"}}>
        <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:18}}>
          <PinnedRibbon />
          <span style={{fontSize:12, color:"var(--ink-500)", letterSpacing:"0.05em"}}>{Math.min(6, posts.length)} 篇文章被釘選</span>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:24}}>
          {posts.slice(0, Math.min(6, posts.length)).map((p, i) => (
            <article key={i} onClick={() => onNav?.("post")}
              style={{
                background:"var(--paper)", border:"1px solid var(--rule)",
                cursor:"pointer", position:"relative", overflow:"hidden",
                display:"flex", flexDirection:"column",
              }}>
              <div style={{aspectRatio:"16/9", overflow:"hidden", background:"var(--cream-100)"}}>
                <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
              </div>
              <div style={{padding:"16px 20px 18px", position:"relative"}}>
                <i className="fa-solid fa-thumbtack" style={{
                  position:"absolute", top:14, right:14, fontSize:11, color:"var(--accent)",
                }}></i>
                <div className="eyebrow" style={{color:"var(--ink-500)", marginBottom:8}}>
                  {p.category} · {p.date}
                </div>
                <h5 style={{
                  fontFamily:"var(--font-display)", fontSize:18, lineHeight:1.3,
                  fontWeight:500, margin:0, letterSpacing:"-0.005em",
                  display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden",
                  paddingRight:18,
                }}>
                  {p.title}
                </h5>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Two-column dense rows — left image + right text per row, fits ~16 posts / page */}
      <section style={{padding:"24px 56px 64px", display:"grid", gridTemplateColumns:"1fr 1fr", columnGap:48}}>
        {posts.concat(posts).slice(0, 16).map((p, i) => (
          <article key={i} onClick={() => onNav?.("post")}
            style={{
              display:"grid",
              gridTemplateColumns:"140px 1fr",
              gap:20,
              alignItems:"flex-start",
              padding:"22px 0",
              borderBottom:"1px solid var(--rule-soft)",
              cursor:"pointer",
            }}>
            <div style={{width:140, height:96, overflow:"hidden", background:"var(--cream-100)"}}>
              <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
            </div>
            <div style={{minWidth:0}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6, gap:12}}>
                <span className="eyebrow" style={{color:"var(--ink-500)"}}>{p.category}</span>
                <span style={{fontSize:11, color:"var(--ink-400)", letterSpacing:"0.05em", whiteSpace:"nowrap"}}>{p.date} · {p.readTime}</span>
              </div>
              <h4 style={{
                fontFamily:"var(--font-display)", fontSize:20, lineHeight:1.25,
                fontWeight:500, margin:"0 0 6px", letterSpacing:"-0.01em",
                display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden",
              }}>
                {p.title}
              </h4>
              <p style={{fontSize:13, lineHeight:1.55, color:"var(--ink-500)", margin:"0 0 8px",
                display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"}}>
                {p.excerpt}
              </p>
              <div style={{display:"flex", gap:5, flexWrap:"wrap"}}>
                {p.tags.slice(0,2).map(t => <span key={t} className="chip" style={{fontSize:10, padding:"2px 7px"}}>{t}</span>)}
              </div>
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

// ---------- A: TOC items + helpers ----------
const TOC_ITEMS = [
  { id: "toc-1",   level: 2, label: "從一行程式碼開始" },
  { id: "toc-2",   level: 2, label: "上架前夜" },
  { id: "toc-2-1", level: 3, label: "隱私權聲明的細節" },
  { id: "toc-2-2", level: 3, label: "IPv6 環境下的網路問題" },
  { id: "toc-3",   level: 2, label: "上架之後，才是開始" },
  { id: "toc-4",   level: 2, label: "後記：寫給三年前的自己" },
];

function findScroller(el) {
  if (!el) return null;
  // Prefer explicit marker
  const marked = el.closest('[data-scroll-root]');
  if (marked) return marked;
  // Fallback: walk up to find first ancestor with computed scrollable overflow
  let cur = el.parentElement;
  while (cur) {
    const cs = getComputedStyle(cur);
    const oy = cs.overflowY;
    if ((oy === 'auto' || oy === 'scroll') && cur.scrollHeight > cur.clientHeight) {
      return cur;
    }
    cur = cur.parentElement;
  }
  return null;
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const scroller = findScroller(el);
  if (scroller) {
    const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 24;
    scroller.scrollTo({ top, behavior: "smooth" });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ---------- A: Table of Contents (top of article — sub-sections collapse) ----------
function TableOfContentsA({ topRef, active, onJump }) {
  // Build map: h2 id -> boolean expanded
  const h2ids = TOC_ITEMS.filter(it => it.level === 2).map(it => it.id);
  const initExpanded = {};
  h2ids.forEach(id => { initExpanded[id] = false; });
  const [expanded, setExpanded] = useStateA(initExpanded);

  // Determine which h2 "owns" each h3
  function parentOf(idx) {
    for (let i = idx - 1; i >= 0; i--) {
      if (TOC_ITEMS[i].level === 2) return TOC_ITEMS[i].id;
    }
    return null;
  }

  const toggleSection = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  let globalIdx = 0;

  return (
    <aside ref={topRef} id="post-toc-top" style={{maxWidth: 760, margin: "56px auto 0", padding: "0 56px"}}>
      <div style={{
        background: "var(--cream-50)",
        border: "1px solid var(--rule)",
        padding: "24px 32px 22px",
      }}>
        <div style={{display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18}}>
          <i className="fa-solid fa-list-ul" style={{fontSize: 12, color: "var(--accent)"}}></i>
          <span className="eyebrow" style={{color: "var(--ink-500)"}}>Table of Contents</span>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 500,
            letterSpacing: "-0.01em", marginLeft: 4,
          }}>
            本文目錄 <i style={{fontWeight: 300, color: "var(--ink-400)", fontSize: 14}}>· {h2ids.length} 段</i>
          </span>
        </div>

        <ol style={{listStyle: "none", padding: 0, margin: 0}}>
          {TOC_ITEMS.map((it, i) => {
            const isActive = active === it.id;
            if (it.level === 3) {
              const parent = parentOf(i);
              if (!expanded[parent]) return null;
              globalIdx++;
              return (
                <li key={it.id} style={{marginBottom: 2}}>
                  <a onClick={() => onJump(it.id)} style={{
                    display: "grid",
                    gridTemplateColumns: "16px 28px 1fr 14px",
                    alignItems: "baseline", gap: 10,
                    padding: "8px 12px 8px 28px",
                    borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                    background: isActive ? "var(--paper)" : "transparent",
                    cursor: "pointer", textDecoration: "none",
                    fontSize: 13, color: isActive ? "var(--ink-900)" : "var(--ink-700)",
                    transition: "background .15s",
                  }}>
                    <span style={{color: "var(--ink-300)", fontSize: 10}}>└</span>
                    <span style={{
                      fontFamily: "var(--font-display)", fontStyle: "italic",
                      fontSize: 11, color: isActive ? "var(--accent)" : "var(--ink-300)",
                      letterSpacing: "0.02em",
                    }}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{fontWeight: 400, lineHeight: 1.45, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{it.label}</span>
                    <i className="fa-solid fa-arrow-right" style={{fontSize: 10, color: isActive ? "var(--accent)" : "var(--ink-300)"}}></i>
                  </a>
                </li>
              );
            }
            // h2
            const hasChildren = TOC_ITEMS[i + 1] && TOC_ITEMS[i + 1].level === 3;
            const isOpen = expanded[it.id];
            return (
              <li key={it.id} style={{marginBottom: 2}}>
                <div onClick={() => hasChildren && toggleSection(it.id)} style={{
                  display: "grid",
                  gridTemplateColumns: "28px 1fr 18px",
                  alignItems: "center", gap: 10,
                  padding: "10px 12px",
                  borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                  background: isActive ? "var(--paper)" : "transparent",
                  cursor: hasChildren ? "pointer" : "default",
                  transition: "background .15s",
                }}>
                  <span style={{
                    fontFamily: "var(--font-display)", fontStyle: "italic",
                    fontSize: 11, color: isActive ? "var(--accent)" : "var(--ink-300)",
                    letterSpacing: "0.02em",
                  }}>{String(i + 1).padStart(2, "0")}</span>
                  <span onClick={(e) => { e.stopPropagation(); onJump(it.id); }} style={{
                    fontWeight: 500, lineHeight: 1.45, cursor: "pointer",
                    fontSize: 14, color: isActive ? "var(--ink-900)" : "var(--ink-700)",
                    textDecoration: "none",
                  }}>{it.label}</span>
                  {hasChildren
                    ? <i className={"fa-solid " + (isOpen ? "fa-chevron-up" : "fa-chevron-down")} style={{fontSize: 10, color: "var(--ink-400)"}}></i>
                    : <i className="fa-solid fa-arrow-right" style={{fontSize: 10, color: isActive ? "var(--accent)" : "var(--ink-300)"}}></i>
                  }
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </aside>
  );
}

// ---------- A: Sticky sidebar TOC — appears only when the top TOC scrolls out of view ----------
function FloatingTocA({ active, onJump, topRef }) {
  const [open, setOpen] = useStateA(true);
  const [visible, setVisible] = useStateA(false);

  // Sub-section expand state (h2 id -> bool)
  const h2ids = TOC_ITEMS.filter(it => it.level === 2).map(it => it.id);
  const initExpanded = {};
  h2ids.forEach(id => { initExpanded[id] = false; });
  const [expanded, setExpanded] = useStateA(initExpanded);
  const toggleSection = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  function parentOf(idx) {
    for (let i = idx - 1; i >= 0; i--) {
      if (TOC_ITEMS[i].level === 2) return TOC_ITEMS[i].id;
    }
    return null;
  }

  React.useEffect(() => {
    if (!topRef || !topRef.current) return;
    const scrollRoot = topRef.current.closest("[data-scroll-root]") || null;
    const io = new IntersectionObserver(
      (entries) => { setVisible(!entries[0].isIntersecting); },
      { root: scrollRoot, threshold: 0, rootMargin: "0px 0px -40% 0px" }
    );
    io.observe(topRef.current);
    return () => io.disconnect();
  }, [topRef]);

  return (
    <aside style={{
      width: "100%",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(-6px)",
      pointerEvents: visible ? "auto" : "none",
      transition: "opacity .28s ease, transform .28s ease",
    }}>
      <div style={{
        background: "var(--paper)",
        border: "1px solid var(--rule)",
        padding: open ? "16px 18px 14px" : "12px 18px",
        boxShadow: "var(--shadow-card)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: open ? 12 : 0,
        }}>
          <div style={{display: "flex", alignItems: "center", gap: 8}}>
            <i className="fa-solid fa-list-ul" style={{fontSize: 10, color: "var(--accent)"}}></i>
            <span className="eyebrow" style={{color: "var(--ink-500)", fontSize: 9}}>本文目錄</span>
          </div>
          <button onClick={() => setOpen(o => !o)} style={{
            background: "transparent", border: "none", cursor: "pointer",
            color: "var(--ink-400)", fontSize: 10, padding: 0,
          }}>
            <i className={"fa-solid " + (open ? "fa-chevron-up" : "fa-chevron-down")}></i>
          </button>
        </div>
        {open && (
          <ol style={{listStyle: "none", padding: 0, margin: 0}}>
            {TOC_ITEMS.map((it, i) => {
              const isActive = active === it.id;
              if (it.level === 3) {
                const parent = parentOf(i);
                if (!expanded[parent]) return null;
                return (
                  <li key={it.id}>
                    <a onClick={() => onJump(it.id)} style={{
                      display: "grid", gridTemplateColumns: "10px 18px 1fr",
                      alignItems: "baseline", gap: 6,
                      padding: "5px 8px 5px 14px",
                      borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                      background: isActive ? "var(--cream-50)" : "transparent",
                      cursor: "pointer", textDecoration: "none",
                      fontSize: 11, color: isActive ? "var(--ink-900)" : "var(--ink-500)",
                      transition: "background .15s",
                    }}>
                      <span style={{color: "var(--ink-300)", fontSize: 9}}>└</span>
                      <span style={{fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 9, color: isActive ? "var(--accent)" : "var(--ink-300)"}}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span style={{fontWeight: 400, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{it.label}</span>
                    </a>
                  </li>
                );
              }
              // h2
              const hasChildren = TOC_ITEMS[i + 1] && TOC_ITEMS[i + 1].level === 3;
              const isOpen = expanded[it.id];
              return (
                <li key={it.id}>
                  <a onClick={() => { if (hasChildren) toggleSection(it.id); onJump(it.id); }} style={{
                    display: "grid", gridTemplateColumns: "18px 1fr 14px",
                    alignItems: "center", gap: 6,
                    padding: "6px 8px",
                    borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                    background: isActive ? "var(--cream-50)" : "transparent",
                    cursor: "pointer", textDecoration: "none",
                    fontSize: 12, color: isActive ? "var(--ink-900)" : "var(--ink-500)",
                    transition: "background .15s",
                  }}>
                    <span style={{fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 9, color: isActive ? "var(--accent)" : "var(--ink-300)"}}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span style={{fontWeight: 500, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{it.label}</span>
                    {hasChildren && (
                      <i className={"fa-solid " + (isOpen ? "fa-chevron-up" : "fa-chevron-down")} style={{fontSize: 8, color: "var(--ink-400)"}}></i>
                    )}
                  </a>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </aside>
  );
}

// ---------- KKday branded link ----------
function KKdayLink({ href = "https://www.kkday.com", children }) {
  const [hover, setHover] = React.useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        verticalAlign: "middle",
        color: "#1ab6c1",
        textDecoration: "underline",
        textDecorationColor: hover ? "#1ab6c1" : "rgba(26,182,193,0.35)",
        textUnderlineOffset: 2,
        fontWeight: 500,
        transition: "text-decoration-color .15s",
      }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 18, height: 18, borderRadius: 4,
        background: hover ? "#1ab6c1" : "rgba(26,182,193,0.12)",
        transition: "background .15s", flexShrink: 0,
      }}>
        <i className="fa-solid fa-ticket" style={{
          fontSize: 9,
          color: hover ? "#fff" : "#1ab6c1",
          transform: "rotate(-45deg)",
          transition: "color .15s",
        }}></i>
      </span>
      {children}
    </a>
  );
}

// ---------- Hash heading — hover reveals # anchor ----------
function HashHeading({ id, tag: Tag = "h2", style, children }) {
  const [hover, setHover] = useStateA(false);
  return (
    <Tag id={id}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{position: "relative", ...style}}>
      {children}
      <a href={"#" + id} style={{
        position: "absolute", left: -28, top: "50%", transform: "translateY(-50%)",
        opacity: hover ? 1 : 0, transition: "opacity .15s",
        fontFamily: "var(--font-en)", fontWeight: 400, fontStyle: "normal",
        fontSize: 16, color: "var(--ink-300)", textDecoration: "none",
        paddingRight: 8, userSelect: "none",
      }}>#</a>
    </Tag>
  );
}

// ---------- A: Back to Top — REMOVED (kept for reference, not rendered)
// (component deleted — using sticky TOC + browser scroll affordances instead)

// ============================================
// A — POST (single)
// ============================================
function PostA({ posts, onNav, page }) {
  const [drawer, setDrawer] = useStateA(false);
  const [active, setActive] = useStateA("toc-1");
  const topRef = React.useRef(null);
  const onJump = (id) => { setActive(id); scrollToId(id); };
  const p = posts[0];
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarA page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerA open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      <article>
        {/* Hero */}
        <header style={{padding:"80px 56px 56px", maxWidth:920, margin:"0 auto", textAlign:"center"}}>
          <div className="eyebrow" style={{marginBottom:24}}>{p.category} · Essay</div>
          <h1 id="post-top" style={{fontFamily:"var(--font-display)", fontSize:64, lineHeight:1.05, fontWeight:500, margin:"0 0 28px", letterSpacing:"-0.025em"}}>
            {p.title}
          </h1>
          <p style={{fontSize:21, lineHeight:1.55, color:"var(--ink-500)", margin:"0 0 32px", fontFamily:"var(--font-display)", fontWeight:300}}>
            {p.excerpt}
          </p>
          <div style={{display:"flex", gap:18, alignItems:"center", justifyContent:"center", fontSize:13, color:"var(--ink-500)", flexWrap:"wrap"}}>
            <img src="https://avatars.githubusercontent.com/u/7194691?v=4" style={{width:32, height:32, borderRadius:999}}/>
            <span>by Harry Li</span>
            <span style={{width:3, height:3, background:"var(--ink-300)", borderRadius:999}}></span>
            <i className="fa-regular fa-calendar" style={{fontSize:12}}></i>
            <span>{p.date}</span>
            <span style={{width:3, height:3, background:"var(--ink-300)", borderRadius:999}}></span>
            <i className="fa-regular fa-clock" style={{fontSize:12}}></i>
            <span>{p.readTime} read</span>
          </div>
        </header>

        <div style={{padding:"0 56px"}}>
          <img src={p.cover} style={{width:"100%", maxHeight:520, objectFit:"cover", borderRadius:2}}/>
          <div style={{textAlign:"center", fontSize:11, color:"var(--ink-400)", marginTop:10, letterSpacing:"0.05em"}}>
            上架前一晚的辦公室 · Photographed by Harry, 2025
          </div>
        </div>

        {/* Table of Contents — top of article (always shown) */}
        <TableOfContentsA topRef={topRef} active={active} onJump={onJump} />

        {/* Body wrapper */}
        <div style={{
          maxWidth: 1080,
          margin: "40px auto 0",
          padding: "0 56px",
        }}>
          {/* Body — centred */}
          <div style={{maxWidth: 680, margin: "0 auto", fontFamily:"var(--font-display)", fontSize:19, lineHeight:1.8, color:"var(--ink-700)"}}>
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
          <HashHeading id="toc-1" tag="h2" style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:500, marginTop:48, marginBottom:16, letterSpacing:"-0.01em", scrollMarginTop:32}}>
            一、從一行程式碼開始
          </HashHeading>
          <p>
            最初的版本只有一個畫面、一個按鈕。但就是這個簡陋的原型，幫我打開了第一扇門。我學會的第一件事是：完成比完美更重要。
          </p>
          <blockquote style={{
            borderLeft:"3px solid var(--accent)", paddingLeft:24, margin:"36px 0",
            fontSize:24, color:"var(--ink-700)", lineHeight:1.5
          }}>
            「Done is better than perfect.」這句被引用到爛的話，當你真的做過一次，才會懂它的份量。
          </blockquote>
          <p>
            接下來的三個月，我每天下班後寫兩小時，週末再寫八小時。不是因為熱情多麼澎湃，而是因為害怕——害怕自己又是個只會說不會做的人。
            旅行途中靠著 <KKdayLink href="https://www.kkday.com">KKday</KKdayLink> 訂了幾個當地體驗行程，
            讓我在釐清思路的同時也充了電。
          </p>
          <HashHeading id="toc-2" tag="h2" style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:500, marginTop:48, marginBottom:16, letterSpacing:"-0.01em", scrollMarginTop:32}}>
            二、上架前夜
          </HashHeading>
          <p>
            送審被拒了兩次。第一次是隱私權聲明寫得不清楚，第二次是 IPv6 環境下無法連線。每一次被拒都讓人沮喪，但也每一次都學到了一些書上不會教的事。
          </p>
          <HashHeading id="toc-2-1" tag="h3" style={{fontFamily:"var(--font-display)", fontSize:24, fontWeight:500, marginTop:36, marginBottom:14, color:"var(--ink-700)", scrollMarginTop:32}}>
            隱私權聲明的細節
          </HashHeading>
          <p>
            Apple 對隱私權聲明的要求非常具體 — 不是寫一份「我們重視你的隱私」就能過關，而是要逐條對應到 App 蒐集的資料類型。
          </p>
          <HashHeading id="toc-2-2" tag="h3" style={{fontFamily:"var(--font-display)", fontSize:24, fontWeight:500, marginTop:36, marginBottom:14, color:"var(--ink-700)", scrollMarginTop:32}}>
            IPv6 環境下的網路問題
          </HashHeading>
          <p>
            審核機房預設使用 IPv6-only 網路，如果後端 API 沒有支援，請求會直接 timeout。這是很多獨立開發者第一次送審被打回的常見原因。
          </p>
          <HashHeading id="toc-3" tag="h2" style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:500, marginTop:48, marginBottom:16, letterSpacing:"-0.01em", scrollMarginTop:32}}>
            三、上架之後，才是開始
          </HashHeading>
          <p>
            App 上架的那一刻，原本以為會是煙火、慶祝、放鬆。但實際發生的是：第二天早上 8 點，我已經在處理第一個 crash report 了。
          </p>
          <HashHeading id="toc-4" tag="h2" style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:500, marginTop:48, marginBottom:16, letterSpacing:"-0.01em", scrollMarginTop:32}}>
            後記：寫給三年前的自己
          </HashHeading>
          <p>
            如果回到三年前，我會跟自己說：別把第一個版本想得太完美。你寫得出來最重要，使用者會告訴你下一步要做什麼。
          </p>
        </div>

          {/* /Body */}
        </div>
        {/* /Body wrapper */}

        <div style={{height: 64}}></div>

        {/* Tags row */}
        <div style={{padding:"0 56px", maxWidth:680, margin:"0 auto 40px", borderTop:"1px solid var(--rule)", paddingTop:32}}>
          <div className="eyebrow" style={{marginBottom:14, color:"var(--ink-500)"}}>Filed under</div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            {p.tags.map(t => <span key={t} className="chip">#{t}</span>)}
          </div>
        </div>

        {/* Article footer — four actions */}
        <div style={{maxWidth:680, margin:"0 auto 64px", padding:"0 56px"}}>
          <div style={{borderTop:"1px solid var(--rule)", paddingTop:40, display:"flex", flexDirection:"column", gap:0}}>

            {/* Originally published on Medium */}
            <a style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"18px 0", borderBottom:"1px solid var(--rule-soft)",
              cursor:"pointer", textDecoration:"none",
              color:"var(--ink-700)",
            }}>
              <div style={{display:"flex", alignItems:"center", gap:14}}>
                <div style={{
                  width:36, height:36, borderRadius:999,
                  background:"var(--ink-900)", display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0,
                }}>
                  <i className="fa-brands fa-medium" style={{fontSize:16, color:"#fff"}}></i>
                </div>
                <div>
                  <div style={{fontSize:14, fontWeight:500, lineHeight:1.3}}>原文發表自 Medium</div>
                  <div style={{fontSize:12, color:"var(--ink-400)", marginTop:2}}>Originally published on Medium</div>
                </div>
              </div>
              <i className="fa-solid fa-arrow-up-right-from-square" style={{fontSize:13, color:"var(--ink-300)"}}></i>
            </a>

            {/* Improve this page */}
            <a style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"18px 0", borderBottom:"1px solid var(--rule-soft)",
              cursor:"pointer", textDecoration:"none",
              color:"var(--ink-700)",
            }}>
              <div style={{display:"flex", alignItems:"center", gap:14}}>
                <div style={{
                  width:36, height:36, borderRadius:999,
                  border:"1px solid var(--rule)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0,
                }}>
                  <i className="fa-brands fa-github" style={{fontSize:16, color:"var(--ink-900)"}}></i>
                </div>
                <div>
                  <div style={{fontSize:14, fontWeight:500, lineHeight:1.3}}>Improve this page</div>
                  <div style={{fontSize:12, color:"var(--ink-400)", marginTop:2}}>在 GitHub 上修改或補充這篇文章</div>
                </div>
              </div>
              <i className="fa-solid fa-arrow-up-right-from-square" style={{fontSize:13, color:"var(--ink-300)"}}></i>
            </a>

            {/* Donate */}
            <a style={{
              display:"flex", alignItems:"center", justifyContent:"space-between",
              padding:"18px 0", borderBottom:"1px solid var(--rule-soft)",
              cursor:"pointer", textDecoration:"none",
              color:"var(--ink-700)",
            }}>
              <div style={{display:"flex", alignItems:"center", gap:14}}>
                <div style={{
                  width:36, height:36, borderRadius:999,
                  background:"rgba(177,78,44,0.1)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0,
                }}>
                  <i className="fa-solid fa-mug-saucer" style={{fontSize:14, color:"var(--accent)"}}></i>
                </div>
                <div>
                  <div style={{fontSize:14, fontWeight:500, lineHeight:1.3}}>請我喝杯咖啡</div>
                  <div style={{fontSize:12, color:"var(--ink-400)", marginTop:2}}>獨立寫作，無付費牆，無業配</div>
                </div>
              </div>
              <i className="fa-solid fa-arrow-right" style={{fontSize:13, color:"var(--ink-300)"}}></i>
            </a>

            {/* Copy link & share */}
            <div style={{padding:"18px 0", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div style={{display:"flex", alignItems:"center", gap:14}}>
                <div style={{
                  width:36, height:36, borderRadius:999,
                  border:"1px solid var(--rule)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  flexShrink:0,
                }}>
                  <i className="fa-solid fa-share-nodes" style={{fontSize:14, color:"var(--ink-700)"}}></i>
                </div>
                <div>
                  <div style={{fontSize:14, fontWeight:500, lineHeight:1.3}}>分享這篇文章</div>
                  <div style={{fontSize:12, color:"var(--ink-400)", marginTop:2}}>Copy link · 分享到社群</div>
                </div>
              </div>
              <div style={{display:"flex", gap:8}}>
                {[
                  {icon:"fa-solid fa-link", title:"Copy link"},
                  {icon:"fa-brands fa-x-twitter", title:"X / Twitter"},
                  {icon:"fa-brands fa-facebook-f", title:"Facebook"},
                  {icon:"fa-brands fa-line", title:"LINE"},
                  {icon:"fa-brands fa-threads", title:"Threads"},
                ].map((s,i) => (
                  <button key={i} title={s.title} style={{
                    width:32, height:32, borderRadius:999,
                    border:"1px solid var(--rule)", background:"transparent",
                    color:"var(--ink-500)", cursor:"pointer", fontSize:13,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <i className={s.icon}></i>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Author card */}
        <div style={{maxWidth:680, margin:"0 auto 40px", padding:"0 56px"}}>
          <div style={{background:"var(--cream-50)", padding:"40px", display:"flex", gap:24, alignItems:"center", borderRadius:2}}>
            <img src="https://avatars.githubusercontent.com/u/7194691?v=4" style={{width:80, height:80, borderRadius:999}}/>
            <div>
              <div className="eyebrow" style={{marginBottom:6}}>Author</div>
              <h4 style={{fontFamily:"var(--font-display)", fontSize:24, fontWeight:600, margin:"0 0 6px"}}>Harry Li · ZhgChgLi</h4>
              <p style={{fontSize:14, color:"var(--ink-500)", lineHeight:1.6, margin:0}}>
                iOS / web developer in Taipei. Open-source maintainer. Sometimes writes about places, things, and the slow craft of making software.
              </p>
            </div>
          </div>
        </div>

        {/* Disqus comment section */}
        <div style={{maxWidth:680, margin:"0 auto 80px", padding:"0 56px"}}>
          <div style={{borderTop:"1px solid var(--rule)", paddingTop:40}}>
            <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32}}>
              <h3 style={{fontFamily:"var(--font-display)", fontSize:24, fontWeight:500, margin:0, letterSpacing:"-0.01em"}}>
                留言 <i style={{fontWeight:300, color:"var(--ink-400)"}}>· Comments</i>
              </h3>
              <img src="https://c.disquscdn.com/next/current/marketing/assets/img/brand/disqus-logo-blue.svg"
                style={{height:20, opacity:0.5}} alt="Disqus" />
            </div>
            <div id="disqus_thread">
              {/* Disqus will inject here; show a styled placeholder in prototype */}
              <div style={{
                padding:"48px 0", textAlign:"center",
                color:"var(--ink-400)", fontSize:14, lineHeight:1.8,
                border:"1px dashed var(--rule)", borderRadius:2,
              }}>
                <i className="fa-regular fa-comment-dots" style={{fontSize:28, display:"block", marginBottom:12, opacity:0.4}}></i>
                <div style={{fontWeight:500, color:"var(--ink-700)", marginBottom:4}}>Disqus 留言</div>
                <div style={{fontSize:13}}>實際部署後，Disqus 留言框會顯示在此。</div>
              </div>
            </div>
          </div>
        </div>

        <script dangerouslySetInnerHTML={{__html: `
          var disqus_config = function () {
            this.page.url = window.location.href;
            this.page.identifier = 'post-slug';
          };
          (function() {
            var d = document, s = d.createElement('script');
            s.src = 'https://zhgchgli.disqus.com/embed.js';
            s.setAttribute('data-timestamp', +new Date());
            (d.head || d.body).appendChild(s);
          })();
        `}} />

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

      <section style={{padding:"80px 56px 40px", borderBottom:"1px solid var(--rule)"}}>
        <div className="eyebrow" style={{marginBottom:18}}>Browse by · Category</div>
        <h1 style={{fontFamily:"var(--font-display)", fontSize:80, lineHeight:1, fontWeight:400, margin:0, letterSpacing:"-0.025em"}}>
          Eight <i style={{fontWeight:300, color:"var(--ink-500)"}}>topics.</i>
        </h1>
      </section>

      {/* Horizontal category chips — quick filter */}
      <section style={{padding:"32px 56px 24px", borderBottom:"1px solid var(--rule-soft)", display:"flex", flexWrap:"wrap", gap:8, alignItems:"center"}}>
        <span style={{fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--ink-400)", marginRight:8}}>Filter</span>
        <button className="btn-pill" style={{padding:"6px 14px", fontSize:12}}>iOS · 42</button>
        {categories.filter(c=>c.name!=="iOS").map(c => (
          <button key={c.name} className="btn-ghost" style={{padding:"6px 14px", fontSize:12}}>{c.name} · {c.count}</button>
        ))}
      </section>

      {/* Selected category header */}
      <section style={{padding:"40px 56px 0"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:8}}>
          <div>
            <div className="eyebrow" style={{marginBottom:10, color:"var(--accent)"}}>Currently in · Category 01 / 08</div>
            <h2 style={{fontFamily:"var(--font-display)", fontSize:56, fontWeight:500, margin:0, letterSpacing:"-0.02em"}}>
              <i style={{fontWeight:300, color:"var(--ink-500)"}}>#</i>iOS
            </h2>
          </div>
          <div style={{textAlign:"right", fontSize:13, color:"var(--ink-500)", lineHeight:1.6}}>
            42 essays<br/>
            <span style={{color:"var(--ink-400)"}}>since Jul 2018</span>
          </div>
        </div>
        <p style={{fontSize:15, color:"var(--ink-500)", lineHeight:1.65, maxWidth:620, marginTop:14}}>
          Swift, SwiftUI, and the small joys of Apple platforms — from concurrency to interview prep.
        </p>
      </section>

      {/* Two-column dense article list */}
      <section style={{padding:"32px 56px 80px", display:"grid", gridTemplateColumns:"1fr 1fr", columnGap:48}}>
        {posts.concat(posts).slice(0, 12).map((p, i) => (
          <article key={i} onClick={() => onNav?.("post")}
            style={{
              display:"grid", gridTemplateColumns:"140px 1fr", gap:20,
              alignItems:"flex-start", padding:"22px 0",
              borderBottom:"1px solid var(--rule-soft)", cursor:"pointer",
            }}>
            <div style={{width:140, height:96, overflow:"hidden", background:"var(--cream-100)"}}>
              <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
            </div>
            <div style={{minWidth:0}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6, gap:12}}>
                <span className="eyebrow" style={{color:"var(--ink-500)"}}>{p.category}</span>
                <span style={{fontSize:11, color:"var(--ink-400)", letterSpacing:"0.05em", whiteSpace:"nowrap"}}>{p.date} · {p.readTime}</span>
              </div>
              <h4 style={{fontFamily:"var(--font-display)", fontSize:20, lineHeight:1.25, fontWeight:500, margin:"0 0 6px", letterSpacing:"-0.01em",
                display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"}}>{p.title}</h4>
              <p style={{fontSize:13, lineHeight:1.55, color:"var(--ink-500)", margin:"0 0 8px",
                display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"}}>{p.excerpt}</p>
              <div style={{display:"flex", gap:5, flexWrap:"wrap"}}>
                {p.tags.slice(0,2).map(t => <span key={t} className="chip" style={{fontSize:10, padding:"2px 7px"}}>{t}</span>)}
              </div>
            </div>
          </article>
        ))}
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
      <section style={{padding:"32px 56px 24px", borderTop:"1px solid var(--rule)"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end"}}>
          <div>
            <div className="eyebrow" style={{marginBottom:10, color:"var(--accent)"}}>Selected tag</div>
            <h3 style={{fontFamily:"var(--font-display)", fontSize:56, fontWeight:500, margin:0, letterSpacing:"-0.02em"}}>
              <i style={{fontWeight:300, color:"var(--ink-500)"}}>#</i>Swift
            </h3>
          </div>
          <div style={{textAlign:"right", fontSize:13, color:"var(--ink-500)", lineHeight:1.6}}>
            12 essays<br/>
            <span style={{color:"var(--ink-400)"}}>last updated Sep 12</span>
          </div>
        </div>
      </section>

      {/* Two-column dense article list */}
      <section style={{padding:"24px 56px 64px", display:"grid", gridTemplateColumns:"1fr 1fr", columnGap:48}}>
        {posts.concat(posts).slice(0, 12).map((p, i) => (
          <article key={i} onClick={() => onNav?.("post")}
            style={{
              display:"grid", gridTemplateColumns:"140px 1fr", gap:20,
              alignItems:"flex-start", padding:"22px 0",
              borderBottom:"1px solid var(--rule-soft)", cursor:"pointer",
            }}>
            <div style={{width:140, height:96, overflow:"hidden", background:"var(--cream-100)"}}>
              <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
            </div>
            <div style={{minWidth:0}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6, gap:12}}>
                <span className="eyebrow" style={{color:"var(--ink-500)"}}>{p.category}</span>
                <span style={{fontSize:11, color:"var(--ink-400)", letterSpacing:"0.05em", whiteSpace:"nowrap"}}>{p.date} · {p.readTime}</span>
              </div>
              <h4 style={{fontFamily:"var(--font-display)", fontSize:20, lineHeight:1.25, fontWeight:500, margin:"0 0 6px", letterSpacing:"-0.01em",
                display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"}}>{p.title}</h4>
              <p style={{fontSize:13, lineHeight:1.55, color:"var(--ink-500)", margin:"0 0 8px",
                display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden"}}>{p.excerpt}</p>
              <div style={{display:"flex", gap:5, flexWrap:"wrap"}}>
                {p.tags.slice(0,2).map(t => <span key={t} className="chip" style={{fontSize:10, padding:"2px 7px", background: t==="Swift" ? "rgba(177, 78, 44, 0.1)" : undefined, color: t==="Swift" ? "var(--accent)" : undefined}}>{t}</span>)}
              </div>
            </div>
          </article>
        ))}
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
