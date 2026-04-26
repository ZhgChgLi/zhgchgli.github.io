/* global React */
const { useState: useStateC } = React;

/* ============================================
   DIRECTION C — "Studio" 工作室風
   結構感、頂部寬條 nav、雙欄密度、暖駝色
   ============================================ */

function TopbarC({ page, onNav, onMenu }) {
  return (
    <header style={{borderBottom:"1px solid var(--ink-900)", background:"var(--cream-50)", position:"sticky", top:0, zIndex:50}}>
      <div style={{height:44, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0 32px", borderBottom:"1px solid var(--rule)", fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--ink-700)"}}>
        <span>Vol. 8 · No. 087</span>
        <span>Field Notes from Taipei · Est. 2018</span>
        <span>正體中文 / EN / 简 / 日</span>
      </div>
      <div style={{height:96, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 32px"}}>
        <a onClick={() => onNav?.("home")} style={{cursor:"pointer", fontFamily:"var(--font-display)", fontSize:42, fontWeight:500, letterSpacing:"-0.025em", lineHeight:1}}>
          ZhgChgLi<span style={{color:"var(--accent)"}}>.</span>
        </a>
        <nav style={{display:"flex", gap:36, fontSize:13, color:"var(--ink-700)", letterSpacing:"0.05em", textTransform:"uppercase"}}>
          {[["home","Home"],["list","Writing"],["category","Topics"],["tag","Tags"],["archive","Archive"]].map(([id,l])=>(
            <a key={id} onClick={()=>onNav?.(id)} style={{cursor:"pointer", borderBottom: page===id?"2px solid var(--accent)":"none", paddingBottom:4, color: page===id?"var(--ink-900)":undefined, fontWeight: page===id?600:500}}>{l}</a>
          ))}
        </nav>
        <div style={{display:"flex", alignItems:"center", gap:16}}>
          <span style={{fontSize:13, color:"var(--ink-500)"}}>⌘ Search</span>
          <button onClick={onMenu} style={{padding:"8px 16px", border:"1px solid var(--ink-900)", background:"transparent", fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer", fontFamily:"inherit"}}>Menu</button>
        </div>
      </div>
    </header>
  );
}

function DrawerC({ open, onClose, page, onNav }) {
  const links = [["home","首頁","01"],["list","文章","02"],["category","分類","03"],["tag","標籤","04"],["archive","歸檔","05"],["post","關於","06"]];
  return (
    <>
      <div className={"drawer-overlay " + (open ? "open" : "")} onClick={onClose}></div>
      <aside className={"drawer " + (open ? "open" : "")} style={{background:"var(--ink-900)", color:"var(--cream-50)", width:480, padding:0, borderLeft:"none"}}>
        <div style={{padding:"32px 40px", borderBottom:"1px solid rgba(255,255,255,0.1)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span style={{fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.5)"}}>Index</span>
          <button onClick={onClose} style={{background:"none", border:"1px solid rgba(255,255,255,0.3)", color:"var(--cream-50)", width:36, height:36, cursor:"pointer", fontSize:16, fontFamily:"inherit"}}>×</button>
        </div>
        <nav style={{padding:"24px 40px"}}>
          {links.map(([id,zh,n]) => (
            <a key={id} onClick={()=>{onNav?.(id); onClose();}} style={{display:"flex", justifyContent:"space-between", alignItems:"center", padding:"24px 0", borderBottom:"1px solid rgba(255,255,255,0.08)", cursor:"pointer"}}>
              <span style={{display:"flex", gap:24, alignItems:"baseline"}}>
                <span style={{fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:13, color:"rgba(255,255,255,0.4)"}}>{n}</span>
                <span style={{fontFamily:"var(--font-display)", fontSize:34, fontWeight:300, color: page===id ? "var(--accent-soft)" : "var(--cream-50)"}}>{zh}</span>
              </span>
              <span style={{fontSize:18, color:"rgba(255,255,255,0.4)"}}>→</span>
            </a>
          ))}
        </nav>
        <div style={{padding:"32px 40px", marginTop:"auto", fontSize:12, color:"rgba(255,255,255,0.5)", letterSpacing:"0.1em", textTransform:"uppercase"}}>
          Harry Li · Taipei 🇹🇼<br/>
          <span style={{display:"flex", gap:16, marginTop:14, textTransform:"none", letterSpacing:"normal", fontSize:13, color:"rgba(255,255,255,0.7)"}}>
            <a>Medium ↗</a><a>GitHub ↗</a><a>LinkedIn ↗</a>
          </span>
        </div>
      </aside>
    </>
  );
}

function FooterC() {
  return (
    <footer style={{background:"var(--ink-900)", color:"var(--cream-100)", padding:"72px 32px 32px"}}>
      <div style={{display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:48, marginBottom:64}}>
        <div>
          <div style={{fontFamily:"var(--font-display)", fontSize:48, fontWeight:400, letterSpacing:"-0.025em", marginBottom:16}}>
            ZhgChgLi<span style={{color:"var(--accent-soft)"}}>.</span>
          </div>
          <p style={{fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.6, maxWidth:380, margin:0}}>
            iOS / web developer & writer based in Taipei. Open-source in the morning, essays at night, ramen at midnight.
          </p>
        </div>
        <div>
          <h5 style={{fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", margin:"0 0 16px"}}>Read</h5>
          <a style={{display:"block", padding:"4px 0", color:"rgba(255,255,255,0.8)"}}>iOS</a>
          <a style={{display:"block", padding:"4px 0", color:"rgba(255,255,255,0.8)"}}>Open Source</a>
          <a style={{display:"block", padding:"4px 0", color:"rgba(255,255,255,0.8)"}}>Career</a>
          <a style={{display:"block", padding:"4px 0", color:"rgba(255,255,255,0.8)"}}>隨筆</a>
        </div>
        <div>
          <h5 style={{fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", margin:"0 0 16px"}}>Connect</h5>
          <a style={{display:"block", padding:"4px 0", color:"rgba(255,255,255,0.8)"}}>Medium</a>
          <a style={{display:"block", padding:"4px 0", color:"rgba(255,255,255,0.8)"}}>GitHub</a>
          <a style={{display:"block", padding:"4px 0", color:"rgba(255,255,255,0.8)"}}>LinkedIn</a>
          <a style={{display:"block", padding:"4px 0", color:"rgba(255,255,255,0.8)"}}>Email</a>
        </div>
        <div>
          <h5 style={{fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(255,255,255,0.5)", margin:"0 0 16px"}}>Subscribe</h5>
          <p style={{fontSize:12, color:"rgba(255,255,255,0.6)", marginBottom:12}}>Monthly notes — no fluff.</p>
          <div style={{display:"flex"}}>
            <input placeholder="email" style={{flex:1, padding:"10px 12px", background:"rgba(255,255,255,0.08)", border:"none", color:"var(--cream-50)", fontSize:13, fontFamily:"inherit"}}/>
            <button style={{padding:"10px 16px", background:"var(--accent)", color:"var(--cream-50)", border:"none", fontSize:12, cursor:"pointer", fontFamily:"inherit"}}>→</button>
          </div>
        </div>
      </div>
      <div style={{paddingTop:32, borderTop:"1px solid rgba(255,255,255,0.1)", display:"flex", justifyContent:"space-between", fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:"rgba(255,255,255,0.4)"}}>
        <span>© 2018–2025 Harry Li</span>
        <span>Built with Jekyll · Hosted on GitHub Pages</span>
        <span>RSS · Sitemap · Colophon</span>
      </div>
    </footer>
  );
}

function HomeC({ posts, onNav, page }) {
  const [drawer, setDrawer] = useStateC(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%", background:"var(--cream-50)"}}>
      <TopbarC page={page} onNav={onNav} onMenu={()=>setDrawer(true)} />
      <DrawerC open={drawer} onClose={()=>setDrawer(false)} page={page} onNav={onNav} />

      {/* Editorial hero — split */}
      <section style={{padding:"56px 32px", borderBottom:"1px solid var(--ink-900)"}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:48, alignItems:"end"}}>
          <div>
            <div className="eyebrow" style={{marginBottom:20}}>Currently reading · iOS Engineering</div>
            <h1 style={{fontFamily:"var(--font-display)", fontSize:88, fontWeight:400, lineHeight:0.98, letterSpacing:"-0.03em", margin:"0 0 28px"}}>
              {posts[0].title.split("—")[0]}<i style={{fontWeight:300, color:"var(--ink-500)", display:"block"}}>— {posts[0].title.split("—")[1]?.trim() || "a memoir"}</i>
            </h1>
            <p style={{fontSize:18, color:"var(--ink-500)", lineHeight:1.6, margin:"0 0 28px", maxWidth:520}}>{posts[0].excerpt}</p>
            <div style={{display:"flex", gap:16, alignItems:"center", fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-500)"}}>
              <span>{posts[0].date}</span><span>·</span><span>{posts[0].readTime}</span><span>·</span><span>{posts[0].category}</span>
            </div>
            <a className="btn-pill" onClick={()=>onNav?.("post")} style={{cursor:"pointer", marginTop:24}}>Read full essay →</a>
          </div>
          <div style={{position:"relative"}}>
            <img src={posts[0].cover} style={{width:"100%", aspectRatio:"4/5", objectFit:"cover"}}/>
            <div style={{position:"absolute", bottom:16, left:16, padding:"6px 12px", background:"var(--paper)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase"}}>Cover · No. 087</div>
          </div>
        </div>
      </section>

      {/* Marquee strip */}
      <div style={{padding:"16px 32px", borderBottom:"1px solid var(--ink-900)", background:"var(--ink-900)", color:"var(--cream-50)", fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", display:"flex", gap:48, overflow:"hidden"}}>
        <span>★ New essays every other Wednesday</span>
        <span>★ Open source maintainer</span>
        <span>★ 1,057 followers on Medium</span>
        <span>★ 087 essays since 2018</span>
        <span>★ Ramen connoisseur</span>
      </div>

      {/* Section header */}
      <section style={{padding:"64px 32px 24px", display:"grid", gridTemplateColumns:"160px 1fr", gap:48, alignItems:"baseline", borderBottom:"1px solid var(--rule)"}}>
        <div className="eyebrow">§ 02 · Recent</div>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
          <h2 style={{fontFamily:"var(--font-display)", fontSize:48, fontWeight:400, margin:0, letterSpacing:"-0.02em"}}>
            Latest <i style={{fontWeight:300, color:"var(--ink-500)"}}>writing.</i>
          </h2>
          <a onClick={()=>onNav?.("list")} style={{fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-500)", cursor:"pointer"}}>All 087 essays →</a>
        </div>
      </section>

      {/* Cards */}
      <section style={{padding:"48px 32px 80px"}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:0}}>
          {posts.slice(1).map((p, i) => (
            <article key={i}
              onClick={()=>onNav?.("post")}
              style={{cursor:"pointer", padding:"32px", borderRight: i%2===0?"1px solid var(--rule)":"none", borderBottom:"1px solid var(--rule)"}}>
              <div style={{display:"grid", gridTemplateColumns:"1fr", gap:20}}>
                <div style={{aspectRatio:"5/3", overflow:"hidden", background:"var(--cream-100)"}}>
                  <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
                </div>
                <div>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:12, fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--ink-500)"}}>
                    <span>{p.category}</span>
                    <span>{String(i+2).padStart(3,"0")}</span>
                  </div>
                  <h4 style={{fontFamily:"var(--font-display)", fontSize:30, fontWeight:500, lineHeight:1.15, letterSpacing:"-0.015em", margin:"0 0 12px"}}>
                    {p.title}
                  </h4>
                  <p style={{fontSize:15, lineHeight:1.65, color:"var(--ink-500)", margin:"0 0 16px"}}>{p.excerpt}</p>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <div style={{display:"flex", gap:6}}>
                      {p.tags.slice(0,2).map(t => <span key={t} className="chip">{t}</span>)}
                    </div>
                    <span style={{fontSize:12, color:"var(--ink-500)"}}>{p.date} · {p.readTime}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Topic strip */}
      <section style={{padding:"48px 32px 80px", borderTop:"1px solid var(--ink-900)", background:"var(--paper)"}}>
        <div className="eyebrow" style={{marginBottom:18}}>§ 03 · Browse by topic</div>
        <div style={{display:"flex", gap:16, flexWrap:"wrap"}}>
          {["iOS","Open Source","DevOps","隨筆","旅行","Career","Productivity","Web"].map((c,i)=>(
            <a key={c} style={{padding:"14px 22px", border:"1px solid var(--ink-900)", fontFamily:"var(--font-display)", fontSize:24, fontWeight:400, fontStyle: i%2 ? "italic" : "normal", cursor:"pointer", background: i===0?"var(--ink-900)":"transparent", color: i===0?"var(--cream-50)":"var(--ink-900)"}}>{c}</a>
          ))}
        </div>
      </section>

      <FooterC />
    </div>
  );
}

function PostListC({ posts, onNav, page }) {
  const [drawer, setDrawer] = useStateC(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%", background:"var(--cream-50)"}}>
      <TopbarC page={page} onNav={onNav} onMenu={()=>setDrawer(true)} />
      <DrawerC open={drawer} onClose={()=>setDrawer(false)} page={page} onNav={onNav} />

      <section style={{padding:"72px 32px 48px", borderBottom:"1px solid var(--ink-900)"}}>
        <div style={{display:"grid", gridTemplateColumns:"160px 1fr 200px", gap:48, alignItems:"baseline"}}>
          <div className="eyebrow">§ Index</div>
          <h1 style={{fontFamily:"var(--font-display)", fontSize:84, fontWeight:400, margin:0, letterSpacing:"-0.025em", lineHeight:1}}>
            Every <i style={{fontWeight:300, color:"var(--ink-500)"}}>essay</i>, indexed.
          </h1>
          <div style={{textAlign:"right", fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-500)"}}>087 entries<br/>since 2018</div>
        </div>
        <div style={{display:"flex", gap:8, marginTop:32}}>
          <button className="btn-pill">All</button>
          <button className="btn-ghost">iOS · 42</button>
          <button className="btn-ghost">Open Source · 18</button>
          <button className="btn-ghost">隨筆 · 26</button>
          <button className="btn-ghost">旅行 · 14</button>
          <button className="btn-ghost" style={{marginLeft:"auto"}}>Newest ↓</button>
        </div>
      </section>

      <section style={{padding:0}}>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr"}}>
          {posts.concat(posts).map((p, i) => (
            <article key={i}
              onClick={()=>onNav?.("post")}
              style={{cursor:"pointer", padding:"32px", borderRight: i%2===0?"1px solid var(--rule)":"none", borderBottom:"1px solid var(--rule)"}}>
              <div style={{display:"flex", gap:20}}>
                <img src={p.cover} style={{width:160, height:160, objectFit:"cover", flexShrink:0}}/>
                <div style={{flex:1}}>
                  <div style={{display:"flex", justifyContent:"space-between", fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--ink-500)", marginBottom:10}}>
                    <span>{p.category}</span>
                    <span>{String(i+1).padStart(3,"0")}</span>
                  </div>
                  <h4 style={{fontFamily:"var(--font-display)", fontSize:22, fontWeight:500, lineHeight:1.2, margin:"0 0 10px"}}>{p.title}</h4>
                  <p style={{fontSize:13.5, lineHeight:1.6, color:"var(--ink-500)", margin:"0 0 12px"}}>{p.excerpt}</p>
                  <span style={{fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-400)"}}>{p.date} · {p.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div style={{padding:"56px 32px", display:"flex", justifyContent:"space-between", alignItems:"center", borderTop:"1px solid var(--ink-900)", background:"var(--paper)"}}>
        <span style={{fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-500)"}}>Page 01 of 09</span>
        <div style={{display:"flex", gap:8}}>
          <button className="btn-ghost">‹ Prev</button>
          <button className="btn-pill">Next ›</button>
        </div>
      </div>

      <FooterC />
    </div>
  );
}

function PostC({ posts, onNav, page }) {
  const [drawer, setDrawer] = useStateC(false);
  const p = posts[0];
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%", background:"var(--cream-50)"}}>
      <TopbarC page={page} onNav={onNav} onMenu={()=>setDrawer(true)} />
      <DrawerC open={drawer} onClose={()=>setDrawer(false)} page={page} onNav={onNav} />

      <article>
        <header style={{padding:"56px 32px 48px", borderBottom:"1px solid var(--ink-900)", display:"grid", gridTemplateColumns:"160px 1fr 200px", gap:48}}>
          <div>
            <div className="eyebrow">§ Essay 087</div>
            <div style={{fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:14, color:"var(--ink-500)", marginTop:14}}>filed under<br/>{p.category}</div>
          </div>
          <div>
            <h1 style={{fontFamily:"var(--font-display)", fontSize:64, fontWeight:500, lineHeight:1.05, letterSpacing:"-0.025em", margin:"0 0 24px"}}>{p.title}</h1>
            <p style={{fontSize:20, lineHeight:1.55, color:"var(--ink-500)", fontFamily:"var(--font-display)", fontStyle:"italic", fontWeight:300, margin:0}}>{p.excerpt}</p>
          </div>
          <div style={{textAlign:"right", fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-500)", lineHeight:1.8}}>
            By Harry Li<br/>
            {p.date}<br/>
            {p.readTime} read
          </div>
        </header>

        <div style={{padding:"0", borderBottom:"1px solid var(--rule)"}}>
          <img src={p.cover} style={{width:"100%", maxHeight:560, objectFit:"cover"}}/>
        </div>

        <div style={{display:"grid", gridTemplateColumns:"160px 1fr 200px", gap:48, padding:"56px 32px", maxWidth:1280, margin:"0 auto"}}>
          <aside>
            <div className="eyebrow" style={{marginBottom:14}}>Contents</div>
            <ol style={{listStyle:"none", padding:0, margin:0, fontSize:13, lineHeight:2, color:"var(--ink-700)"}}>
              <li style={{borderLeft:"2px solid var(--accent)", paddingLeft:10, color:"var(--accent)"}}>一、從一行程式碼開始</li>
              <li style={{paddingLeft:12}}>二、上架前夜</li>
              <li style={{paddingLeft:12}}>三、第一個一星評價</li>
              <li style={{paddingLeft:12}}>四、學會放手</li>
            </ol>
          </aside>
          <div style={{fontFamily:"var(--font-display)", fontSize:19, lineHeight:1.85, color:"var(--ink-700)", maxWidth:680}}>
            <p style={{marginTop:0}}>
              <span style={{float:"left", fontFamily:"var(--font-display)", fontSize:84, lineHeight:0.85, fontWeight:500, marginRight:14, marginTop:6, color:"var(--accent)"}}>三</span>
              年前的這個時候，我還在公司茶水間反覆練習怎麼跟主管說「我想做一個自己的 App」。三年後的今天，那個 App 上架了，下載量破萬。
            </p>
            <p>這篇文章想記錄的不是教學，而是過程裡那些細微的、難以對人說的轉折——關於團隊溝通、關於自我懷疑、關於凌晨三點看著紅字想放棄的時刻。</p>
            <h2 style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:500, marginTop:48, marginBottom:16}}>一、從一行程式碼開始</h2>
            <p>最初的版本只有一個畫面、一個按鈕。但就是這個簡陋的原型，幫我打開了第一扇門。</p>
            <blockquote style={{borderLeft:"3px solid var(--accent)", paddingLeft:24, margin:"36px 0", fontStyle:"italic", fontSize:24, color:"var(--ink-700)", lineHeight:1.4}}>
              「Done is better than perfect.」
            </blockquote>
            <p>接下來的三個月，我每天下班後寫兩小時，週末再寫八小時。</p>
          </div>
          <aside style={{position:"sticky", top:160, alignSelf:"start"}}>
            <div className="eyebrow" style={{marginBottom:14}}>Tools</div>
            <div style={{fontSize:12, color:"var(--ink-500)", lineHeight:2}}>
              <div style={{display:"flex", justifyContent:"space-between", borderBottom:"1px solid var(--rule-soft)", padding:"4px 0"}}><span>Share</span><span>↗</span></div>
              <div style={{display:"flex", justifyContent:"space-between", borderBottom:"1px solid var(--rule-soft)", padding:"4px 0"}}><span>Copy link</span><span>↗</span></div>
              <div style={{display:"flex", justifyContent:"space-between", borderBottom:"1px solid var(--rule-soft)", padding:"4px 0"}}><span>Print</span><span>↗</span></div>
              <div style={{display:"flex", justifyContent:"space-between", padding:"4px 0"}}><span>Translate</span><span>↗</span></div>
            </div>
            <div className="eyebrow" style={{marginTop:32, marginBottom:14}}>Tags</div>
            <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
              {p.tags.map(t => <span key={t} className="chip">#{t}</span>)}
            </div>
          </aside>
        </div>

        <section style={{padding:"56px 32px 80px", borderTop:"1px solid var(--ink-900)", background:"var(--paper)"}}>
          <div className="eyebrow" style={{marginBottom:24}}>Continue reading</div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:32}}>
            {posts.slice(1,4).map((rp, i) => (
              <article key={i} style={{cursor:"pointer", borderTop:"1px solid var(--ink-900)", paddingTop:20}}>
                <img src={rp.cover} style={{width:"100%", aspectRatio:"4/3", objectFit:"cover", marginBottom:16}}/>
                <div style={{fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--ink-500)", marginBottom:8}}>{rp.category}</div>
                <h5 style={{fontFamily:"var(--font-display)", fontSize:22, fontWeight:500, lineHeight:1.2, margin:0}}>{rp.title}</h5>
              </article>
            ))}
          </div>
        </section>
      </article>

      <FooterC />
    </div>
  );
}

function CategoryC({ categories, posts, onNav, page }) {
  const [drawer, setDrawer] = useStateC(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%", background:"var(--cream-50)"}}>
      <TopbarC page={page} onNav={onNav} onMenu={()=>setDrawer(true)} />
      <DrawerC open={drawer} onClose={()=>setDrawer(false)} page={page} onNav={onNav} />

      <section style={{padding:"72px 32px 48px", borderBottom:"1px solid var(--ink-900)", display:"grid", gridTemplateColumns:"160px 1fr", gap:48, alignItems:"baseline"}}>
        <div className="eyebrow">§ Topics</div>
        <h1 style={{fontFamily:"var(--font-display)", fontSize:84, fontWeight:400, margin:0, letterSpacing:"-0.025em", lineHeight:1}}>
          Eight <i style={{fontWeight:300, color:"var(--ink-500)"}}>topics</i>, on rotation.
        </h1>
      </section>

      <section style={{padding:0, display:"grid", gridTemplateColumns:"1fr 1fr"}}>
        {categories.map((c, i) => (
          <a key={c.name} style={{padding:"40px 32px", borderRight: i%2===0 ? "1px solid var(--rule)" : "none", borderBottom:"1px solid var(--rule)", cursor:"pointer", display:"grid", gridTemplateColumns:"60px 1fr 80px", gap:24, alignItems:"baseline"}}>
            <span style={{fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:18, color:"var(--ink-300)"}}>0{i+1}</span>
            <div>
              <h3 style={{fontFamily:"var(--font-display)", fontSize:42, fontWeight:500, margin:"0 0 8px", letterSpacing:"-0.02em"}}>{c.name}</h3>
              <p style={{fontSize:13, color:"var(--ink-500)", margin:0, lineHeight:1.5}}>
                {c.name === "iOS" && "Swift, SwiftUI, and the small joys of Apple platforms."}
                {c.name === "Open Source" && "Libraries, tools, and giving back to the community."}
                {c.name === "DevOps" && "CI/CD, automation, and shipping with confidence."}
                {c.name === "隨筆" && "Slow thoughts, the kind that don't fit a tweet."}
                {c.name === "旅行" && "Field notes from quiet streets and small cafés."}
                {c.name === "Career" && "Interviews, mentorship, and the long road."}
                {c.name === "Productivity" && "Tools and systems for thinking better."}
                {c.name === "Web" && "Frontend, backend, and the boring middle."}
              </p>
            </div>
            <span style={{fontSize:12, color:"var(--ink-500)", textAlign:"right", letterSpacing:"0.1em", textTransform:"uppercase"}}>{c.count}<br/>posts</span>
          </a>
        ))}
      </section>

      <FooterC />
    </div>
  );
}

function TagC({ tags, posts, onNav, page }) {
  const [drawer, setDrawer] = useStateC(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%", background:"var(--cream-50)"}}>
      <TopbarC page={page} onNav={onNav} onMenu={()=>setDrawer(true)} />
      <DrawerC open={drawer} onClose={()=>setDrawer(false)} page={page} onNav={onNav} />

      <section style={{padding:"72px 32px 48px", borderBottom:"1px solid var(--ink-900)", display:"grid", gridTemplateColumns:"160px 1fr", gap:48, alignItems:"baseline"}}>
        <div className="eyebrow">§ Tags</div>
        <h1 style={{fontFamily:"var(--font-display)", fontSize:84, fontWeight:400, margin:0, letterSpacing:"-0.025em", lineHeight:1}}>
          The fine <i style={{fontWeight:300, color:"var(--ink-500)"}}>print.</i>
        </h1>
      </section>

      <section style={{padding:"56px 32px", borderBottom:"1px solid var(--ink-900)", display:"flex", flexWrap:"wrap", gap:0, lineHeight:1.4}}>
        {tags.map((t, i) => (
          <a key={t} style={{
            padding:"10px 18px",
            border:"1px solid var(--ink-900)",
            marginRight:-1, marginBottom:-1,
            fontFamily:"var(--font-display)",
            fontSize: [22, 16, 28, 18, 20][i%5],
            fontWeight: i%3===0 ? 500 : 400,
            fontStyle: i%4===1 ? "italic" : "normal",
            cursor:"pointer",
            background: i===0 ? "var(--ink-900)" : "transparent",
            color: i===0 ? "var(--cream-50)" : "var(--ink-900)"
          }}>
            #{t}<span style={{marginLeft:8, fontSize:11, color:i===0?"rgba(255,255,255,.5)":"var(--ink-400)", letterSpacing:"0.1em"}}>{(i*7)%24+2}</span>
          </a>
        ))}
      </section>

      <section style={{padding:"56px 32px 80px"}}>
        <div className="eyebrow" style={{marginBottom:24}}>Selected · #Swift · 12 essays</div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr"}}>
          {posts.slice(0,4).map((p,i)=>(
            <article key={i} onClick={()=>onNav?.("post")} style={{cursor:"pointer", padding:"24px 0", borderRight: i%2===0?"1px solid var(--rule)":"none", borderTop:"1px solid var(--rule)", paddingLeft: i%2===1?32:0, paddingRight: i%2===0?32:0}}>
              <div style={{display:"grid", gridTemplateColumns:"120px 1fr", gap:20}}>
                <img src={p.cover} style={{width:"100%", aspectRatio:"1/1", objectFit:"cover"}}/>
                <div>
                  <div style={{fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--ink-500)", marginBottom:8}}>{p.date}</div>
                  <h4 style={{fontFamily:"var(--font-display)", fontSize:20, fontWeight:500, lineHeight:1.25, margin:"0 0 8px"}}>{p.title}</h4>
                  <p style={{fontSize:13, color:"var(--ink-500)", lineHeight:1.5, margin:0}}>{p.excerpt}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <FooterC />
    </div>
  );
}

function ArchiveC({ archives, onNav, page }) {
  const [drawer, setDrawer] = useStateC(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%", background:"var(--cream-50)"}}>
      <TopbarC page={page} onNav={onNav} onMenu={()=>setDrawer(true)} />
      <DrawerC open={drawer} onClose={()=>setDrawer(false)} page={page} onNav={onNav} />

      <section style={{padding:"72px 32px 48px", borderBottom:"1px solid var(--ink-900)", display:"grid", gridTemplateColumns:"160px 1fr 240px", gap:48, alignItems:"baseline"}}>
        <div className="eyebrow">§ Archive</div>
        <h1 style={{fontFamily:"var(--font-display)", fontSize:84, fontWeight:400, margin:0, letterSpacing:"-0.025em", lineHeight:1}}>
          A <i style={{fontWeight:300, color:"var(--ink-500)"}}>chronology.</i>
        </h1>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-500)"}}>
          <div><b style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:500, color:"var(--ink-900)", display:"block", letterSpacing:"normal"}}>087</b>essays</div>
          <div><b style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:500, color:"var(--ink-900)", display:"block", letterSpacing:"normal"}}>342k</b>words</div>
        </div>
      </section>

      <section style={{padding:"40px 32px 80px"}}>
        {archives.map(yr => (
          <div key={yr.year} style={{display:"grid", gridTemplateColumns:"160px 1fr", gap:48, paddingTop:32, borderTop:"1px solid var(--ink-900)", marginBottom:32}}>
            <h2 style={{fontFamily:"var(--font-display)", fontSize:96, fontWeight:300, fontStyle:"italic", margin:0, letterSpacing:"-0.04em", lineHeight:1, color:"var(--ink-900)", position:"sticky", top:160, alignSelf:"start"}}>
              {yr.year}
            </h2>
            <div>
              {yr.posts.map((p, i) => (
                <a key={i} onClick={()=>onNav?.("post")} style={{display:"grid", gridTemplateColumns:"50px 80px 1fr 24px", alignItems:"baseline", gap:24, padding:"18px 0", borderBottom:"1px solid var(--rule-soft)", cursor:"pointer"}}>
                  <span style={{fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:13, color:"var(--ink-300)"}}>{String(i+1).padStart(2,"0")}</span>
                  <span style={{fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-500)"}}>{p.date}</span>
                  <span style={{fontFamily:"var(--font-display)", fontSize:20, fontWeight:400}}>{p.title}</span>
                  <span style={{color:"var(--ink-300)"}}>→</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </section>

      <FooterC />
    </div>
  );
}

window.DirectionC = { HomeC, PostListC, PostC, CategoryC, TagC, ArchiveC };
