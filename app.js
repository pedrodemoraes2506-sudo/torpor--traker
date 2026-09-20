/* ===================== VTES Torneios — lógica do app ===================== */
(function(){
  "use strict";

  /* ---------- IndexedDB (armazenamento local, sem terceiros) ---------- */
  const DB_NAME = "vtes_tournaments_db";
  const DB_VERSION = 1;
  let dbP = null;
  function openDb(){
    if (dbP) return dbP;
    dbP = new Promise((resolve, reject)=>{
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = ()=>{
        const db = req.result;
        if (!db.objectStoreNames.contains("tournaments")){
          db.createObjectStore("tournaments", { keyPath: "id" });
        }
      };
      req.onsuccess = ()=> resolve(req.result);
      req.onerror = ()=> reject(req.error);
    });
    return dbP;
  }
  async function dbPut(tournament){
    const db = await openDb();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction("tournaments", "readwrite");
      tx.objectStore("tournaments").put(tournament);
      tx.oncomplete = ()=> resolve();
      tx.onerror = ()=> reject(tx.error);
    });
  }
  async function dbGetAll(){
    const db = await openDb();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction("tournaments", "readonly");
      const req = tx.objectStore("tournaments").getAll();
      req.onsuccess = ()=> resolve(req.result || []);
      req.onerror = ()=> reject(req.error);
    });
  }
  async function dbDelete(id){
    const db = await openDb();
    return new Promise((resolve, reject)=>{
      const tx = db.transaction("tournaments", "readwrite");
      tx.objectStore("tournaments").delete(id);
      tx.oncomplete = ()=> resolve();
      tx.onerror = ()=> reject(tx.error);
    });
  }

  /* ---------- utilidades ---------- */
  function uid(prefix){
    return (prefix||"id") + "_" + Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-4);
  }
  function shortId(id){ return id.split("_")[1] ? id.split("_")[1].toUpperCase() : id.toUpperCase(); }
  function esc(s){
    return String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  /* ---------- Clãs (símbolos próprios, estilizados — não são os ícones oficiais do jogo) ---------- */
  const CLANS = [
    { id:'brujah',     name:'Brujah',            color:'#b23a2f', path:'M4 12l4-6 3 4 3-6 3 6 3-4 4 6' },
    { id:'gangrel',    name:'Gangrel',            color:'#6d7a4a', path:'M5 19L11 5M10 19L14 5M15 19L19 5' },
    { id:'malkavian',  name:'Malkavian',          color:'#8a4fae', path:'M12 4c3 1 5 3 5 6a5 5 0 0 1-10 0c0-1.4.6-2.6 1.6-3.6' },
    { id:'nosferatu',  name:'Nosferatu',          color:'#8a8a8a', path:'M12 8a3 3 0 0 1 3 3v2M12 8a3 3 0 0 0-3 3v2M4 9l4 2M20 9l-4 2M4 15l4-2M20 15l-4-2M9 19l1.5-3M15 19l-1.5-3' },
    { id:'toreador',   name:'Toreador',           color:'#c24d6b', path:'M12 19V9M12 9c-3 0-5-2-5-4.5C9 4 11 5 12 7c1-2 3-3 5-2.5C17 7 15 9 12 9z' },
    { id:'tremere',    name:'Tremere',            color:'#8e1524', path:'M12 4l6.9 5-2.6 8.1H7.7L5.1 9z M12 4v14.1M5.1 9h13.8M7.7 17.1l4.3-9.9 4.3 9.9' },
    { id:'ventrue',    name:'Ventrue',            color:'#c9a227', path:'M4 18h16M5 18l1-8 3 4 3-6 3 6 3-4 1 8' },
    { id:'assamite',   name:'Banu Haqim (Assamita)', color:'#7a0e1c', path:'M12 3v11M9 6l3-3 3 3M8 14h8l-2 3h-4z M11 17h2v4h-2z' },
    { id:'ministry',   name:'Ministério (Set)',   color:'#b58a2e', path:'M12 3v6M8 9h8M9.5 9a3.5 4 0 1 0 5 0' },
    { id:'giovanni',   name:'Giovanni (Hecata)',  color:'#4a4a4a', path:'M12 4a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0v-2a5 5 0 0 0-5-5zM9.5 10h.01M14.5 10h.01M9 19l1.5-3M15 19l-1.5-3M10 19v2M14 19v2' },
    { id:'lasombra',   name:'Lasombra',           color:'#3d2e6b', path:'M8 4a8 8 0 1 0 8 14A8 8 0 0 1 8 4z' },
    { id:'ravnos',     name:'Ravnos',             color:'#c05a2b', path:'M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0 M12 4v16M4 12h16M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7' },
    { id:'tzimisce',   name:'Tzimisce',           color:'#3f6b4a', path:'M5 19c3-4 1-6 3-9s0-5 3-6M11 4c2 2 0 4 2 6s0 6-3 9' },
    { id:'other',      name:'Outro / sem clã',    color:'#8a7a6a', path:'' },
  ];
  function clanById(id){ return CLANS.find(c=>c.id===id) || null; }
  function clanIconSvg(id, size){
    const c = clanById(id);
    if (!c || !c.path) return '';
    size = size || 16;
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${c.color}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="flex:0 0 auto;vertical-align:-3px;"><path d="${c.path}"/></svg>`;
  }
  function clanBadge(id, showLabel){
    const c = clanById(id);
    if (!c) return '';
    const icon = clanIconSvg(id, 15);
    if (!icon) return showLabel ? `<span class="clan-badge"><span style="opacity:.6;">${esc(c.name)}</span></span>` : '';
    return `<span class="clan-badge" title="${esc(c.name)}">${icon}${showLabel? `<span>${esc(c.name)}</span>`:''}</span>`;
  }
  function clanSelectOptions(selectedId){
    return CLANS.map(c=>`<option value="${c.id}" ${selectedId===c.id?'selected':''}>${esc(c.name)}</option>`).join('');
  }
  function fmtDate(ts){
    const d = new Date(ts);
    return d.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit',year:'numeric'});
  }
  function toast(msg){
    const host = document.getElementById('toast-host');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(()=>{ el.style.transition='opacity .4s'; el.style.opacity='0'; setTimeout(()=>el.remove(), 400); }, 2200);
  }

  /* ---------- estado em memória ---------- */
  const state = {
    tournaments: [],       // lista carregada do IndexedDB
    currentId: null,       // torneio aberto
    tab: 'jogadores',      // aba ativa dentro do torneio
    timer: { remaining: 7200, total: 7200, running:false, intervalHandle:null, alarmHandle:null, tableLabel:'' },
    audioCtx: null,
    qrShare: { chunks:[], idx:0, playing:false, timerHandle:null },
    scan: { active:false, stream:null, collected:{}, total:0, tid:null, rafHandle:null },
    downloadsCap: null,
  };

  function currentTournament(){
    return state.tournaments.find(t=>t.id===state.currentId) || null;
  }
  function newTournamentObj(name){
    return {
      id: uid('t'),
      name: name || 'Torneio sem nome',
      createdAt: Date.now(),
      roundDurationMin: 120,
      players: [],   // {id,name,deckName,deckLink}
      rounds: [],    // {id,name,tables:[{id,label,playerIds:[],scores:{playerId:score}}]}
    };
  }
  function standingsFor(t){
    const totals = {};
    t.players.forEach(p=>{ totals[p.id] = { player:p, total:0, games:0 }; });
    t.rounds.forEach(r=>{
      r.tables.forEach(tb=>{
        (tb.playerIds||[]).forEach(pid=>{
          if(!totals[pid]) return;
          const sc = Number(tb.scores?.[pid] || 0);
          totals[pid].total += sc;
          totals[pid].games += 1;
        });
      });
    });
    return Object.values(totals).sort((a,b)=> b.total - a.total || a.player.name.localeCompare(b.player.name));
  }

  async function persist(t){
    await dbPut(t);
    const idx = state.tournaments.findIndex(x=>x.id===t.id);
    if (idx>=0) state.tournaments[idx] = t; else state.tournaments.push(t);
  }

  /* ---------- render root ---------- */
  const app = document.getElementById('app');

  function render(){
    if (!state.currentId){ renderList(); }
    else { renderTournament(); }
  }

  function renderList(){
    const items = [...state.tournaments].sort((a,b)=>b.createdAt-a.createdAt);
    app.innerHTML = `
      <header class="top">
        <div class="crest">🩸</div>
        <div>
          <h1>VTES Torneios</h1>
          <div class="sub">Vampire: The Eternal Struggle</div>
        </div>
      </header>
      <div class="card">
        <h2>Novo torneio</h2>
        <label for="new-t-name">Nome do torneio</label>
        <input id="new-t-name" type="text" placeholder="Ex: Elysium de Outono">
        <button class="btn primary full" id="btn-create-t">Criar torneio</button>
      </div>
      <div class="card">
        <h2>Entrar por QR Code</h2>
        <div class="sub" style="margin-bottom:10px;color:var(--bone-dim);font-size:0.88rem;">Receba os dados de um torneio compartilhado por outro jogador, sem precisar de internet.</div>
        <button class="btn full" id="btn-scan">Escanear QR Code</button>
      </div>
      ${items.length ? `<h3 style="margin: 18px 4px 10px;">Seus torneios</h3>` : ''}
      <div id="tourn-list">
        ${items.length ? items.map(t=>`
          <div class="tourn-item" data-id="${t.id}">
            <div>
              <div class="name">${esc(t.name)}</div>
              <div class="meta">${fmtDate(t.createdAt)} · ${t.players.length} jogador(es) · ${t.rounds.length} rodada(s) · ID ${shortId(t.id)}</div>
            </div>
            <button class="icon-btn" data-delete-t="${t.id}" title="Apagar torneio" style="margin-left:8px;">🗑</button>
          </div>
        `).join('') : `
          <div class="empty">
            <div class="glyph">🦇</div>
            <div>Nenhum torneio ainda.<br>Crie um novo ou escaneie um QR Code para começar.</div>
          </div>
        `}
      </div>
      <footer class="foot">Dados armazenados apenas neste aparelho.<br>Projeto de fã, não-oficial. Não afiliado, endossado ou patrocinado pela Paradox Interactive / White Wolf / VEKN. Vampire: The Eternal Struggle e VTES são marcas de seus respectivos donos.</footer>
    `;
    document.getElementById('btn-create-t').onclick = async ()=>{
      const name = document.getElementById('new-t-name').value.trim();
      const t = newTournamentObj(name);
      await persist(t);
      state.currentId = t.id;
      state.tab = 'jogadores';
      render();
      toast('Torneio criado');
    };
    document.getElementById('btn-scan').onclick = openScanModal;
    document.querySelectorAll('.tourn-item').forEach(el=>{
      el.onclick = ()=>{ state.currentId = el.dataset.id; state.tab='jogadores'; render(); };
    });
    document.querySelectorAll('[data-delete-t]').forEach(btn=>{
      btn.onclick = async (e)=>{
        e.stopPropagation();
        const t = state.tournaments.find(x=>x.id===btn.dataset.deleteT);
        if (!t) return;
        if (!(await askConfirm(`Apagar o torneio "${t.name}"? Essa ação não pode ser desfeita.`))) return;
        await dbDelete(t.id);
        state.tournaments = state.tournaments.filter(x=>x.id!==t.id);
        render();
        toast('Torneio apagado');
      };
    });
  }

  function renderTournament(){
    const t = currentTournament();
    if (!t){ state.currentId = null; render(); return; }
    const tabs = [
      ['jogadores','Jogadores'],
      ['mesas','Rodadas & Mesas'],
      ['classificacao','Classificação'],
      ['cronometro','Cronômetro'],
      ['cartas','Cartas'],
      ['compartilhar','Compartilhar'],
    ];
    app.innerHTML = `
      <header class="top">
        <div class="crest">🩸</div>
        <div>
          <h1>${esc(t.name)}</h1>
          <div class="sub">ID ${shortId(t.id)} · ${t.players.length} jogador(es)</div>
        </div>
        <div style="margin-left:auto;display:flex;align-items:center;gap:4px;">
          <button class="icon-btn" id="btn-delete-current" title="Apagar torneio">🗑</button>
          <button class="back" style="margin-left:0;">← Torneios</button>
        </div>
      </header>
      <div class="tabs">
        ${tabs.map(([k,label])=>`<button data-tab="${k}" class="${state.tab===k?'active':''}">${label}</button>`).join('')}
      </div>
      <div id="tab-content"></div>
      <footer class="foot">Dados armazenados apenas neste aparelho.<br>Projeto de fã, não-oficial. Não afiliado, endossado ou patrocinado pela Paradox Interactive / White Wolf / VEKN. Vampire: The Eternal Struggle e VTES são marcas de seus respectivos donos.</footer>
    `;
    app.querySelector('.back').onclick = ()=>{ stopAlarmLoop(); stopTimerTick(false); state.currentId=null; render(); };
    document.getElementById('btn-delete-current').onclick = async ()=>{
      if (!(await askConfirm(`Apagar o torneio "${t.name}"? Essa ação não pode ser desfeita.`))) return;
      stopTimerTick(false);
      await dbDelete(t.id);
      state.tournaments = state.tournaments.filter(x=>x.id!==t.id);
      state.currentId = null;
      render();
      toast('Torneio apagado');
    };
    app.querySelectorAll('.tabs button').forEach(b=>{
      b.onclick = ()=>{ state.tab = b.dataset.tab; render(); };
    });
    const slot = document.getElementById('tab-content');
    if (state.tab==='jogadores') renderPlayersTab(slot, t);
    else if (state.tab==='mesas') renderTablesTab(slot, t);
    else if (state.tab==='classificacao') renderStandingsTab(slot, t);
    else if (state.tab==='cronometro') renderTimerTab(slot, t);
    else if (state.tab==='cartas') renderCardsTab(slot, t);
    else if (state.tab==='compartilhar') renderShareTab(slot, t);
  }

  /* ---------- ABA: Jogadores ---------- */
  function renderPlayersTab(slot, t){
    slot.innerHTML = `
      <div class="card">
        <h2>Adicionar jogador</h2>
        <label>Nome do jogador</label>
        <input id="p-name" type="text" placeholder="Nome">
        <label>Clã</label>
        <select id="p-clan">${clanSelectOptions('other')}</select>
        <label>Deck utilizado</label>
        <input id="p-deck" type="text" placeholder="Ex: Tremere Vote Bleed">
        <label>Link da decklist (opcional)</label>
        <input id="p-link" type="url" placeholder="https://...">
        <button class="btn primary full" id="btn-add-player">Adicionar</button>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h2 style="margin-bottom:0;">Jogadores (${t.players.length})</h2>
          <button class="btn ghost" id="btn-export-txt">Exportar .TXT</button>
        </div>
        ${t.players.length ? t.players.map(p=>`
          <div class="player-row">
            <div class="info">
              <div class="pname">${clanBadge(p.clan)} ${esc(p.name)}</div>
              <div class="pdeck">${esc(p.deckName || '—')}</div>
              ${p.deckLink ? `<a class="decklink" href="${esc(p.deckLink)}" target="_blank" rel="noopener">${esc(p.deckLink)}</a>` : ''}
            </div>
            <button class="icon-btn" title="Remover" data-rm="${p.id}">🗑</button>
          </div>
        `).join('') : `<div class="empty"><div class="glyph">🃏</div>Nenhum jogador cadastrado.</div>`}
      </div>
    `;
    document.getElementById('btn-add-player').onclick = async ()=>{
      const name = document.getElementById('p-name').value.trim();
      const clan = document.getElementById('p-clan').value;
      const deckName = document.getElementById('p-deck').value.trim();
      const deckLink = document.getElementById('p-link').value.trim();
      if (!name){ toast('Digite o nome do jogador'); return; }
      t.players.push({ id: uid('p'), name, clan, deckName, deckLink });
      await persist(t);
      render();
      toast('Jogador adicionado');
    };
    slot.querySelectorAll('[data-rm]').forEach(btn=>{
      btn.onclick = async ()=>{
        if(!(await askConfirm('Remover este jogador do torneio?', 'Remover'))) return;
        t.players = t.players.filter(p=>p.id!==btn.dataset.rm);
        await persist(t);
        render();
      };
    });
    document.getElementById('btn-export-txt').onclick = ()=> exportPlayersTxt(t);
  }

  async function ensureDownloads(){
    if (state.downloadsCap !== null) return state.downloadsCap;
    try{
      if (window.claude && typeof window.claude.use === 'function'){
        state.downloadsCap = await window.claude.use('downloads');
      } else { state.downloadsCap = null; }
    }catch(e){ state.downloadsCap = null; }
    return state.downloadsCap;
  }

  async function exportPlayersTxt(t){
    const lines = [
      `Torneio: ${t.name}`,
      `ID: ${shortId(t.id)}`,
      `Data: ${fmtDate(t.createdAt)}`,
      '',
      ...t.players.map(p=> `${p.name}${p.clan && p.clan!=='other' ? ' ['+ (clanById(p.clan)?.name||'') +']' : ''} — ${p.deckName || 'Deck não informado'}${p.deckLink ? ' — ' + p.deckLink : ''}`)
    ];
    const text = lines.join('\n');
    const filename = `vtes_${(t.name||'torneio').replace(/[^a-z0-9]+/gi,'_').toLowerCase()}_jogadores.txt`;
    const cap = await ensureDownloads();
    if (cap){
      try{
        await cap.save({ filename, data: text });
        toast('Arquivo enviado para download');
        return;
      }catch(e){ /* segue para fallback */ }
    }
    try{
      const blob = new Blob([text], {type:'text/plain'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url), 4000);
      toast('Arquivo baixado');
    }catch(e){
      toast('Não foi possível exportar neste navegador');
    }
  }

  /* ---------- ABA: Rodadas & Mesas ---------- */
  function renderTablesTab(slot, t){
    slot.innerHTML = `
      <div class="card">
        <h2>Nova rodada</h2>
        <div class="row">
          <input id="r-name" type="text" placeholder="Ex: Rodada 1">
          <button class="btn primary" id="btn-add-round">Criar</button>
        </div>
      </div>
      <div id="rounds-host"></div>
    `;
    document.getElementById('btn-add-round').onclick = async ()=>{
      const name = document.getElementById('r-name').value.trim() || `Rodada ${t.rounds.length+1}`;
      t.rounds.push({ id: uid('r'), name, tables: [] });
      await persist(t);
      render();
    };
    const host = document.getElementById('rounds-host');
    if (!t.rounds.length){
      host.innerHTML = `<div class="empty"><div class="glyph">⚔️</div>Nenhuma rodada criada ainda.</div>`;
      return;
    }
    host.innerHTML = [...t.rounds].reverse().map(r=>`
      <div class="round-block" data-round="${r.id}">
        <div class="round-title">
          <h3>${esc(r.name)}</h3>
          <button class="icon-btn" data-add-table="${r.id}" title="Nova mesa">➕ Mesa</button>
          <button class="icon-btn" data-rm-round="${r.id}" title="Remover rodada" style="margin-left:auto;">🗑</button>
        </div>
        <div data-tables-of="${r.id}">
          ${r.tables.length ? r.tables.map(tb=> tableBlockHtml(t, r, tb)).join('') : `<div style="color:var(--bone-dim);font-size:0.88rem;padding:6px 2px;">Sem mesas nesta rodada.</div>`}
        </div>
      </div>
    `).join('');

    host.querySelectorAll('[data-add-table]').forEach(btn=>{
      btn.onclick = ()=> openTableModal(t, btn.dataset.addTable);
    });
    host.querySelectorAll('[data-rm-round]').forEach(btn=>{
      btn.onclick = async ()=>{
        if(!(await askConfirm('Remover esta rodada e todas as suas mesas?', 'Remover'))) return;
        t.rounds = t.rounds.filter(r=>r.id!==btn.dataset.rmRound);
        await persist(t); render();
      };
    });
    host.querySelectorAll('[data-edit-table]').forEach(btn=>{
      btn.onclick = ()=> openTableModal(t, btn.dataset.round, btn.dataset.editTable);
    });
    host.querySelectorAll('[data-rm-table]').forEach(btn=>{
      btn.onclick = async ()=>{
        if(!(await askConfirm('Remover esta mesa?', 'Remover'))) return;
        const r = t.rounds.find(x=>x.id===btn.dataset.round);
        r.tables = r.tables.filter(tb=>tb.id!==btn.dataset.rmTable);
        await persist(t); render();
      };
    });
  }

  function tableBlockHtml(t, r, tb){
    const order = tb.playerIds || [];
    const n = order.length;
    const players = order.map(pid=> t.players.find(p=>p.id===pid)).filter(Boolean);
    return `
      <div class="table-block">
        <div class="thead">
          <div class="label">${esc(tb.label)}</div>
          <div>
            <button class="icon-btn" data-round="${r.id}" data-edit-table="${tb.id}" title="Editar">✎</button>
            <button class="icon-btn" data-round="${r.id}" data-rm-table="${tb.id}" title="Remover">🗑</button>
          </div>
        </div>
        ${players.map((p,i)=>{
          const preyName = n>1 ? (t.players.find(x=>x.id===order[(i-1+n)%n])?.name || '—') : '—';
          const predName = n>1 ? (t.players.find(x=>x.id===order[(i+1)%n])?.name || '—') : '—';
          return `
          <div class="score-line" style="align-items:flex-start;flex-direction:column;gap:2px;padding:8px 0;">
            <div style="display:flex;justify-content:space-between;width:100%;">
              <span class="pn">${i+1}º — ${clanBadge(p.clan)} ${esc(p.name)}</span>
              <span class="sc">${Number(tb.scores?.[p.id]||0).toLocaleString('pt-BR')} pts</span>
            </div>
            <div style="font-size:0.78rem;color:var(--bone-dim);">Presa: ${esc(preyName)} · Predador: ${esc(predName)}</div>
          </div>
        `;}).join('') || '<div style="color:var(--bone-dim);font-size:0.85rem;">Nenhum jogador nesta mesa.</div>'}
      </div>
    `;
  }

  function openTableModal(t, roundId, tableId){
    const r = t.rounds.find(x=>x.id===roundId);
    if (!r) return;
    const existing = tableId ? r.tables.find(x=>x.id===tableId) : null;
    let order = existing ? [...existing.playerIds] : [];
    const scoresLocal = existing ? {...existing.scores} : {};

    const modal = openModal(`
      <h2>${existing? 'Editar mesa' : 'Nova mesa'} — ${esc(r.name)}</h2>
      <label>Nome/identificação da mesa</label>
      <input id="tb-label" type="text" value="${existing? esc(existing.label) : `Mesa ${r.tables.length+1}`}">

      <label style="margin-top:6px;">Jogadores disponíveis (toque para adicionar à mesa)</label>
      <div class="picker-list" id="tb-available"></div>

      <label style="margin-top:6px;">Ordem de assento — 1º ao último, sentido do jogo</label>
      <div style="color:var(--bone-dim);font-size:0.78rem;margin:-6px 0 8px;">A presa de cada jogador é o próximo da lista; o predador é o anterior.</div>
      <button class="btn ghost full" id="tb-randomize" style="margin-bottom:10px;">🎲 Sortear ordem aleatoriamente</button>
      <div id="tb-order"></div>

      <div class="row" style="margin-top:8px;">
        <button class="btn ghost full" id="tb-cancel">Cancelar</button>
        <button class="btn primary full" id="tb-save">Salvar mesa</button>
      </div>
    `, null);

    function renderAvailable(){
      const box = modal.querySelector('#tb-available');
      const avail = t.players.filter(p=> !order.includes(p.id));
      box.innerHTML = avail.length ? avail.map(p=>`
        <div class="picker-item">
          <label style="margin:0;flex:1;">${clanBadge(p.clan)} ${esc(p.name)}</label>
          <button class="icon-btn" data-add="${p.id}" title="Adicionar à mesa">➕</button>
        </div>
      `).join('') : `<div style="padding:12px;color:var(--bone-dim);font-size:0.9rem;">${t.players.length ? 'Todos os jogadores já estão na mesa.' : 'Cadastre jogadores primeiro na aba Jogadores.'}</div>`;
      box.querySelectorAll('[data-add]').forEach(btn=>{
        btn.onclick = ()=>{ order.push(btn.dataset.add); if(scoresLocal[btn.dataset.add]==null) scoresLocal[btn.dataset.add]=0; renderAll(); };
      });
    }
    function renderOrder(){
      const box = modal.querySelector('#tb-order');
      const n = order.length;
      box.innerHTML = n ? order.map((pid,i)=>{
        const p = t.players.find(x=>x.id===pid);
        if (!p) return '';
        const preyName = n>1 ? (t.players.find(x=>x.id===order[(i-1+n)%n])?.name || '—') : '—';
        const predName = n>1 ? (t.players.find(x=>x.id===order[(i+1)%n])?.name || '—') : '—';
        return `
        <div class="table-block" style="margin-bottom:8px;padding:10px 12px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="chip" style="flex:0 0 auto;">${i+1}º</span>
            <span style="flex:1;color:var(--bone);">${clanBadge(p.clan)} ${esc(p.name)}</span>
            <button class="icon-btn" data-up="${i}" title="Mover para cima" ${i===0?'disabled':''}>▲</button>
            <button class="icon-btn" data-down="${i}" title="Mover para baixo" ${i===n-1?'disabled':''}>▼</button>
            <button class="icon-btn" data-remove="${pid}" title="Remover da mesa">🗑</button>
          </div>
          <div style="font-size:0.78rem;color:var(--bone-dim);margin:4px 0 8px;">Presa: ${esc(preyName)} · Predador: ${esc(predName)}</div>
          <div class="row" style="align-items:center;margin:0;">
            <span style="flex:1;color:var(--bone-dim);font-size:0.85rem;">Pontuação</span>
            <input style="flex:0 0 110px;margin:0;" type="number" step="0.5" min="0" data-score="${pid}" value="${scoresLocal[pid] ?? 0}">
          </div>
        </div>`;
      }).join('') : `<div style="padding:12px;color:var(--bone-dim);font-size:0.9rem;">Adicione jogadores acima para montar a mesa.</div>`;
      box.querySelectorAll('[data-up]').forEach(btn=>{
        btn.onclick = ()=>{ const i=Number(btn.dataset.up); if(i>0){ [order[i-1],order[i]]=[order[i],order[i-1]]; renderOrder(); } };
      });
      box.querySelectorAll('[data-down]').forEach(btn=>{
        btn.onclick = ()=>{ const i=Number(btn.dataset.down); if(i<order.length-1){ [order[i+1],order[i]]=[order[i],order[i+1]]; renderOrder(); } };
      });
      box.querySelectorAll('[data-remove]').forEach(btn=>{
        btn.onclick = ()=>{ order = order.filter(id=>id!==btn.dataset.remove); renderAll(); };
      });
      box.querySelectorAll('[data-score]').forEach(inp=>{
        inp.oninput = ()=>{ scoresLocal[inp.dataset.score] = Number(inp.value)||0; };
      });
    }
    function renderAll(){ renderAvailable(); renderOrder(); }
    renderAll();

    modal.querySelector('#tb-randomize').onclick = ()=>{
      if (order.length < 2){ toast('Adicione ao menos 2 jogadores antes de sortear'); return; }
      for (let i = order.length - 1; i > 0; i--){
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      renderOrder();
      toast('Ordem sorteada');
    };

    modal.querySelector('#tb-cancel').onclick = closeModal;
    modal.querySelector('#tb-save').onclick = async ()=>{
      const label = modal.querySelector('#tb-label').value.trim() || `Mesa ${r.tables.length+1}`;
      if (order.length < 2){ toast('Adicione ao menos 2 jogadores'); return; }
      const scores = {};
      order.forEach(pid=>{ scores[pid] = Number(scoresLocal[pid]) || 0; });
      if (existing){
        existing.label = label; existing.playerIds = order; existing.scores = scores;
      } else {
        r.tables.push({ id: uid('tb'), label, playerIds: order, scores });
      }
      await persist(t);
      closeModal();
      render();
      toast('Mesa salva');
    };
  }

  /* ---------- ABA: Classificação ---------- */
  function renderStandingsTab(slot, t){
    const st = standingsFor(t);
    slot.innerHTML = `
      <div class="card">
        <h2>Classificação geral</h2>
        ${st.length ? `
        <table class="plain">
          <thead><tr><th>#</th><th>Jogador</th><th>Mesas</th><th>Total</th></tr></thead>
          <tbody>
            ${st.map((s,i)=>`
              <tr>
                <td class="${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':''}">${i+1}º</td>
                <td>${clanBadge(s.player.clan)} ${esc(s.player.name)}</td>
                <td>${s.games}</td>
                <td class="${i===0?'rank-1':i===1?'rank-2':i===2?'rank-3':''}">${s.total.toLocaleString('pt-BR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : `<div class="empty"><div class="glyph">🏆</div>Ainda não há mesas com pontuação.</div>`}
      </div>
    `;
  }

  /* ---------- ABA: Cronômetro ---------- */
  function renderTimerTab(slot, t){
    const mins = Math.floor(state.timer.remaining/60);
    const secs = state.timer.remaining % 60;
    const warn = state.timer.remaining <= 300 && state.timer.remaining>0;
    slot.innerHTML = `
      <div class="card timer-wrap">
        <h2 style="margin-bottom:16px;">Cronômetro de mesa</h2>
        <div class="timer-face">
          <div class="timer-digits ${warn?'warn':''}" id="timer-digits">${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}</div>
          <div class="timer-label">${state.timer.remaining<=0 ? 'TEMPO ESGOTADO' : (state.timer.running? 'EM ANDAMENTO' : 'PAUSADO')}</div>
        </div>
        <div class="timer-controls">
          <button class="btn primary" id="tm-toggle">${state.timer.running? 'Pausar' : 'Iniciar'}</button>
          <button class="btn ghost" id="tm-reset">Reiniciar</button>
        </div>
        <div class="timer-presets">
          <button class="btn ghost" data-mins="90">90 min</button>
          <button class="btn ghost" data-mins="105">105 min</button>
          <button class="btn ghost" data-mins="120">120 min</button>
          <button class="btn ghost" data-mins="150">150 min</button>
        </div>
        <div class="timer-presets">
          <button class="btn ghost" id="tm-test-alarm">🔊 Testar alarme</button>
        </div>
      </div>
    `;
    slot.querySelectorAll('[data-mins]').forEach(b=>{
      b.onclick = ()=>{
        stopTimerTick(false);
        state.timer.total = Number(b.dataset.mins)*60;
        state.timer.remaining = state.timer.total;
        renderTournament();
      };
    });
    document.getElementById('tm-toggle').onclick = ()=>{
      ensureAudioCtx();
      if (state.timer.running) stopTimerTick(true);
      else startTimerTick();
    };
    document.getElementById('tm-reset').onclick = ()=>{
      stopAlarmLoop();
      stopTimerTick(false);
      state.timer.remaining = state.timer.total;
      renderTournament();
    };
    document.getElementById('tm-test-alarm').onclick = ()=>{
      ensureAudioCtx();
      playAlarmPattern();
    };
  }

  /* ---------- Alarme sonoro (Web Audio API, sem arquivos externos) ---------- */
  function ensureAudioCtx(){
    if (!state.audioCtx){
      try{ state.audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e){ state.audioCtx = null; }
    }
    if (state.audioCtx && state.audioCtx.state === 'suspended'){
      state.audioCtx.resume().catch(()=>{});
    }
    return state.audioCtx;
  }
  function beep(ctx, freq, startTime, duration){
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, startTime);
    gain.gain.exponentialRampToValueAtTime(0.4, startTime+0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime+duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime+duration+0.03);
  }
  function playAlarmPattern(){
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    beep(ctx, 880, now, 0.22);
    beep(ctx, 880, now+0.32, 0.22);
    beep(ctx, 1108, now+0.64, 0.42);
  }
  function startAlarmLoop(){
    stopAlarmLoop();
    playAlarmPattern();
    state.timer.alarmHandle = setInterval(playAlarmPattern, 2400);
  }
  function stopAlarmLoop(){
    if (state.timer.alarmHandle) clearInterval(state.timer.alarmHandle);
    state.timer.alarmHandle = null;
  }
  function openAlarmModal(){
    const modal = openModal(`
      <h2 style="text-align:center;">⏰ Tempo esgotado!</h2>
      <p style="text-align:center;color:var(--bone);margin:8px 0 22px;">O tempo desta mesa chegou ao fim.</p>
      <button class="btn primary full" id="alarm-stop">Silenciar alarme</button>
    `, ()=> stopAlarmLoop());
    modal.querySelector('#alarm-stop').onclick = ()=>{ stopAlarmLoop(); closeModal(); };
  }

  function startTimerTick(){
    if (state.timer.remaining<=0) state.timer.remaining = state.timer.total;
    state.timer.running = true;
    clearInterval(state.timer.intervalHandle);
    state.timer.intervalHandle = setInterval(()=>{
      state.timer.remaining = Math.max(0, state.timer.remaining-1);
      updateTimerDigitsOnly();
      if (state.timer.remaining<=0){
        stopTimerTick(false);
        toast('Tempo da mesa esgotado');
        if (navigator.vibrate) navigator.vibrate([300,100,300,100,300,100,600]);
        startAlarmLoop();
        openAlarmModal();
      }
    }, 1000);
    if (state.tab==='cronometro') renderTournament();
  }
  function stopTimerTick(keepFlagFalseAfter){
    clearInterval(state.timer.intervalHandle);
    state.timer.intervalHandle = null;
    state.timer.running = false;
    if (state.tab==='cronometro') renderTournament();
  }
  function updateTimerDigitsOnly(){
    const el = document.getElementById('timer-digits');
    if (!el) return;
    const mins = Math.floor(state.timer.remaining/60);
    const secs = state.timer.remaining % 60;
    el.textContent = `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
    el.classList.toggle('warn', state.timer.remaining<=300 && state.timer.remaining>0);
    const lbl = document.querySelector('.timer-label');
    if (lbl) lbl.textContent = state.timer.remaining<=0 ? 'TEMPO ESGOTADO' : (state.timer.running? 'EM ANDAMENTO':'PAUSADO');
  }

  /* ---------- ABA: Compartilhar (QR export/import) ---------- */
  /* ---------- ABA: Cartas (busca de cartas oficiais de VTES via API pública KRCG) ---------- */
  const cardDetailCache = {};
  async function krcgSearch(query){
    try{
      const res = await fetch('https://v2.api.krcg.org/card_search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: [query] })
      });
      if (res.ok){
        const data = await res.json();
        if (Array.isArray(data)) return data;
      }
    }catch(e){ /* tenta o modo alternativo abaixo */ }
    // modo alternativo: tenta como nome exato
    try{
      const res2 = await fetch('https://v2.api.krcg.org/card/' + encodeURIComponent(query));
      if (res2.ok){
        const card = await res2.json();
        if (card && card.name) return [card.name];
      }
    }catch(e){ return null; }
    return null;
  }
  async function krcgGetCard(name){
    if (cardDetailCache[name]) return cardDetailCache[name];
    try{
      const res = await fetch('https://v2.api.krcg.org/card/' + encodeURIComponent(name));
      if (!res.ok) return null;
      const card = await res.json();
      cardDetailCache[name] = card;
      return card;
    }catch(e){ return null; }
  }

  function renderCardsTab(slot, t){
    slot.innerHTML = `
      <div class="card">
        <h2>Buscar cartas de VTES</h2>
        <div style="color:var(--bone-dim);font-size:0.85rem;margin-bottom:10px;">
          Busca em tempo real na base oficial de cartas (via KRCG). Requer internet.
        </div>
        <div class="row">
          <input id="card-search-input" type="text" placeholder="Nome, texto, clã, tipo...">
          <button class="btn primary" id="card-search-btn" style="flex:0 0 auto;">Buscar</button>
        </div>
        <div id="card-search-status" style="color:var(--bone-dim);font-size:0.85rem;"></div>
        <div id="card-search-results"></div>
      </div>
      <div id="card-detail-host"></div>
    `;
    const input = slot.querySelector('#card-search-input');
    const status = slot.querySelector('#card-search-status');
    const results = slot.querySelector('#card-search-results');
    async function doSearch(){
      const q = input.value.trim();
      if (!q){ toast('Digite algo para buscar'); return; }
      status.textContent = 'Buscando...';
      results.innerHTML = '';
      const names = await krcgSearch(q);
      if (names === null){
        status.textContent = 'Não foi possível conectar à base de cartas agora. Verifique sua internet (essa busca não funciona no ambiente de teste do claude.ai — funciona no app hospedado no GitHub Pages).';
        return;
      }
      if (names.length === 0){
        status.textContent = 'Nenhuma carta encontrada.';
        return;
      }
      const shown = names.slice(0, 40);
      status.textContent = `${names.length} resultado(s)${names.length>40 ? ' — mostrando os 40 primeiros' : ''}.`;
      results.innerHTML = shown.map(n=>`<div class="picker-item" data-card="${esc(n)}" style="cursor:pointer;"><label style="margin:0;flex:1;cursor:pointer;">${esc(n)}</label><span class="icon-btn">›</span></div>`).join('');
      results.querySelectorAll('[data-card]').forEach(row=>{
        row.onclick = ()=> showCardDetail(row.dataset.card, slot);
      });
    }
    document.getElementById('card-search-btn').onclick = doSearch;
    input.addEventListener('keydown', (e)=>{ if (e.key==='Enter') doSearch(); });
  }

  async function showCardDetail(name, slot){
    const host = slot.querySelector('#card-detail-host');
    host.innerHTML = `<div class="card">Carregando "${esc(name)}"...</div>`;
    const card = await krcgGetCard(name);
    if (!card){
      host.innerHTML = `<div class="card">Não foi possível carregar os detalhes desta carta agora.</div>`;
      return;
    }
    const types = Array.isArray(card.types) ? card.types.join(', ') : '';
    const clans = Array.isArray(card.clans) ? card.clans.join(', ') : (card.clan || '');
    const disc = Array.isArray(card.disciplines) ? card.disciplines.join(', ') : '';
    const setsList = card.sets ? Object.keys(card.sets).join(', ') : (card.ordered_sets ? card.ordered_sets.join(', ') : '');
    host.innerHTML = `
      <div class="card">
        <div style="display:flex;gap:14px;align-items:flex-start;">
          ${card.url ? `<img src="${esc(card.url)}" alt="" style="width:90px;border-radius:6px;border:1px solid var(--line);flex:0 0 auto;" onerror="this.style.display='none'">` : ''}
          <div style="flex:1;min-width:0;">
            <h2 style="margin-bottom:4px;">${esc(card.printed_name || card.name)}</h2>
            ${types ? `<div class="chip" style="margin-bottom:6px;">${esc(types)}</div>` : ''}
            ${clans ? `<div style="color:var(--bone-dim);font-size:0.85rem;">Clã: ${esc(clans)}</div>` : ''}
            ${disc ? `<div style="color:var(--bone-dim);font-size:0.85rem;">Disciplinas: ${esc(disc)}</div>` : ''}
          </div>
        </div>
        ${card.card_text ? `<div class="divider"></div><div style="white-space:pre-line;color:var(--bone);font-size:0.98rem;">${esc(card.card_text)}</div>` : ''}
        ${setsList ? `<div style="color:var(--bone-dim);font-size:0.8rem;margin-top:12px;">Sets: ${esc(setsList)}</div>` : ''}
      </div>
    `;
    host.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  function renderShareTab(slot, t){
    slot.innerHTML = `
      <div class="card">
        <h2>Compartilhar torneio (QR Code)</h2>
        <div style="color:var(--bone-dim);font-size:0.88rem;margin-bottom:12px;">
          Gere um ou mais QR Codes com os dados atuais deste torneio. Outro jogador pode escanear
          na tela inicial do app dele para importar tudo — sem internet.
        </div>
        <button class="btn primary full" id="btn-gen-qr">Gerar QR Code de exportação</button>
        <div id="qr-progress"></div>
        <div class="qr-frame" id="qr-frame"></div>
        <div class="row" id="qr-nav" style="display:none;">
          <button class="btn ghost" id="qr-prev">◀ Anterior</button>
          <button class="btn ghost" id="qr-play">Pausar</button>
          <button class="btn ghost" id="qr-next">Próximo ▶</button>
        </div>
      </div>
      <div class="card">
        <h2>ID deste torneio</h2>
        <div class="chip">${shortId(t.id)}</div>
      </div>
    `;
    document.getElementById('btn-gen-qr').onclick = ()=> generateShareQr(t);
  }

  function chunkString(str, size){
    const chunks = [];
    for (let i=0;i<str.length;i+=size) chunks.push(str.slice(i, i+size));
    return chunks;
  }

  function generateShareQr(t){
    const json = JSON.stringify(t);
    const raw = chunkString(json, 700);
    const n = raw.length;
    const packets = raw.map((d,i)=> JSON.stringify({ y:'vtq', id: t.id, i, n, d }));
    state.qrShare.chunks = packets;
    state.qrShare.idx = 0;
    state.qrShare.playing = n > 1;
    document.getElementById('qr-nav').style.display = n>1 ? 'flex' : 'none';
    drawQrFrame();
    clearInterval(state.qrShare.timerHandle);
    if (n>1){
      state.qrShare.timerHandle = setInterval(()=>{
        if (!state.qrShare.playing) return;
        state.qrShare.idx = (state.qrShare.idx+1) % state.qrShare.chunks.length;
        drawQrFrame();
      }, 1600);
      document.getElementById('qr-play').onclick = ()=>{
        state.qrShare.playing = !state.qrShare.playing;
        document.getElementById('qr-play').textContent = state.qrShare.playing? 'Pausar':'Continuar';
      };
      document.getElementById('qr-prev').onclick = ()=>{
        state.qrShare.idx = (state.qrShare.idx-1+state.qrShare.chunks.length)%state.qrShare.chunks.length;
        drawQrFrame();
      };
      document.getElementById('qr-next').onclick = ()=>{
        state.qrShare.idx = (state.qrShare.idx+1)%state.qrShare.chunks.length;
        drawQrFrame();
      };
    }
  }
  function drawQrFrame(){
    const frame = document.getElementById('qr-frame');
    const prog = document.getElementById('qr-progress');
    if (!frame) return;
    frame.innerHTML = '<div id="qr-canvas-host"></div>';
    const n = state.qrShare.chunks.length;
    prog.textContent = n>1 ? `Parte ${state.qrShare.idx+1} de ${n} — mantenha a câmera apontada até capturar todas` : 'QR Code pronto para escanear';
    // eslint-disable-next-line no-undef
    new QRCode(document.getElementById('qr-canvas-host'), {
      text: state.qrShare.chunks[state.qrShare.idx],
      width: 230, height: 230,
      correctLevel: QRCode.CorrectLevel.L
    });
  }

  /* ---------- Escaneamento (importar) ---------- */
  function openScanModal(){
    const modal = openModal(`
      <h2>Escanear QR Code</h2>
      <div class="scan-wrap">
        <video id="scanner" playsinline muted></video>
      </div>
      <div class="scan-progress" id="scan-progress">Aponte a câmera para o QR Code...</div>
      <button class="btn ghost full" id="scan-cancel" style="margin-top:12px;">Cancelar</button>
    `, ()=> stopScan());
    startScan(modal);
  }
  async function startScan(modal){
    state.scan.active = true;
    state.scan.collected = {};
    state.scan.total = 0;
    state.scan.tid = null;
    const video = modal.querySelector('#scanner');
    try{
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      state.scan.stream = stream;
      video.srcObject = stream;
      await video.play();
    }catch(e){
      modal.querySelector('#scan-progress').textContent = 'Não foi possível acessar a câmera. Verifique as permissões do navegador.';
      return;
    }
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    function tick(){
      if (!state.scan.active) return;
      if (video.readyState === video.HAVE_ENOUGH_DATA){
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        ctx.drawImage(video, 0,0, canvas.width, canvas.height);
        const img = ctx.getImageData(0,0,canvas.width, canvas.height);
        // eslint-disable-next-line no-undef
        const code = jsQR(img.data, img.width, img.height);
        if (code && code.data){
          handleScannedPacket(code.data, modal);
        }
      }
      state.scan.rafHandle = requestAnimationFrame(tick);
    }
    tick();
    modal.querySelector('#scan-cancel').onclick = ()=>{ closeModal(); };
  }
  function stopScan(){
    state.scan.active = false;
    if (state.scan.rafHandle) cancelAnimationFrame(state.scan.rafHandle);
    if (state.scan.stream) state.scan.stream.getTracks().forEach(tr=>tr.stop());
    state.scan.stream = null;
  }
  async function handleScannedPacket(raw, modal){
    let pkt;
    try{ pkt = JSON.parse(raw); }catch(e){ return; }
    if (!pkt || pkt.y !== 'vtq') return;
    if (state.scan.tid && state.scan.tid !== pkt.id){
      // novo torneio começou a ser escaneado — reinicia coleta
      state.scan.collected = {};
    }
    state.scan.tid = pkt.id;
    state.scan.total = pkt.n;
    state.scan.collected[pkt.i] = pkt.d;
    const got = Object.keys(state.scan.collected).length;
    const prog = modal.querySelector('#scan-progress');
    if (prog) prog.textContent = `Capturado ${got} de ${pkt.n} parte(s)...`;
    if (got >= pkt.n){
      let full = '';
      for (let i=0;i<pkt.n;i++) full += (state.scan.collected[i] ?? '');
      try{
        const tournament = JSON.parse(full);
        stopScan();
        closeModal();
        await persist(tournament);
        state.currentId = tournament.id;
        state.tab = 'jogadores';
        render();
        toast('Torneio importado com sucesso');
      }catch(e){
        if (prog) prog.textContent = 'Dados incompletos ou corrompidos. Tente novamente.';
        state.scan.collected = {};
      }
    }
  }

  /* ---------- Modal genérico ---------- */
  let modalCloseCb = null;
  function openModal(innerHtml, onClose){
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.id = 'modal-back';
    back.innerHTML = `<div class="modal">${innerHtml}</div>`;
    document.body.appendChild(back);
    modalCloseCb = onClose || null;
    back.addEventListener('click', (e)=>{ if (e.target===back) closeModal(); });
    return back.querySelector('.modal');
  }
  function closeModal(){
    const back = document.getElementById('modal-back');
    if (back) back.remove();
    if (modalCloseCb) { const cb = modalCloseCb; modalCloseCb=null; cb(); }
  }
  function askConfirm(message, confirmLabel){
    return new Promise(resolve=>{
      const modal = openModal(`
        <h2>Confirmar</h2>
        <p style="color:var(--bone);margin:6px 0 20px;font-size:1.05rem;">${esc(message)}</p>
        <div class="row">
          <button class="btn ghost full" id="cf-cancel">Cancelar</button>
          <button class="btn danger full" id="cf-ok">${esc(confirmLabel || 'Apagar')}</button>
        </div>
      `, ()=> resolve(false));
      modal.querySelector('#cf-cancel').onclick = closeModal;
      modal.querySelector('#cf-ok').onclick = ()=>{ modalCloseCb = null; closeModal(); resolve(true); };
    });
  }

  /* ---------- inicialização ---------- */
  async function init(){
    try{
      state.tournaments = await dbGetAll();
    }catch(e){
      console.error(e);
    }
    render();
  }
  init();
})();
