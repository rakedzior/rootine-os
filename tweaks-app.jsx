/* ============================================================
   ROOTINE OS — Tweaks panel
   Applies theme / palette / font to <html> data-attributes live.
   ============================================================ */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "palette": "celadon",
  "headings": "serif",
  "radius": 20,
  "showFinance": true
}/*EDITMODE-END*/;

const PALETTES = {
  celadon: ['#6f9d84', '#bd8769', '#f4eee2'],
  sage:    ['#8a9b7c', '#c0a062', '#f4eee2'],
  misty:   ['#7d8a99', '#b09a86', '#f0ede6'],
  blush:   ['#c69a93', '#c9ad7e', '#f4eee2'],
};
const PALETTE_KEYS = Object.keys(PALETTES);

function RootineTweaks() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const r = document.documentElement;
    r.classList.add('theme-switching');
    r.setAttribute('data-theme', t.theme);
    r.setAttribute('data-palette', t.palette);
    r.setAttribute('data-font', t.headings);
    r.style.setProperty('--r-card', t.radius + 'px');
    r.style.setProperty('--r-mid', Math.max(8, t.radius - 6) + 'px');
    const fin = document.querySelectorAll('.col')[0];
    // finance is the 2nd card in the left column
    const finCard = fin ? fin.querySelectorAll('.card')[1] : null;
    if (finCard) finCard.style.display = t.showFinance ? '' : 'none';
    // force reflow, then re-enable transitions on the next frame
    void r.offsetHeight;
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => r.classList.remove('theme-switching')));
    return () => cancelAnimationFrame(id);
  }, [t.theme, t.palette, t.headings, t.radius, t.showFinance]);

  // map current palette key -> colors array for the swatch picker
  const curColors = PALETTES[t.palette] || PALETTES.celadon;
  const onPalette = (colors) => {
    const key = PALETTE_KEYS.find((k) => JSON.stringify(PALETTES[k]) === JSON.stringify(colors)) || 'celadon';
    setTweak('palette', key);
  };

  return (
    <TweaksPanel title="Ustawienia">
      <TweakSection label="Atmosfera" />
      <TweakRadio
        label="Motyw"
        value={t.theme}
        options={[{ value: 'light', label: 'Ciepły jasny' }, { value: 'dark', label: 'Ciepły ciemny' }]}
        onChange={(v) => setTweak('theme', v)}
      />
      <TweakColor
        label="Paleta"
        value={curColors}
        options={PALETTE_KEYS.map((k) => PALETTES[k])}
        onChange={onPalette}
      />

      <TweakSection label="Typografia" />
      <TweakRadio
        label="Nagłówki"
        value={t.headings}
        options={[{ value: 'serif', label: 'Szeryfowe' }, { value: 'sans', label: 'Bezszeryf.' }]}
        onChange={(v) => setTweak('headings', v)}
      />

      <TweakSection label="Forma" />
      <TweakSlider
        label="Zaokrąglenie kart"
        value={t.radius}
        min={8} max={28} step={1} unit="px"
        onChange={(v) => setTweak('radius', v)}
      />
      <TweakToggle
        label="Pokaż Puls finansów"
        value={t.showFinance}
        onChange={(v) => setTweak('showFinance', v)}
      />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById('tweaks-root')).render(<RootineTweaks />);
