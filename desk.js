/* ============================================================
   ROOTINE OS — BIURO  desk.js
   ============================================================ */
(function () {
  'use strict';

  /* ===== SEED DATA ===== */
  const SEED = {
    sprawy: [
      {id:1,title:'Opłacić ZUS za lipiec',category:'Firma',status:'Do zrobienia',priority:'Krytyczny',dueDate:'2026-08-20',notes:''},
      {id:2,title:'Opłacić VAT za lipiec',category:'Firma',status:'Do zrobienia',priority:'Krytyczny',dueDate:'2026-08-25',notes:''},
      {id:3,title:'Przegląd techniczny auta',category:'Auto',status:'Do zrobienia',priority:'Wysoki',dueDate:'2026-09-10',notes:''},
      {id:4,title:'Odnowić OC/AC · Warta',category:'Auto',status:'Do zrobienia',priority:'Wysoki',dueDate:'2026-07-14',notes:''},
      {id:5,title:'Odnowić paszport',category:'Urząd',status:'W toku',priority:'Wysoki',dueDate:'2026-08-31',notes:'Reguła 6 miesięcy przed podróżą'},
      {id:6,title:'Podjąć decyzję ws. najmu mieszkania',category:'Dom',status:'Oczekuje',priority:'Wysoki',dueDate:'2026-09-01',notes:'Koniec umowy 01.09.2026'},
    ],
    dokumenty: [
      {id:1,name:'Dowód osobisty',category:'Tożsamość',documentNumber:'ABC 123456',issueDate:'2020-03-15',validUntil:'2030-03-15',status:'Ważny',physicalLocation:'Portfel',notes:''},
      {id:2,name:'Paszport',category:'Tożsamość',documentNumber:'XY 1234567',issueDate:'2016-09-01',validUntil:'2026-09-01',status:'Wygasa',physicalLocation:'Szuflada w biurku',notes:'Odnów przed regułą 6 miesięcy'},
      {id:3,name:'Prawo jazdy kat. B',category:'Prawo jazdy',documentNumber:'PL 01234567',issueDate:'2012-06-10',validUntil:'2027-06-10',status:'Ważny',physicalLocation:'Portfel',notes:''},
      {id:4,name:'Dowód rejestracyjny Golf',category:'Auto',documentNumber:'KR 12345',issueDate:'2021-03-01',validUntil:'',status:'Ważny',physicalLocation:'Samochód',notes:''},
      {id:5,name:'Umowa B2B · Finanteq',category:'Firma',documentNumber:'FIN-2024-001',issueDate:'2024-01-15',validUntil:'2026-12-31',status:'Wygasa',physicalLocation:'Chmura',notes:'Negocjacje przed końcem roku'},
    ],
    umowy: [
      {id:1,name:'Prąd · Tauron',provider:'Tauron Polska Energia',category:'Media',startDate:'2023-01-01',endDate:'2026-12-31',noticePeriod:30,cost:320,paymentFrequency:'Miesięcznie',autoRenewal:false,status:'Aktywna',notes:''},
      {id:2,name:'Internet · Orange',provider:'Orange Polska',category:'Internet',startDate:'2024-03-01',endDate:'2027-03-01',noticePeriod:30,cost:70,paymentFrequency:'Miesięcznie',autoRenewal:true,status:'Aktywna',notes:''},
      {id:3,name:'Telefon · Play',provider:'Play (P4)',category:'Telefon',startDate:'2025-01-15',endDate:'2027-01-15',noticePeriod:30,cost:55,paymentFrequency:'Miesięcznie',autoRenewal:false,status:'Aktywna',notes:''},
      {id:4,name:'Najem mieszkania',provider:'Prywatny właściciel',category:'Mieszkanie',startDate:'2024-09-01',endDate:'2026-09-01',noticePeriod:60,cost:2400,paymentFrequency:'Miesięcznie',autoRenewal:false,status:'Do sprawdzenia',notes:'Koniec umowy wrzesień 2026'},
    ],
    car:{brand:'Volkswagen',model:'Golf VIII 1.5 eTSI',year:2021,vin:'WVWZZZ1KZMW123456',registrationNumber:'KR 12345',currentMileage:42800,purchaseDate:'2021-03-15',inspectionValidUntil:'2026-09-10',inspectionLastDate:'2024-09-10',ocProvider:'Warta',ocPolicyNumber:'PL-77231',ocValidFrom:'2025-07-14',ocValidUntil:'2026-07-14',ocPremium:2180,acProvider:'Warta',acPolicyNumber:'PL-77231',acValidFrom:'2025-07-14',acValidUntil:'2026-07-14',acPremium:0},
    carService:[
      {id:1,type:'Wymiana oleju',date:'2025-11-10',mileage:35000,cost:420,workshop:'ASO VW Kraków',nextDueDate:'2026-11-10',nextDueMileage:50000,notes:'5W-40 Castrol'},
      {id:2,type:'Wymiana opon (letnie)',date:'2026-04-12',mileage:41200,cost:180,workshop:'Oponiarnia Kraków',nextDueDate:'2026-10-15',nextDueMileage:0,notes:'Continental 205/55 R17'},
    ],
    ubezpieczenia:[
      {id:1,name:'OC/AC · Golf',type:'Auto',provider:'Warta',policyNumber:'PL-77231',validFrom:'2025-07-14',validUntil:'2026-07-14',premium:2180,frequency:'Rocznie',coverage:'OC + AC + Assistance',status:'Wygasa',notes:''},
      {id:2,name:'Mieszkanie · PZU',type:'Mieszkanie',provider:'PZU',policyNumber:'PZU-XX-11223',validFrom:'2025-11-03',validUntil:'2026-11-03',premium:640,frequency:'Rocznie',coverage:'Wyposażenie + OC',status:'Aktywna',notes:''},
      {id:3,name:'Zdrowie · Medicover',type:'Zdrowie',provider:'Medicover',policyNumber:'MC-XXXXX',validFrom:'2025-01-01',validUntil:'2026-12-31',premium:320,frequency:'Miesięcznie',coverage:'Pakiet rodzinny',status:'Aktywna',notes:''},
      {id:4,name:'Podróż · Allianz',type:'Podróż',provider:'Allianz',policyNumber:'ALZ-XXXXX',validFrom:'2026-03-01',validUntil:'2027-03-01',premium:410,frequency:'Rocznie',coverage:'Cały świat',status:'Aktywna',notes:''},
    ],
    uop:{companyName:'Przykładowy Pracodawca Sp. z o.o.',companyAddress:'ul. Krakowska 1, 30-001 Kraków',nip:'123-456-78-90',regon:'123456789',startDate:'2023-01-02',noticePeriod:1,salaryDay:28,vacationLimit:26,vacationCarryover:2},
    vacations:[
      {id:1,type:'Urlop wypoczynkowy',dateFrom:'2026-04-14',dateTo:'2026-04-17',workingDays:4,status:'Wykorzystany',notes:''},
      {id:2,type:'Urlop wypoczynkowy',dateFrom:'2026-06-02',dateTo:'2026-06-06',workingDays:5,status:'Wykorzystany',notes:'Majówka'},
      {id:3,type:'Urlop na żądanie',dateFrom:'2026-05-15',dateTo:'2026-05-15',workingDays:1,status:'Wykorzystany',notes:''},
      {id:4,type:'Urlop wypoczynkowy',dateFrom:'2026-08-10',dateTo:'2026-08-14',workingDays:5,status:'Planowany',notes:'Wakacje'},
    ],
    b2b:{companyName:'Jan Kowalski Konsulting IT',companyAddress:'ul. Floriańska 15/3, 31-021 Kraków',nip:'677-XXX-XX-21',regon:'36XXXX812',startDate:'2019-03-01'},
    settlements:[
      {id:1,month:7,year:2026,overallStatus:'W toku',totalAmountDue:6100,totalAmountPaid:0,nearestDeadline:'2026-07-31',notes:'',
        items:[{id:1,type:'invoice_issued',dueDate:'2026-07-31',amount:null,status:'Do zrobienia',completedDate:'',notes:''},{id:2,type:'documents_uploaded_to_accounting',dueDate:'2026-08-05',amount:null,status:'Do zrobienia',completedDate:'',notes:''},{id:3,type:'accounting_paid',dueDate:'2026-08-10',amount:300,status:'Do zapłaty',completedDate:'',notes:''},{id:4,type:'zus_paid',dueDate:'2026-08-20',amount:1800,status:'Do zapłaty',completedDate:'',notes:''},{id:5,type:'pit_paid',dueDate:'2026-08-20',amount:2400,status:'Do zapłaty',completedDate:'',notes:''},{id:6,type:'vat_paid',dueDate:'2026-08-25',amount:1600,status:'Do zapłaty',completedDate:'',notes:''}]},
      {id:2,month:6,year:2026,overallStatus:'Opłacone',totalAmountDue:5740,totalAmountPaid:5740,nearestDeadline:'',notes:'',
        items:[{id:1,type:'invoice_issued',dueDate:'2026-06-30',amount:null,status:'Opłacone',completedDate:'2026-06-28',notes:''},{id:2,type:'documents_uploaded_to_accounting',dueDate:'2026-07-05',amount:null,status:'Opłacone',completedDate:'2026-07-03',notes:''},{id:3,type:'accounting_paid',dueDate:'2026-07-10',amount:300,status:'Opłacone',completedDate:'2026-07-08',notes:''},{id:4,type:'zus_paid',dueDate:'2026-07-20',amount:1640,status:'Opłacone',completedDate:'2026-07-18',notes:''},{id:5,type:'pit_paid',dueDate:'2026-07-20',amount:2380,status:'Opłacone',completedDate:'2026-07-18',notes:''},{id:6,type:'vat_paid',dueDate:'2026-07-25',amount:1420,status:'Opłacone',completedDate:'2026-07-22',notes:''}]},
    ],
  };

  /* ===== STATE ===== */
  const KEY = 'rootine.desk.v2';
  let S = {};
  function load(){ try{ const d=JSON.parse(localStorage.getItem(KEY)); S=d||JSON.parse(JSON.stringify(SEED)); }catch(e){ S=JSON.parse(JSON.stringify(SEED)); } }
  function save(){ localStorage.setItem(KEY,JSON.stringify(S)); }
  function nid(arr){ return arr.length?Math.max(...arr.map(x=>x.id))+1:1; }

  /* ===== HELPERS ===== */
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmt(d){ if(!d) return '—'; const p=String(d).split('-'); return p.length===3?`${p[2]}.${p[1]}.${p[0]}`:'—'; }
  function dTo(d){ if(!d) return null; const n=new Date(); n.setHours(0,0,0,0); return Math.round((new Date(d)-n)/86400000); }
  function dLbl(n){ if(n===null) return '—'; if(n<0) return `${Math.abs(n)}d po term.`; if(n===0) return 'Dziś'; return `za ${n}d`; }
  const BM={'Do zrobienia':'badge-blue','W toku':'badge-lav','Oczekuje':'badge-gray','Zakończone':'badge-green','Po terminie':'badge-red','Krytyczny':'badge-red','Wysoki':'badge-orange','Średni':'badge-blue','Niski':'badge-gray','Ważny':'badge-green','Wygasa':'badge-orange','Wygasł':'badge-red','Aktywna':'badge-green','Do sprawdzenia':'badge-orange','Do wypowiedzenia':'badge-red','Zakończona':'badge-gray','Do zapłaty':'badge-orange','Opłacone':'badge-green','Nie dotyczy':'badge-gray','Oczekuje na kwotę':'badge-blue','Planowany':'badge-blue','Zatwierdzony':'badge-lav','Wykorzystany':'badge-green','Anulowany':'badge-gray','Nadchodzące':'badge-blue'};
  function bdg(s){ return `<span class="badge ${BM[s]||'badge-gray'}">${esc(s)}</span>`; }
  const MN=['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
  const B2BT={invoice_issued:'Wystawienie faktury',documents_uploaded_to_accounting:'Wgranie dokumentów do księgowości',accounting_paid:'Opłacenie księgowości',zus_paid:'Opłacenie ZUS',pit_paid:'Opłacenie PIT',vat_paid:'Opłacenie VAT'};
  const B2BST=['Nie dotyczy','Do zrobienia','Oczekuje na kwotę','Do zapłaty','Opłacone','Po terminie'];
  const SCAT=['Urząd','Auto','Dom','Firma','Praca','Zdrowie','Finanse','Inne'];
  const SPRI=['Niski','Średni','Wysoki','Krytyczny'];
  const SST=['Do zrobienia','W toku','Oczekuje','Zakończone'];
  const DCAT=['Tożsamość','Prawo jazdy','Auto','Firma','Praca','Zdrowie','Mieszkanie','Finanse','Inne'];
  const DST=['Ważny','Wygasa','Wygasł'];
  const UCAT=['Media','Internet','Telefon','Subskrypcje','Mieszkanie','Bank','Usługi','Inne'];
  const UST=['Aktywna','Do sprawdzenia','Do wypowiedzenia','Zakończona'];
  const ITYPE=['Życie','Zdrowie','Auto','Mieszkanie','Podróż','Firma','Inne'];
  const IST=['Aktywna','Wygasa','Wygasła'];
  const VACTYPE=['Urlop wypoczynkowy','Urlop na żądanie','Urlop okolicznościowy','L4','Inne'];
  const VACST=['Planowany','Zatwierdzony','Wykorzystany','Anulowany'];
  function into(id,html){ const el=document.getElementById(id); if(el) el.innerHTML=html; }

  /* ===== MODAL + FORM ===== */
  function modal(title,body,onSave){
    document.getElementById('biuro-modal').innerHTML=`<div class="modal-overlay" id="moverlay" onclick="if(event.target.id==='moverlay')window.closeModal()"><div class="modal-box">
      <div class="modal-head"><div class="modal-title">${esc(title)}</div><button class="modal-close" onclick="window.closeModal()">✕</button></div>
      <div class="modal-body">${body}</div>
      <div class="modal-foot"><button class="btn-secondary" onclick="window.closeModal()">Anuluj</button><button class="btn-primary" onclick="window._msave()">Zapisz</button></div>
    </div></div>`;
    window._msave=()=>{ if(onSave()!==false) window.closeModal(); };
  }
  window.closeModal=()=>{ document.getElementById('biuro-modal').innerHTML=''; };
  function fld(lbl,name,type,val,opts){
    const id='ff'+name,v=val==null?'':String(val);
    if(type==='select') return `<div class="form-group"><label for="${id}">${lbl}</label><select id="${id}" name="${name}">${opts.map(o=>`<option value="${esc(o)}"${v===String(o)?' selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
    if(type==='textarea') return `<div class="form-group"><label for="${id}">${lbl}</label><textarea id="${id}" name="${name}">${esc(v)}</textarea></div>`;
    if(type==='checkbox') return `<div class="form-group form-check"><label><input id="${id}" name="${name}" type="checkbox"${v?' checked':''}> ${lbl}</label></div>`;
    return `<div class="form-group"><label for="${id}">${lbl}</label><input id="${id}" name="${name}" type="${type}" value="${esc(v)}"></div>`;
  }
  function r2(...a){ return `<div class="form-row-2">${a.join('')}</div>`; }
  function gv(n){ const e=document.querySelector(`[name="${n}"]`); return e?(e.type==='checkbox'?e.checked:e.value.trim()):''; }
  const addBtn=label=>`<button class="btn-add" onclick="window._cur_add()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>${label}</button>`;

  /* ===== NAVIGATION ===== */
  const RENDERS={};
  window.deskGo=(id)=>showSec(id);
  function showSec(id){
    document.querySelectorAll('.biuro-sec').forEach(s=>s.classList.remove('active'));
    document.querySelectorAll('.biuro-nav-btn').forEach(b=>b.classList.remove('active'));
    const sec=document.getElementById('sec-'+id), btn=document.querySelector(`.biuro-nav-btn[data-sec="${id}"]`);
    if(sec) sec.classList.add('active');
    if(btn) btn.classList.add('active');
    if(RENDERS[id]) RENDERS[id]();
  }

  /* ===== DASHBOARD ===== */
  RENDERS.dashboard=function(){
    const now=new Date(); now.setHours(0,0,0,0);
    const overdue=S.sprawy.filter(t=>t.status!=='Zakończone'&&dTo(t.dueDate)<0);
    const expDocs=S.dokumenty.filter(d=>d.validUntil&&dTo(d.validUntil)<=30&&d.status!=='Wygasł');
    const urgContr=S.umowy.filter(u=>u.endDate&&dTo(u.endDate)<=90&&u.status!=='Zakończona');
    const vacUsed=S.vacations.filter(v=>v.status==='Wykorzystany').reduce((a,v)=>a+v.workingDays,0);
    const vacPlan=S.vacations.filter(v=>v.status==='Planowany').reduce((a,v)=>a+v.workingDays,0);
    const vacLeft=S.uop.vacationLimit+(S.uop.vacationCarryover||0)-vacUsed;
    let nextPay=new Date(now.getFullYear(),now.getMonth(),S.uop.salaryDay);
    if(nextPay<=now) nextPay=new Date(now.getFullYear(),now.getMonth()+1,S.uop.salaryDay);
    const payDays=Math.round((nextPay-now)/86400000);
    const curS=[...S.settlements].sort((a,b)=>b.year-a.year||b.month-a.month)[0];
    const dl=[];
    S.sprawy.forEach(t=>{ if(t.status!=='Zakończone'&&t.dueDate) dl.push({date:t.dueDate,area:'Sprawy',name:t.title,status:t.status,priority:t.priority,sec:'sprawy'}); });
    S.dokumenty.forEach(d=>{ if(d.validUntil&&d.status!=='Wygasł'){const n=dTo(d.validUntil);if(n<=180) dl.push({date:d.validUntil,area:'Dokumenty',name:d.name,status:d.status,priority:n<30?'Wysoki':'Średni',sec:'dokumenty'});} });
    S.umowy.forEach(u=>{ if(u.endDate&&u.status!=='Zakończona'){const n=dTo(u.endDate);if(n<=90) dl.push({date:u.endDate,area:'Umowy',name:u.name,status:u.status,priority:n<30?'Wysoki':'Średni',sec:'umowy'});} });
    S.settlements.forEach(s=>{ if(s.nearestDeadline&&s.overallStatus!=='Opłacone') dl.push({date:s.nearestDeadline,area:'B2B',name:`Rozliczenie ${MN[s.month-1]} ${s.year}`,status:s.overallStatus,priority:'Wysoki',sec:'b2b'}); });
    if(S.car.inspectionValidUntil&&dTo(S.car.inspectionValidUntil)<=90) dl.push({date:S.car.inspectionValidUntil,area:'Auto',name:'Przegląd techniczny',status:'Nadchodzące',priority:'Wysoki',sec:'auto'});
    if(S.car.ocValidUntil&&dTo(S.car.ocValidUntil)<=90) dl.push({date:S.car.ocValidUntil,area:'Auto',name:'OC/AC · '+S.car.ocProvider,status:'Wygasa',priority:'Wysoki',sec:'auto'});
    S.ubezpieczenia.forEach(u=>{ if(u.validUntil){const n=dTo(u.validUntil);if(n<=90) dl.push({date:u.validUntil,area:'Ubezpieczenia',name:u.name,status:u.status,priority:n<30?'Wysoki':'Średni',sec:'ubezpieczenia'});} });
    dl.sort((a,b)=>new Date(a.date)-new Date(b.date));
    const rows=dl.slice(0,12).map(d=>`<tr>
      <td><b>${fmt(d.date)}</b><br><small style="font-family:var(--mono);font-size:8.5px;color:var(--ink-3)">${dLbl(dTo(d.date))}</small></td>
      <td><span class="badge badge-gray">${esc(d.area)}</span></td>
      <td style="max-width:240px">${esc(d.name)}</td>
      <td>${bdg(d.status)}</td>
      <td>${bdg(d.priority)}</td>
      <td><button class="tact-btn" onclick="window.deskGo('${d.sec}')">Otwórz</button></td>
    </tr>`).join('');
    into('sec-dashboard',`
      <div class="sec-head"><div class="sec-head-lhs"><div class="sec-title">Dashboard · Biuro</div></div></div>
      ${overdue.length?`<div class="alert-strip"><span class="at">⚠ ${overdue.length} ${overdue.length===1?'sprawa':'spraw'} po terminie</span><button class="tact-btn" onclick="window.deskGo('sprawy')">Zobacz</button></div>`:''}
      <div class="dash-grid">
        <div class="dash-card${overdue.length?' alert':''}"><div class="dk">Sprawy po terminie</div><div class="dv">${overdue.length}</div><div class="dsub">${S.sprawy.filter(t=>t.status!=='Zakończone').length} aktywnych</div></div>
        <div class="dash-card${expDocs.length?' alert':''}"><div class="dk">Dokumenty wygasające</div><div class="dv">${expDocs.length}<small> /30d</small></div><div class="dsub">${S.dokumenty.length} śledzonych</div></div>
        <div class="dash-card${urgContr.length?' alert':''}"><div class="dk">Umowy do decyzji</div><div class="dv">${urgContr.length}<small> /90d</small></div><div class="dsub">${S.umowy.length} aktywnych</div></div>
        <div class="dash-card"><div class="dk">UoP · Urlop pozostały</div><div class="dv">${vacLeft}<small> dni</small></div><div class="dsub">${vacUsed} wykorz. · ${vacPlan} plan.</div></div>
        <div class="dash-card"><div class="dk">UoP · Następna wypłata</div><div class="dv">${payDays}<small> dni</small></div><div class="dsub">${fmt(nextPay.toISOString().split('T')[0])}</div></div>
        ${curS?`<div class="dash-card${curS.overallStatus!=='Opłacone'?' alert':''}"><div class="dk">B2B · ${MN[curS.month-1]} ${curS.year}</div><div class="dv">${((curS.totalAmountDue||0)-(curS.totalAmountPaid||0)).toLocaleString('pl')}<small> zł</small></div><div class="dsub">${bdg(curS.overallStatus)}</div></div>`:''}
      </div>
      <div class="card"><div class="card-head"><div class="lhs"><span class="idx">—</span><span class="card-title">Najbliższe terminy</span></div><span class="pill">${dl.length} łącznie</span></div>
        <div style="overflow-x:auto"><table class="biuro-table"><thead><tr><th>Termin</th><th>Obszar</th><th>Nazwa</th><th>Status</th><th>Priorytet</th><th></th></tr></thead>
        <tbody>${rows||'<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--ink-3)">Brak nadchodzących terminów</td></tr>'}</tbody></table></div>
      </div>`);
  };

  /* ===== SPRAWY ===== */
  RENDERS.sprawy=function(){
    let sf={status:'all',cat:'all',pri:'all'};
    function sl(){
      let items=[...S.sprawy];
      if(sf.status!=='all') items=items.filter(t=>t.status===sf.status);
      if(sf.cat!=='all') items=items.filter(t=>t.category===sf.cat);
      if(sf.pri!=='all') items=items.filter(t=>t.priority===sf.pri);
      const po={'Krytyczny':0,'Wysoki':1,'Średni':2,'Niski':3};
      items.sort((a,b)=>(po[a.priority]||9)-(po[b.priority]||9));
      const rows=items.map(t=>`<tr>
        <td><b>${esc(t.title)}</b>${t.notes?`<br><small style="color:var(--ink-3);font-size:11px">${esc(t.notes)}</small>`:''}</td>
        <td><span class="badge badge-gray">${esc(t.category)}</span></td>
        <td>${bdg(t.status)}</td><td>${bdg(t.priority)}</td>
        <td style="${dTo(t.dueDate)<0?'color:var(--acc-b-ink);font-weight:600':''}">${fmt(t.dueDate)}</td>
        <td><div class="tact"><button class="tact-btn" onclick="window._sEd(${t.id})">Edytuj</button><button class="tact-btn" onclick="window._sDn(${t.id})">${t.status==='Zakończone'?'Wznów':'Zakończ'}</button><button class="tact-btn danger" onclick="window._sDl(${t.id})">Usuń</button></div></td>
      </tr>`).join('');
      into('s-rows',rows||`<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--ink-3)">Brak spraw</td></tr>`);
      const c=document.getElementById('s-cnt'); if(c) c.textContent=items.length+' spraw';
    }
    into('sec-sprawy',`<div class="sec-head"><div class="sec-head-lhs"><div class="sec-title">Sprawy</div><div class="sec-count" id="s-cnt"></div></div>
      <button class="btn-add" onclick="window._sAd()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>Dodaj sprawę</button></div>
      <div class="filter-bar">
        <select class="filter-select" onchange="window._sF('status',this.value)"><option value="all">Wszystkie statusy</option>${SST.map(s=>`<option>${s}</option>`).join('')}</select>
        <select class="filter-select" onchange="window._sF('cat',this.value)"><option value="all">Wszystkie kategorie</option>${SCAT.map(s=>`<option>${s}</option>`).join('')}</select>
        <select class="filter-select" onchange="window._sF('pri',this.value)"><option value="all">Wszystkie priorytety</option>${SPRI.map(s=>`<option>${s}</option>`).join('')}</select>
      </div>
      <div class="card"><div style="overflow-x:auto"><table class="biuro-table"><thead><tr><th>Sprawa</th><th>Kategoria</th><th>Status</th><th>Priorytet</th><th>Termin</th><th></th></tr></thead><tbody id="s-rows"></tbody></table></div></div>`);
    sl();
    window._sF=(k,v)=>{ sf[k]=v; sl(); };
    const sF=t=>`<div class="form-grid">${fld('Nazwa sprawy','title','text',t.title)}${r2(fld('Kategoria','category','select',t.category||'Firma',SCAT),fld('Status','status','select',t.status||'Do zrobienia',SST))}${r2(fld('Priorytet','priority','select',t.priority||'Średni',SPRI),fld('Termin','dueDate','date',t.dueDate))}${fld('Notatki','notes','textarea',t.notes)}</div>`;
    window._sAd=()=>modal('Dodaj sprawę',sF({}),()=>{ const v=gv('title'); if(!v) return false; S.sprawy.push({id:nid(S.sprawy),title:v,category:gv('category'),status:gv('status')||'Do zrobienia',priority:gv('priority')||'Średni',dueDate:gv('dueDate'),notes:gv('notes')}); save(); sl(); });
    window._sEd=id=>{ const t=S.sprawy.find(x=>x.id===id); if(!t) return; modal('Edytuj sprawę',sF(t),()=>{ Object.assign(t,{title:gv('title'),category:gv('category'),status:gv('status'),priority:gv('priority'),dueDate:gv('dueDate'),notes:gv('notes')}); if(!t.title) return false; save(); sl(); }); };
    window._sDn=id=>{ const t=S.sprawy.find(x=>x.id===id); if(!t) return; t.status=t.status==='Zakończone'?'Do zrobienia':'Zakończone'; save(); sl(); };
    window._sDl=id=>{ if(!confirm('Usuń sprawę?')) return; S.sprawy=S.sprawy.filter(x=>x.id!==id); save(); sl(); };
  };

  /* ===== DOKUMENTY ===== */
  RENDERS.dokumenty=function(){
    let df={status:'all',cat:'all'};
    function dl(){
      let items=[...S.dokumenty];
      if(df.status!=='all') items=items.filter(d=>d.status===df.status);
      if(df.cat!=='all') items=items.filter(d=>d.category===df.cat);
      const rows=items.map(d=>`<tr>
        <td><b>${esc(d.name)}</b></td>
        <td><span class="badge badge-gray">${esc(d.category)}</span></td>
        <td style="font-family:var(--mono);font-size:11px">${esc(d.documentNumber)||'—'}</td>
        <td>${bdg(d.status)}</td>
        <td style="${d.validUntil&&dTo(d.validUntil)<30?'color:var(--acc-b-ink);font-weight:600':''}">${fmt(d.validUntil)||'—'}</td>
        <td style="font-size:11px;color:var(--ink-3)">${esc(d.physicalLocation)}</td>
        <td><div class="tact"><button class="tact-btn" onclick="window._dEd(${d.id})">Edytuj</button><button class="tact-btn danger" onclick="window._dDl(${d.id})">Usuń</button></div></td>
      </tr>`).join('');
      into('d-rows',rows||`<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ink-3)">Brak dokumentów</td></tr>`);
    }
    into('sec-dokumenty',`<div class="sec-head"><div class="sec-head-lhs"><div class="sec-title">Dokumenty</div></div>
      <button class="btn-add" onclick="window._dAd()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>Dodaj dokument</button></div>
      <div class="filter-bar">
        <select class="filter-select" onchange="window._dF('status',this.value)"><option value="all">Wszystkie statusy</option>${DST.map(s=>`<option>${s}</option>`).join('')}</select>
        <select class="filter-select" onchange="window._dF('cat',this.value)"><option value="all">Wszystkie kategorie</option>${DCAT.map(s=>`<option>${s}</option>`).join('')}</select>
      </div>
      <div class="card"><div style="overflow-x:auto"><table class="biuro-table"><thead><tr><th>Nazwa</th><th>Kategoria</th><th>Numer</th><th>Status</th><th>Ważny do</th><th>Lokalizacja</th><th></th></tr></thead><tbody id="d-rows"></tbody></table></div></div>`);
    dl();
    window._dF=(k,v)=>{ df[k]=v; dl(); };
    const dF=d=>`<div class="form-grid">${fld('Nazwa dokumentu','name','text',d.name)}${r2(fld('Kategoria','category','select',d.category||'Tożsamość',DCAT),fld('Status','status','select',d.status||'Ważny',DST))}${r2(fld('Numer dokumentu','documentNumber','text',d.documentNumber),fld('Data wydania','issueDate','date',d.issueDate))}${r2(fld('Ważny do','validUntil','date',d.validUntil),fld('Lokalizacja fizyczna','physicalLocation','text',d.physicalLocation))}${fld('Notatki','notes','textarea',d.notes)}</div>`;
    window._dAd=()=>modal('Dodaj dokument',dF({}),()=>{ const v=gv('name'); if(!v) return false; S.dokumenty.push({id:nid(S.dokumenty),name:v,category:gv('category'),documentNumber:gv('documentNumber'),issueDate:gv('issueDate'),validUntil:gv('validUntil'),status:gv('status')||'Ważny',physicalLocation:gv('physicalLocation'),notes:gv('notes')}); save(); dl(); });
    window._dEd=id=>{ const d=S.dokumenty.find(x=>x.id===id); if(!d) return; modal('Edytuj dokument',dF(d),()=>{ Object.assign(d,{name:gv('name'),category:gv('category'),documentNumber:gv('documentNumber'),issueDate:gv('issueDate'),validUntil:gv('validUntil'),status:gv('status'),physicalLocation:gv('physicalLocation'),notes:gv('notes')}); if(!d.name) return false; save(); dl(); }); };
    window._dDl=id=>{ if(!confirm('Usuń dokument?')) return; S.dokumenty=S.dokumenty.filter(x=>x.id!==id); save(); dl(); };
  };

  /* ===== UMOWY ===== */
  RENDERS.umowy=function(){
    let uf={status:'all'};
    function ul(){
      let items=[...S.umowy]; if(uf.status!=='all') items=items.filter(u=>u.status===uf.status);
      const rows=items.map(u=>`<tr>
        <td><b>${esc(u.name)}</b><br><small style="color:var(--ink-3)">${esc(u.provider)}</small></td>
        <td><span class="badge badge-gray">${esc(u.category)}</span></td>
        <td>${bdg(u.status)}</td>
        <td style="font-family:var(--mono)">${u.cost?u.cost.toLocaleString('pl')+' zł':'—'}&nbsp;<small style="color:var(--ink-3)">${esc(u.paymentFrequency)}</small></td>
        <td>${fmt(u.startDate)}</td>
        <td style="${u.endDate&&dTo(u.endDate)<30?'color:var(--acc-b-ink);font-weight:600':''}">${fmt(u.endDate)}</td>
        <td><div class="tact"><button class="tact-btn" onclick="window._uEd(${u.id})">Edytuj</button><button class="tact-btn danger" onclick="window._uDl(${u.id})">Usuń</button></div></td>
      </tr>`).join('');
      into('u-rows',rows||`<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ink-3)">Brak umów</td></tr>`);
    }
    into('sec-umowy',`<div class="sec-head"><div class="sec-head-lhs"><div class="sec-title">Umowy</div></div>
      <button class="btn-add" onclick="window._uAd()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>Dodaj umowę</button></div>
      <div class="filter-bar"><select class="filter-select" onchange="window._uF('status',this.value)"><option value="all">Wszystkie statusy</option>${UST.map(s=>`<option>${s}</option>`).join('')}</select></div>
      <div class="card"><div style="overflow-x:auto"><table class="biuro-table"><thead><tr><th>Nazwa / Dostawca</th><th>Kategoria</th><th>Status</th><th>Koszt</th><th>Start</th><th>Koniec</th><th></th></tr></thead><tbody id="u-rows"></tbody></table></div></div>`);
    ul();
    window._uF=(k,v)=>{ uf[k]=v; ul(); };
    const uF=u=>`<div class="form-grid">${r2(fld('Nazwa umowy','name','text',u.name),fld('Dostawca','provider','text',u.provider))}${r2(fld('Kategoria','category','select',u.category||'Media',UCAT),fld('Status','status','select',u.status||'Aktywna',UST))}${r2(fld('Data startu','startDate','date',u.startDate),fld('Data końca','endDate','date',u.endDate))}${r2(fld('Koszt (zł)','cost','number',u.cost),fld('Częstotliwość','paymentFrequency','select',u.paymentFrequency||'Miesięcznie',['Miesięcznie','Kwartalnie','Rocznie','Jednorazowo']))}${r2(fld('Okres wypowiedzenia (dni)','noticePeriod','number',u.noticePeriod),fld('Autoodnawianie','autoRenewal','checkbox',u.autoRenewal))}${fld('Notatki','notes','textarea',u.notes)}</div>`;
    window._uAd=()=>modal('Dodaj umowę',uF({}),()=>{ const v=gv('name'); if(!v) return false; S.umowy.push({id:nid(S.umowy),name:v,provider:gv('provider'),category:gv('category'),startDate:gv('startDate'),endDate:gv('endDate'),noticePeriod:+gv('noticePeriod'),cost:+gv('cost'),paymentFrequency:gv('paymentFrequency'),autoRenewal:gv('autoRenewal'),status:gv('status')||'Aktywna',notes:gv('notes')}); save(); ul(); });
    window._uEd=id=>{ const u=S.umowy.find(x=>x.id===id); if(!u) return; modal('Edytuj umowę',uF(u),()=>{ Object.assign(u,{name:gv('name'),provider:gv('provider'),category:gv('category'),startDate:gv('startDate'),endDate:gv('endDate'),noticePeriod:+gv('noticePeriod'),cost:+gv('cost'),paymentFrequency:gv('paymentFrequency'),autoRenewal:gv('autoRenewal'),status:gv('status'),notes:gv('notes')}); if(!u.name) return false; save(); ul(); }); };
    window._uDl=id=>{ if(!confirm('Usuń umowę?')) return; S.umowy=S.umowy.filter(x=>x.id!==id); save(); ul(); };
  };

  /* ===== AUTO ===== */
  RENDERS.auto=function(){
    function aR(){
      const c=S.car;
      const inspD=dTo(c.inspectionValidUntil), ocD=dTo(c.ocValidUntil);
      const srvRows=[...S.carService].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(s=>`<tr>
        <td><b>${esc(s.type)}</b></td><td>${fmt(s.date)}</td>
        <td style="font-family:var(--mono)">${s.mileage?s.mileage.toLocaleString('pl')+' km':'—'}</td>
        <td style="font-family:var(--mono)">${s.cost?s.cost.toLocaleString('pl')+' zł':'—'}</td>
        <td>${esc(s.workshop)}</td>
        <td style="${s.nextDueDate&&dTo(s.nextDueDate)<30?'color:var(--acc-b-ink);font-weight:600':''}">${fmt(s.nextDueDate)}</td>
        <td><div class="tact"><button class="tact-btn" onclick="window._aEd(${s.id})">Edytuj</button><button class="tact-btn danger" onclick="window._aDl(${s.id})">Usuń</button></div></td>
      </tr>`).join('');
      into('sec-auto',`<div class="sec-head"><div class="sec-head-lhs"><div class="sec-title">Auto</div></div><button class="tact-btn" onclick="window._aEc()">Edytuj dane auta</button></div>
        <div class="data-card">
          <div class="data-card-head"><div class="data-card-title">${esc(c.brand)} ${esc(c.model)}</div><span class="badge badge-gray">${c.year}</span></div>
          <div class="auto-specs">
            <div class="auto-spec-cell"><div class="k">Rejestracja</div><div class="v">${esc(c.registrationNumber)}</div></div>
            <div class="auto-spec-cell"><div class="k">Przebieg</div><div class="v">${c.currentMileage?c.currentMileage.toLocaleString('pl')+' km':'—'}</div></div>
            <div class="auto-spec-cell"><div class="k">VIN</div><div class="v" style="font-size:11px;font-family:var(--mono)">${esc(c.vin)}</div></div>
            <div class="auto-spec-cell"><div class="k">Data zakupu</div><div class="v">${fmt(c.purchaseDate)}</div></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div class="data-card" style="margin-bottom:0"><div class="data-card-head"><div class="data-card-title">Przegląd techniczny</div>${bdg(inspD!==null&&inspD<30?'Wygasa':'Aktywna')}</div>
            <div class="data-grid">
              <div class="data-cell"><div class="k">Ważny do</div><div class="v" style="${inspD!==null&&inspD<30?'color:var(--acc-b-ink)':''}">${fmt(c.inspectionValidUntil)}</div></div>
              <div class="data-cell"><div class="k">Ostatni</div><div class="v">${fmt(c.inspectionLastDate)}</div></div>
            </div>
          </div>
          <div class="data-card" style="margin-bottom:0"><div class="data-card-head"><div class="data-card-title">OC / AC</div>${bdg(ocD!==null&&ocD<30?'Wygasa':'Aktywna')}</div>
            <div class="data-grid">
              <div class="data-cell"><div class="k">Ubezpieczyciel</div><div class="v">${esc(c.ocProvider)}</div></div>
              <div class="data-cell"><div class="k">Numer polisy</div><div class="v" style="font-family:var(--mono);font-size:12px">${esc(c.ocPolicyNumber)}</div></div>
              <div class="data-cell"><div class="k">Ważna do</div><div class="v" style="${ocD!==null&&ocD<30?'color:var(--acc-b-ink)':''}">${fmt(c.ocValidUntil)}</div></div>
              <div class="data-cell"><div class="k">Składka</div><div class="v">${c.ocPremium?c.ocPremium.toLocaleString('pl')+' zł':'—'}</div></div>
            </div>
          </div>
        </div>
        <div class="card"><div class="card-head"><div class="lhs"><span class="idx">—</span><span class="card-title">Historia serwisowa</span></div>
          <button class="btn-add" onclick="window._aAs()" style="font-size:10px;padding:6px 12px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px"><path d="M12 5v14M5 12h14"/></svg>Dodaj</button></div>
          <div style="overflow-x:auto"><table class="biuro-table"><thead><tr><th>Typ</th><th>Data</th><th>Przebieg</th><th>Koszt</th><th>Warsztat</th><th>Następny termin</th><th></th></tr></thead>
          <tbody>${srvRows||'<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ink-3)">Brak wpisów serwisowych</td></tr>'}</tbody></table></div>
        </div>`);
    }
    aR();
    const cF=c=>`<div class="form-grid">${r2(fld('Marka','brand','text',c.brand),fld('Model','model','text',c.model))}${r2(fld('Rok','year','number',c.year),fld('Nr rejestracyjny','registrationNumber','text',c.registrationNumber))}${r2(fld('Przebieg (km)','currentMileage','number',c.currentMileage),fld('Data zakupu','purchaseDate','date',c.purchaseDate))}${fld('VIN','vin','text',c.vin)}${r2(fld('Przegląd ważny do','inspectionValidUntil','date',c.inspectionValidUntil),fld('Przegląd ostatni','inspectionLastDate','date',c.inspectionLastDate))}${r2(fld('OC/AC ubezpieczyciel','ocProvider','text',c.ocProvider),fld('OC/AC nr polisy','ocPolicyNumber','text',c.ocPolicyNumber))}${r2(fld('OC/AC ważna od','ocValidFrom','date',c.ocValidFrom),fld('OC/AC ważna do','ocValidUntil','date',c.ocValidUntil))}${fld('OC/AC składka (zł)','ocPremium','number',c.ocPremium)}</div>`;
    window._aEc=()=>modal('Dane auta',cF(S.car),()=>{ Object.assign(S.car,{brand:gv('brand'),model:gv('model'),year:+gv('year'),registrationNumber:gv('registrationNumber'),currentMileage:+gv('currentMileage'),purchaseDate:gv('purchaseDate'),vin:gv('vin'),inspectionValidUntil:gv('inspectionValidUntil'),inspectionLastDate:gv('inspectionLastDate'),ocProvider:gv('ocProvider'),ocPolicyNumber:gv('ocPolicyNumber'),ocValidFrom:gv('ocValidFrom'),ocValidUntil:gv('ocValidUntil'),ocPremium:+gv('ocPremium')}); save(); aR(); });
    const sF=s=>`<div class="form-grid">${fld('Typ serwisu','type','text',s.type)}${r2(fld('Data','date','date',s.date),fld('Przebieg (km)','mileage','number',s.mileage))}${r2(fld('Koszt (zł)','cost','number',s.cost),fld('Warsztat','workshop','text',s.workshop))}${r2(fld('Następny termin','nextDueDate','date',s.nextDueDate),fld('Następny przebieg (km)','nextDueMileage','number',s.nextDueMileage))}${fld('Notatki','notes','textarea',s.notes)}</div>`;
    window._aAs=()=>modal('Dodaj wpis serwisowy',sF({}),()=>{ const v=gv('type'); if(!v) return false; S.carService.push({id:nid(S.carService),type:v,date:gv('date'),mileage:+gv('mileage'),cost:+gv('cost'),workshop:gv('workshop'),nextDueDate:gv('nextDueDate'),nextDueMileage:+gv('nextDueMileage'),notes:gv('notes')}); save(); aR(); });
    window._aEd=id=>{ const s=S.carService.find(x=>x.id===id); if(!s) return; modal('Edytuj wpis',sF(s),()=>{ Object.assign(s,{type:gv('type'),date:gv('date'),mileage:+gv('mileage'),cost:+gv('cost'),workshop:gv('workshop'),nextDueDate:gv('nextDueDate'),nextDueMileage:+gv('nextDueMileage'),notes:gv('notes')}); save(); aR(); }); };
    window._aDl=id=>{ if(!confirm('Usuń wpis?')) return; S.carService=S.carService.filter(x=>x.id!==id); save(); aR(); };
  };

  /* ===== UBEZPIECZENIA ===== */
  RENDERS.ubezpieczenia=function(){
    function il(){
      const rows=S.ubezpieczenia.map(u=>`<tr>
        <td><b>${esc(u.name)}</b></td><td><span class="badge badge-gray">${esc(u.type)}</span></td>
        <td>${esc(u.provider)}</td><td style="font-family:var(--mono);font-size:11px">${esc(u.policyNumber)}</td>
        <td>${bdg(u.status)}</td>
        <td style="${u.validUntil&&dTo(u.validUntil)<30?'color:var(--acc-b-ink);font-weight:600':''}">${fmt(u.validUntil)}</td>
        <td style="font-family:var(--mono)">${u.premium?u.premium.toLocaleString('pl')+' zł':'—'}&nbsp;<small>${esc(u.frequency)}</small></td>
        <td style="font-size:11px;color:var(--ink-3)">${esc(u.coverage)}</td>
        <td><div class="tact"><button class="tact-btn" onclick="window._iEd(${u.id})">Edytuj</button><button class="tact-btn danger" onclick="window._iDl(${u.id})">Usuń</button></div></td>
      </tr>`).join('');
      into('i-rows',rows||`<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--ink-3)">Brak polis</td></tr>`);
    }
    into('sec-ubezpieczenia',`<div class="sec-head"><div class="sec-head-lhs"><div class="sec-title">Ubezpieczenia</div></div>
      <button class="btn-add" onclick="window._iAd()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>Dodaj polisę</button></div>
      <div class="card"><div style="overflow-x:auto"><table class="biuro-table"><thead><tr><th>Nazwa</th><th>Typ</th><th>Ubezpieczyciel</th><th>Nr polisy</th><th>Status</th><th>Ważna do</th><th>Składka</th><th>Zakres</th><th></th></tr></thead><tbody id="i-rows"></tbody></table></div></div>`);
    il();
    const iF=u=>`<div class="form-grid">${r2(fld('Nazwa polisy','name','text',u.name),fld('Typ','type','select',u.type||'Auto',ITYPE))}${r2(fld('Ubezpieczyciel','provider','text',u.provider),fld('Numer polisy','policyNumber','text',u.policyNumber))}${r2(fld('Ważna od','validFrom','date',u.validFrom),fld('Ważna do','validUntil','date',u.validUntil))}${r2(fld('Składka (zł)','premium','number',u.premium),fld('Częstotliwość','frequency','select',u.frequency||'Rocznie',['Miesięcznie','Kwartalnie','Rocznie']))}${r2(fld('Status','status','select',u.status||'Aktywna',IST),fld('Zakres ochrony','coverage','text',u.coverage))}${fld('Notatki','notes','textarea',u.notes)}</div>`;
    window._iAd=()=>modal('Dodaj polisę',iF({}),()=>{ const v=gv('name'); if(!v) return false; S.ubezpieczenia.push({id:nid(S.ubezpieczenia),name:v,type:gv('type'),provider:gv('provider'),policyNumber:gv('policyNumber'),validFrom:gv('validFrom'),validUntil:gv('validUntil'),premium:+gv('premium'),frequency:gv('frequency'),coverage:gv('coverage'),status:gv('status'),notes:gv('notes')}); save(); il(); });
    window._iEd=id=>{ const u=S.ubezpieczenia.find(x=>x.id===id); if(!u) return; modal('Edytuj polisę',iF(u),()=>{ Object.assign(u,{name:gv('name'),type:gv('type'),provider:gv('provider'),policyNumber:gv('policyNumber'),validFrom:gv('validFrom'),validUntil:gv('validUntil'),premium:+gv('premium'),frequency:gv('frequency'),coverage:gv('coverage'),status:gv('status'),notes:gv('notes')}); if(!u.name) return false; save(); il(); }); };
    window._iDl=id=>{ if(!confirm('Usuń polisę?')) return; S.ubezpieczenia=S.ubezpieczenia.filter(x=>x.id!==id); save(); il(); };
  };

  /* ===== UoP ===== */
  RENDERS.uop=function(){
    function uR(){
      const u=S.uop;
      const vacUsed=S.vacations.filter(v=>v.status==='Wykorzystany').reduce((a,v)=>a+v.workingDays,0);
      const vacPlan=S.vacations.filter(v=>v.status==='Planowany').reduce((a,v)=>a+v.workingDays,0);
      const vacLeft=u.vacationLimit+(u.vacationCarryover||0)-vacUsed;
      const now=new Date(); now.setHours(0,0,0,0);
      let nextPay=new Date(now.getFullYear(),now.getMonth(),u.salaryDay);
      if(nextPay<=now) nextPay=new Date(now.getFullYear(),now.getMonth()+1,u.salaryDay);
      const payDays=Math.round((nextPay-now)/86400000);
      const vacRows=[...S.vacations].sort((a,b)=>new Date(b.dateFrom)-new Date(a.dateFrom)).map(v=>`<tr>
        <td>${esc(v.type)}</td><td>${fmt(v.dateFrom)}</td><td>${fmt(v.dateTo)}</td>
        <td style="font-family:var(--mono);font-weight:600;text-align:center">${v.workingDays}</td>
        <td>${bdg(v.status)}</td>
        <td style="font-size:11px;color:var(--ink-3)">${esc(v.notes)}</td>
        <td><div class="tact"><button class="tact-btn" onclick="window._vEd(${v.id})">Edytuj</button><button class="tact-btn danger" onclick="window._vDl(${v.id})">Usuń</button></div></td>
      </tr>`).join('');
      into('sec-uop',`<div class="sec-head"><div class="sec-head-lhs"><div class="sec-title">UoP</div></div></div>
        <div class="uop-main">
          <div class="data-card" style="margin-bottom:0"><div class="data-card-head"><div class="data-card-title">Pracodawca</div><button class="tact-btn" onclick="window._uopEd()">Edytuj</button></div>
            <div class="data-grid">
              <div class="data-cell" style="grid-column:span 2"><div class="k">Firma</div><div class="v">${esc(u.companyName)}</div></div>
              <div class="data-cell"><div class="k">NIP</div><div class="v">${esc(u.nip)}</div></div>
              <div class="data-cell"><div class="k">Data zatrudnienia</div><div class="v">${fmt(u.startDate)}</div></div>
              <div class="data-cell" style="grid-column:span 2"><div class="k">Adres</div><div class="v" style="font-size:12px">${esc(u.companyAddress)}</div></div>
            </div>
          </div>
          <div class="data-card" style="margin-bottom:0"><div class="data-card-head"><div class="data-card-title">Warunki zatrudnienia</div></div>
            <div class="data-grid">
              <div class="data-cell"><div class="k">Okres wypowiedzenia</div><div class="v">${u.noticePeriod} mies.</div></div>
              <div class="data-cell"><div class="k">Dzień wypłaty</div><div class="v">${u.salaryDay}. dnia miesiąca</div></div>
              <div class="data-cell"><div class="k">Następna wypłata</div><div class="v up">${payDays} dni · ${fmt(nextPay.toISOString().split('T')[0])}</div></div>
              <div class="data-cell"><div class="k">Limit urlopu</div><div class="v">${u.vacationLimit}+${u.vacationCarryover||0} dni</div></div>
            </div>
          </div>
        </div>
        <div class="data-card">
          <div class="data-card-head"><div class="data-card-title">Urlopy ${new Date().getFullYear()}</div></div>
          <div class="vac-ring-row">
            <div class="vac-stat"><div class="k">Limit łączny</div><div class="v">${u.vacationLimit+(u.vacationCarryover||0)}</div></div>
            <div class="vac-stat"><div class="k">Wykorzystany</div><div class="v">${vacUsed}</div></div>
            <div class="vac-stat"><div class="k">Zaplanowany</div><div class="v">${vacPlan}</div></div>
            <div class="vac-stat" style="${vacLeft<5?'background:var(--acc-b-soft)':''}"><div class="k">Pozostało</div><div class="v" style="${vacLeft<5?'color:var(--acc-b-ink)':''}">${vacLeft}</div></div>
          </div>
        </div>
        <div class="card"><div class="card-head"><div class="lhs"><span class="idx">—</span><span class="card-title">Wpisy urlopowe</span></div>
          <button class="btn-add" onclick="window._vAd()" style="font-size:10px;padding:6px 12px"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px;height:12px"><path d="M12 5v14M5 12h14"/></svg>Dodaj urlop</button></div>
          <div style="overflow-x:auto"><table class="biuro-table"><thead><tr><th>Typ</th><th>Od</th><th>Do</th><th>Dni</th><th>Status</th><th>Notatki</th><th></th></tr></thead>
          <tbody>${vacRows||'<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ink-3)">Brak wpisów</td></tr>'}</tbody></table></div>
        </div>`);
    }
    uR();
    window._uopEd=()=>modal('Dane pracodawcy',`<div class="form-grid">${fld('Nazwa firmy','companyName','text',S.uop.companyName)}${fld('Adres','companyAddress','text',S.uop.companyAddress)}${r2(fld('NIP','nip','text',S.uop.nip),fld('REGON','regon','text',S.uop.regon))}${r2(fld('Data zatrudnienia','startDate','date',S.uop.startDate),fld('Wypowiedzenie (mies.)','noticePeriod','number',S.uop.noticePeriod))}${r2(fld('Dzień wypłaty','salaryDay','number',S.uop.salaryDay),fld('Limit urlopu (dni)','vacationLimit','number',S.uop.vacationLimit))}${fld('Urlop zaległy (dni)','vacationCarryover','number',S.uop.vacationCarryover)}</div>`,()=>{ Object.assign(S.uop,{companyName:gv('companyName'),companyAddress:gv('companyAddress'),nip:gv('nip'),regon:gv('regon'),startDate:gv('startDate'),noticePeriod:+gv('noticePeriod'),salaryDay:+gv('salaryDay'),vacationLimit:+gv('vacationLimit'),vacationCarryover:+gv('vacationCarryover')}); save(); uR(); });
    const vF=v=>`<div class="form-grid">${fld('Typ urlopu','type','select',v.type||'Urlop wypoczynkowy',VACTYPE)}${r2(fld('Od','dateFrom','date',v.dateFrom),fld('Do','dateTo','date',v.dateTo))}${r2(fld('Dni robocze','workingDays','number',v.workingDays),fld('Status','status','select',v.status||'Planowany',VACST))}${fld('Notatki','notes','textarea',v.notes)}</div>`;
    window._vAd=()=>modal('Dodaj urlop',vF({}),()=>{ if(!gv('dateFrom')) return false; S.vacations.push({id:nid(S.vacations),type:gv('type'),dateFrom:gv('dateFrom'),dateTo:gv('dateTo'),workingDays:+gv('workingDays')||0,status:gv('status'),notes:gv('notes')}); save(); uR(); });
    window._vEd=id=>{ const v=S.vacations.find(x=>x.id===id); if(!v) return; modal('Edytuj urlop',vF(v),()=>{ Object.assign(v,{type:gv('type'),dateFrom:gv('dateFrom'),dateTo:gv('dateTo'),workingDays:+gv('workingDays')||0,status:gv('status'),notes:gv('notes')}); save(); uR(); }); };
    window._vDl=id=>{ if(!confirm('Usuń urlop?')) return; S.vacations=S.vacations.filter(x=>x.id!==id); save(); uR(); };
  };

  /* ===== B2B ===== */
  RENDERS.b2b=function(){
    const exp=new Set(S.settlements.length?[[...S.settlements].sort((a,b)=>b.year-a.year||b.month-a.month)[0].id]:[]); 
    function bR(){
      const b=S.b2b;
      const sorted=[...S.settlements].sort((a,b)=>b.year-a.year||b.month-a.month);
      const iIco=st=>{ if(st==='Opłacone') return `<div class="b2b-item-icon" style="background:var(--acc-a-soft);color:var(--acc-a-ink)">✓</div>`; if(st==='Po terminie') return `<div class="b2b-item-icon" style="background:var(--acc-b-soft);color:var(--acc-b-ink)">!</div>`; if(st==='Nie dotyczy') return `<div class="b2b-item-icon" style="background:var(--surface-inset);color:var(--ink-4)">—</div>`; return `<div class="b2b-item-icon" style="background:var(--surface-inset);color:var(--ink-3)">○</div>`; };
      const mCard=s=>{
        const prog=s.items.filter(i=>i.status==='Opłacone').length;
        const rem=(s.totalAmountDue||0)-(s.totalAmountPaid||0);
        const items=exp.has(s.id)?`<div class="b2b-checklist">${s.items.map((it,idx)=>`
          <div class="b2b-item">
            ${iIco(it.status)}
            <div class="b2b-item-main">
              <div class="b2b-item-name">${B2BT[it.type]||esc(it.type)}</div>
              <div class="b2b-item-due">Termin: ${fmt(it.dueDate)}${it.completedDate?` · Wykonano: ${fmt(it.completedDate)}`:''}</div>
            </div>
            <div class="b2b-item-amount">${it.amount!=null&&it.amount!==''?Number(it.amount).toLocaleString('pl')+' zł':'—'}</div>
            <div class="b2b-item-actions">
              ${bdg(it.status)}
              <select class="filter-select" style="padding:3px 8px;font-size:9px" onchange="window._b2bSt(${s.id},${idx},this.value)">${B2BST.map(st=>`<option${it.status===st?' selected':''}>${st}</option>`).join('')}</select>
            </div>
          </div>`).join('')}</div>`:'';
        return `<div class="b2b-month-card">
          <div class="b2b-month-head" onclick="window._b2bTog(${s.id})">
            <div><div class="b2b-month-title">${MN[s.month-1]} ${s.year}</div></div>
            <div class="b2b-month-meta">
              <span class="badge badge-gray">${prog}/${s.items.length} poz.</span>
              ${bdg(s.overallStatus)}
              <span style="font-family:var(--mono);font-size:12px;font-weight:600;color:var(--ink)">${rem.toLocaleString('pl')} zł pozostało</span>
              <span style="color:var(--ink-4)">${exp.has(s.id)?'▴':'▾'}</span>
            </div>
          </div>${items}
        </div>`;
      };
      into('sec-b2b',`<div class="sec-head"><div class="sec-head-lhs"><div class="sec-title">B2B</div></div>
        <button class="btn-add" onclick="window._b2bAm()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>Nowy miesiąc</button></div>
        <div class="data-card">
          <div class="data-card-head"><div class="data-card-title">Dane firmy</div><button class="tact-btn" onclick="window._b2bEc()">Edytuj</button></div>
          <div class="data-grid">
            <div class="data-cell" style="grid-column:span 2"><div class="k">Firma</div><div class="v">${esc(b.companyName)}</div></div>
            <div class="data-cell"><div class="k">NIP</div><div class="v">${esc(b.nip)}</div></div>
            <div class="data-cell"><div class="k">REGON</div><div class="v">${esc(b.regon)}</div></div>
            <div class="data-cell"><div class="k">Działalność od</div><div class="v">${fmt(b.startDate)}</div></div>
            <div class="data-cell" style="grid-column:span 2"><div class="k">Adres</div><div class="v">${esc(b.companyAddress)}</div></div>
          </div>
        </div>
        <div>${sorted.map(mCard).join('')}</div>`);
    }
    bR();
    window._b2bTog=id=>{ exp.has(id)?exp.delete(id):exp.add(id); bR(); };
    window._b2bSt=(sid,idx,val)=>{ const s=S.settlements.find(x=>x.id===sid); if(!s) return; const it=s.items[idx]; it.status=val; if(val==='Opłacone'&&!it.completedDate) it.completedDate=new Date().toISOString().split('T')[0]; const active=s.items.filter(i=>i.status!=='Nie dotyczy'); const allPaid=active.length&&active.every(i=>i.status==='Opłacone'); s.overallStatus=allPaid?'Opłacone':s.items.some(i=>i.status==='Po terminie')?'Po terminie':'W toku'; s.totalAmountPaid=s.items.filter(i=>i.status==='Opłacone'&&i.amount).reduce((a,i)=>a+(+i.amount||0),0); const pend=s.items.filter(i=>i.status==='Do zapłaty'||i.status==='Do zrobienia').sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate)); s.nearestDeadline=pend[0]?.dueDate||''; save(); bR(); };
    window._b2bEc=()=>modal('Dane firmy',`<div class="form-grid">${fld('Nazwa firmy','companyName','text',S.b2b.companyName)}${fld('Adres','companyAddress','text',S.b2b.companyAddress)}${r2(fld('NIP','nip','text',S.b2b.nip),fld('REGON','regon','text',S.b2b.regon))}${fld('Data założenia','startDate','date',S.b2b.startDate)}</div>`,()=>{ Object.assign(S.b2b,{companyName:gv('companyName'),companyAddress:gv('companyAddress'),nip:gv('nip'),regon:gv('regon'),startDate:gv('startDate')}); save(); bR(); });
    window._b2bAm=()=>{ const n=new Date(); modal('Nowy miesiąc rozliczeniowy',`<div class="form-grid">${r2(fld('Miesiąc (1–12)','month','number',n.getMonth()+1),fld('Rok','year','number',n.getFullYear()))}</div>`,()=>{ const m=+gv('month'),y=+gv('year'); if(!m||!y||m<1||m>12) return false; if(S.settlements.find(s=>s.month===m&&s.year===y)) return false; const ns={id:nid(S.settlements),month:m,year:y,overallStatus:'W toku',totalAmountDue:0,totalAmountPaid:0,nearestDeadline:'',notes:'',items:Object.keys(B2BT).map((t,i)=>({id:i+1,type:t,dueDate:'',amount:null,status:'Do zrobienia',completedDate:'',notes:''}))}; S.settlements.push(ns); exp.add(ns.id); save(); bR(); }); };
  };

  /* ===== BOOT ===== */
  function boot(){
    load();
    document.querySelectorAll('.biuro-nav-btn').forEach(btn=>{ btn.addEventListener('click',()=>showSec(btn.dataset.sec)); });
    showSec('dashboard');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
