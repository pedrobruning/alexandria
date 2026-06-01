/* ============================================================
   FORKLORE — shared components
   ============================================================ */
const { useState, useEffect, useRef, useCallback } = React;

/* ---- Pixel icons: built from rects on a 12x12 grid ---- */
const ICONS = {
  fork:   ['3,1,2,2','3,4,2,5','7,4,2,5','3,9,2,2','7,9,2,2','5,5,2,1','3,5,4,1','7,5,1,1'],
  share:  ['8,1,3,3','1,5,3,3','8,8,3,3','3,5,5,2','3,3,5,2'],
  back:   ['1,5,3,2','3,3,2,6','5,4,2,4','7,5,4,2'],
  trash:  ['3,1,6,2','1,3,10,2','3,5,1,6','5,5,1,6','7,5,1,6','2,11,8,1'],
  gear:   ['5,1,2,2','5,9,2,2','1,5,2,2','9,5,2,2','4,4,4,4','2,2,2,2','8,2,2,2','2,8,2,2','8,8,2,2'],
  plus:   ['5,2,2,8','2,5,8,2'],
  copy:   ['2,2,6,6','5,5,5,5'],
  link:   ['2,4,4,1','2,4,1,3','2,7,4,1','7,4,4,1','10,4,1,3','7,7,4,1','5,5,3,2'],
  eye:    ['4,2,4,1','2,4,1,4','10,4,1,4','4,9,4,1','3,3,1,1','8,3,1,1','3,8,1,1','8,8,1,1','5,4,3,4'],
  scroll: ['2,2,8,1','2,2,1,8','9,2,1,8','2,9,8,1','4,4,4,1','4,6,4,1'],
  star:   ['5,1,2,10','1,5,10,2','3,3,2,2','7,3,2,2','3,7,2,2','7,7,2,2'],
  check:  ['9,3,2,2','7,5,2,2','5,7,2,2','3,5,2,2','3,7,2,2','5,9,2,2'],
  x:      ['2,2,2,2','4,4,2,2','6,6,2,2','8,8,2,2','8,2,2,2','6,4,2,2','4,6,2,2','2,8,2,2'],
  flask:  ['4,1,4,2','5,3,2,3','3,6,6,5','3,11,6,1','4,8,4,2'],
};
function PixelIcon({ name, size = 18, color = 'currentColor', style }) {
  const rects = ICONS[name] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{ imageRendering:'pixelated', display:'block', ...style }} shapeRendering="crispEdges">
      {rects.map((r,i) => { const [x,y,w,h] = r.split(',').map(Number);
        return <rect key={i} x={x} y={y} width={w} height={h} fill={color} />; })}
    </svg>
  );
}

/* ---- Seal badge ---- */
function Seal({ count, variant }) {
  return <div className={'seal' + (variant==='carnelian' ? ' seal--carnelian':'')} title={variant==='carnelian'?'steered branch':'fork point'}>
    {variant === 'carnelian' ? <PixelIcon name="fork" size={12} color="#E8D5A8" /> : count}
  </div>;
}

/* ---- Toast ---- */
function Toast({ toast }) {
  if (!toast) return null;
  return <div className={'toast' + (toast.kind==='err' ? ' toast--err':'')}>
    <PixelIcon name={toast.kind==='err'?'x':'check'} size={16} color={toast.kind==='err'?'#d07350':'#E0A82E'} />
    <span>{toast.msg}</span>
  </div>;
}

/* ---- Spinner with themed label ---- */
function PixSpinner({ label }) {
  return <div className="row center gap-3">
    <div className="pixspin" />
    {label && <span style={{ fontFamily:'var(--font-pixel)', color:'var(--sand-light)', fontSize:14 }}>{label}</span>}
  </div>;
}

/* ---- Legend strip (atlas) ---- */
function Legend() {
  return <div className="row center gap-4 wrap" style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--muted)', padding:'8px 12px' }}>
    <span className="row center gap-2"><i style={{width:14,height:3,background:'var(--lapis-bright)',boxShadow:'0 0 6px var(--lapis-bright)'}}/> current timeline</span>
    <span className="row center gap-2"><span className="seal" style={{width:16,height:16,fontSize:9}}>2</span> fork point</span>
    <span className="row center gap-2"><i style={{width:10,height:10,border:'2px solid var(--lapis)',boxShadow:'0 0 6px var(--lapis)'}}/> excavated · free to revisit</span>
  </div>;
}

/* ============================================================
   HERO PIXEL PANORAMA (§7.1) — geometric blocks only
   Pharos lighthouse + Library against a sunset dune sky
   ============================================================ */
function PixelPanorama({ animate }) {
  const stars = React.useMemo(() => Array.from({length: 40}, () => ({
    left: Math.random()*100, top: Math.random()*45, d: Math.random()*4,
  })), []);
  return (
    <div className="panorama" style={{ position:'absolute', inset:0, overflow:'hidden' }}>
      {/* sky bands (stepped, no smooth gradient on chrome) */}
      <div style={{ position:'absolute', inset:0, background:
        'linear-gradient(180deg,#1d2740 0%,#1d2740 18%,#3a3358 18%,#3a3358 33%,#7a4a5a 33%,#7a4a5a 48%,#b56b4a 48%,#b56b4a 60%,#d98b4a 60%,#d98b4a 72%,#e0a82e 72%,#e0a82e 80%,#c9a876 80%,#c9a876 100%)' }} />
      {/* stars */}
      {stars.map((s,i) => <span key={i} className="atlas-star" style={{ left:s.left+'%', top:s.top+'%', animationDelay:s.d+'s', opacity:.6 }} />)}
      {/* sun disk */}
      <div style={{ position:'absolute', left:'50%', top:'52%', width:120, height:120, transform:'translate(-50%,-50%)',
        background:'#f4d06a', clipPath:'polygon(30% 0,70% 0,100% 30%,100% 70%,70% 100%,30% 100%,0 70%,0 30%)',
        boxShadow:'0 0 60px 20px rgba(244,208,106,.5)' }} />
      {/* distant library blocks (right) */}
      <Building x="62%" w={42} h={120} c="#5a4632" />
      <Building x="68%" w={56} h={160} c="#6b4f30" roof />
      <Building x="76%" w={40} h={110} c="#5a4632" />
      {/* Pharos lighthouse (left of center) */}
      <Pharos animate={animate} />
      {/* foreground dunes (stepped) */}
      <Dune bottom={0} c="#8a5e34" h={120} off={0} />
      <Dune bottom={0} c="#6b4f30" h={70} off={30} />
      <div style={{ position:'absolute', inset:0, boxShadow:'inset 0 -40px 80px rgba(43,33,24,.6), inset 0 40px 80px rgba(29,39,64,.4)', pointerEvents:'none' }} />
    </div>
  );
}
function Building({ x, w, h, c, roof }) {
  return <div style={{ position:'absolute', left:x, bottom:'18%', width:w, height:h, background:c,
    boxShadow:'inset 3px 3px 0 rgba(255,255,255,.08), inset -3px -3px 0 rgba(0,0,0,.4)' }}>
    {roof && <div style={{ position:'absolute', top:-14, left:'50%', transform:'translateX(-50%)', width:0, height:0,
      borderLeft:`${w/2}px solid transparent`, borderRight:`${w/2}px solid transparent`, borderBottom:'14px solid '+c }} />}
    {/* pixel windows */}
    <div style={{ position:'absolute', inset:'12px 8px', display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:6, opacity:.5 }}>
      {Array.from({length:6}).map((_,i)=><span key={i} style={{ background:'#1d2740', height:8 }} />)}
    </div>
  </div>;
}
function Pharos({ animate }) {
  return <div style={{ position:'absolute', left:'42%', bottom:'18%', transform:'translateX(-50%)', display:'flex', flexDirection:'column', alignItems:'center' }}>
    {/* beacon */}
    <div style={{ width:26, height:26, background:'#f4d06a', marginBottom:-2,
      boxShadow:'0 0 30px 8px rgba(244,208,106,.8)',
      animation: animate ? 'frozenPulse 2.4s ease-in-out infinite' : 'none' }} />
    {/* tiers */}
    <div style={{ width:30, height:54, background:'#c9a876', boxShadow:'inset 3px 0 0 #e8d5a8, inset -4px 0 0 #8a5e34' }} />
    <div style={{ width:42, height:70, background:'#b89a63', boxShadow:'inset 3px 0 0 #c9a876, inset -4px 0 0 #6b4f30' }} />
    <div style={{ width:58, height:90, background:'#a88a55', boxShadow:'inset 4px 0 0 #b89a63, inset -5px 0 0 #5a4632' }} />
  </div>;
}
function Dune({ c, h, off }) {
  // stepped dune from blocks
  const steps = 7;
  return <div style={{ position:'absolute', left:0, right:0, bottom:0, height:h+off, display:'flex', alignItems:'flex-end' }}>
    {Array.from({length:steps}).map((_,i)=>{
      const t = Math.sin((i/steps)*Math.PI);
      return <div key={i} style={{ flex:1, height: (h*t)+off*0.4+20, background:c,
        boxShadow:'inset 0 4px 0 rgba(255,255,255,.06)' }} />;
    })}
  </div>;
}

/* ---- small mini-atlas thumbnail for archive cards ---- */
function MiniAtlas({ tree }) {
  const nodes = flatten(tree).slice(0,6);
  const pos = [[8,20],[34,8],[34,32],[60,20],[60,40],[84,28]];
  return <svg viewBox="0 0 100 52" style={{ width:'100%', height:52, imageRendering:'pixelated' }} shapeRendering="crispEdges">
    {pos.slice(0,nodes.length).map((p,i)=> i>0 && <line key={'l'+i} x1={pos[Math.max(0,i-1)][0]+5} y1={pos[Math.max(0,i-1)][1]+3} x2={p[0]} y2={p[1]+3} stroke="#4A3B2A" strokeWidth="2" />)}
    {pos.slice(0,nodes.length).map((p,i)=>(
      <rect key={i} x={p[0]} y={p[1]} width="11" height="7"
        fill={i===0?'#2A6F97':'#3A2D20'} stroke={i%3===0?'#E0A82E':'#4A3B2A'} strokeWidth="1.5" />
    ))}
  </svg>;
}

Object.assign(window, { PixelIcon, Seal, Toast, PixSpinner, Legend, PixelPanorama, MiniAtlas });
