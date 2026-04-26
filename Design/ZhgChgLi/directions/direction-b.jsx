/* global React */
const { useState: useStateB } = React;

/* ============================================
   DIRECTION B — "Quiet" 留白雜誌風
   單欄為主、超大留白、極簡 metadata、暖灰
   ============================================ */

function TopbarB({ page, onNav, onMenu }) {
  return (
    <header style={{
      height:80, display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 64px", borderBottom:"1px solid var(--rule-soft)", background:"var(--paper)",
      position:"sticky", top:0, zIndex:50
    }}>
      <a className="brand" onClick={() => onNav?.("home")} style={{cursor:"pointer", fontFamily:"var(--font-display)", fontSize:20, fontWeight:500}}>
        Z<span style={{fontStyle:"italic", fontWeight:300}}>·</span>C<span style={{fontStyle:"italic", fontWeight:300}}>·</span>L
        <span style={{fontSize:11, marginLeft:14, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--ink-500)", fontFamily:"var(--font-zh)", fontWeight:500}}>Field Notes</span>
      </a>
      <button onClick={onMenu} style={{background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:10, fontSize:13, color:"var(--ink-700)", fontFamily:"inherit"}}>
        <span style={{display:"inline-flex", flexDirection:"column", gap:3}}>
          <span style={{width:18, height:1, background:"currentColor"}}></span>
          <span style={{width:18, height:1, background:"currentColor"}}></span>
        </span>
        Menu
      </button>
    </header>
  );
}

function DrawerB({ open, onClose, page, onNav }) {
  const links = [["home","首頁","Home"],["list","文章","Writing"],["category","分類","Categories"],["tag","標籤","Tags"],["archive","歸檔","Archive"],["post","關於","About"]];
  return (
    <>
      <div className={"drawer-overlay " + (open ? "open" : "")} onClick={onClose}></div>
      <aside className={"drawer " + (open ? "open" : "")} style={{background:"var(--paper)", width:440, padding:"40px 48px"}}>
        <button className="close" onClick={onClose}>×</button>
        <div style={{marginTop:24}}>
          <div className="eyebrow" style={{color:"var(--ink-500)"}}>The Index</div>
          <nav style={{marginTop:24}}>
            {links.map(([id,zh,en],i) => (
              <a key={id} onClick={() => { onNav?.(id); onClose(); }}
                style={{display:"block", padding:"20px 0", borderBottom:"1px solid var(--rule-soft)", cursor:"pointer"}}>
                <div style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:400, letterSpacing:"-0.01em", color: page===id ? "var(--accent)" : "var(--ink-900)"}}>
                  {zh}
                </div>
                <div style={{fontSize:11, color:"var(--ink-400)", letterSpacing:"0.15em", textTransform:"uppercase", marginTop:4}}>{en}</div>
              </a>
            ))}
          </nav>
          <div style={{marginTop:32, fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--ink-400)"}}>Elsewhere</div>
          <div style={{display:"flex", gap:18, marginTop:14, fontSize:13, color:"var(--ink-700)"}}>
            <a>Medium ↗</a><a>GitHub ↗</a><a>LinkedIn ↗</a>
          </div>
        </div>
      </aside>
    </>
  );
}

function FooterB() {
  return (
    <footer style={{padding:"80px 64px 48px", borderTop:"1px solid var(--rule-soft)", background:"var(--paper)"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:48}}>
        <div style={{fontFamily:"var(--font-display)", fontSize:48, fontWeight:400, letterSpacing:"-0.02em"}}>
          Stay <i style={{fontWeight:300, color:"var(--ink-500)"}}>in touch.</i>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <input placeholder="your@email.com" style={{padding:"14px 18px", border:"1px solid var(--rule)", background:"transparent", fontSize:14, fontFamily:"inherit", width:280, borderRadius:0}}/>
          <button style={{padding:"14px 24px", background:"var(--ink-900)", color:"var(--paper)", border:"none", fontSize:13, cursor:"pointer", borderRadius:0, fontFamily:"inherit"}}>Subscribe →</button>
        </div>
      </div>
      <div style={{display:"flex", justifyContent:"space-between", fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--ink-400)"}}>
        <span>© Harry Li · Taipei · 2018–2025</span>
        <span>Quiet software, slow writing</span>
        <span>RSS · Sitemap · Colophon</span>
      </div>
    </footer>
  );
}

function HomeB({ posts, onNav, page }) {
  const [drawer, setDrawer] = useStateB(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarB page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerB open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      {/* Spacious masthead */}
      <section style={{padding:"160px 64px 120px", textAlign:"center"}}>
        <div className="eyebrow" style={{color:"var(--ink-400)", marginBottom:32}}>ZhgChgLi · Established 2018</div>
        <h1 style={{
          fontFamily:"var(--font-display)", fontSize:120, lineHeight:1, fontWeight:300,
          margin:0, letterSpacing:"-0.04em", maxWidth:1200, marginInline:"auto"
        }}>
          A quiet place<br/>for <i>longer</i> thoughts.
        </h1>
        <p style={{fontSize:18, color:"var(--ink-500)", maxWidth:540, marginInline:"auto", marginTop:40, lineHeight:1.7}}>
          A field journal by Harry Li — on iOS engineering, the open-source craft, and the small good things in between.
        </p>
      </section>

      <div style={{padding:"0 64px"}}>
        <div style={{height:1, background:"var(--rule)"}}></div>
      </div>

      {/* Lone hero piece */}
      <section style={{padding:"96px 64px", maxWidth:1100, margin:"0 auto"}}>
        <div style={{display:"flex", justifyContent:"space-between", marginBottom:32, fontSize:11, color:"var(--ink-500)", letterSpacing:"0.15em", textTransform:"uppercase"}}>
          <span>This week's reading</span>
          <span>No. 087</span>
        </div>
        <div style={{cursor:"pointer"}} onClick={() => onNav?.("post")}>
          <img src={posts[0].cover} style={{width:"100%", aspectRatio:"21/9", objectFit:"cover", marginBottom:40}}/>
          <h2 style={{fontFamily:"var(--font-display)", fontSize:64, fontWeight:400, lineHeight:1.05, letterSpacing:"-0.025em", margin:"0 0 24px", maxWidth:880}}>
            {posts[0].title}
          </h2>
          <p style={{fontSize:19, color:"var(--ink-500)", lineHeight:1.65, maxWidth:680, margin:"0 0 28px"}}>
            {posts[0].excerpt}
          </p>
          <div style={{fontSize:12, color:"var(--ink-500)", letterSpacing:"0.1em", textTransform:"uppercase"}}>
            {posts[0].date} · {posts[0].readTime} · {posts[0].category}
          </div>
        </div>
      </section>

      <div style={{padding:"0 64px"}}><div style={{height:1, background:"var(--rule)"}}></div></div>

      {/* 2-column quiet cards */}
      <section style={{padding:"96px 64px 120px", maxWidth:1280, margin:"0 auto"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:56}}>
          <h3 style={{fontFamily:"var(--font-display)", fontSize:32, fontWeight:400, margin:0, fontStyle:"italic"}}>recent essays.</h3>
          <a onClick={() => onNav?.("list")} style={{fontSize:12, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--ink-500)", cursor:"pointer"}}>All writing →</a>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, rowGap:96}}>
          {posts.slice(1).map((p, i) => (
            <article key={i} style={{cursor:"pointer"}} onClick={() => onNav?.("post")}>
              <div style={{aspectRatio:"4/3", overflow:"hidden", marginBottom:28, background:"var(--cream-100)"}}>
                <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
              </div>
              <div style={{fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--ink-500)", marginBottom:14}}>
                {p.category} — {p.date}
              </div>
              <h4 style={{fontFamily:"var(--font-display)", fontSize:32, lineHeight:1.15, fontWeight:400, margin:"0 0 14px", letterSpacing:"-0.015em"}}>
                {p.title}
              </h4>
              <p style={{fontSize:15, lineHeight:1.7, color:"var(--ink-500)", margin:0}}>
                {p.excerpt}
              </p>
            </article>
          ))}
        </div>
      </section>

      <FooterB />
    </div>
  );
}

function PostListB({ posts, onNav, page }) {
  const [drawer, setDrawer] = useStateB(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarB page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerB open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      <section style={{padding:"120px 64px 80px", maxWidth:1280, margin:"0 auto"}}>
        <div className="eyebrow" style={{color:"var(--ink-400)", marginBottom:24}}>The Index · 087 essays</div>
        <h1 style={{fontFamily:"var(--font-display)", fontSize:96, fontWeight:300, margin:0, letterSpacing:"-0.03em", lineHeight:1}}>
          Every essay,<br/>in <i>order.</i>
        </h1>
      </section>

      <div style={{padding:"0 64px", maxWidth:1280, margin:"0 auto"}}><div style={{height:1, background:"var(--rule)"}}></div></div>

      <section style={{padding:"56px 64px 80px", maxWidth:1280, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, rowGap:96}}>
        {posts.concat(posts.slice(0,2)).map((p, i) => (
          <article key={i} style={{cursor:"pointer"}} onClick={() => onNav?.("post")}>
            <div style={{aspectRatio:"4/3", overflow:"hidden", marginBottom:24}}>
              <img src={p.cover} style={{width:"100%", height:"100%", objectFit:"cover"}}/>
            </div>
            <div style={{fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--ink-500)", marginBottom:12}}>
              {String(i+1).padStart(3,"0")} · {p.category} · {p.date}
            </div>
            <h4 style={{fontFamily:"var(--font-display)", fontSize:28, lineHeight:1.2, fontWeight:400, margin:"0 0 12px", letterSpacing:"-0.01em"}}>
              {p.title}
            </h4>
            <p style={{fontSize:14.5, lineHeight:1.65, color:"var(--ink-500)", margin:0}}>{p.excerpt}</p>
          </article>
        ))}
      </section>

      <FooterB />
    </div>
  );
}

function PostB({ posts, onNav, page }) {
  const [drawer, setDrawer] = useStateB(false);
  const p = posts[0];
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarB page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerB open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      <article>
        <header style={{padding:"120px 64px 64px", maxWidth:820, margin:"0 auto"}}>
          <div className="eyebrow" style={{color:"var(--ink-400)", marginBottom:32}}>Essay · {p.category}</div>
          <h1 style={{fontFamily:"var(--font-display)", fontSize:72, lineHeight:1.05, fontWeight:400, margin:"0 0 40px", letterSpacing:"-0.025em"}}>
            {p.title}
          </h1>
          <p style={{fontSize:22, lineHeight:1.5, color:"var(--ink-500)", fontStyle:"italic", fontFamily:"var(--font-display)", fontWeight:300, margin:"0 0 48px"}}>
            {p.excerpt}
          </p>
          <div style={{display:"flex", justifyContent:"space-between", paddingTop:24, borderTop:"1px solid var(--rule-soft)", fontSize:12, color:"var(--ink-500)", letterSpacing:"0.1em", textTransform:"uppercase"}}>
            <span>By Harry Li</span>
            <span>{p.date}</span>
            <span>{p.readTime} read</span>
          </div>
        </header>

        <div style={{padding:"0 64px"}}>
          <img src={p.cover} style={{width:"100%", maxHeight:600, objectFit:"cover"}}/>
        </div>

        <div style={{maxWidth:680, margin:"80px auto", padding:"0 24px", fontFamily:"var(--font-display)", fontSize:19, lineHeight:1.85, color:"var(--ink-700)"}}>
          <p style={{marginTop:0}}>三年前的這個時候，我還在公司茶水間反覆練習怎麼跟主管說「我想做一個自己的 App」。三年後的今天，那個 App 上架了，下載量破萬，也讓我重新理解了一件事：寫程式是一回事，把它變成產品交到使用者手上，是另一回事。</p>
          <p>這篇文章想記錄的不是教學，而是過程裡那些細微的、難以對人說的轉折。</p>
          <h2 style={{fontFamily:"var(--font-display)", fontSize:30, fontWeight:500, marginTop:56, marginBottom:18}}>從一行程式碼開始</h2>
          <p>最初的版本只有一個畫面、一個按鈕。但就是這個簡陋的原型，幫我打開了第一扇門。我學會的第一件事是：完成比完美更重要。</p>
          <blockquote style={{borderLeft:"none", padding:"24px 0", margin:"32px 0", fontStyle:"italic", fontSize:26, color:"var(--ink-900)", textAlign:"center", borderTop:"1px solid var(--rule)", borderBottom:"1px solid var(--rule)", lineHeight:1.4}}>
            「Done is better than perfect.」
          </blockquote>
          <p>接下來的三個月，我每天下班後寫兩小時，週末再寫八小時。不是因為熱情多麼澎湃，而是因為害怕——害怕自己又是個只會說不會做的人。</p>
        </div>

        <div style={{maxWidth:680, margin:"0 auto 80px", padding:"32px 24px", borderTop:"1px solid var(--rule)", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            {p.tags.map(t => <span key={t} style={{fontSize:12, color:"var(--ink-500)", letterSpacing:"0.05em"}}>#{t}</span>)}
          </div>
          <span style={{fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--ink-400)"}}>End ✦</span>
        </div>

        <section style={{padding:"56px 64px 96px", maxWidth:1280, margin:"0 auto", borderTop:"1px solid var(--rule)"}}>
          <div className="eyebrow" style={{color:"var(--ink-400)", marginBottom:32}}>Continue reading</div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:80}}>
            {posts.slice(1,3).map((rp, i) => (
              <article key={i} style={{cursor:"pointer"}}>
                <img src={rp.cover} style={{width:"100%", aspectRatio:"4/3", objectFit:"cover", marginBottom:20}}/>
                <h5 style={{fontFamily:"var(--font-display)", fontSize:26, fontWeight:400, lineHeight:1.2, margin:0}}>{rp.title}</h5>
              </article>
            ))}
          </div>
        </section>
      </article>

      <FooterB />
    </div>
  );
}

function CategoryB({ categories, posts, onNav, page }) {
  const [drawer, setDrawer] = useStateB(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarB page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerB open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      <section style={{padding:"120px 64px 64px", maxWidth:1280, margin:"0 auto"}}>
        <div className="eyebrow" style={{color:"var(--ink-400)", marginBottom:24}}>Category</div>
        <h1 style={{fontFamily:"var(--font-display)", fontSize:96, fontWeight:300, margin:0, letterSpacing:"-0.03em", lineHeight:1}}>
          By <i>topic.</i>
        </h1>
      </section>

      <section style={{padding:"40px 64px 80px", maxWidth:1280, margin:"0 auto"}}>
        {categories.map((c, i) => (
          <a key={c.name} style={{display:"flex", alignItems:"baseline", gap:32, padding:"32px 0", borderTop:"1px solid var(--rule-soft)", cursor:"pointer"}}>
            <span style={{fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:14, color:"var(--ink-300)", width:40}}>0{i+1}</span>
            <span style={{fontFamily:"var(--font-display)", fontSize:56, fontWeight:300, letterSpacing:"-0.02em", flex:1}}>{c.name}</span>
            <span style={{fontSize:12, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--ink-500)"}}>{c.count} essays</span>
            <span style={{fontFamily:"var(--font-display)", fontSize:24, color:"var(--ink-300)"}}>↗</span>
          </a>
        ))}
      </section>

      <FooterB />
    </div>
  );
}

function TagB({ tags, posts, onNav, page }) {
  const [drawer, setDrawer] = useStateB(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarB page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerB open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      <section style={{padding:"120px 64px 64px", maxWidth:1280, margin:"0 auto"}}>
        <div className="eyebrow" style={{color:"var(--ink-400)", marginBottom:24}}>Tags</div>
        <h1 style={{fontFamily:"var(--font-display)", fontSize:96, fontWeight:300, margin:0, letterSpacing:"-0.03em", lineHeight:1}}>
          Loose <i>threads.</i>
        </h1>
      </section>

      <section style={{padding:"40px 64px 80px", maxWidth:1100, margin:"0 auto", textAlign:"center"}}>
        <div style={{lineHeight:2, fontFamily:"var(--font-display)"}}>
          {tags.map((t, i) => {
            const sizes = [40, 22, 32, 18, 28, 48, 24, 36, 20];
            return <span key={t} style={{fontSize: sizes[i%sizes.length], fontWeight: i%3===0?500:300, fontStyle:i%4===1?"italic":"normal", color: i%5===0?"var(--accent)":"var(--ink-700)", margin:"0 14px", cursor:"pointer", letterSpacing:"-0.01em"}}>{t}</span>;
          })}
        </div>
      </section>

      <section style={{padding:"56px 64px 80px", maxWidth:1280, margin:"0 auto", borderTop:"1px solid var(--rule)"}}>
        <div className="eyebrow" style={{color:"var(--ink-400)", marginBottom:32}}>Selected · #Swift · 12 essays</div>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, rowGap:64}}>
          {posts.slice(0,4).map((p,i)=>(
            <article key={i} style={{display:"grid", gridTemplateColumns:"160px 1fr", gap:24, cursor:"pointer"}}>
              <img src={p.cover} style={{width:"100%", aspectRatio:"1/1", objectFit:"cover"}}/>
              <div>
                <div style={{fontSize:11, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--ink-500)", marginBottom:10}}>{p.date}</div>
                <h4 style={{fontFamily:"var(--font-display)", fontSize:22, fontWeight:400, lineHeight:1.25, margin:0}}>{p.title}</h4>
              </div>
            </article>
          ))}
        </div>
      </section>

      <FooterB />
    </div>
  );
}

function ArchiveB({ archives, onNav, page }) {
  const [drawer, setDrawer] = useStateB(false);
  return (
    <div className="frame" style={{position:"relative", minHeight:"100%"}}>
      <TopbarB page={page} onNav={onNav} onMenu={() => setDrawer(true)} />
      <DrawerB open={drawer} onClose={() => setDrawer(false)} page={page} onNav={onNav} />

      <section style={{padding:"120px 64px 64px", maxWidth:1280, margin:"0 auto"}}>
        <div className="eyebrow" style={{color:"var(--ink-400)", marginBottom:24}}>Archive · 087 essays · since 2018</div>
        <h1 style={{fontFamily:"var(--font-display)", fontSize:96, fontWeight:300, margin:0, letterSpacing:"-0.03em", lineHeight:1}}>
          By <i>year.</i>
        </h1>
      </section>

      <section style={{padding:"40px 64px 80px", maxWidth:980, margin:"0 auto"}}>
        {archives.map(yr => (
          <div key={yr.year} style={{paddingTop:48, marginBottom:48}}>
            <h2 style={{fontFamily:"var(--font-display)", fontSize:120, fontWeight:200, fontStyle:"italic", margin:"0 0 32px", color:"var(--ink-300)", letterSpacing:"-0.04em"}}>{yr.year}</h2>
            {yr.posts.map((p, i) => (
              <a key={i} style={{display:"flex", alignItems:"baseline", gap:32, padding:"20px 0", borderTop:"1px solid var(--rule-soft)", cursor:"pointer"}}>
                <span style={{fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--ink-400)", width:80}}>{p.date}</span>
                <span style={{fontFamily:"var(--font-display)", fontSize:22, fontWeight:400, flex:1}}>{p.title}</span>
                <span style={{color:"var(--ink-300)"}}>↗</span>
              </a>
            ))}
          </div>
        ))}
      </section>

      <FooterB />
    </div>
  );
}

window.DirectionB = { HomeB, PostListB, PostB, CategoryB, TagB, ArchiveB };
