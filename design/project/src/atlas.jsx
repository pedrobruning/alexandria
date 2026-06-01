/* ============================================================
   FORKLORE — Story Atlas (the tree / dig site)
   ============================================================ */
const { useState: useStateA, useEffect: useEffectA, useRef: useRefA, useMemo, useCallback: useCallbackA } = React;

const COL = 232;   // horizontal gap per depth
const ROW = 132;   // vertical gap per leaf row
const NODE_W = 168;

/* tidy left→right tree layout */
function computeLayout(root) {
  const pos = {};
  let rowCounter = 0;
  const assign = (n, depth) => {
    const kids = n.children || [];
    if (!kids.length) {
      const y = rowCounter * ROW; rowCounter++;
      pos[n.id] = { x: depth * COL, y };
      return y;
    }
    const ys = kids.map(c => assign(c, depth + 1));
    const y = (Math.min(...ys) + Math.max(...ys)) / 2;
    pos[n.id] = { x: depth * COL, y };
    return y;
  };
  assign(root, 0);
  // normalise extents
  const xs = Object.values(pos).map(p=>p.x), ysv = Object.values(pos).map(p=>p.y);
  return { pos, w: Math.max(...xs)+NODE_W, h: Math.max(...ysv)+90, minY: Math.min(...ysv) };
}

function pathToRoot(root, id) {
  const path = [];
  const dfs = (n) => {
    if (n.id === id) { path.push(n); return true; }
    for (const c of (n.children||[])) { if (dfs(c)) { path.push(n); return true; } }
    return false;
  };
  dfs(root);
  return path.reverse(); // root → target
}

function Atlas({ story, selectedId, onSelect, ghost, justSnapped, readOnly }) {
  const root = story.tree;
  const { pos, w, h } = useMemo(() => computeLayout(root), [story, ghost]);
  const wrapRef = useRefA(null);
  const [off, setOff] = useStateA({ x: 40, y: 40 });
  const drag = useRefA(null);
  const activePath = useMemo(() => new Set(pathToRoot(root, selectedId).map(n=>n.id)), [root, selectedId]);

  const nodes = useMemo(() => flatten(root).map(x=>x.node), [root, ghost]);

  /* auto-center selected node */
  useEffectA(() => {
    const el = wrapRef.current; if (!el) return;
    const p = pos[selectedId]; if (!p) return;
    const cw = el.clientWidth, ch = el.clientHeight;
    setOff({ x: cw/2 - (p.x + NODE_W/2), y: ch/2 - (p.y + 40) });
  }, [selectedId, story]);

  /* pan handlers */
  const onDown = (e) => {
    if (e.target.closest('.node')) return;
    const pt = e.touches ? e.touches[0] : e;
    drag.current = { sx: pt.clientX, sy: pt.clientY, ox: off.x, oy: off.y };
  };
  const onMove = (e) => {
    if (!drag.current) return;
    const pt = e.touches ? e.touches[0] : e;
    setOff({ x: drag.current.ox + (pt.clientX - drag.current.sx), y: drag.current.oy + (pt.clientY - drag.current.sy) });
  };
  const onUp = () => { drag.current = null; };

  /* keyboard nav between nodes (§10) */
  useEffectA(() => {
    const onKey = (e) => {
      if (['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
      const cur = nodes.find(n=>n.id===selectedId); if (!cur) return;
      const parent = nodes.find(n => (n.children||[]).some(c=>c.id===selectedId));
      const sibs = parent ? parent.children : [root];
      const idx = sibs.findIndex(n=>n.id===selectedId);
      if (e.key==='ArrowLeft' && parent) { e.preventDefault(); onSelect(parent.id); }
      else if (e.key==='ArrowRight' && (cur.children||[]).length) { e.preventDefault(); onSelect(cur.children[0].id); }
      else if (e.key==='ArrowUp' && idx>0) { e.preventDefault(); onSelect(sibs[idx-1].id); }
      else if (e.key==='ArrowDown' && idx<sibs.length-1) { e.preventDefault(); onSelect(sibs[idx+1].id); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId, nodes]);

  /* ghost node position (under its parent's last slot) */
  let ghostPos = null;
  if (ghost) {
    const pp = pos[ghost.parentId];
    if (pp) ghostPos = { x: pp.x + COL, y: pp.y + ((ghost.siblingIndex||0)+1) * (ROW*0.55) };
  }

  const stars = useMemo(()=>Array.from({length:60},()=>({l:Math.random()*100,t:Math.random()*100,d:Math.random()*4})),[story]);

  return (
    <div ref={wrapRef} className="atlas-wrap"
      style={{ position:'relative', width:'100%', height:'100%', overflow:'hidden', cursor: drag.current?'grabbing':'grab', touchAction:'none' }}
      onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
      onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}>
      {/* night sky */}
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(120% 100% at 50% 0%, #34283c 0%, #2B2118 55%, #1c150e 100%)' }} />
      {stars.map((s,i)=><span key={i} className="atlas-star" style={{ left:s.l+'%', top:s.t+'%', animationDelay:s.d+'s' }} />)}

      {/* canvas */}
      <div style={{ position:'absolute', left:0, top:0, transform:`translate(${off.x}px,${off.y}px)`, width:w, height:h, transition: drag.current?'none':'transform .35s steps(6)' }}>
        {/* edges */}
        <svg style={{ position:'absolute', left:0, top:0, overflow:'visible', pointerEvents:'none' }} width={w} height={h} shapeRendering="crispEdges">
          {nodes.map(n => (n.children||[]).map(c => {
            const a = pos[n.id], b = pos[c.id]; if(!a||!b) return null;
            const active = activePath.has(n.id) && activePath.has(c.id);
            const midX = a.x+NODE_W + (b.x-(a.x+NODE_W))/2;
            const ay=a.y+40, by=b.y+40;
            const d = `M ${a.x+NODE_W} ${ay} H ${midX} V ${by} H ${b.x}`;
            return <path key={n.id+c.id} d={d} fill="none"
              stroke={active?'var(--lapis-bright)':'var(--stone)'} strokeWidth={active?4:3}
              style={ active ? { filter:'drop-shadow(0 0 5px var(--lapis-bright))' } : null } />;
          }))}
          {/* ghost connector */}
          {ghostPos && (() => { const a=pos[ghost.parentId]; if(!a) return null;
            const midX=a.x+NODE_W+(ghostPos.x-(a.x+NODE_W))/2;
            const d=`M ${a.x+NODE_W} ${a.y+40} H ${midX} V ${ghostPos.y+40} H ${ghostPos.x}`;
            return <path d={d} fill="none" stroke="var(--lapis)" strokeWidth={3} strokeDasharray="6 6"
              style={{ animation:'dashMarch .5s linear infinite' }} />; })()}
        </svg>

        {/* nodes */}
        {nodes.map(n => {
          const p = pos[n.id]; if(!p) return null;
          const kids = n.children||[];
          const onActive = activePath.has(n.id);
          const selected = n.id===selectedId;
          const isFork = kids.length>=2;
          const frozen = !selected; // excavated/revisitable glow on non-selected written nodes
          return (
            <div key={n.id}
              className={'node node--' + n.kind
                + (onActive?' node--active':'')
                + (selected?' node--selected':'')
                + (!selected && frozen?' node--frozen':'')
                + (justSnapped===n.id?' node--snap':'') }
              style={{ left:p.x, top:p.y }}
              tabIndex={0}
              onClick={()=>onSelect(n.id)}
              onKeyDown={(e)=>{ if(e.key==='Enter'){ onSelect(n.id); } }}>
              <span className="node__tag">
                {n.kind==='root' ? 'ROOT' : n.kind==='steered' ? '↳ STEERED' : '↳ BRANCH'}
              </span>
              <span className="node-title" style={{ display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{n.title}</span>
              {n.steer && <span className="caption" style={{ display:'block', marginTop:6, color:'#d07350', fontSize:10 }}>“{n.steer}”</span>}
              {isFork && <span className="node__seal"><Seal count={kids.length} /></span>}
              {n.kind==='steered' && <span className="node__seal--steer"><Seal variant="carnelian" /></span>}
              {justSnapped===n.id && <Dust />}
            </div>
          );
        })}

        {/* ghost (unsealing) node */}
        {ghostPos && (
          <div className="node node--ghost" style={{ left:ghostPos.x, top:ghostPos.y }}>
            <span className="node__tag">↳ UNSEALING…</span>
            <span className="node-title row center gap-2"><span className="pixspin" style={{width:16,height:16}}/> unsealing the scroll</span>
          </div>
        )}
      </div>

      {/* legend */}
      <div style={{ position:'absolute', left:0, right:0, bottom:0, background:'rgba(28,21,14,.82)', borderTop:'3px solid var(--stone)' }}>
        <Legend />
      </div>
    </div>
  );
}

function Dust() {
  const bits = Array.from({length:8},(_,i)=>({ a:(i/8)*Math.PI*2 }));
  return <div className="dust">{bits.map((b,i)=>(
    <i key={i} style={{ left:'50%', top:'50%', transform:`translate(${Math.cos(b.a)*30}px,${Math.sin(b.a)*30}px)`, animationDelay:(i*15)+'ms' }} />
  ))}</div>;
}

Object.assign(window, { Atlas, pathToRoot, computeLayout });
