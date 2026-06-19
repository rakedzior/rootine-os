import { useState } from 'react';
import { useIsFeatureVisible } from '@/features/config/useConfig';
import {
  useOfficeDocs, useAddOfficeDoc, useDeleteOfficeDoc,
  useInsurancePolicies, useAddInsurance, useDeleteInsurance,
  useVehicles, useAddVehicle, useDeleteVehicle,
  useVehicleServices, useAddVehicleService, useDeleteVehicleService,
  useB2bSettlements, useUpsertB2b, usePatchB2b,
  useEmployment, useAddEmployment, useDeleteEmployment,
  useVacations, useAddVacation, useDeleteVacation,
} from '@/features/office/hooks';
import { DOC_CATEGORIES, docStatus, type DocCategory } from '@/features/office/types';
import { logAudit } from '@/lib/audit';
import '@/styles/desk.css';

type Sec = 'dashboard' | 'dokumenty' | 'auto' | 'ubezpieczenia' | 'uop' | 'b2b' | 'urlopy';

const SECTIONS: { key: Sec; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'dokumenty', label: 'Dokumenty' },
  { key: 'auto', label: 'Auto' },
  { key: 'ubezpieczenia', label: 'Ubezpieczenia' },
  { key: 'uop', label: 'UoP' },
  { key: 'b2b', label: 'B2B' },
  { key: 'urlopy', label: 'Urlopy' },
];

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(d: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

function DueTag({ date }: { date: string | null }) {
  const d = daysUntil(date);
  if (d === null) return null;
  const color = d < 0 ? 'var(--acc-b)' : d <= 30 ? 'var(--ev-yellow)' : 'var(--acc-a)';
  const label = d < 0 ? `${Math.abs(d)}d po terminie` : d === 0 ? 'dziś' : `za ${d}d`;
  return <span style={{ fontSize: 11, color, marginLeft: 6 }}>{label}</span>;
}

export function BiuroScreen() {
  const showDocs = useIsFeatureVisible('office.documents_vault');
  const showInsurance = useIsFeatureVisible('office.insurance');
  const showVehicles = useIsFeatureVisible('office.vehicles');
  const showB2b = useIsFeatureVisible('office.b2b_settlements');
  const showEmployment = useIsFeatureVisible('office.employment');
  const showVacations = useIsFeatureVisible('office.vacations');

  const [sec, setSec] = useState<Sec>('dashboard');

  // Documents
  const docsQ = useOfficeDocs();
  const addDoc = useAddOfficeDoc();
  const delDoc = useDeleteOfficeDoc();
  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<DocCategory>('inne');
  const [docExp, setDocExp] = useState('');
  const [docNote, setDocNote] = useState('');
  const [docRef, setDocRef] = useState('');
  const [docFilter, setDocFilter] = useState<DocCategory | ''>('');

  // Insurance
  const insQ = useInsurancePolicies();
  const addIns = useAddInsurance();
  const delIns = useDeleteInsurance();
  const [insType, setInsType] = useState('OC');
  const [insInsurer, setInsInsurer] = useState('');
  const [insPremium, setInsPremium] = useState('');
  const [insEnd, setInsEnd] = useState('');

  // Vehicles
  const vehiclesQ = useVehicles();
  const addVeh = useAddVehicle();
  const delVeh = useDeleteVehicle();
  const [selectedVehId, setSelectedVehId] = useState<string | null>(null);
  const [vehName, setVehName] = useState('');
  const [vehPlate, setVehPlate] = useState('');
  const servicesQ = useVehicleServices(selectedVehId);
  const addSvc = useAddVehicleService();
  const delSvc = useDeleteVehicleService();
  const [svcType, setSvcType] = useState('przegląd');
  const [svcDue, setSvcDue] = useState('');
  const [svcCost, setSvcCost] = useState('');

  // B2B
  const b2bQ = useB2bSettlements();
  const upsertB2b = useUpsertB2b();
  const patchB2b = usePatchB2b();
  const [b2bMonth, setB2bMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [b2bZus, setB2bZus] = useState('');
  const [b2bPit, setB2bPit] = useState('');
  const [b2bVat, setB2bVat] = useState('');

  // Employment
  const empQ = useEmployment();
  const addEmp = useAddEmployment();
  const delEmp = useDeleteEmployment();
  const [empName, setEmpName] = useState('');
  const [empPos, setEmpPos] = useState('');
  const [empPoolInput, setEmpPoolInput] = useState('26');

  // Vacations
  const vacQ = useVacations();
  const addVac = useAddVacation();
  const delVac = useDeleteVacation();
  const [vacStart, setVacStart] = useState('');
  const [vacEnd, setVacEnd] = useState('');

  const docs = docsQ.data ?? [];
  const policies = insQ.data ?? [];
  const vehicles = vehiclesQ.data ?? [];
  const services = servicesQ.data ?? [];
  const b2bs = b2bQ.data ?? [];
  const emps = empQ.data ?? [];
  const vacs = vacQ.data ?? [];

  // Dashboard: upcoming deadlines
  const upcomingDocs = docs.filter((d) => d.expires_on).sort((a, b) => (a.expires_on ?? '').localeCompare(b.expires_on ?? '')).slice(0, 5);
  const upcomingPolicies = policies.filter((p) => p.end_date).sort((a, b) => (a.end_date ?? '').localeCompare(b.end_date ?? '')).slice(0, 5);
  const upcomingServices = services.filter((s) => s.due_on).sort((a, b) => (a.due_on ?? '').localeCompare(b.due_on ?? '')).slice(0, 5);

  const usedVacDays = vacs.filter((v) => v.type === 'wypoczynkowy').reduce((s, v) => s + v.days, 0);
  const empPool = emps[0]?.vacation_pool ?? 26;

  return (
    <div className="app" style={{ minHeight: 'auto' }}>
      <div className="biuro-subnav">
        {SECTIONS.map((s) => (
          <button key={s.key} className={`biuro-nav-btn${sec === s.key ? ' active' : ''}`} type="button" onClick={() => setSec(s.key)}>
            {s.label}
          </button>
        ))}
      </div>

      <main className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: 900 }}>
        <section className="col">

          {/* DASHBOARD */}
          {sec === 'dashboard' && (
            <>
              <article className="card">
                <div className="card-head"><div className="lhs"><span className="card-title">Najbliższe terminy</span></div></div>
                {upcomingDocs.length === 0 && upcomingPolicies.length === 0 && upcomingServices.length === 0 ? (
                  <div className="agenda-empty">Brak terminów — dodaj dokumenty, polisy i serwisy.</div>
                ) : (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {upcomingDocs.map((d) => (
                      <li key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span>📄 {d.name}</span>
                        <span>{fmt(d.expires_on)}<DueTag date={d.expires_on} /></span>
                      </li>
                    ))}
                    {upcomingPolicies.map((p) => (
                      <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span>🛡 {p.type} · {p.insurer}</span>
                        <span>{fmt(p.end_date)}<DueTag date={p.end_date} /></span>
                      </li>
                    ))}
                    {upcomingServices.map((s) => (
                      <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                        <span>🚗 {s.type}</span>
                        <span>{fmt(s.due_on)}<DueTag date={s.due_on} /></span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
              {showVacations && emps.length > 0 && (
                <article className="card">
                  <div className="card-head"><div className="lhs"><span className="card-title">Urlop — {new Date().getFullYear()}</span></div></div>
                  <div style={{ display: 'flex', gap: 24, fontSize: 20, fontWeight: 700, padding: '8px 0' }}>
                    <div><div className="tnum">{usedVacDays}</div><div style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-3)' }}>Wykorzystane</div></div>
                    <div><div className="tnum" style={{ color: 'var(--acc-a)' }}>{Math.max(0, empPool - usedVacDays)}</div><div style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-3)' }}>Pozostało</div></div>
                    <div><div className="tnum">{empPool}</div><div style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-3)' }}>Pula roczna</div></div>
                  </div>
                </article>
              )}
            </>
          )}

          {/* DOKUMENTY */}
          {sec === 'dokumenty' && showDocs && (
            <article className="card">
              <div className="card-head">
                <div className="lhs"><span className="card-title">Dokumenty</span></div>
                <span className="pill">{docs.length}</span>
              </div>

              {/* Category filter chips */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                <button type="button"
                  onClick={() => setDocFilter('')}
                  style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid ${docFilter === '' ? 'var(--acc-a)' : 'var(--border)'}`, background: docFilter === '' ? 'var(--acc-a-soft)' : 'transparent', color: docFilter === '' ? 'var(--acc-a-ink)' : 'var(--ink-3)', cursor: 'pointer' }}>
                  Wszystkie
                </button>
                {DOC_CATEGORIES.map((cat) => {
                  const count = docs.filter((d) => d.category === cat).length;
                  if (count === 0) return null;
                  return (
                    <button key={cat} type="button"
                      onClick={() => setDocFilter(cat)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, border: `1px solid ${docFilter === cat ? 'var(--acc-a)' : 'var(--border)'}`, background: docFilter === cat ? 'var(--acc-a-soft)' : 'transparent', color: docFilter === cat ? 'var(--acc-a-ink)' : 'var(--ink-3)', cursor: 'pointer' }}>
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Document list */}
              {(() => {
                const filtered = docFilter ? docs.filter((d) => d.category === docFilter) : docs;
                if (filtered.length === 0) return <div className="agenda-empty">{docFilter ? `Brak dokumentów w kategorii „${docFilter}".` : 'Brak dokumentów. Dodaj pierwszy poniżej.'}</div>;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    {filtered.map((d) => {
                      const status = docStatus(d.expires_on);
                      const statusColor = status === 'wygasły' ? 'var(--acc-b)' : status === 'wygasa niedługo' ? 'var(--ev-yellow, #f59e0b)' : 'var(--acc-a)';
                      return (
                        <div key={d.id} style={{ padding: '10px 12px', background: 'var(--surface-inset)', borderRadius: 10, borderLeft: `3px solid ${status ? statusColor : 'var(--border)'}` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: 14 }}>{d.name}</div>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4, fontSize: 11, color: 'var(--ink-3)' }}>
                                <span style={{ padding: '1px 7px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', fontFamily: 'var(--mono)' }}>{d.category}</span>
                                {status && <span style={{ color: statusColor, fontWeight: 600 }}>{status}</span>}
                                {d.expires_on && <span>wygasa {fmt(d.expires_on)}<DueTag date={d.expires_on} /></span>}
                              </div>
                              {d.note && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 4 }}>{d.note}</div>}
                              {d.ref_link && (
                                <a href={d.ref_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--acc-a)', marginTop: 4, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  🔗 {d.ref_link}
                                </a>
                              )}
                            </div>
                            <button type="button" onClick={() => { logAudit('document_access', { entity: d.id }); delDoc.mutate(d.id); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Add document form */}
              <div style={{ display: 'grid', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="fi" type="text" placeholder="Nazwa dokumentu *" value={docName} onChange={(e) => setDocName(e.target.value)} style={{ flex: 1 }} />
                  <select className="fi-sel" value={docCategory} onChange={(e) => setDocCategory(e.target.value as DocCategory)}
                    style={{ fontSize: 13, padding: '6px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'inherit', flexShrink: 0 }}>
                    {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="fi" type="date" value={docExp} onChange={(e) => setDocExp(e.target.value)} style={{ flex: 1 }} />
                  <input className="fi" type="text" placeholder="Link / URL (opcjonalnie)" value={docRef} onChange={(e) => setDocRef(e.target.value)} style={{ flex: 2 }} />
                </div>
                <input className="fi" type="text" placeholder="Notatka (opcjonalnie)" value={docNote} onChange={(e) => setDocNote(e.target.value)} />
                <button className="add-btn" type="button" style={{ width: '100%', padding: 10 }}
                  onClick={() => {
                    if (!docName.trim()) return;
                    addDoc.mutate({
                      name: docName.trim(),
                      category: docCategory,
                      expires_on: docExp || null,
                      note: docNote.trim() || null,
                      ref_link: docRef.trim() || null,
                    });
                    setDocName(''); setDocExp(''); setDocNote(''); setDocRef('');
                  }}>
                  + Dodaj dokument
                </button>
              </div>
            </article>
          )}

          {/* AUTO */}
          {sec === 'auto' && showVehicles && (
            <>
              <article className="card">
                <div className="card-head"><div className="lhs"><span className="card-title">Pojazdy</span></div><span className="pill">{vehicles.length}</span></div>
                {vehicles.length === 0 ? (
                  <div className="agenda-empty">Brak pojazdów.</div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {vehicles.map((v) => (
                      <div key={v.id} style={{ padding: '6px 12px', background: selectedVehId === v.id ? 'var(--acc-a)' : 'var(--surface-inset)', borderRadius: 'var(--r-sm)', cursor: 'pointer', color: selectedVehId === v.id ? '#fff' : 'inherit', fontSize: 13, display: 'flex', gap: 6, alignItems: 'center' }}
                        onClick={() => setSelectedVehId(selectedVehId === v.id ? null : v.id)}>
                        {v.name} {v.plate && <span style={{ fontSize: 11, opacity: 0.7 }}>{v.plate}</span>}
                        <button type="button" onClick={(e) => { e.stopPropagation(); delVeh.mutate(v.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="fi" type="text" placeholder="Marka / model" value={vehName} onChange={(e) => setVehName(e.target.value)} style={{ flex: 1 }} />
                  <input className="fi" type="text" placeholder="Tablice" value={vehPlate} onChange={(e) => setVehPlate(e.target.value)} style={{ width: 100 }} />
                  <button className="add-btn" type="button" onClick={() => { if (!vehName.trim()) return; addVeh.mutate({ name: vehName.trim(), plate: vehPlate || null }); setVehName(''); setVehPlate(''); }}>+</button>
                </div>
              </article>
              {selectedVehId && (
                <article className="card">
                  <div className="card-head"><div className="lhs"><span className="card-title">Historia serwisu · {vehicles.find((v) => v.id === selectedVehId)?.name}</span></div></div>
                  {services.length === 0 ? (
                    <div className="agenda-empty">Brak wpisów serwisowych.</div>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {services.map((s) => (
                        <li key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                          <div>
                            <span style={{ fontWeight: 500 }}>{s.type}</span>
                            <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 8 }}>{fmt(s.date)}</span>
                            {s.due_on && <span style={{ fontSize: 11, marginLeft: 8 }}>kolejny {fmt(s.due_on)}<DueTag date={s.due_on} /></span>}
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            {s.cost != null && <span className="tnum" style={{ fontSize: 12 }}>{s.cost} zł</span>}
                            <button type="button" onClick={() => delSvc.mutate(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <select className="fi-sel" value={svcType} onChange={(e) => setSvcType(e.target.value)} style={{ fontSize: 13, padding: '6px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'inherit' }}>
                      {['przegląd', 'OC', 'AC', 'serwis', 'opony', 'inne'].map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <input className="fi" type="date" placeholder="Data kolejna" value={svcDue} onChange={(e) => setSvcDue(e.target.value)} />
                    <input type="number" className="fi-num" placeholder="Koszt zł" value={svcCost} onChange={(e) => setSvcCost(e.target.value)} inputMode="decimal" />
                    <button className="add-btn" type="button" onClick={() => { addSvc.mutate({ vehicle_id: selectedVehId, type: svcType, due_on: svcDue || null, cost: svcCost ? parseFloat(svcCost) : null }); setSvcDue(''); setSvcCost(''); }}>+</button>
                  </div>
                </article>
              )}
            </>
          )}

          {/* UBEZPIECZENIA */}
          {sec === 'ubezpieczenia' && showInsurance && (
            <article className="card">
              <div className="card-head"><div className="lhs"><span className="card-title">Polisy ubezpieczeniowe</span></div><span className="pill">{policies.length}</span></div>
              {policies.length === 0 ? (
                <div className="agenda-empty">Brak polis.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {policies.map((p) => (
                    <li key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                      <div>
                        <span style={{ fontWeight: 500 }}>{p.type}</span>
                        <span style={{ color: 'var(--ink-3)', marginLeft: 8 }}>{p.insurer}</span>
                        {p.end_date && <span style={{ fontSize: 11, marginLeft: 8 }}>do {fmt(p.end_date)}<DueTag date={p.end_date} /></span>}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {p.premium != null && <span className="tnum" style={{ fontSize: 12 }}>{p.premium} zł/r</span>}
                        <button type="button" onClick={() => delIns.mutate(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <select className="fi-sel" value={insType} onChange={(e) => setInsType(e.target.value)} style={{ fontSize: 13, padding: '6px 8px', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'inherit' }}>
                  {['OC', 'AC', 'health', 'life', 'property', 'travel', 'other'].map((t) => <option key={t}>{t}</option>)}
                </select>
                <input className="fi" type="text" placeholder="Ubezpieczyciel" value={insInsurer} onChange={(e) => setInsInsurer(e.target.value)} style={{ flex: 1 }} />
                <input type="number" className="fi-num" placeholder="Składka zł/r" value={insPremium} onChange={(e) => setInsPremium(e.target.value)} inputMode="decimal" />
                <input className="fi" type="date" placeholder="Koniec" value={insEnd} onChange={(e) => setInsEnd(e.target.value)} />
                <button className="add-btn" type="button" onClick={() => { if (!insInsurer.trim()) return; addIns.mutate({ type: insType, insurer: insInsurer.trim(), premium: insPremium ? parseFloat(insPremium) : null, end_date: insEnd || null }); setInsInsurer(''); setInsPremium(''); setInsEnd(''); }}>+</button>
              </div>
            </article>
          )}

          {/* UoP */}
          {sec === 'uop' && showEmployment && (
            <article className="card">
              <div className="card-head"><div className="lhs"><span className="card-title">Umowa o pracę</span></div></div>
              {emps.length === 0 ? (
                <div className="agenda-empty">Brak danych UoP.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {emps.map((e) => (
                    <li key={e.id} style={{ padding: '8px 10px', background: 'var(--surface-inset)', borderRadius: 'var(--r-sm)', fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600 }}>{e.employer}</span>
                        <button type="button" onClick={() => delEmp.mutate(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                      </div>
                      {e.position && <div style={{ color: 'var(--ink-3)' }}>{e.position}</div>}
                      <div style={{ marginTop: 4 }}>Od: {fmt(e.start_date)} · Pula urlopu: {e.vacation_pool} dni/rok</div>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input className="fi" type="text" placeholder="Pracodawca*" value={empName} onChange={(e) => setEmpName(e.target.value)} style={{ flex: 1 }} />
                <input className="fi" type="text" placeholder="Stanowisko" value={empPos} onChange={(e) => setEmpPos(e.target.value)} style={{ flex: 1 }} />
                <input type="number" className="fi-num" placeholder="Pula urlopu" value={empPoolInput} onChange={(e) => setEmpPoolInput(e.target.value)} inputMode="numeric" />
                <button className="add-btn" type="button" onClick={() => { if (!empName.trim()) return; addEmp.mutate({ employer: empName.trim(), position: empPos || null, vacationPool: parseInt(empPoolInput) || 26 }); setEmpName(''); setEmpPos(''); }}>+</button>
              </div>
            </article>
          )}

          {/* B2B */}
          {sec === 'b2b' && showB2b && (
            <article className="card">
              <div className="card-head"><div className="lhs"><span className="card-title">Rozliczenia B2B / ZUS / PIT / VAT</span></div></div>
              {b2bs.length === 0 ? (
                <div className="agenda-empty">Brak rozliczeń.</div>
              ) : (
                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse', marginBottom: 14 }}>
                  <thead><tr style={{ color: 'var(--ink-3)', fontSize: 11 }}><th style={{ textAlign: 'left', padding: '4px 0' }}>Miesiąc</th><th>ZUS</th><th>PIT</th><th>VAT</th><th>Status</th><th /></tr></thead>
                  <tbody>
                    {b2bs.map((b) => (
                      <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '6px 0', fontWeight: 500 }}>{b.month}</td>
                        <td style={{ textAlign: 'center' }} className="tnum">{b.zus} zł</td>
                        <td style={{ textAlign: 'center' }} className="tnum">{b.pit} zł</td>
                        <td style={{ textAlign: 'center' }} className="tnum">{b.vat} zł</td>
                        <td style={{ textAlign: 'center' }}>
                          <button type="button" onClick={() => patchB2b.mutate({ id: b.id, patch: { status: b.status === 'paid' ? 'pending' : 'paid' } })}
                            style={{ fontSize: 11, padding: '2px 8px', borderRadius: 3, border: 'none', cursor: 'pointer', background: b.status === 'paid' ? 'var(--acc-a)' : 'var(--surface-inset)', color: b.status === 'paid' ? '#fff' : 'inherit' }}>
                            {b.status === 'paid' ? '✓ Zapłacono' : 'Oczekuje'}
                          </button>
                        </td>
                        <td />
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input className="fi" type="month" value={b2bMonth} onChange={(e) => setB2bMonth(e.target.value)} style={{ flex: '1 1 120px' }} />
                <input type="number" className="fi-num" placeholder="ZUS" value={b2bZus} onChange={(e) => setB2bZus(e.target.value)} inputMode="numeric" />
                <input type="number" className="fi-num" placeholder="PIT" value={b2bPit} onChange={(e) => setB2bPit(e.target.value)} inputMode="numeric" />
                <input type="number" className="fi-num" placeholder="VAT" value={b2bVat} onChange={(e) => setB2bVat(e.target.value)} inputMode="numeric" />
                <button className="add-btn" type="button" onClick={() => {
                  upsertB2b.mutate({ month: b2bMonth, zus: parseFloat(b2bZus) || 0, pit: parseFloat(b2bPit) || 0, vat: parseFloat(b2bVat) || 0 });
                  setB2bZus(''); setB2bPit(''); setB2bVat('');
                }}>+</button>
              </div>
            </article>
          )}

          {/* Urlopy */}
          {sec === 'urlopy' && showVacations && (
            <article className="card">
              <div className="card-head"><div className="lhs"><span className="card-title">Urlopy</span></div></div>
              {vacs.length === 0 ? (
                <div className="agenda-empty">Brak urlopów.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {vacs.map((v) => (
                    <li key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '6px 10px', background: 'var(--surface-inset)', borderRadius: 'var(--r-sm)' }}>
                      <span>{fmt(v.start_date)} – {fmt(v.end_date)} <span className="pill">{v.days} dni</span></span>
                      <button type="button" onClick={() => delVac.mutate(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)' }}>×</button>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input className="fi" type="date" value={vacStart} onChange={(e) => setVacStart(e.target.value)} style={{ flex: 1 }} />
                <input className="fi" type="date" value={vacEnd} onChange={(e) => setVacEnd(e.target.value)} style={{ flex: 1 }} />
                <button className="add-btn" type="button" onClick={() => {
                  if (!vacStart || !vacEnd) return;
                  const days = Math.round((new Date(vacEnd).getTime() - new Date(vacStart).getTime()) / 86400000) + 1;
                  addVac.mutate({ start_date: vacStart, end_date: vacEnd, days });
                  setVacStart(''); setVacEnd('');
                }}>+</button>
              </div>
            </article>
          )}
        </section>
      </main>
    </div>
  );
}
