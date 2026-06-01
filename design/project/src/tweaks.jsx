/* ============================================================
   FORKLORE — Tweaks panel
   ============================================================ */
const FL_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "bodyFont": "Newsreader",
  "pixelFont": "Pixelify Sans",
  "readerSize": 19,
  "atlasGlow": true,
  "forceFail": false
}/*EDITMODE-END*/;

const BODY_FONTS = { 'Newsreader':"'Newsreader', Georgia, serif", 'Spectral':"'Spectral', Georgia, serif", 'Humanist sans':"'Optima', 'Segoe UI', system-ui, sans-serif" };
const PIXEL_FONTS = { 'Pixelify Sans':"'Pixelify Sans', monospace", 'Silkscreen':"'Silkscreen', monospace", 'VT323':"'VT323', monospace" };

function ForkloreTweaks({ onTweak }) {
  const [t, setTweak] = useTweaks(FL_TWEAK_DEFAULTS);

  React.useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--font-body', BODY_FONTS[t.bodyFont] || BODY_FONTS.Newsreader);
    r.setProperty('--font-pixel', PIXEL_FONTS[t.pixelFont] || PIXEL_FONTS['Pixelify Sans']);
    r.setProperty('--reader-prose', t.readerSize + 'px');
    document.body.classList.toggle('no-glow', !t.atlasGlow);
    onTweak && onTweak('forceFail', t.forceFail);
  }, [t]);

  return (
    <TweaksPanel>
      <TweakSection label="Reading surface" />
      <TweakRadio label="Body typeface" value={t.bodyFont}
        options={['Newsreader','Spectral','Humanist sans']}
        onChange={(v)=>setTweak('bodyFont', v)} />
      <TweakSlider label="Reader text" value={t.readerSize} min={16} max={24} step={1} unit="px"
        onChange={(v)=>setTweak('readerSize', v)} />
      <TweakSection label="Pixel chrome" />
      <TweakRadio label="UI pixel font" value={t.pixelFont}
        options={['Pixelify Sans','Silkscreen','VT323']}
        onChange={(v)=>setTweak('pixelFont', v)} />
      <TweakToggle label="Atlas glow & pulse" value={t.atlasGlow}
        onChange={(v)=>setTweak('atlasGlow', v)} />
      <TweakSection label="Demo" />
      <TweakToggle label="Force next unseal to fail" value={t.forceFail}
        onChange={(v)=>setTweak('forceFail', v)} />
    </TweaksPanel>
  );
}

window.ForkloreTweaks = ForkloreTweaks;
