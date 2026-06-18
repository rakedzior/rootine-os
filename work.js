/* ============================================================
   ROOTINE OS — PRACA  work.js
   ============================================================ */
(function () {
  'use strict';

  /* ===== SEED ===== */
  const SEED = {
    companies: [
      {id:1,name:'Finanteq Sp. z o.o.',status:'Aktywna',notes:'Retainer integracyjny B2B'},
      {id:2,name:'Kotcha App',status:'Aktywna',notes:'Platforma mobilna'},
      {id:3,name:'Studio Wave',status:'Aktywna',notes:'Audyt UI/UX'},
    ],
    projects: [
      {id:1,companyId:1,name:'Integracja systemu płatności',status:'W toku',priority:'Wysoki',startDate:'2026-01-15',endDate:'2026-08-31',notes:'API, webhooks, testy',links:[]},
      {id:2,companyId:1,name:'Migracja bazy danych',status:'Planowany',priority:'Średni',startDate:'2026-09-01',endDate:'2026-10-31',notes:'PostgreSQL → MongoDB',links:[]},
      {id:3,companyId:2,name:'Redesign aplikacji',status:'W toku',priority:'Wysoki',startDate:'2025-11-01',endDate:'2026-08-15',notes:'Nowy design system',links:[]},
      {id:4,companyId:3,name:'Audit dostępności WCAG',status:'Do review',priority:'Średni',startDate:'2026-05-15',endDate:'2026-07-30',notes:'',links:[]},
    ],
    tasks: [
      {id:1,companyId:1,projectId:1,title:'Wybrać dostawcę płatności',status:'Zakończone',priority:'Wysoki',dueDate:'2026-02-15',notes:'Porównanie: Stripe vs Przelewy24',links:[],subtasks:[{id:1,title:'Sporządzić porównanie cen',status:'Zakończone',dueDate:''},{id:2,title:'Sprawdzić dokumentację API',status:'Zakończone',dueDate:''},{id:3,title:'Przedstawić rekomendacje',status:'Zakończone',dueDate:''}]},
      {id:2,companyId:1,projectId:1,title:'Implementacja SDK Stripe',status:'W toku',priority:'Wysoki',dueDate:'2026-08-01',notes:'Webhooks, testy, error handling',links:[],subtasks:[{id:1,title:'Setup konta Stripe',status:'Zakończone',dueDate:''},{id:2,title:'Integracja frontend',status:'W toku',dueDate:''},{id:3,title:'Integracja backend',status:'Do zrobienia',dueDate:''},{id:4,title:'Testy e2e',status:'Backlog',dueDate:''}]},
      {id:3,companyId:1,projectId:1,title:'Dokumentacja API',status:'Zablokowane',priority:'Średni',dueDate:'2026-07-20',notes:'Czeka na finalne decyzje biznesowe',links:[],subtasks:[{id:1,title:'Napisać spec',status:'Do zrobienia',dueDate:''},{id:2,title:'Przygotować przykłady',status:'Backlog',dueDate:''}]},
      {id:4,companyId:2,projectId:3,title:'Stwórz design system',status:'W toku',priority:'Wysoki',dueDate:'2026-07-31',notes:'Komponenty, kolory, typografia',links:[],subtasks:[{id:1,title:'Zdefiniuj paletę kolorów',status:'Zakończone',dueDate:''},{id:2,title:'Komponenty bazowe',status:'W toku',dueDate:''},{id:3,title:'Ikony i ilustracje',status:'Do zrobienia',dueDate:''}]},
      {id:5,companyId:2,projectId:3,title:'Przeprojektuj dashboard',status:'Do zrobienia',priority:'Wysoki',dueDate:'2026-08-15',notes:'',links:[],subtasks:[]},
      {id:6,companyId:3,projectId:4,title:'Przeprowadzić audit WCAG',status:'W toku',priority:'Średni',dueDate:'2026-07-15',notes:'Full page scan',links:[],subtasks:[{id:1,title:'Zeskanować strukturę DOM',status:'Zakończone',dueDate:''},{id:2,title:'Sprawdzić kontrast',status:'W toku',dueDate:''},{id:3,title:'Testy czytnika ekranu',status:'Do zrobienia',dueDate:''}]},
    ],
  };

  /* ===== STATE ===== */
  const KEY = 'rootine.work.v1';
  let S = {};
  function load(){ try{ const d=JSON.parse(localStorage.getItem(KEY)); S=d||JSON.parse(JSON.stringify(SEED)); }catch(e){ S=JSON.parse(JSON.stringify(SEED)); } }
  function save(){ localStorage.setItem(KEY,JSON.stringify(S)); }
  function nid(arr){ return arr.length?Math.max(...arr.map(x=>x.id))+1:1; }

  /* ===== HELPERS ===== */
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function fmt(d){ if(!d) return '—'; const p=String(d).split('-'); return p.length===3?`${p[2]}.${p[1]}.${p[0]}`:'—'; }
  function dTo(d){ if(!d) return null; const n=new Date(); n.setHours(0,0,0,0); return Math.round((new Date(d)-n)/86400000); }
  function dLbl(n){ if(n===null) return '—'; if(n<0) return `${Math.abs(n)}d po`; if(n===0) return 'Dziś'; return `za ${n}d`; }
  const BM={'Backlog':'badge-gray','Do zrobienia':'badge-blue','W toku':'badge-lav','Zablokowane':'badge-red','Oczekuje':'badge-orange','Do review':'badge-orange','Zakończone':'badge-green','Anulowane':'badge-gray','Wysoki':'badge-orange','Średni':'badge-blue','Niski':'badge-gray','Krytyczny':'badge-red','Aktywna':'badge-green','Wstrzymana':'badge-gray','Zakończona':'badge-gray','Archiwalna':'badge-gray','Planowany':'badge-blue','Archiwalny':'badge-gray','W toku':'badge-lav'};
  function bdg(s){ return `<span class="badge ${BM[s]||'badge-gray'}">${esc(s)}</span>`; }
  function into(id,html){ const el=document.getElementById(id); if(el) el.innerHTML=html; }
  const STC={'Backlog':'st-bl','Do zrobienia':'st-td','W toku':'st-wi','Zablokowane':'st-bk','Oczekuje':'st-rv','Do review':'st-rv','Zakończone':'st-dn','Anulowane':'st-cn'};
  const DOTC={'Backlog':'dot-bl','Do zrobienia':'dot-td','W toku':'dot-wi','Zablokowane':'dot-bk','Oczekuje':'dot-rv','Do review':'dot-rv','Zakończone':'dot-dn'};

  /* ===== NAV ===== */
  const RENDERS={};
  window.workGo=(id)=>showSec(id);
  function showSec(id){
    document.querySelectorAll('.work-sec').forEach(s=>s.classList.remove('active'));
    document.querySelectorAll('.work-nav-btn').forEach(b=>b.classList.remove('active'));
    const sec=document.getElementById('sec-'+id), btn=document.querySelector(`.work-nav-btn[data-sec="${id}"]`);
    if(sec) sec.classList.add('active');
    if(btn) btn.classList.add('active');
    if(RENDERS[id]) RENDERS[id]();
  }

  /* ===== MODAL + FORM ===== */
  function modal(title,body,onSave){
    document.getElementById('work-modal').innerHTML=`<div class="modal-overlay" id="moverlay" onclick="if(event.target.id==='moverlay')window.closeModal()"><div class="modal-box">
      <div class="modal-head"><div class="modal-title">${esc(title)}</div><button class="modal-close" onclick="window.closeModal()">✕</button></div>
      <div class="modal-body">${body}</div>
      <div class="modal-foot"><button class="btn-secondary" onclick="window.closeModal()">Anuluj</button><button class="btn-primary" onclick="window._msave()">Zapisz</button></div>
    </div></div>`;
    window._msave=()=>{ if(onSave()!==false) window.closeModal(); };
  }
  window.closeModal=()=>{ document.getElementById('work-modal').innerHTML=''; };
  function fld(lbl,name,type,val,opts){
    const id='ff'+name,v=val==null?'':String(val);
    if(type==='select') return `<div class="form-group"><label for="${id}">${lbl}</label><select id="${id}" name="${name}">${opts.map(o=>{const ov=typeof o==='object'?o.v:o,ol=typeof o==='object'?o.l:o;return `<option value="${esc(ov)}"${String(v)===String(ov)?' selected':''}>${esc(ol)}</option>`;}).join('')}</select></div>`;
    if(type==='textarea') return `<div class="form-group"><label for="${id}">${lbl}</label><textarea id="${id}" name="${name}">${esc(v)}</textarea></div>`;
    return `<div class="form-group"><label for="${id}">${lbl}</label><input id="${id}" name="${name}" type="${type}" value="${esc(v)}"></div>`;
  }
  function r2(...a){ return `<div class="form-row-2">${a.join('')}</div>`; }
  function gv(n){ const e=document.querySelector(`[name="${n}"]`); return e?e.value.trim():''; }
  const TSTATS=['Backlog','Do zrobienia','W toku','Zablokowane','Oczekuje','Do review','Zakończone','Anulowane'];
  const TPRI=['Niski','Średni','Wysoki','Krytyczny'];
  const PSTATS=['Planowany','W toku','Wstrzymany','Do review','Zakończony','Archiwalny'];

  /* ===== DASHBOARD ===== */
  RENDERS.dashboard=function(){
    const now=new Date(); now.setHours(0,0,0,0);
    const active=S.tasks.filter(t=>t.status!=='Zakończone'&&t.status!=='Anulowane');
    const todayT=active.filter(t=>t.dueDate&&dTo(t.dueDate)===0);
    const overdue=active.filter(t=>dTo(t.dueDate)<0);
    const inProg=active.filter(t=>t.status==='W toku');
    const blocked=active.filter(t=>t.status==='Zablokowane');
    const review=active.filter(t=>t.status==='Do review');
    const rows=active.sort((a,b)=>new Date(a.dueDate||'9999')-new Date(b.dueDate||'9999')).slice(0,12).map(t=>{
      const c=S.companies.find(x=>x.id===t.companyId),p=S.projects.find(x=>x.id===t.projectId);
      return `<tr><td><span class="badge badge-gray">${esc(c?.name||'—')}</span></td><td style="font-size:11px;color:var(--ink-3)">${esc(p?.name||'—')}</td><td><b>${esc(t.title)}</b></td><td style="${dTo(t.dueDate)<0?'color:var(--acc-b-ink);font-weight:600':''}">${fmt(t.dueDate)}</td><td>${bdg(t.status)}</td><td>${bdg(t.priority)}</td><td><button class="tact-btn" onclick="window.workGo('tasks');setTimeout(()=>window._tedit(${t.id}),100)">Pokaż</button></td></tr>`;
    }).join('');
    into('sec-dashboard',`<div class="sec-head"><div class="sec-head-lhs"><div class="sec-title">Dashboard · Praca</div></div></div>
      ${overdue.length?`<div style="background:var(--acc-b-soft);border:1px solid var(--acc-b);border-radius:var(--r-sm);padding:10px 14px;margin-bottom:16px;color:var(--acc-b-ink);font-weight:600">⚠ ${overdue.length} ${overdue.length===1?'zadanie':'zadań'} po terminie</div>`:''}
      <div class="dash-grid">
        <div class="dash-card"><div class="dk">Na dziś</div><div class="dv">${todayT.length}</div></div>
        <div class="dash-card${overdue.length?' alert':''}"><div class="dk">Po terminie</div><div class="dv">${overdue.length}</div></div>
        <div class="dash-card"><div class="dk">W toku</div><div class="dv">${inProg.length}</div></div>
        <div class="dash-card${blocked.length?' alert':''}"><div class="dk">Zablokowane</div><div class="dv">${blocked.length}</div></div>
        <div class="dash-card"><div class="dk">Do review</div><div class="dv">${review.length}</div></div>
        <div class="dash-card"><div class="dk">Aktywne razem</div><div class="dv">${active.length}</div></div>
      </div>
      <div class="card"><div class="card-head"><div class="lhs"><span class="idx">—</span><span class="card-title">Najbliższe terminy</span></div><span class="pill">${active.length}</span></div>
        <div style="overflow-x:auto"><table class="work-table"><thead><tr><th>Firma</th><th>Projekt</th><th>Zadanie</th><th>Termin</th><th>Status</th><th>Priorytet</th><th></th></tr></thead>
        <tbody>${rows||'<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ink-3)">Brak aktywnych zadań</td></tr>'}</tbody></table></div>
      </div>`);
  };

  /* ===== COMPANIES + PROJECTS ===== */
  RENDERS['companies-projects']=function(){
    function cpR(){
      const coList=S.companies.map(c=>{
        const pc=S.projects.filter(p=>p.companyId===c.id).length;
        const tc=S.tasks.filter(t=>t.companyId===c.id&&t.status!=='Zakończone').length;
        return `<div class="cp-co-item">
          <div class="cp-co-info"><div class="cp-co-name">${esc(c.name)}</div><div class="cp-co-meta">${pc} proj. · ${tc} aktywnych zad.</div></div>
          ${bdg(c.status)}
          <div class="tact"><button class="tact-btn" onclick="window._cedit(${c.id})">Edytuj</button><button class="tact-btn del" onclick="window._cdel(${c.id})">Usuń</button></div>
        </div>`;
      }).join('');

      const projSections=S.companies.map(c=>{
        const cProjs=S.projects.filter(p=>p.companyId===c.id);
        if(!cProjs.length) return '';
        const cards=cProjs.map(p=>{
          const tc=S.tasks.filter(t=>t.projectId===p.id).length;
          return `<div class="cp-proj-card">
            <div class="cp-proj-card-name">${esc(p.name)}</div>
            <div class="cp-proj-card-meta">${bdg(p.status)}&nbsp;${bdg(p.priority)}<span class="cp-proj-card-tc">${tc} zad.</span></div>
            ${p.notes?`<div style="font-size:11px;color:var(--ink-3);margin-bottom:8px">${esc(p.notes)}</div>`:''}
            <div class="tact"><button class="tact-btn" onclick="window._pedit(${p.id})">Edytuj</button><button class="tact-btn del" onclick="window._pdel(${p.id})">Usuń</button></div>
          </div>`;
        }).join('');
        return `<div class="cp-proj-section"><div class="cp-proj-label">${esc(c.name)}</div><div class="cp-proj-grid">${cards}</div></div>`;
      }).join('');

      into('sec-companies-projects',`
        <div class="sec-head">
          <div class="sec-head-lhs"><div class="sec-title">Firmy &amp; Projekty</div></div>
          <div class="sec-head-rhs">
            <button class="btn-add" onclick="window._cadd()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>Dodaj firmę</button>
            <button class="btn-add" onclick="window._padd()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>Dodaj projekt</button>
          </div>
        </div>
        <div class="cp-layout">
          <div>
            <div style="font-family:var(--mono);font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);font-weight:600;margin-bottom:10px">Firmy (${S.companies.length})</div>
            <div class="cp-co-list">${coList||'<div style="padding:20px;text-align:center;color:var(--ink-3)">Brak firm</div>'}</div>
          </div>
          <div>
            <div style="font-family:var(--mono);font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);font-weight:600;margin-bottom:10px">Projekty (${S.projects.length})</div>
            ${projSections||'<div style="padding:20px;text-align:center;color:var(--ink-3)">Brak projektów</div>'}
          </div>
        </div>`);
    }
    cpR();

    const CF=c=>`<div class="form-grid">${fld('Nazwa firmy','name','text',c.name)}${fld('Status','status','select',c.status||'Aktywna',['Aktywna','Wstrzymana','Zakończona','Archiwalna'])}${fld('Notatki','notes','textarea',c.notes)}</div>`;
    window._cadd=()=>modal('Dodaj firmę',CF({}),()=>{ const v=gv('name'); if(!v) return false; S.companies.push({id:nid(S.companies),name:v,status:gv('status')||'Aktywna',notes:gv('notes')}); save(); cpR(); });
    window._cedit=id=>{ const c=S.companies.find(x=>x.id===id); if(!c) return; modal('Edytuj firmę',CF(c),()=>{ Object.assign(c,{name:gv('name'),status:gv('status'),notes:gv('notes')}); if(!c.name) return false; save(); cpR(); }); };
    window._cdel=id=>{ if(!confirm('Usuń firmę i powiązane projekty/zadania?')) return; S.companies=S.companies.filter(x=>x.id!==id); S.projects=S.projects.filter(p=>p.companyId!==id); S.tasks=S.tasks.filter(t=>t.companyId!==id); save(); cpR(); };

    const PF=p=>`<div class="form-grid">${fld('Nazwa projektu','name','text',p.name)}${fld('Firma','company','select',p.companyId,S.companies.map(c=>({v:String(c.id),l:c.name})))}${r2(fld('Status','status','select',p.status||'Planowany',PSTATS),fld('Priorytet','priority','select',p.priority||'Średni',TPRI))}${r2(fld('Data startu','startDate','date',p.startDate),fld('Data końca','endDate','date',p.endDate))}${fld('Notatki','notes','textarea',p.notes)}</div>`;
    window._padd=()=>modal('Dodaj projekt',PF({}),()=>{ const v=gv('name'); if(!v) return false; S.projects.push({id:nid(S.projects),companyId:+gv('company'),name:v,status:gv('status')||'Planowany',priority:gv('priority')||'Średni',startDate:gv('startDate'),endDate:gv('endDate'),notes:gv('notes'),links:[]}); save(); cpR(); });
    window._pedit=id=>{ const p=S.projects.find(x=>x.id===id); if(!p) return; modal('Edytuj projekt',PF(p),()=>{ Object.assign(p,{name:gv('name'),companyId:+gv('company'),status:gv('status'),priority:gv('priority'),startDate:gv('startDate'),endDate:gv('endDate'),notes:gv('notes')}); if(!p.name) return false; save(); cpR(); }); };
    window._pdel=id=>{ if(!confirm('Usuń projekt i zadania?')) return; S.projects=S.projects.filter(x=>x.id!==id); S.tasks=S.tasks.filter(t=>t.projectId!==id); save(); cpR(); };
  };

  /* ===== TASKS ===== */
  RENDERS.tasks=function(){
    let tf={company:'all',project:'all',view:'company'};
    const STATUSES=['Backlog','Do zrobienia','W toku','Zablokowane','Do review','Zakończone'];

    function taskCard(t){
      const p=S.projects.find(x=>x.id===t.projectId);
      const done=(t.subtasks||[]).filter(s=>s.status==='Zakończone').length;
      const total=(t.subtasks||[]).length;
      const due=dTo(t.dueDate);
      return `<div class="kanban-card ${STC[t.status]||''}" onclick="window._tedit(${t.id})">
        <div class="kanban-card-title">${esc(t.title)}</div>
        <div class="kanban-card-meta">
          ${p?`<span class="kanban-card-proj">${esc(p.name)}</span>`:''}
          ${bdg(t.priority)}
          ${t.dueDate?`<span class="kanban-card-due" style="color:${due<0?'var(--acc-b-ink)':due===0?'var(--acc-b-ink)':'var(--ink-3)'}">${dLbl(due)}</span>`:''}
          ${total?`<span class="kanban-card-subs">${done}/${total} ✓</span>`:''}
        </div>
      </div>`;
    }

    function kanbanCols(items){
      return STATUSES.map(st=>{
        const cards=items.filter(t=>t.status===st);
        return `<div class="kanban-col">
          <div class="kanban-head"><span class="kh-dot ${DOTC[st]||'dot-bl'}"></span>${st}<span class="kanban-count">${cards.length}</span></div>
          <div class="kanban-body">${cards.map(taskCard).join('')}</div>
        </div>`;
      }).join('');
    }

    function companyView(items){
      const active=S.companies.filter(c=>items.some(t=>t.companyId===c.id));
      if(!active.length) return `<div style="text-align:center;padding:40px;color:var(--ink-3)">Brak zadań</div>`;
      return active.map(c=>{
        const ct=items.filter(t=>t.companyId===c.id);
        return `<div class="ckg">
          <div class="ckg-header">
            <span class="ckg-name">${esc(c.name)}</span>${bdg(c.status)}
            <span class="ckg-count">${ct.filter(t=>t.status!=='Zakończone').length} aktywnych · ${ct.filter(t=>t.status==='Zakończone').length} zakończonych</span>
          </div>
          <div class="ckg-board">${kanbanCols(ct)}</div>
        </div>`;
      }).join('');
    }

    function listView(items){
      const rows=items.sort((a,b)=>new Date(a.dueDate||'9999')-new Date(b.dueDate||'9999')).map(t=>{
        const c=S.companies.find(x=>x.id===t.companyId),p=S.projects.find(x=>x.id===t.projectId);
        const done=(t.subtasks||[]).filter(s=>s.status==='Zakończone').length,total=(t.subtasks||[]).length;
        return `<tr>
          <td><span class="badge badge-gray">${esc(c?.name||'—')}</span></td>
          <td style="font-size:11px;color:var(--ink-3)">${esc(p?.name||'—')}</td>
          <td><b>${esc(t.title)}</b>${total?`<br><small style="font-family:var(--mono);font-size:9px;color:var(--ink-3)">${done}/${total} subtasków</small>`:''}</td>
          <td style="${dTo(t.dueDate)<0?'color:var(--acc-b-ink);font-weight:600':''}">${fmt(t.dueDate)}</td>
          <td>${bdg(t.status)}</td><td>${bdg(t.priority)}</td>
          <td><div class="tact"><button class="tact-btn" onclick="window._tedit(${t.id})">Edytuj</button><button class="tact-btn del" onclick="window._tdel(${t.id})">Usuń</button></div></td>
        </tr>`;
      }).join('');
      return `<div class="card"><div style="overflow-x:auto"><table class="work-table"><thead><tr><th>Firma</th><th>Projekt</th><th>Zadanie</th><th>Termin</th><th>Status</th><th>Priorytet</th><th></th></tr></thead>
        <tbody>${rows||'<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--ink-3)">Brak zadań</td></tr>'}</tbody></table></div></div>`;
    }

    function tR(){
      let items=[...S.tasks];
      if(tf.company!=='all') items=items.filter(t=>t.companyId===+tf.company);
      if(tf.project!=='all') items=items.filter(t=>t.projectId===+tf.project);
      const content=tf.view==='company'?companyView(items):tf.view==='kanban'?`<div class="kanban-board">${kanbanCols(items)}</div>`:listView(items);
      const projOpts=S.projects.filter(p=>tf.company==='all'?true:p.companyId===+tf.company);
      into('sec-tasks',`
        <div class="sec-head">
          <div class="sec-head-lhs"><div class="sec-title">Zadania</div><div class="sec-count">${items.length}</div></div>
          <div class="sec-head-rhs">
            <div class="work-seg">
              <button class="wsb${tf.view==='company'?' active':''}" onclick="tf.view='company';tR()">Per firma</button>
              <button class="wsb${tf.view==='kanban'?' active':''}" onclick="tf.view='kanban';tR()">Kanban</button>
              <button class="wsb${tf.view==='list'?' active':''}" onclick="tf.view='list';tR()">Lista</button>
            </div>
            <button class="btn-add" onclick="window._tadd()"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>Dodaj zadanie</button>
          </div>
        </div>
        <div class="filter-bar">
          <select class="filter-select" onchange="tf.company=this.value;tR()"><option value="all">Wszystkie firmy</option>${S.companies.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select>
          <select class="filter-select" onchange="tf.project=this.value;tR()"><option value="all">Wszystkie projekty</option>${projOpts.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select>
        </div>
        ${content}`);
    }
    tR();

    const TF=t=>{
      const stRows=(t.subtasks||[]).map(st=>`<div class="subtask-item" id="st${st.id}">
        <input type="checkbox" ${st.status==='Zakończone'?'checked':''}>
        <span class="st${st.status==='Zakończone'?' done':''}">${esc(st.title)}</span>
        <span class="sb">${fmt(st.dueDate)}</span>
      </div>`).join('');
      return `<div class="form-grid">
        ${fld('Nazwa zadania','title','text',t.title)}
        ${r2(fld('Firma','company','select',t.companyId,S.companies.map(c=>({v:String(c.id),l:c.name}))),fld('Projekt','project','select',t.projectId,S.projects.map(p=>({v:String(p.id),l:p.name}))))}
        ${r2(fld('Status','status','select',t.status||'Do zrobienia',TSTATS),fld('Priorytet','priority','select',t.priority||'Średni',TPRI))}
        ${fld('Termin','dueDate','date',t.dueDate)}
        ${fld('Notatki','notes','textarea',t.notes)}
        <div>
          <label style="font-family:var(--mono);font-size:9px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);font-weight:600;display:block;margin-bottom:8px">Subtaski (${(t.subtasks||[]).length})</label>
          <div class="subtask-list">${stRows}</div>
          <div class="subtask-add">
            <input id="newSt" placeholder="Nowy subtask..." onkeydown="if(event.key==='Enter'){window._addSt(${t.id});event.preventDefault();}">
            <button onclick="window._addSt(${t.id})">+ Dodaj</button>
          </div>
        </div>
      </div>`;
    };

    window._tadd=()=>modal('Dodaj zadanie',TF({}),()=>{
      const v=gv('title'); if(!v) return false;
      S.tasks.push({id:nid(S.tasks),companyId:+gv('company'),projectId:+gv('project'),title:v,status:gv('status')||'Do zrobienia',priority:gv('priority')||'Średni',dueDate:gv('dueDate'),notes:gv('notes'),links:[],subtasks:[]});
      save(); tR();
    });

    window._tedit=id=>{
      const t=S.tasks.find(x=>x.id===id); if(!t) return;
      modal('Edytuj zadanie',TF(t),()=>{
        Object.assign(t,{title:gv('title'),companyId:+gv('company'),projectId:+gv('project'),status:gv('status'),priority:gv('priority'),dueDate:gv('dueDate'),notes:gv('notes')});
        document.querySelectorAll('.subtask-item').forEach(el=>{
          const sid=+el.id.replace('st','');
          const st=(t.subtasks||[]).find(x=>x.id===sid);
          if(st) st.status=el.querySelector('input[type="checkbox"]').checked?'Zakończone':'Do zrobienia';
        });
        if(!t.title) return false; save(); tR();
      });
    };

    window._addSt=id=>{
      const inp=document.getElementById('newSt'); if(!inp) return;
      const v=inp.value.trim(); if(!v) return;
      const t=S.tasks.find(x=>x.id===id); if(!t) return;
      if(!t.subtasks) t.subtasks=[];
      t.subtasks.push({id:nid(t.subtasks),title:v,status:'Do zrobienia',dueDate:'',notes:''});
      save();
      // Re-render just subtask list without closing modal
      const list=document.querySelector('.subtask-list');
      if(list){ list.innerHTML+= `<div class="subtask-item" id="st${t.subtasks[t.subtasks.length-1].id}"><input type="checkbox"><span class="st">${esc(v)}</span><span class="sb">—</span></div>`; }
      inp.value='';
    };

    window._tdel=id=>{ if(!confirm('Usuń zadanie?')) return; S.tasks=S.tasks.filter(x=>x.id!==id); save(); tR(); };
  };

  /* ===== BOOT ===== */
  function boot(){
    load();
    document.querySelectorAll('.work-nav-btn').forEach(btn=>{ btn.addEventListener('click',()=>showSec(btn.dataset.sec)); });
    showSec('dashboard');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
