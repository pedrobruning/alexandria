/* ============================================================
   FORKLORE — screens (Landing, Entry, Archive, Create, Share)
   ============================================================ */
const { useState: useStateS, useEffect: useEffectS } = React;

/* ---------- Brand lockup ---------- */
function Wordmark({ size=44, light }) {
  return <div className="row center gap-3">
    <span className="logo" style={{ fontSize:size, color: light?'var(--sand-light)':'var(--ink)' }}>
      Fork<span style={{ color:'var(--gold)' }}>lore</span>
    </span>
    <PixelIcon name="fork" size={size*0.7} color="var(--lapis-bright)" style={{ marginTop:4 }} />
  </div>;
}

/* ============================================================
   1 · LANDING / HERO (§7.1)
   ============================================================ */
function Landing({ onBegin }) {
  const [stage, setStage] = useStateS(0);
  useEffectS(() => {
    const t1=setTimeout(()=>setStage(1),250), t2=setTimeout(()=>setStage(2),650), t3=setTimeout(()=>setStage(3),1050);
    return ()=>{ clearTimeout(t1);clearTimeout(t2);clearTimeout(t3); };
  }, []);
  const rise = (n) => ({ opacity: stage>=n?1:0, transform: stage>=n?'translateY(0)':'translateY(16px)', transition:'all .35s steps(5)' });

  return (
    <div className="screen vignette">
      <PixelPanorama animate />
      <div style={{ position:'relative', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', paddingBottom:'9vh', textAlign:'center' }}>
        <div style={{ ...rise(1) }}>
          <div className="frame frame--basalt" style={{ padding:'10px 22px', marginBottom:24, display:'inline-block' }}>
            <Wordmark size={52} light />
          </div>
        </div>
        <p className="prose" style={{ ...rise(2), color:'var(--sand-light)', fontFamily:'var(--font-body)', fontSize:22, fontStyle:'italic', maxWidth:'30ch', margin:'0 auto 28px', textShadow:'2px 2px 0 rgba(0,0,0,.6)' }}>
          Every story is a map of the stories it could have been.
        </p>
        <div style={{ ...rise(3) }}>
          <button className="btn btn--lg" onClick={onBegin} style={{ whiteSpace:'nowrap' }}>
            <PixelIcon name="flask" size={18} color="#2B2118" /> Begin the dig
          </button>
        </div>
        <div className="caption" style={{ ...rise(3), marginTop:30, color:'var(--sand-light)', opacity:.7, textShadow:'1px 1px 0 rgba(0,0,0,.6)' }}>
          THE PIXEL LIBRARY OF ALEXANDRIA · UNSEAL · EXCAVATE · FORK
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   2 · ENTRY (§7.2)
   ============================================================ */
function Entry({ onEnter }) {
  const [name, setName] = useStateS('');
  return (
    <div className="screen bg-dune vignette" style={{ display:'grid', placeItems:'center' }}>
      <PixelPanorama />
      <div style={{ position:'absolute', inset:0, background:'rgba(28,21,14,.55)' }} />
      <div className="frame frame--basalt" style={{ position:'relative', width:'min(440px,92vw)', padding:'34px 30px' }}>
        <div className="center-col" style={{ marginBottom:8 }}><Wordmark size={34} light /></div>
        <div className="fret" style={{ margin:'14px 0 22px' }} />
        <p style={{ fontFamily:'var(--font-body)', fontSize:16, color:'var(--sand-light)', textAlign:'center', marginBottom:24, lineHeight:1.6 }}>
          Sign the register, archivist. Your excavations are kept under this name.
        </p>
        <label className="label">Author handle</label>
        <input className="field field--dark" value={name} onChange={e=>setName(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter'&&name.trim()) onEnter(name.trim()); }}
          placeholder="e.g. tahira_of_the_dunes" autoFocus />
        <button className="btn btn--block btn--lg" style={{ marginTop:22 }}
          disabled={!name.trim()} onClick={()=>onEnter(name.trim())}>
          Enter the archive
        </button>
        <p className="caption" style={{ textAlign:'center', marginTop:16 }}>No password. The desert keeps your secrets.</p>
      </div>
    </div>
  );
}

/* ============================================================
   3 · ARCHIVE / LIBRARY (§7.3)
   ============================================================ */
function Archive({ handle, stories, onOpen, onNew, onShare, onDelete }) {
  const [confirm, setConfirm] = useStateS(null);
  return (
    <div className="screen scroll-y" style={{ background:'var(--basalt)' }}>
      {/* header */}
      <div style={{ position:'sticky', top:0, zIndex:10, background:'rgba(43,33,24,.96)', borderBottom:'3px solid var(--stone)', backdropFilter:'blur(2px)' }}>
        <div style={{ maxWidth:1120, margin:'0 auto', padding:'16px 28px' }} className="row center between wrap gap-3">
          <div className="row center gap-4">
            <Wordmark size={26} light />
            <div className="frame frame--basalt" style={{ padding:'6px 14px', boxShadow:'inset 2px 2px 0 var(--stone-light), inset -2px -2px 0 #1c150e' }}>
              <span style={{ fontFamily:'var(--font-pixel)', fontWeight:600, fontSize:15, color:'var(--sand-light)' }}>The Archive</span>
            </div>
          </div>
          <div className="row center gap-3">
            <span className="caption">archivist · <span style={{ color:'var(--lapis-bright)' }}>{handle}</span></span>
            <button className="btn" onClick={onNew}><PixelIcon name="plus" size={16} color="#2B2118"/> New story</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1120, margin:'0 auto', padding:'28px' }}>
        {stories.length===0 ? (
          <EmptyArchive onNew={onNew} />
        ) : (
          <React.Fragment>
            <div className="row center between" style={{ marginBottom:18 }}>
              <span style={{ fontFamily:'var(--font-pixel)', fontSize:18, color:'var(--sand-light)' }}>{stories.length} excavations</span>
              <span className="caption">sorted · most recent</span>
            </div>
            <div className="archive-grid" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:22 }}>
              {stories.map(s => (
                <StoryCard key={s.id} story={s}
                  onOpen={()=>onOpen(s.id)} onShare={()=>onShare(s.id)}
                  onDelete={()=>setConfirm(s)} />
              ))}
            </div>
          </React.Fragment>
        )}
      </div>

      {confirm && (
        <ConfirmDelete story={confirm} onCancel={()=>setConfirm(null)}
          onConfirm={()=>{ onDelete(confirm.id); setConfirm(null); }} />
      )}
    </div>
  );
}

function StoryCard({ story, onOpen, onShare, onDelete }) {
  return (
    <div className="frame frame--basalt story-card" style={{ padding:0, overflow:'hidden', transition:'transform .1s steps(2), box-shadow .1s steps(2)' }}>
      {/* mini atlas */}
      <div style={{ background:'#1c150e', padding:'14px 16px 8px', borderBottom:'3px solid var(--stone)' }}>
        <MiniAtlas tree={story.tree} />
      </div>
      <div style={{ padding:'14px 16px 16px' }}>
        <h3 className="node-title" style={{ fontSize:19, color:'var(--sand-light)', marginBottom:8 }}>{story.title}</h3>
        <div className="row gap-2 wrap" style={{ marginBottom:10 }}>
          <span className="tag tag--lapis">{story.genre}</span>
          <span className="tag tag--gold">{story.tone}</span>
        </div>
        <div className="row center gap-3" style={{ marginBottom:14 }}>
          <span className="caption"><PixelIcon name="scroll" size={12} color="var(--muted)" style={{display:'inline-block',verticalAlign:'-2px',marginRight:4}}/>{countPassages(story.tree)} passages</span>
          <span className="caption"><PixelIcon name="fork" size={12} color="var(--muted)" style={{display:'inline-block',verticalAlign:'-2px',marginRight:4}}/>{countBranches(story.tree)} forks</span>
        </div>
        <div className="row center between">
          <span className="caption">updated {story.updated}</span>
          <div className="row gap-2">
            <button className="iconbtn" title="Share" onClick={onShare} style={{ width:34, height:34 }}><PixelIcon name="share" size={15} color="var(--sand-light)"/></button>
            <button className="iconbtn" title="Delete" onClick={onDelete} style={{ width:34, height:34, color:'var(--carnelian)' }}><PixelIcon name="trash" size={15} color="#d07350"/></button>
            <button className="btn" onClick={onOpen} style={{ padding:'7px 14px', fontSize:13 }}>Open ›</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyArchive({ onNew }) {
  return (
    <div className="center-col" style={{ textAlign:'center', padding:'8vh 20px', position:'relative' }}>
      {/* friendly excavation scene from blocks */}
      <div style={{ position:'relative', width:220, height:120, marginBottom:28 }}>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:54, background:'#6b4f30', boxShadow:'inset 0 4px 0 rgba(255,255,255,.06)' }} />
        <div style={{ position:'absolute', bottom:30, left:'50%', transform:'translateX(-50%)', width:64, height:30, background:'#1c150e', clipPath:'polygon(0 100%,15% 0,85% 0,100% 100%)' }} />
        <div style={{ position:'absolute', bottom:34, left:'calc(50% + 2px)', transform:'translateX(-50%)', width:30, height:22, background:'var(--gold)', boxShadow:'0 0 18px var(--gold)', clipPath:'polygon(0 100%,20% 0,80% 0,100% 100%)' }} />
        {/* a planted shovel = rectangles */}
        <div style={{ position:'absolute', bottom:30, right:30, width:6, height:50, background:'var(--stone-light)', transform:'rotate(18deg)' }} />
        <div style={{ position:'absolute', bottom:20, right:24, width:18, height:12, background:'var(--sand)' }} />
      </div>
      <h2 className="h2" style={{ color:'var(--sand-light)', marginBottom:12 }}>The archive is empty.</h2>
      <p style={{ fontFamily:'var(--font-body)', fontSize:17, color:'var(--muted)', maxWidth:'34ch', marginBottom:26, lineHeight:1.6 }}>
        Every dig begins with a single sealed scroll. Unearth your first tale and watch its timelines branch.
      </p>
      <button className="btn btn--lg" onClick={onNew}><PixelIcon name="plus" size={18} color="#2B2118"/> Unearth your first tale</button>
    </div>
  );
}

function ConfirmDelete({ story, onCancel, onConfirm }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(28,21,14,.7)', display:'grid', placeItems:'center', zIndex:300 }} onClick={onCancel}>
      <div className="frame frame--basalt" style={{ width:'min(400px,92vw)', padding:'26px' }} onClick={e=>e.stopPropagation()}>
        <div className="row center gap-3" style={{ marginBottom:14 }}>
          <span className="seal seal--carnelian" style={{ width:30, height:30 }}><PixelIcon name="trash" size={15} color="#E8D5A8"/></span>
          <h3 className="h2" style={{ fontSize:20, color:'var(--sand-light)' }}>Re-bury this dig?</h3>
        </div>
        <p style={{ fontFamily:'var(--font-body)', fontSize:16, color:'var(--sand-light)', lineHeight:1.6, marginBottom:22 }}>
          “{story.title}” and all <strong>{countPassages(story.tree)}</strong> of its excavated passages will be lost to the sand. This cannot be undone.
        </p>
        <div className="row gap-3 between">
          <button className="btn btn--secondary" onClick={onCancel}>Keep it</button>
          <button className="btn btn--danger" onClick={onConfirm}><PixelIcon name="trash" size={15} color="#E8D5A8"/> Re-bury</button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   4 · CREATE (§7.4)
   ============================================================ */
function Create({ onBack, onOpen, generating }) {
  const [premise, setPremise] = useStateS('');
  const [genre, setGenre] = useStateS('Fantasy');
  const [tone, setTone] = useStateS('Lyrical');
  const [err, setErr] = useStateS(false);

  const go = () => {
    if (!premise.trim()) { setErr(true); return; }
    onOpen({ premise: premise.trim(), genre, tone });
  };

  return (
    <div className="screen bg-dune scroll-y vignette">
      <PixelPanorama />
      <div style={{ position:'absolute', inset:0, background:'rgba(28,21,14,.6)' }} />
      <div style={{ position:'relative', maxWidth:660, margin:'0 auto', padding:'28px 20px 60px' }}>
        <button className="btn btn--ghost" onClick={onBack} style={{ marginBottom:16 }}>
          <PixelIcon name="back" size={16} color="var(--sand-light)"/> Back to the archive
        </button>
        <div className="frame frame--papyrus" style={{ padding:'30px 30px 34px' }}>
          <h1 className="h1" style={{ color:'var(--ink)', fontSize:30, marginBottom:6 }}>Seal a new scroll</h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:16, color:'var(--muted)', marginBottom:24 }}>
            Give the dig its first spark. Forklore unrolls the opening passage — every page after is a fork.
          </p>

          <label className="label label--ink">The spark</label>
          <textarea className={'field' + (err?' field-err':'')} rows={4} value={premise}
            onChange={e=>{ setPremise(e.target.value); if(err) setErr(false); }}
            placeholder="A lighthouse keeper finds a door in the sea-fog that wasn’t there yesterday…"
            style={ err ? { borderColor:'var(--carnelian)' } : null } />
          {err && <p className="hint hint--err">The dig needs a spark. Write a premise to begin.</p>}

          <div className="fret" style={{ margin:'24px 0', opacity:.4 }} />

          <label className="label label--ink">Genre</label>
          <div className="row gap-2 wrap" style={{ marginBottom:22 }}>
            {GENRES.map(g => <button key={g} className={'chip chip--gold' + (genre===g?' chip--on':'')} onClick={()=>setGenre(g)}>{g}</button>)}
          </div>

          <label className="label label--ink">Tone</label>
          <div className="row gap-2 wrap" style={{ marginBottom:28 }}>
            {TONES.map(t => <button key={t} className={'chip' + (tone===t?' chip--on':'')} onClick={()=>setTone(t)}>{t}</button>)}
          </div>

          {generating ? (
            <div className="frame frame--basalt" style={{ padding:'18px', display:'grid', placeItems:'center' }}>
              <PixSpinner label="unsealing the first scroll…" />
            </div>
          ) : (
            <button className="btn btn--block btn--lg" onClick={go}>
              <PixelIcon name="scroll" size={18} color="#2B2118"/> Open the first page
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Wordmark, Landing, Entry, Archive, StoryCard, EmptyArchive, Create });
