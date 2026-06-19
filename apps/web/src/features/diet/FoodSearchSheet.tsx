import { useState, useRef, useEffect, useCallback } from 'react';
import { BottomSheet } from '@/components/BottomSheet';
import { searchProducts, fetchByBarcode } from './openFoodFacts';
import { useAddMealItem } from './hooks';
import type { OFFProduct } from './openFoodFacts';
import type { MealType } from './types';
import { MEAL_TYPE_LABELS } from './types';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultMealType?: MealType;
}

type Step = 'search' | 'detail' | 'manual' | 'scan';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];

export function FoodSearchSheet({ open, onClose, defaultMealType = 'other' }: Props) {
  const addItem = useAddMealItem();

  const [step, setStep] = useState<Step>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OFFProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<OFFProduct | null>(null);
  const [amount, setAmount] = useState('100');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);

  // Manual add fields
  const [manName, setManName] = useState('');
  const [manKcal, setManKcal] = useState('');
  const [manProtein, setManProtein] = useState('');
  const [manCarb, setManCarb] = useState('');
  const [manFat, setManFat] = useState('');
  const [manAmount, setManAmount] = useState('100');

  // Barcode scanning
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const [scanError, setScanError] = useState('');
  const [scanLoading, setScanLoading] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');

  const reset = useCallback(() => {
    setStep('search'); setQuery(''); setResults([]); setSelected(null);
    setAmount('100'); setMealType(defaultMealType); setManName(''); setManKcal('');
    setManProtein(''); setManCarb(''); setManFat(''); setManAmount('100');
    setScanError(''); setManualBarcode('');
  }, [defaultMealType]);

  // Stop camera when leaving scan step
  useEffect(() => {
    if (step !== 'scan' && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [step]);

  // Stop camera when sheet closes
  useEffect(() => {
    if (!open && streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, [open]);

  async function doSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await searchProducts(query);
      setResults(res);
    } finally {
      setSearching(false);
    }
  }

  function selectProduct(p: OFFProduct) {
    setSelected(p);
    setStep('detail');
  }

  function calcNutrient(per100: number): number {
    const g = parseFloat(amount) || 100;
    return Math.round((per100 * g) / 100 * 10) / 10;
  }

  async function addSelected() {
    if (!selected) return;
    const g = parseFloat(amount) || 100;
    await addItem.mutateAsync({
      name: `${selected.name} (${g}g)`,
      kcal: calcNutrient(selected.kcal),
      protein: calcNutrient(selected.protein),
      carb: calcNutrient(selected.carb),
      fat: calcNutrient(selected.fat),
      amount: g,
      meal_type: mealType,
    });
    reset();
    onClose();
  }

  async function addManual() {
    const name = manName.trim();
    const kcal = parseFloat(manKcal);
    if (!name || isNaN(kcal)) return;
    const g = parseFloat(manAmount) || 100;
    await addItem.mutateAsync({
      name,
      kcal,
      protein: parseFloat(manProtein) || 0,
      carb: parseFloat(manCarb) || 0,
      fat: parseFloat(manFat) || 0,
      amount: g,
      meal_type: mealType,
    });
    reset();
    onClose();
  }

  async function startScan() {
    setStep('scan');
    setScanError('');
    // Try BarcodeDetector first (Chrome/Android)
    if ('BarcodeDetector' in window) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'] });
        const scan = async () => {
          if (!videoRef.current || step !== 'scan') return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const barcode = codes[0].rawValue;
              if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
              await lookupBarcode(barcode);
              return;
            }
          } catch { /* continue */ }
          setTimeout(scan, 300);
        };
        setTimeout(scan, 500);
        return;
      } catch {
        setScanError('Nie można uruchomić kamery.');
      }
    } else {
      setScanError('Skanowanie wymaga Chrome na Androidzie. Wpisz kod kreskowy ręcznie poniżej.');
    }
  }

  async function lookupBarcode(barcode: string) {
    setScanLoading(true);
    try {
      const product = await fetchByBarcode(barcode);
      if (product) {
        selectProduct(product);
      } else {
        setScanError(`Nie znaleziono produktu dla kodu: ${barcode}`);
      }
    } finally {
      setScanLoading(false);
    }
  }

  const MealTypeSelector = () => (
    <div>
      <label className="bs-label">Posiłek</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {MEAL_TYPES.map((mt) => (
          <button
            key={mt}
            type="button"
            onClick={() => setMealType(mt)}
            style={{
              padding: '6px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
              fontFamily: 'var(--mono)', letterSpacing: '.05em',
              border: `1px solid ${mealType === mt ? 'var(--acc-a)' : 'var(--border)'}`,
              background: mealType === mt ? 'var(--acc-a-soft)' : 'transparent',
              color: mealType === mt ? 'var(--acc-a-ink)' : 'var(--ink-3)',
              fontWeight: mealType === mt ? 600 : 400,
            }}
          >
            {MEAL_TYPE_LABELS[mt]}
          </button>
        ))}
      </div>
    </div>
  );

  // ── SEARCH STEP ──
  if (step === 'search') return (
    <BottomSheet open={open} onClose={() => { reset(); onClose(); }} title="Dodaj produkt">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            className="bs-input"
            style={{ flex: 1 }}
            placeholder="Wyszukaj produkt…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch()}
            autoFocus
          />
          <button
            type="button"
            className="btn-primary"
            onClick={doSearch}
            disabled={searching}
            style={{ flexShrink: 0, padding: '0 16px' }}
          >
            {searching ? '…' : 'Szukaj'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={startScan}>
            📷 Skanuj kod
          </button>
          <button type="button" className="btn-ghost" style={{ flex: 1 }} onClick={() => setStep('manual')}>
            ✏️ Dodaj ręcznie
          </button>
        </div>

        {results.length === 0 && !searching && query && (
          <div className="agenda-empty">Brak wyników. Spróbuj po angielsku lub dodaj ręcznie.</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflowY: 'auto' }}>
          {results.map((p) => (
            <button
              key={p.code || p.name}
              type="button"
              onClick={() => selectProduct(p)}
              style={{
                textAlign: 'left', background: 'none', border: 'none',
                padding: '10px 8px', cursor: 'pointer', borderRadius: 8,
                borderBottom: '1px solid var(--border-soft)',
              }}
            >
              <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>{p.name}</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--mono)', marginTop: 2 }}>
                {p.kcal} kcal · B {p.protein}g · W {p.carb}g · T {p.fat}g &nbsp;(per 100g)
              </div>
            </button>
          ))}
        </div>
      </div>
    </BottomSheet>
  );

  // ── DETAIL STEP ──
  if (step === 'detail' && selected) return (
    <BottomSheet open={open} onClose={() => setStep('search')} title={selected.name}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--mono)' }}>
          Per 100g: {selected.kcal} kcal · B {selected.protein}g · W {selected.carb}g · T {selected.fat}g
        </div>

        <div>
          <label className="bs-label">Gramatura (g)</label>
          <input
            className="bs-input"
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
          />
        </div>

        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: 'var(--surface-inset)', fontSize: 13, color: 'var(--ink-2)',
        }}>
          <strong style={{ color: 'var(--acc-a)', fontFamily: 'var(--mono)', fontSize: 15 }}>
            {calcNutrient(selected.kcal)} kcal
          </strong>
          &nbsp;· B {calcNutrient(selected.protein)}g
          &nbsp;· W {calcNutrient(selected.carb)}g
          &nbsp;· T {calcNutrient(selected.fat)}g
        </div>

        <MealTypeSelector />

        <button
          type="button"
          className="btn-primary"
          onClick={addSelected}
          disabled={addItem.isPending}
          style={{ padding: '14px', fontSize: 15, fontWeight: 600 }}
        >
          {addItem.isPending ? 'Dodawanie…' : 'Dodaj do dziennika'}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setStep('search')}>
          ← Wróć
        </button>
      </div>
    </BottomSheet>
  );

  // ── SCAN STEP ──
  if (step === 'scan') return (
    <BottomSheet open={open} onClose={() => { setStep('search'); setScanError(''); }} title="Skanuj kod kreskowy">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {'BarcodeDetector' in window ? (
          <video
            ref={videoRef}
            style={{ width: '100%', borderRadius: 12, background: '#000', aspectRatio: '4/3' }}
            muted
            playsInline
          />
        ) : null}
        {scanError && <div className="auth-banner warn">{scanError}</div>}
        {scanLoading && <div className="agenda-empty">Wyszukiwanie produktu…</div>}
        <div>
          <label className="bs-label">Lub wpisz kod kreskowy</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={barcodeInputRef}
              className="bs-input"
              style={{ flex: 1 }}
              type="text"
              inputMode="numeric"
              placeholder="np. 5900259128713"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => lookupBarcode(manualBarcode)}
              disabled={!manualBarcode.trim() || scanLoading}
              style={{ flexShrink: 0, padding: '0 14px' }}
            >
              OK
            </button>
          </div>
        </div>
        <button type="button" className="btn-ghost" onClick={() => { setStep('search'); setScanError(''); }}>
          ← Wróć
        </button>
      </div>
    </BottomSheet>
  );

  // ── MANUAL STEP ──
  return (
    <BottomSheet open={open} onClose={() => setStep('search')} title="Dodaj produkt ręcznie">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input className="bs-input" placeholder="Nazwa produktu *" value={manName} onChange={(e) => setManName(e.target.value)} autoFocus />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <label className="bs-label">Kalorie *</label>
            <input className="bs-input" type="number" inputMode="decimal" placeholder="kcal" value={manKcal} onChange={(e) => setManKcal(e.target.value)} />
          </div>
          <div>
            <label className="bs-label">Gramatura (g)</label>
            <input className="bs-input" type="number" inputMode="decimal" value={manAmount} onChange={(e) => setManAmount(e.target.value)} />
          </div>
          <div>
            <label className="bs-label">Białko (g)</label>
            <input className="bs-input" type="number" inputMode="decimal" value={manProtein} onChange={(e) => setManProtein(e.target.value)} />
          </div>
          <div>
            <label className="bs-label">Węglowodany (g)</label>
            <input className="bs-input" type="number" inputMode="decimal" value={manCarb} onChange={(e) => setManCarb(e.target.value)} />
          </div>
          <div>
            <label className="bs-label">Tłuszcze (g)</label>
            <input className="bs-input" type="number" inputMode="decimal" value={manFat} onChange={(e) => setManFat(e.target.value)} />
          </div>
        </div>
        <MealTypeSelector />
        <button
          type="button"
          className="btn-primary"
          onClick={addManual}
          disabled={addItem.isPending || !manName.trim() || !manKcal}
          style={{ padding: '14px', fontSize: 15, fontWeight: 600 }}
        >
          {addItem.isPending ? 'Dodawanie…' : 'Dodaj produkt'}
        </button>
        <button type="button" className="btn-ghost" onClick={() => setStep('search')}>
          ← Wróć
        </button>
      </div>
    </BottomSheet>
  );
}
