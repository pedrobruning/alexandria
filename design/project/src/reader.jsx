/* ============================================================
   FORKLORE — Reader pane (§7.5 right/bottom)
   ============================================================ */
const { useState: useStateR, useRef: useRefR } = React;

function Reader({ story, selectedId, onSelect, onFork, generating, readOnly, onFork2 }) {
  const root = story.tree;
  const path = pathToRoot(root, selectedId);
  const node = path[path.length-1];
  const [steer, setSteer] = useStateR('');
  const passageNo = path.length;
  const branches = node.children || [];
  const steerRef = useRefR(null);

  if (!node) return null;

  const doFork = () => { onFork(node, steer.trim() || null); setSteer(''); };

  return (
    <div className="reader scroll-y" style={{ height:'100%', background:'var(--papyrus)', padding:'0', position:'relative' }}>
      {/* papyrus fiber texture */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:.06,
        backgroundImage:'repeating-linear-gradient(90deg,#2B2118 0 1px,transparent 1px 6px)' }} />

      <div style={{ position:'relative', padding:'28px 34px 120px', maxWidth:760, margin:'0 auto' }}>
        {/* breadcrumb */}
        <div className="row wrap center" style={{ gap:6, marginBottom:20, fontFamily:'var(--font-mono)', fontSize:12 }}>
          {path.map((p,i) => (
            <React.Fragment key={p.id}>
              <button onClick={()=>onSelect(p.id)}
                style={{ background:'none', border:'none', padding:'2px 4px', cursor:'pointer',
                  color: p.id===selectedId ? 'var(--lapis)' : 'var(--muted)',
                  fontWeight: p.id===selectedId?600:400, fontFamily:'var(--font-mono)', fontSize:12 }}>
                {p.id===root.id ? '◆ root' : truncate(p.title, 16)}
              </button>
              {i<path.length-1 && <span style={{ color:'var(--muted)' }}>›</span>}
            </React.Fragment>
          ))}
          <span className="tag" style={{ marginLeft:'auto' }}>depth {passageNo}</span>
        </div>

        {/* title row */}
        <div className="row center between" style={{ marginBottom:4, gap:12 }}>
          <span className="caption" style={{ color:'var(--gold-deep)' }}>PASSAGE {String(passageNo).padStart(2,'0')}</span>
          <div className="row gap-2">
            {node.kind==='root' && <span className="tag tag--gold">ROOT</span>}
            {node.kind==='steered' && <span className="tag tag--carnelian">↳ STEERED</span>}
            {branches.length>=2 && <span className="tag tag--gold">FORK · {branches.length}</span>}
          </div>
        </div>
        <h1 className="h1" style={{ color:'var(--ink)', fontSize:30, marginBottom: node.steer?6:18 }}>{node.title}</h1>
        {node.steer && <div className="row center gap-2" style={{ marginBottom:18 }}>
          <span className="seal seal--carnelian" style={{ width:18, height:18 }}><PixelIcon name="fork" size={9} color="#E8D5A8"/></span>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--carnelian)' }}>steered: “{node.steer}”</span>
        </div>}

        <div className="fret" style={{ margin:'0 0 22px', opacity:.4 }} />

        {/* prose */}
        <div className="prose">
          {node.body.map((para,i)=>{
            if (i===0 && para.length>1) {
              return <p key={i}><span className="dropcap">{para[0]}</span>{para.slice(1)}</p>;
            }
            return <p key={i}>{para}</p>;
          })}
        </div>

        {/* branches from here */}
        {branches.length>0 && (
          <div style={{ marginTop:34 }}>
            <div className="row center gap-2" style={{ marginBottom:12 }}>
              <PixelIcon name="fork" size={16} color="var(--gold-deep)" />
              <span style={{ fontFamily:'var(--font-pixel)', fontWeight:600, fontSize:15, color:'var(--ink)' }}>Branches from here</span>
              <span className="tag tag--gold">{branches.length}</span>
            </div>
            <div className="col gap-2">
              {branches.map(b => (
                <button key={b.id} onClick={()=>onSelect(b.id)}
                  className="branch-row"
                  style={{ display:'flex', alignItems:'center', gap:12, textAlign:'left', width:'100%',
                    padding:'10px 14px', background:'rgba(43,33,24,.05)', cursor:'pointer',
                    border:'3px solid var(--stone)', boxShadow:'inset 2px 2px 0 rgba(255,255,255,.3)' }}>
                  <PixelIcon name="scroll" size={18} color={b.kind==='steered'?'var(--carnelian)':'var(--lapis)'} />
                  <span style={{ flex:1 }}>
                    <span style={{ display:'block', fontFamily:'var(--font-pixel)', fontWeight:600, fontSize:14, color:'var(--ink)' }}>{b.title}</span>
                    {b.steer && <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--carnelian)' }}>steered: “{b.steer}”</span>}
                  </span>
                  <span className="caption">travel ›</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* fork controls — sticky bottom */}
      {!readOnly && (
        <div style={{ position:'sticky', bottom:0, left:0, right:0, background:'rgba(229,210,166,.96)',
          borderTop:'3px solid var(--stone)', padding:'14px 34px', boxShadow:'0 -6px 0 rgba(0,0,0,.08)' }}>
          <div style={{ maxWidth:760, margin:'0 auto' }}>
            {generating ? (
              <div className="row center jc" style={{ padding:'8px 0' }}>
                <PixSpinner label="unsealing the next passage…" />
              </div>
            ) : (
              <React.Fragment>
                <div className="row gap-3" style={{ alignItems:'stretch' }}>
                  <input ref={steerRef} className="field" value={steer} onChange={e=>setSteer(e.target.value)}
                    onKeyDown={e=>{ if(e.key==='Enter') doFork(); }}
                    placeholder="optional nudge — e.g. ‘but she refuses the offer’" style={{ flex:1 }} />
                  <button className="btn btn--lg" onClick={doFork} style={{ whiteSpace:'nowrap' }}>
                    <PixelIcon name="fork" size={16} color="#2B2118" />
                    {branches.length>0 ? 'Add another branch' : 'Unseal the next passage'}
                  </button>
                </div>
                <p className="hint" style={{ marginTop:8 }}>
                  Each continuation forks a new timeline — the others stay frozen, excavated, and free to revisit.
                </p>
              </React.Fragment>
            )}
          </div>
        </div>
      )}

      {readOnly && (
        <div style={{ position:'sticky', bottom:0, background:'rgba(229,210,166,.96)', borderTop:'3px solid var(--stone)', padding:'14px 34px' }}>
          <div style={{ maxWidth:760, margin:'0 auto' }} className="row center between gap-3 wrap">
            <span className="hint" style={{ margin:0 }}>You are reading a shared dig. Fork it to continue the excavation in your own archive.</span>
            <button className="btn" onClick={onFork2}><PixelIcon name="copy" size={15} color="#2B2118"/> Fork from here — make it yours</button>
          </div>
        </div>
      )}
    </div>
  );
}

function truncate(s, n) { return s.length>n ? s.slice(0,n-1)+'…' : s; }

Object.assign(window, { Reader });
