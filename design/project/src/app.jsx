/* ============================================================
   FORKLORE — app shell, routing, Atlas+Reader, Share
   ============================================================ */
const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp, useCallback: useCB } = React;

/* persistence */
const LS = 'forklore_v1';
function loadState() {
  try { const r = JSON.parse(localStorage.getItem(LS)); if (r && r.stories) return r; } catch(e){}
  return null;
}
function saveState(s) { try { localStorage.setItem(LS, JSON.stringify(s)); } catch(e){} }

function useToast() {
  const [toast, setToast] = useStateApp(null);
  const show = useCB((msg, kind='ok') => {
    setToast({ msg, kind }); 
    clearTimeout(window.__tt); window.__tt = setTimeout(()=>setToast(null), 2200);
  }, []);
  return [toast, show];
}

/* ============================================================
   5 · ATLAS + READER (the main screen)
   ============================================================ */
function StoryView({ story, onBack, onShare, onUpdate, onToast, forceFail }) {
  const [selectedId, setSelectedId] = useStateApp(story.tree.id);
  const [ghost, setGhost] = useStateApp(null);
  const [generating, setGenerating] = useStateApp(false);
  const [snapped, setSnapped] = useStateApp(null);
  const [error, setError] = useStateApp(null);
  const [mobileTab, setMobileTab] = useStateApp('reader');
  const [isMobile, setIsMobile] = useStateApp(window.innerWidth < 900);

  useEffectApp(() => {
    const r = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', r); return ()=>window.removeEventListener('resize', r);
  }, []);

  const findNode = (id, n=story.tree) => n.id===id ? n : (n.children||[]).reduce((f,c)=>f||findNode(id,c), null);

  const doFork = useCB(async (node, steer) => {
    setError(null);
    const sIdx = (node.children||[]).length;
    setGhost({ parentId: node.id, siblingIndex: sIdx });
    setGenerating(true);
    if (isMobile) setMobileTab('atlas');
    const path = pathToRoot(story.tree, node.id);
    try {
      await new Promise(r=>setTimeout(r, 1100)); // let the dashed connector march
      if (forceFail) throw new Error('crumbled');
      const gen = await generatePassage({ genre: story.genre, tone: story.tone, steer, path });
      const newNode = { id: nid(), parentId: node.id, kind: steer?'steered':'branch', steer: steer||null, title: gen.title, body: gen.body, children: [] };
      node.children = node.children || [];
      node.children.push(newNode);
      setGhost(null); setGenerating(false);
      setSnapped(newNode.id);
      setSelectedId(newNode.id);
      onUpdate(story);
      setTimeout(()=>setSnapped(null), 600);
      onToast('saved to the archive', 'ok');
      if (isMobile) setTimeout(()=>setMobileTab('reader'), 700);
    } catch (e) {
      setGhost(null); setGenerating(false);
      setError(node.id);
      onToast('the scroll crumbled', 'err');
    }
  }, [story, forceFail, isMobile]);

  const headerBar = (
    <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:20, background:'rgba(28,21,14,.92)', borderBottom:'3px solid var(--stone)' }}>
      <div className="row center between" style={{ padding:'10px 18px', gap:12 }}>
        <div className="row center gap-3" style={{ minWidth:0 }}>
          <button className="iconbtn" onClick={onBack} title="Back to archive"><PixelIcon name="back" size={16} color="var(--sand-light)"/></button>
          <div style={{ minWidth:0 }}>
            <div className="node-title" style={{ fontSize:16, color:'var(--sand-light)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{story.title}</div>
            <div className="caption" style={{ fontSize:10 }}>{story.genre} · {story.tone} · {countPassages(story.tree)} passages</div>
          </div>
        </div>
        <button className="btn btn--secondary" onClick={()=>onShare(story.id)} style={{ padding:'8px 14px', fontSize:13 }}>
          <PixelIcon name="share" size={15} color="var(--sand-light)"/> Share
        </button>
      </div>
      {isMobile && (
        <div className="row" style={{ borderTop:'2px solid var(--stone)' }}>
          {['atlas','reader'].map(t=>(
            <button key={t} onClick={()=>setMobileTab(t)} style={{ flex:1, padding:'10px', background: mobileTab===t?'var(--stone)':'transparent',
              border:'none', color: mobileTab===t?'var(--sand-light)':'var(--muted)', fontFamily:'var(--font-pixel)', fontWeight:600, fontSize:13 }}>
              {t==='atlas'?'◆ The Atlas':'▤ The Reader'}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const atlasPane = (
    <div style={{ position:'relative', height:'100%' }}>
      <Atlas story={story} selectedId={selectedId} onSelect={setSelectedId} ghost={ghost} justSnapped={snapped} />
    </div>
  );
  const readerPane = (
    <div style={{ height:'100%', position:'relative' }}>
      <Reader story={story} selectedId={selectedId} onSelect={setSelectedId} onFork={doFork} generating={generating && selectedId===(findNode(selectedId)?.id)} />
      {error && error===selectedId && <ErrorStrip onRetry={()=>{ const n=findNode(error); setError(null); doFork(n, null); }} onDismiss={()=>setError(null)} />}
    </div>
  );

  const topPad = isMobile ? 96 : 60;
  return (
    <div className="screen" style={{ background:'var(--basalt)' }}>
      {headerBar}
      <div style={{ position:'absolute', top:topPad, left:0, right:0, bottom:0 }}>
        {isMobile ? (
          <div style={{ height:'100%' }}>{mobileTab==='atlas' ? atlasPane : readerPane}</div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'56% 44%', height:'100%' }}>
            <div style={{ borderRight:'3px solid var(--stone)', position:'relative' }}>{atlasPane}</div>
            <div>{readerPane}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorStrip({ onRetry, onDismiss }) {
  return (
    <div style={{ position:'absolute', left:'50%', bottom:96, transform:'translateX(-50%)', zIndex:40, width:'min(460px,90%)' }}>
      <div className="frame frame--basalt" style={{ padding:'14px 16px', borderColor:'var(--carnelian)' }}>
        <div className="row center gap-3">
          <span className="seal seal--carnelian" style={{ width:28, height:28, flexShrink:0 }}><PixelIcon name="x" size={13} color="#E8D5A8"/></span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-pixel)', fontWeight:600, color:'var(--sand-light)', fontSize:14 }}>The scroll crumbled.</div>
            <div className="caption">The sand shifted mid-unsealing. Try again — nothing was lost.</div>
          </div>
          <button className="btn btn--danger" style={{ padding:'8px 12px', fontSize:13 }} onClick={onRetry}>Retry</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   6 · SHARE VIEW (§7.6)
   ============================================================ */
function ShareView({ story, fromArchive, onBack, onForkCopy, onCopyLink }) {
  const [selectedId, setSelectedId] = useStateApp(story.tree.id);
  const [isMobile, setIsMobile] = useStateApp(window.innerWidth < 900);
  const [tab, setTab] = useStateApp('reader');
  useEffectApp(() => { const r=()=>setIsMobile(window.innerWidth<900); window.addEventListener('resize',r); return ()=>window.removeEventListener('resize',r); }, []);

  const atlas = <Atlas story={story} selectedId={selectedId} onSelect={setSelectedId} readOnly />;
  const reader = <Reader story={story} selectedId={selectedId} onSelect={setSelectedId} readOnly onFork2={onForkCopy} onFork={()=>{}} />;

  return (
    <div className="screen" style={{ background:'var(--basalt)' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, zIndex:20, background:'rgba(28,21,14,.92)', borderBottom:'3px solid var(--stone)' }}>
        <div className="row center between wrap" style={{ padding:'10px 18px', gap:12 }}>
          <div className="row center gap-3" style={{ minWidth:0 }}>
            {fromArchive && <button className="iconbtn" onClick={onBack}><PixelIcon name="back" size={16} color="var(--sand-light)"/></button>}
            <div className="frame frame--basalt" style={{ padding:'6px 12px', boxShadow:'inset 2px 2px 0 var(--stone-light), inset -2px -2px 0 #1c150e' }}>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--muted)' }}>SHARED DIG</span>
            </div>
            <div style={{ minWidth:0 }}>
              <div className="node-title" style={{ fontSize:16, color:'var(--sand-light)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{story.title}</div>
              <div className="caption" style={{ fontSize:10 }}>by {story.author || 'tahira_of_the_dunes'} · read-only</div>
            </div>
          </div>
          <div className="row center gap-2">
            <button className="btn btn--secondary" onClick={onCopyLink} style={{ padding:'8px 12px', fontSize:13 }}><PixelIcon name="link" size={14} color="var(--sand-light)"/> Copy link</button>
            <button className="btn" onClick={onForkCopy} style={{ padding:'8px 14px', fontSize:13 }}><PixelIcon name="copy" size={14} color="#2B2118"/> Fork — make it yours</button>
          </div>
        </div>
        {isMobile && (
          <div className="row" style={{ borderTop:'2px solid var(--stone)' }}>
            {['atlas','reader'].map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{ flex:1, padding:'10px', background: tab===t?'var(--stone)':'transparent', border:'none', color: tab===t?'var(--sand-light)':'var(--muted)', fontFamily:'var(--font-pixel)', fontWeight:600, fontSize:13 }}>{t==='atlas'?'◆ The Atlas':'▤ The Reader'}</button>
            ))}
          </div>
        )}
      </div>
      <div style={{ position:'absolute', top: isMobile?96:60, left:0, right:0, bottom:0 }}>
        {isMobile ? (tab==='atlas'?atlas:reader) : (
          <div style={{ display:'grid', gridTemplateColumns:'56% 44%', height:'100%' }}>
            <div style={{ borderRight:'3px solid var(--stone)', position:'relative' }}>{atlas}</div>
            <div>{reader}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */
function App() {
  const persisted = loadState();
  const [route, setRoute] = useStateApp(persisted ? { name:'archive' } : { name:'landing' });
  const [handle, setHandle] = useStateApp(persisted?.handle || null);
  const [stories, setStories] = useStateApp(persisted?.stories || seedStories());
  const [genCreate, setGenCreate] = useStateApp(false);
  const [toast, showToast] = useToast();
  const [forceFail, setForceFail] = useStateApp(false);
  const tweaksRef = useRefApp(null);

  useEffectApp(() => { saveState({ handle, stories }); }, [handle, stories]);

  const updateStory = useCB((story) => {
    setStories(prev => prev.map(s => s.id===story.id ? { ...story, updated:'just now' } : s));
  }, []);

  const openStory = (id) => { const s = stories.find(x=>x.id===id); setRoute({ name:'story', story: s }); };

  const createStory = async ({ premise, genre, tone }) => {
    setGenCreate(true);
    const gen = await generatePassage({ genre, tone, steer:null, path:[] });
    const tree = { id: nid(), parentId:null, kind:'root', steer:null,
      title: gen.title || 'The First Page', body: gen.body, children: [] };
    const story = { id:'s'+Date.now(), title: gen.title || titleFromPremise(premise), genre, tone, premise, updated:'just now', tree, author: handle };
    setStories(prev => [story, ...prev]);
    setGenCreate(false);
    setRoute({ name:'story', story });
    showToast('saved to the archive', 'ok');
  };

  const handleTweak = (k,v) => { if (k==='forceFail') setForceFail(v); };

  let view;
  switch (route.name) {
    case 'landing': view = <Landing onBegin={()=>setRoute({name:'entry'})} />; break;
    case 'entry':   view = <Entry onEnter={(n)=>{ setHandle(n); setRoute({name:'archive'}); showToast('welcome, '+n,'ok'); }} />; break;
    case 'archive': view = <Archive handle={handle||'archivist'} stories={stories}
      onOpen={openStory} onNew={()=>setRoute({name:'create'})}
      onShare={(id)=>{ const s=stories.find(x=>x.id===id); setRoute({name:'share', story:s, fromArchive:true}); }}
      onDelete={(id)=>{ setStories(prev=>prev.filter(s=>s.id!==id)); showToast('re-buried in the sand','ok'); }} />; break;
    case 'create':  view = <Create onBack={()=>setRoute({name:'archive'})} onOpen={createStory} generating={genCreate} />; break;
    case 'story':   view = <StoryView key={route.story.id} story={route.story} forceFail={forceFail}
      onBack={()=>setRoute({name:'archive'})}
      onShare={(id)=>{ const s=stories.find(x=>x.id===id)||route.story; setRoute({name:'share', story:s, fromArchive:true}); }}
      onUpdate={updateStory} onToast={showToast} />; break;
    case 'share':   view = <ShareView key={route.story.id} story={route.story} fromArchive={route.fromArchive}
      onBack={()=>setRoute({name:'archive'})}
      onCopyLink={()=>{ try{navigator.clipboard.writeText(location.href+'#'+route.story.id);}catch(e){} showToast('share link copied','ok'); }}
      onForkCopy={()=>{ const copy={ ...route.story, id:'s'+Date.now(), title:route.story.title+' (your fork)', updated:'just now', author:handle, tree: JSON.parse(JSON.stringify(route.story.tree)) };
        setStories(prev=>[copy,...prev]); showToast('forked into your archive','ok'); setRoute({name:'story', story:copy}); }} />; break;
    default: view = <div/>;
  }

  return <React.Fragment>
    {view}
    <Toast toast={toast} />
    <ForkloreTweaks onTweak={handleTweak} />
  </React.Fragment>;
}

function titleFromPremise(p){ const w=p.split(/\s+/).slice(0,4).join(' '); return w.charAt(0).toUpperCase()+w.slice(1); }

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
