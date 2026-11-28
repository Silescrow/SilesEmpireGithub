/* ============================================================
   SILES EMPIRE – Spiel (Steinzeit)
   Three.js (r160, three.min.js), eine Szene, Touch-Steuerung
   ============================================================ */
(function(){
'use strict';
const EE = window.EE;
const T = window.THREE;

/* ---------- kleine Helfer ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v,a,b) => v<a?a:v>b?b:v;
const lerp = (a,b,t) => a+(b-a)*t;
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash2(x,y,s){ let h=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453; return h-Math.floor(h); }
function vnoise(x,y,s){ const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);
  return lerp(lerp(a,b,u),lerp(c,d,u),v); }
function ridged(x,y,s){ let f=0,a=.55,fr=1,w=1; for(let i=0;i<5;i++){ let n=1-Math.abs(vnoise(x*fr,y*fr,s+i*13)*2-1); n*=n; n*=w; w=clamp(n*1.7,0,1); f+=n*a; a*=.5; fr*=2.07; } return f; }
function fbm(x,y,s){ let f=0,a=.5,fr=1; for(let i=0;i<4;i++){ f+=a*vnoise(x*fr,y*fr,s+i*13); fr*=2; a*=.5; } return f; }

/* ---------- Daten ---------- */
const CIV_COLOR = { 'Türkei':0xd0182c, 'Italien':0x7a1030, 'Griechenland':0x2a6fd6, 'Ägypten':0xe3b23c, 'Irak':0x17b3c4, 'Deutschland':0x2e7d32,
  'Großbritannien':0x1a2a80, 'Frankreich':0x7e57c2, 'Norwegen':0xd9d9d9, 'Mongolei':0x6ec6ff, 'China':0xff7a1a, 'Japan':0xff8fb1, 'Korea':0x2b2b2b,
  'Mexiko':0x138a7d, 'Peru':0xffd400, 'Guatemala':0x7cc242, 'Russland':0xa0522d, 'Südafrika':0xc9a46a,
  'Iran':0x0b5d1e, 'Saudi-Arabien':0x556b2f, 'Indien':0x9c27b0, 'Mali':0xb8860b, 'Spanien':0x8b0000, 'Portugal':0x00695c,
  'Irland':0xa5d6a7, 'Niederlande':0xe65100, 'Polen':0xf5f5f5, 'USA':0x3c3b6e, 'Australien':0xffcc80, 'Brasilien':0x00c853 };
// Ländernamen im Satz: die Türkei, der Irak, die USA, Deutschland (k: 0 wer/was, 1 wem, 2 wen)
const CIV_ART = { f:['die','der','die'], m:['der','dem','den'], p:['die','den','die'] };
// Name in der aktuellen Epoche (Steinzeit: Çatalhöyük, Bandkeramiker …; ab Neuzeit das heutige Land)
function eraOf(c){ c=c&&c.civ||c; const e0=(G&&G.era)|0, e=e0<=2?e0:e0===3?2:3, l=c[6]; const t=(l&&l[Math.min(e,l.length-1)]||c[0]+'|'+(c[4]||'')).split('|'); return [t[0], t[1]||'']; }
function NM(c){ return eraOf(c)[0]; }
function cn(c,k){ const [n,g]=eraOf(c), a=CIV_ART[g]; return (a?a[k|0]+' ':'')+n; }
function CN(c,k){ const t=cn(c,k); return t[0].toUpperCase()+t.slice(1); }
function cv(c,sg,pl){ return eraOf(c)[1]==='p'?pl:sg; }
const BASE_COLORS = [0x2f7bff,0xe23b3b,0xf2c230,0x3fbf5a,0x9b59ff,0xff8a1f,0x1fd1d1,0xff5fb0,0x8a5a2b,0xffffff,0x2b2b2b,0x7dff4a,0x1f4fa8,0xa8203a,0xc9a227,0x2e8b57,0x6a3d9a,0xff6f61,0x4a148c,0x00bfa5,0xffab91,0x795548,0xcddc39,0x5c6bc0,0xec407a,0x26c6da,0xbf360c,0x9e9d24,0x546e7a,0xffe082];
const COLORS = [0x2f7bff,0xe23b3b,0xf2c230,0x3fbf5a,0x9b59ff,0xff8a1f,0x1fd1d1,0xff5fb0,0x8a5a2b,0xffffff,0x2b2b2b,0x7dff4a,0x1f4fa8,0xa8203a,0xc9a227,0x2e8b57,0x6a3d9a,0xff6f61];
const COLNAMES = ['Blau','Rot','Gelb','Grün','Lila','Orange','Türkis','Pink','Braun','Weiß','Schwarz','Hellgrün','Dunkelblau','Weinrot','Ocker','Waldgrün','Violett','Koralle'];
const RES = ['food','wood','stone','gold'];
const RES_DE = {food:'Nahrung',wood:'Holz',stone:'Stein',gold:'Gold',metal:'Metall',oil:'Öl'};
const BUILD = {
  tc:    {name:'Stadtzentrum', size:6, cost:{wood:250, stone:100, food:100}, time:60, hp:3000, drop:['food','wood','stone','gold'], pop:5},
  house: {name:'Hütte', size:3, cost:{wood:30}, time:14, hp:400, pop:4},
  wall:  {name:'Palisade', size:1, cost:{wood:4}, time:3, hp:300},
  gate:  {name:'Tor', size:1, cost:{wood:15}, time:8, hp:1000},
  store: {name:'Lager', size:3, cost:{wood:50}, time:18, hp:700, drop:['wood','stone','gold','food']},
  road:  {name:'Weg', size:1, cost:{}, time:2.2, hp:100},
  barracks:{name:'Kriegerhütte', size:4, cost:{wood:120, stone:40}, time:35, hp:1500},
  tower: {name:'Wachturm', size:3, cost:{wood:100, stone:40}, time:30, hp:1200},
  market:{name:'Marktplatz', size:4, cost:{wood:100}, time:25, hp:800},
  elder: {name:'Ältestenhütte', size:4, cost:{wood:120, stone:30}, time:30, hp:900},
};
/* ---------- Forschung (wie Empire Earth 2): drei Bereiche, je 4 Forschungen pro Epoche.
   Die Ältestenhütte erzeugt Wissen; Greise (und Bauern) darin forschen schneller. Mit genug Forschungen steigt das Volk in die nächste Epoche auf. ---------- */
const TECH_TREES = [['mil','Militär'],['eco','Wirtschaft'],['emp','Reich']];
const TECH = {
  flint:  {t:'mil', n:'Feuersteinklingen', d:'Axtkrieger +20 % Angriff', cost:{wood:80, stone:60}, time:40},
  sling:  {t:'mil', n:'Speerschleuder',    d:'Speerträger +20 % Angriff', cost:{wood:100, food:60}, time:45},
  poison: {t:'mil', n:'Pfeilgift',         d:'Bogenschützen +20 % Angriff', cost:{food:80, gold:40}, time:50},
  paint:  {t:'mil', n:'Kriegsbemalung',    d:'Krieger +15 % Leben', cost:{food:120, gold:40}, time:55},
  axe:    {t:'eco', n:'Steinaxt',          d:'Holz +20 % schneller', cost:{wood:60, stone:40}, time:35},
  trap:   {t:'eco', n:'Fallen',            d:'Nahrung +20 % schneller', cost:{wood:80}, time:35},
  pick:   {t:'eco', n:'Hartsteinhacke',    d:'Stein und Gold +20 % schneller', cost:{wood:60, stone:60}, time:40},
  basket: {t:'eco', n:'Tragekörbe',        d:'Bauern tragen 15 statt 10', cost:{wood:120, food:60}, time:50},
  fire:   {t:'emp', n:'Feuer hüten',       d:'Jede Hütte +1 Platz', cost:{wood:100}, time:40},
  cave:   {t:'emp', n:'Höhlenmalerei',     d:'Forschung +30 % schneller', cost:{food:80, stone:40}, time:35},
  council:{t:'emp', n:'Stammesrat',        d:'Bauern 20 % billiger', cost:{food:150, gold:50}, time:50},
  tame:   {t:'emp', n:'Tierzähmung',       d:'Ochsen 30 % billiger', cost:{food:100, wood:60}, time:45},
};
const AGE_NEED = 6;   // so viele Forschungen der Epoche braucht man zum Aufsteigen
const hasTech = (o,k) => { const p=G&&G.players[o]; return !!(p && p.tech && p.tech[k]); };
const techCount = o => { const p=G.players[o]; return p&&p.tech ? Object.keys(p.tech).length : 0; };
const workerCost = o => hasTech(o,'council') ? {food:48} : WORKER_COST;
const unitCost = (o,k) => k==='ox' && hasTech(o,'tame') ? Object.fromEntries(Object.entries(UNIT.ox.cost).map(([r,v])=>[r,Math.round(v*.7)])) : UNIT[k].cost;
const carryCap = u => hasTech(u.owner,'basket') ? 15 : CARRY;
const popOf = b => (BUILD[b.kind].pop||0) + (b.kind==='house' && hasTech(b.owner,'fire') ? 1 : 0);
const atkMul = u => (u.kind==='club'&&hasTech(u.owner,'flint') || u.kind==='spear'&&hasTech(u.owner,'sling') || u.kind==='bow'&&hasTech(u.owner,'poison')) ? 1.2 : 1;
const gatherMul = (o,kind) => (kind==='wood'&&hasTech(o,'axe') || kind==='food'&&hasTech(o,'trap') || (kind==='stone'||kind==='gold')&&hasTech(o,'pick')) ? 1.2 : 1;
const elders = b => G.units.filter(u=>u.inside===b && !u.dead);
const ELDER_MAX = 4;
function researchRate(b){ return (1 + .5*elders(b).reduce((a,u)=>a+(u.ageSt==='greis'?2:1),0)) * (hasTech(b.owner,'cave')?1.3:1); }
function finishTech(o,k){
  const p=G.players[o]; p.tech=p.tech||{}; if(p.tech[k]) return; p.tech[k]=1;
  if(k==='fire') for(const b of G.builds) if(b.owner===o && b.kind==='house' && b.built>=1 && !b.dead) p.popCap++;
  if(k==='paint') for(const u of G.units) if(u.owner===o && isSoldier(u) && !u.dead){ u.maxHp=Math.round(u.maxHp*1.15); u.hp=Math.min(u.maxHp,u.hp*1.15); }
  if(o===0){ EE.toast('🔬 Erforscht: '+TECH[k].n+' – '+TECH[k].d); EE.sfx('done',.8); EE.vib(25); updateHUD();
    if(techCount(0)===AGE_NEED) setTimeout(()=>EE.toast('Genug geforscht – im Stadtzentrum kannst du aufsteigen'),2600); }
}
function updateResearch(b,dt){
  if(!b.rk || b.built<1) return;
  b.rp=(b.rp||0)+dt*researchRate(b);
  if(b.rp>=TECH[b.rk].time){ const k=b.rk; b.rk=null; b.rp=0; finishTech(b.owner,k); }
  if(G.selB===b) drawPanelSoon();
}
// Computer-Gegner forschen nebenbei (ohne Hütte), je nach Schwierigkeit
function aiResearch(p,dt){
  p.techT=(p.techT??(140+G.rand()*80))-dt*(.6+.4*(EE.S.diff|0)); if(p.techT>0) return; p.techT=150+G.rand()*90;
  const open=Object.keys(TECH).filter(k=>!(p.tech&&p.tech[k])); if(open.length) finishTech(p.id, open[(G.rand()*open.length)|0]);
}
const WORKER_COST = {food:60};
const WORKER_TIME = 18;
const CARRY = 10;
const START_RES = {food:200, wood:200, stone:100, gold:50};

/* ---------- Zustand ---------- */
let G = null; // aktives Spiel

/* ============================================================
   START / STOPP
   ============================================================ */
async function start(sv){
  if(G) stop();
  EE.toast('Die Welt wird geladen …');
  await Promise.all([loadModels(EE.S.gfx|0), loadWorldMask()]);
  EE.hideMenu();
  const S = EE.S;
  const mapI = sv ? sv.map : S.map|0;
  const NX = [3840,5760,8320,12800][mapI] || 5760, HS = NX<=6000?8:16, NZ = Math.round(NX*(LAT0-LAT1)/360/TILE)*TILE;
  const byName = n => EE.civBy(n);
  const civ = sv ? byName(sv.civs[0]) : (EE.CIVS[S.civ] || EE.CIVS[0]);
  const foes = sv ? sv.civs.length-1 : clamp(S.ai||3, 1, 14);
  // Gegner möglichst weit weg wählen (bei wenigen Gegnern nie Nachbarn)
  const dist = (a,b)=>{ const p=CIV_POS[a[0]]||[0,0], q=CIV_POS[b[0]]||[0,0]; let dl=Math.abs(p[0]-q[0]); return Math.hypot(dl, (p[1]-q[1])*1.3); };
  const chosen=[civ], pool=EE.CIVS.filter(c=>c!==civ);
  while(chosen.length<=foes && pool.length){
    const sc = pool.map(c=>[c, Math.min(...chosen.map(o=>dist(c,o)))]).sort((a,b)=>b[1]-a[1]);
    const pick = pool[(Math.random()*pool.length)|0];
    chosen.push(pick); pool.splice(pool.indexOf(pick),1);
  }
  const others = sv ? sv.civs.slice(1).map(byName) : chosen.slice(1);
  const gfx = S.gfx|0;
  G = { NX, NZ, HS, foes, civ, gfx, era:sv?(sv.era|0):(S.epoch|0), eraEnd:sv?(sv.eraEnd??9):(S.epochEnd??9), seed:sv?sv.seed:(Math.random()*1e9)|0, map:mapI, t:0, resMod:sv?sv.res:null, units:[], builds:[], res:[], deer:[],
        players:[], sel:[], selB:null, place:null, running:true, raf:0, msgT:0 };
  G.rand = rng(G.seed);
  [civ, ...others.slice(0,foes)].forEach((c,i)=>G.players.push({id:i, civ:c, res:{...START_RES}, pop:0, popCap:0, tc:null, color:COLORS[i]}));
  // Teamfarbe = Hauptfarbe der eigenen Flagge (Türkei rot …); ist sie einem anderen Volk zu ähnlich, eine gut unterscheidbare Ersatzfarbe
  { const rgb=h=>[h>>16&255,h>>8&255,h&255], dist=(a,b)=>{ const A=rgb(a),B=rgb(b); return Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2]); }, used=[];
    const okL = c=>{ const L=rgb(c).reduce((a,b)=>a+b,0)/765; return L>.1 && L<.85; };
    G.players.forEach((p,i)=>{
      const fl=[...String(p.civ[2]).matchAll(/fill="(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})"/g)].map(m=>new T.Color(m[1]).getHex()).filter(okL);
      // zuerst die Hauptfarbe der Flagge, dann die anderen Flaggenfarben, erst zuletzt eine Ersatzfarbe
      // feste, gut unterscheidbare Farbe je Zivilisation – passend zur Flagge
      let c = CIV_COLOR[p.civ[0]]; if(c!=null && used.some(u=>dist(u,c)<40)) c=null;
      if(c==null) c = fl.find(f=>!used.some(u=>dist(u,f)<70));
      if(c==null) c = BASE_COLORS.filter(okL).filter(b=>!used.some(u=>dist(u,b)<70))[0] ?? BASE_COLORS[i];
      used.push(c); COLORS[i]=c; p.color=c; flagCache[p.civ[0]]=c; }); }
  initDip();
  // Online: Teams aus dem Raum – gleiches Team = verbündet, sonst Krieg; Namen der Mitspieler
  if(sv && sv.online){ G.online=sv; G.players.forEach((p,i)=>{ const sl=sv.slots[i]; p.netName=sl.name; p.human=sl.kind==='human'; p.team=sl.team;
      if(i>0 && G.dip[i]){ G.dip[i].state = sl.team===sv.slots[0].team ? 'ally' : 'enemy'; G.dip[i].mood = sl.team===sv.slots[0].team ? 80 : 0; } }); }
  buildUI();
  initRenderer();
  genWorld();
  if(sv && !sv.online) applySave(sv);
  buildOverview();
  for(const b of G.builds) if(b.kind==='tc' && b.built>=1) claimRegion(b);
  buildBorders();
  G.saveT = 20;
  setTimeout(()=>{ if(G) drawMinimap(); }, 50);
  initInput();
  updateHUD(); drawPanel();
  if(G.loadCam){ Object.assign(G.camS,{x:G.loadCam.x, z:G.loadCam.z, dist:G.loadCam.d, yaw:G.loadCam.y}); EE.toast('Spielstand geladen'); }
  else if(G.players[0].tc) centerCamOn(G.players[0].tc.x, G.players[0].tc.z);
  updateCam(); updateTiles(true);
  $('#game').classList.remove('hidden');
  // Fenster-Design der Epoche (ep1 = Steinzeit … ep10 = Zukunft)
  for(let i=1;i<=10;i++) $('#game').classList.remove('ep'+i); $('#game').classList.add('ep'+(G.age||1));
  let last = performance.now();
  const loop = now => {
    if(!G || !G.running) return;
    if(G.inMenu){ last = now; G.raf = requestAnimationFrame(loop); return; }
    const dt = clamp((now-last)/1000, 0, .05); fpsTick(now); last = now; G.pfDeadline = performance.now() + 6; G.pfLeft = 4;   // pro Bild: 6 ms Wegsuche, aber immer mindestens 4 Wege – sonst bleiben bei vielen Leuten welche stehen (V2.29)
    if(!G.paused) update(dt);
    render();
    G.raf = requestAnimationFrame(loop);
  };
  G.raf = requestAnimationFrame(loop);
  EE.toast(CN(civ)+' '+cv(civ,'erwacht','erwachen')+' in der Steinzeit');
  EE.music('calm');
}

/* ============================================================
   SPIELSTAND: wird automatisch gespeichert (alle 30 s, beim Menü und beim Schließen der App).
   Die Welt selbst entsteht aus dem Seed neu, gespeichert werden nur die Änderungen.
   ============================================================ */
const SAVE_KEY = 'ee_save_v1';
const resKey = (x,z) => Math.round(x*4)+','+Math.round(z*4);
const r1 = v => Math.round(v*100)/100;
function saveGame(){
  if(!G || G.over || !G.players[0].tc && !G.builds.some(b=>b.owner===0)) return;
  try{
    const res = Object.assign({}, G.resMod||{});
    for(const r of G.res) if(!r.deer && (r.amt<r.max || !r.alive)) res[resKey(r.x,r.z)] = r.alive ? Math.round(r.amt) : 0;
    const liveB = G.builds.filter(b=>!b.dead);
    const sv = { v:1, date:Date.now(), map:G.map, seed:G.seed, t:Math.round(G.t), civs:G.players.map(p=>p.civ[0]), era:G.era, eraEnd:G.eraEnd,
      res, players:G.players.map(p=>({res:p.res, ...(p.expT!=null?{expT:p.expT}:{}), ...(p.tech?{tech:p.tech}:{})})),
      dip:Object.fromEntries(Object.entries(G.dip).map(([k,d])=>[k,{state:d.state, mood:Math.round(d.mood), ask:Math.round(d.ask||0)}])),
      builds:liveB.map(b=>({k:b.kind, o:b.owner, x:r1(b.x), z:r1(b.z), b:r1(b.built), hp:Math.round(b.hp), s:b.slow?1:0, r:b.recv||undefined,
        q:(b.queue||[]).length?b.queue.slice():undefined, rk:b.rk||undefined, rp:b.rk?r1(b.rp||0):undefined, w:b.wallId||undefined, seg:b.seg||undefined})),
      units:G.units.filter(u=>!u.dead).map(u=>({i:u.inside&&!u.inside.dead?liveB.indexOf(u.inside):undefined, sl:u.inside?u.slot:undefined, k:u.kind, o:u.owner, x:r1(u.x), z:r1(u.z), hp:Math.round(u.hp), c:u.carry&&u.carry.amt?[u.carry.type,u.carry.amt]:undefined, sx:u.sex, au:u.auto?1:undefined, sk:u.seek?1:undefined, ht:u.inHut?Math.round(u.hutT):undefined, ag:u.age!=null?Math.round(u.age):undefined, dz:u.dieAt!=null?Math.round(u.dieAt):undefined, pn:u.pin?1:undefined, hd:u.hold?1:undefined, ps:u.post?[r1(u.post.x),r1(u.post.z)]:undefined, lt:u.lastType||undefined, g:u.kind==='kid'?[u.stage,Math.round(u.grow)]:undefined})),
      cam:{x:r1(G.camS.x), z:r1(G.camS.z), d:r1(G.camS.dist), y:r1(G.camS.yaw)} };
    localStorage.setItem(SAVE_KEY, JSON.stringify(sv));
  }catch(e){ console.warn('Speichern fehlgeschlagen', e); }
}
function readSave(){ try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY)||'null'); return s && s.v===1 ? s : null; }catch(e){ return null; } }
function applySave(sv){
  G.quiet = true;
  // Startaufbau entfernen, dann den gespeicherten Stand aufbauen
  for(const b of G.builds){ G.scene.remove(b.mesh); G.scene.remove(b.ring); for(const k of b.cells||[]) if(k>=0) G.grid[k]=0; }
  for(const u of G.units){ G.scene.remove(u.mesh); G.scene.remove(u.ring); if(u.bar) G.scene.remove(u.bar); }
  G.builds.length=0; G.units.length=0; G.reg.owner.clear();
  G.players.forEach((p,i)=>{ p.pop=0; p.popCap=0; p.tc=null; Object.assign(p, sv.players[i]||{}); p.res={...p.res}; });
  for(const [k,d] of Object.entries(sv.dip||{})) if(G.dip[k]) Object.assign(G.dip[k], d);
  let maxW = 0; const made=[];
  for(const s of sv.builds){
    let b;
    if(s.seg && s.k==='tower'){ b = addWallTower(s.o, s.seg, s.w, s.b>=1); maxW=Math.max(maxW,s.w|0); if(s.b<1) b.built=s.b; }
    else if(s.seg){ b = addWall(s.o, s.seg, s.seg.ang, s.w, s.k==='road'); maxW=Math.max(maxW,s.w|0); if(s.b>=1) finishBuilding(b); else b.built=s.b; }
    else { b = addBuilding(s.k, s.o, s.x, s.z, s.b>=1); if(s.b<1){ b.built=s.b; b.mesh.scale.y=.25+.75*s.b; } if(b.kind==='tc' && b.built>=1){ claimRegion(b); const p=G.players[b.owner]; if(!p.tc) p.tc=b; } }
    made.push(b); b.hp = s.hp; b.slow = !!s.s; if(s.r) b.recv=s.r; if(s.q) b.queue = s.q.slice(); if(s.rk && TECH[s.rk]){ b.rk=s.rk; b.rp=s.rp||0; }
  }
  WALL_ID = Math.max(WALL_ID, maxW+1);
  for(const s of sv.units){ G.nextSex = s.sx; const u = spawnWorker(s.o, s.x, s.z, s.k); u.hp = s.hp; if(s.au && s.o!==0) u.auto=true;   /* eigene Bauern laden ohne Automatik */ if(s.sk) u.seek=true; if(s.lt) u.lastType=s.lt; if(s.g){ u.grow=s.g[1]; setStage(u,s.g[0]); } if(s.c) u.carry = {type:s.c[0], amt:s.c[1]}; if(s.i!=null && s.i>=0 && made[s.i]){ u.inside=made[s.i]; u.slot=s.sl|0; if(s.ht){ u.inHut=true; u.hutT=s.ht; } } if(s.ag!=null){ u.age=s.ag; if(s.dz!=null) u.dieAt=s.dz; if(u.kind==='worker'){ if(u.age>AGE_VOLD) setAgeStage(u,'greis'); else if(u.age>AGE_OLD) setAgeStage(u,'alt'); } } if(s.hd) u.hold=true; if(s.ps) u.post={x:s.ps[0],z:s.ps[1]}; if(s.pn) setPin(u,true); }
  G.t = sv.t||0;
  if(sv.cam) G.loadCam = sv.cam;
  G.quiet = false;
}
// Geschenke vom Admin (Silescrow ID): sofort im laufenden Spiel, sonst beim nächsten Spiel
function gift(res){
  const add=r=>{ const p=G.players[0]; for(const k in r) if(k in p.res) p.res[k]+=Math.max(0,r[k]|0); EE.toast('🎁 Geschenk erhalten: '+Object.entries(r).map(([k,v])=>v+' '+({food:'Nahrung',wood:'Holz',stone:'Stein',gold:'Gold'}[k]||k)).join(', ')); };
  if(G && !G.over && G.players[0] && !G.inMenu){ add(res); return; }
  try{ const l=JSON.parse(localStorage.getItem('ee_geschenk')||'[]'); l.push(res); localStorage.setItem('ee_geschenk', JSON.stringify(l)); }catch(e){}
  EE.toast('🎁 Geschenk kommt in deine nächste Partie');
}
function giftPending(){ try{ const l=JSON.parse(localStorage.getItem('ee_geschenk')||'[]'); localStorage.removeItem('ee_geschenk'); const sum={}; for(const r of l) for(const k in r) sum[k]=(sum[k]||0)+r[k]; if(Object.keys(sum).length) gift(sum); }catch(e){} }
function loadGame(){ const sv=readSave(); if(!sv){ EE.toast('Kein Spielstand gefunden'); return; } start(sv); }
addEventListener('pagehide', ()=>saveGame());
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) saveGame(); });

function toMenu(){
  if(!G) return;
  G.inMenu=true; G.paused=true; $('#pause').classList.add('hidden'); saveGame();
  $('#game').classList.add('hidden'); EE.ambient({wind:.3,waves:0,birds:0,fire:0}); EE.music('theme'); EE.showMenu(true);
}
function resume(){
  if(!G) return;
  EE.hideMenu(); $('#game').classList.remove('hidden'); G.inMenu=false; G.paused=false; onResize(); EE.music('calm'); EE.toast('Weiter geht’s');
}
function stop(){
  if(!G) return;
  G.running = false;
  cancelAnimationFrame(G.raf);
  window.removeEventListener('resize', onResize);
  try{ G.renderer.dispose(); G.renderer.forceContextLoss(); }catch(e){}
  $('#game').innerHTML = '';
  $('#game').classList.add('hidden');
  G = null;
  EE.ambient({wind:.3,waves:0,birds:0,fire:0});
  EE.music('theme');
  EE.showMenu();
}

/* ============================================================
   OBERFLÄCHE (HUD)
   ============================================================ */
// Gemalte Rohstoff-Icons liegen in ui/res_*.png (Beeren, Fleisch, Fisch, Getreide, Holz, Stein, Gold, Metall, Eisen, Kohle, Öl, Uran, Energie, Münzen, Wolle, Faser, Leder, Knochen, Honig/Salz, Bevölkerung, Munition, Schießpulver, Salpeter, Zinn/Kupfer, Stahl, Treibstoff, Ersatzteile, Sanität, Gummi, Glas, Aluminium, Mikrochip)
const ICON = {
  food:'<svg viewBox="0 0 24 24"><image href="ui/res_beeren.png" x="-1.5" y="-1.5" width="27" height="27"/></svg>',   // gemaltes Icon (V2.20)
  wood:'<svg viewBox="0 0 24 24"><image href="ui/res_holz.png" x="-1.5" y="-1.5" width="27" height="27"/></svg>',   // gemaltes Icon (V2.20)
  stone:'<svg viewBox="0 0 24 24"><image href="ui/res_stein.png" x="-1.5" y="-1.5" width="27" height="27"/></svg>',   // gemaltes Icon (V2.20)
  gold:'<svg viewBox="0 0 24 24"><image href="ui/res_gold.png" x="-1.5" y="-1.5" width="27" height="27"/></svg>',   // gemaltes Icon (V2.20)
  pop:'<svg viewBox="0 0 24 24"><image href="ui/res_bevoelkerung.png" x="-1.5" y="-1.5" width="27" height="27"/></svg>',
};

function buildUI(){
  const g = $('#game');
  g.innerHTML = `
  <canvas id="gc"></canvas>
  <div id="sel-box"></div>
  <div id="topbar">
    <div class="rs" id="r-food">${ICON.food}<span class="rv"><b>0</b><small>Nahrung</small></span></div>
    <div class="rs" id="r-wood">${ICON.wood}<span class="rv"><b>0</b><small>Holz</small></span></div>
    <div class="rs" id="r-stone">${ICON.stone}<span class="rv"><b>0</b><small>Stein</small></span></div>
    <div class="rs" id="r-gold">${ICON.gold}<span class="rv"><b>0</b><small>Gold</small></span></div>
    <div class="rs" id="r-pop">${ICON.pop}<span class="rv"><b>0/0</b><small>Leute</small></span></div>
    <div class="age"><div><span>${NM(G.civ)}</span> · Steinzeit</div><div class="wxi" id="wx"></div></div>
    <button class="hb" id="bPause" aria-label="Menü"><svg viewBox="0 0 24 24"><path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg></button>
  </div>
  <canvas id="mini" width="150" height="150"></canvas>
  <div id="kinds"></div>
  <button class="hb" id="bHome" aria-label="Zur Basis"><svg viewBox="0 0 24 24"><path d="M3 12l9-8 9 8M6 10v10h12V10" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linejoin="round"/></svg></button>
  <div id="tpHud"><b id="tpName"></b><div class="tpbar"><i id="tpHp"></i></div><div class="tpbar c"><i id="tpCarry"></i></div><small id="tpCarryT"></small></div>
  <div id="tpPrompt"></div>
  <button id="bTake">🎮 Übernehmen</button>
  <div id="joy" aria-label="Laufen"><i></i></div>
  <button id="bAct" aria-label="Aktion"><span id="bActI">✋</span><small id="bActL">Arbeiten</small></button>
  <button id="bRun" aria-label="Rennen">🏃</button>
  <button id="bFollowOff" aria-label="Kamera zurück"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>Zurück</button>
  <button class="hb" id="bNorth" aria-label="Kameradrehung zurücksetzen"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.2" stroke="currentColor" stroke-width="1.6" fill="none" opacity=".7"/><g id="needle"><path d="M12 4.2l3 7.8h-6z" fill="#e2453b"/><path d="M12 19.8l3-7.8h-6z" fill="currentColor"/></g></svg></button>
  <div id="panel"></div>
  <div id="placebar" class="hidden"><span id="pCost"></span><span id="pTxt">Gebäude mit dem Finger platzieren</span><button class="pb gate hidden" id="pGate">+ Tore</button><button class="pb no" id="pNo">✕</button><button class="pb ok" id="pOk">✓</button></div>
  <div id="fps" class="hidden"></div>
  <div id="offer" class="hidden"></div>
  <div id="dip" class="hidden"><div class="dcard"><div class="dhead"><button class="dtab" data-t="rel"><span>🤝</span>Beziehungen</button><button class="dtab" data-t="trade"><span>⚖️</span>Handel</button><button class="dtab" data-t="trib"><span>🎁</span>Tribut</button><button class="dtab" data-t="war"><span>⚔️</span>Krieg</button><button class="dx winx" id="dClose" aria-label="Schließen">✕</button></div><div id="dipBody"></div></div></div>
  <div id="rotate"><div>Bitte das Handy quer halten</div></div>
  <div id="pause" class="hidden"><div class="pcard"><button class="winx" id="pX" aria-label="Schließen">✕</button><h2>Pause</h2>
    <button class="btn main small" id="pWeiter">Weiter</button>
    <button class="btn small" id="pSet">Einstellungen</button>
    <button class="btn small" id="pNeu">Neu starten</button>
    <button class="btn small" id="pMenu">Zum Hauptmenü</button></div></div>`;
  $('#bPause').onclick = () => { EE.click(); G.paused = true; $('#pause').classList.remove('hidden'); };
  $('#pWeiter').onclick = $('#pX').onclick = () => { EE.click(); G.paused = false; $('#pause').classList.add('hidden'); };
  // Hauptmenü: Spiel bleibt im Hintergrund erhalten – dort „Weiterspielen“ oder ein neues Spiel
  $('#pMenu').onclick = () => { EE.click(); toMenu(); };
  $('#pNeu').onclick = () => { EE.click(); start(); };
  // Einstellungen auch im Spiel (Grafik, Musik, FPS-Anzeige …)
  $('#pSet').onclick = () => { EE.click(); const d=document.getElementById('dSet'); d.style.zIndex=20; d.style.position='fixed'; document.body.appendChild(d); d.classList.remove('hidden');
    const done = () => { if(!d.classList.contains('hidden')) return; mo.disconnect(); if(G && (EE.S.gfx|0)!==G.gfx) applyGfx(EE.S.gfx|0); };
    const mo = new MutationObserver(done); mo.observe(d,{attributes:true, attributeFilter:['class']}); };
  $('#kinds').onclick = e => { const b=e.target.closest('[data-k]'); if(b) selectKind(b.dataset.k); };
  $('#bFollowOff').onclick = () => stopFollow();
  initTP();
  $('#bNorth').onclick = () => { EE.click(); G.camReset = true; };
  $('#bHome').onclick = () => { EE.click(); const tc=G.players[0].tc; if(tc){ centerCamOn(tc.x,tc.z); } };
  $('#pOk').onclick = confirmPlace;
  $('#pGate').onclick = ()=>{ if(G.place&&G.place.kind==='wall'){ G.place.gate=!G.place.gate; $('#pGate').classList.toggle('on',G.place.gate); EE.click(); } };
  $('#pNo').onclick = cancelPlace;
  $('#dClose').onclick = closeDip;
  $$('#dip .dtab').forEach(b=>b.onclick=()=>{ EE.click(); G.dipUI.tab=b.dataset.t; renderDip(); });
  $('#dip').addEventListener('click', e=>{ if(e.target.id==='dip') closeDip(); });
}

function updateHUD(){
  const p = G.players[0];
  for(const r of RES) $('#r-'+r+' b').textContent = Math.floor(p.res[r]);
  $('#r-pop b').textContent = p.pop+'/'+p.popCap;
  $('#r-pop').classList.toggle('full', p.pop>=p.popCap);
  const idle = G.units.filter(u=>u.owner===0 && u.state==='idle' && u.kind!=='kid' && !u.inside).length;
  // Knopf für untätige Bauern entfernt (V1.61)
  updateKinds();
}
// Sorten-Leiste oben links: je Einheiten-Sorte ein Knopf mit Anzahl – antippen wählt alle dieser Sorte aus
// (später auch für Reiter, Schiffe, Panzer, Flugzeuge, Hubschrauber …)
const KIND_ORDER = ['worker','club','spear','bow'];
function updateKinds(){
  const el=$('#kinds'); if(!el) return;
  const n={}; let sol=0;
  for(const u of G.units){ if(u.owner!==0 || u.dead || u.inside || u.kind==='kid') continue; n[u.kind]=(n[u.kind]||0)+1; if(isSoldier(u)) sol++; }
  const ks=Object.keys(n).sort((a,b)=>(KIND_ORDER.indexOf(a)+99)%99-(KIND_ORDER.indexOf(b)+99)%99);
  let h=ks.map(k=>`<button class="kb" data-k="${k}" aria-label="Alle ${UNIT_DE[k]||k}">${unitPic({owner:0,kind:k,hp:1,maxHp:1})}<b>${n[k]}</b></button>`).join('');
  if(ks.filter(k=>k!=='worker').length>1) h+=`<button class="kb all" data-k="army" aria-label="Alle Krieger">${swordSVG()}<b>${sol}</b></button>`;
  if(el._h!==h){ el._h=h; el.innerHTML=h; }
}
function selectKind(k){
  const us=G.units.filter(u=>u.owner===0 && !u.dead && !u.inside && u.kind!=='kid' && (k==='army'?isSoldier(u):u.kind===k));
  if(!us.length) return;
  EE.click(); select(us,null);
  EE.toast(us.length+' '+(k==='army'?'Krieger':(UNIT_DE[k]||k))+' ausgewählt');
}

// Kosten auf Knöpfen: grün = genug im Lager, rot = fehlt noch
function costText(c){ const p=G&&G.players&&G.players[0]; return Object.keys(c).map(k=>`<span class="c ${p&&p.res[k]!=null?(p.res[k]>=c[k]?'ok':'miss'):''}">${ICON[k]}${c[k]}</span>`).join(''); }
// Kosten in der Bauleiste wie in Empire Earth 2: Symbol + Menge, rot wenn es noch fehlt
function setCost(c){ const p=G.players[0], h=Object.keys(c).filter(k=>c[k]>0).map(k=>`<span class="c${p.res[k]<c[k]?' miss':''}">${ICON[k]}${c[k]}</span>`).join(''); if(G.costH!==h){ G.costH=h; $('#pCost').innerHTML=h; } }
function canPay(p,c){ return Object.keys(c).every(k=>p.res[k]>=c[k]); }
const missingTxt = (p,c) => 'Es fehlen noch '+Object.keys(c).filter(k=>p.res[k]<c[k]).map(k=>Math.ceil(c[k]-p.res[k])+' '+RES_DE[k]).join(', ');
function pay(p,c){ for(const k in c) p.res[k]-=c[k]; }

function drawPanel(){
  const el = $('#panel'); if(!el) return;
  const p = G.players[0];
  if(G.place){ el.innerHTML=''; el.className='hidden'; return; }
  if(G.selB && G.selBs && G.selBs.length>1){
    const bs=G.selBs.filter(o=>!o.dead), back={}; for(const o of bs){ const r=refundOf(o); for(const k in r) back[k]=(back[k]||0)+r[k]; }
    const isRoad=G.selB.kind==='road', pl=isRoad?[]:wallTowerPlan(G.selB), tot={}; for(const r in WT_COST) tot[r]=WT_COST[r]*pl.length;
    const nW=bs.filter(o=>o.kind==='wall').length, nT=bs.filter(o=>o.kind==='tower').length, nG=bs.filter(o=>o.kind==='gate').length;
    const armed=G.multiDel && G.t-G.multiDel<3;
    let h=isRoad ? `<div class="info"><b>Weg · ${bs.length} Stücke</b><small>ca. ${Math.round(bs.reduce((a,o)=>a+(o.seg.len||1),0))} m</small></div>` : `<div class="info"><b>${bs.length} Mauerteile</b><small>${nW} Palisade${nT?' · '+nT+' Türme':''}${nG?' · '+nG+' Tor'+(nG>1?'e':''):''}</small></div>`;
    if(pl.length) h+=`<button class="ab" data-a="wtowers"><span class="ai">${towerSVG()}</span>${pl.length} Türme einbauen<span class="ac">${costText(tot)}</span></button>`;
    h+=`<button class="ab del${armed?' armed':''}" data-a="demolishAll"><span class="ai"><svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" stroke="#ff7a6a" stroke-width="2" fill="none" stroke-linejoin="round"/></svg></span>${armed?'Wirklich alle?':'Alle abreißen'}<span class="ac">${armed?'nochmal tippen':(Object.values(back).some(v=>v>0)?'+'+costText(back).replace(/"c (ok|miss)"/g,'"c ok"'):'ganze Strecke')}</span></button>`;
    el.innerHTML=h; el.className='';
    el.querySelectorAll('.ab').forEach(b=>b.onclick=()=>action(b.dataset.a));
    return;
  }
  if(G.selB){
    const b = G.selB, d = BUILD[b.kind];
    let h = `<button class="pclose sx" aria-label="Schließen">✕</button><div class="info"><b>${b.wallT?'Mauerturm':d.name}</b><small>${b.owner===0?(b.built<1?'Wird gebaut … '+Math.floor(b.built*100)+' %':'Leben '+Math.ceil(b.hp)+'/'+d.hp):NM(G.players[b.owner])}</small></div>`;
    if(b.owner===0 && homeCap(b)) h += `<div class="info"><small>${residentsTxt(b)}</small></div>`;
    if(b.owner===0 && b.built>=1 && d.drop){ const R=b.recv||{}, keys=d.drop.filter(k=>k in RES_DE);
      const chip=(o)=>keys.map(k=>`<span class="c">${ICON[k]||''}${Math.floor(o[k]||0)}</span>`).join('');
      h += `<div class="store"><div><small>Hier abgegeben</small><span class="ac">${chip(R)}</span></div><div><small>Vorrat deines Volkes</small><span class="ac">${chip(G.players[0].res)}</span></div></div>`; }
    if(b.owner===0 && b.built>=1 && b.kind==='tc'){
      const q = b.queue.length, hn=helpers(b).length, tm=Math.round((trainMul(b)-1)*100);
      h += `<div class="info"><small>Tempo ${tm?'+'+tm+' %':'normal'} · Hütten im Gebiet +5 % je Hütte · Helfer +10 %</small></div>`;
      h += `<button class="ab" data-a="helpin"><span class="ai">${ICON.pop}</span>Helfer rein<span class="ac">${hn}/${HELP_MAX}</span></button>`;
      if(hn) h += `<button class="ab" data-a="helpout"><span class="ai">${ICON.pop}</span>Helfer raus<span class="ac">${hn}</span></button>`;
      h += `<button class="ab" data-a="worker"><span class="ai">${unitPic({owner:0,kind:'worker',sex:'m'})}</span>Bauer<span class="ac">${costText(workerCost(0))}</span>${q?'<i class="q">'+q+'</i>':''}</button>`;
      h += `<button class="ab" data-a="t-ox"><span class="ai">${OX_SVG}</span>Ochse<span class="ac">${costText(unitCost(0,'ox'))}</span>${q&&b.queue[0]==='ox'?'<i class="q">'+q+'</i>':''}</button>`;
      h += `<button class="ab" data-a="dip"><span class="ai">${dipSVG()}</span>Diplomatie<span class="ac">Bündnis · Handel</span></button>`;
      { const n=techCount(0), ok=n>=AGE_NEED; h += `<button class="ab${ok?'':' lock'}" data-a="age"><span class="ai"><svg viewBox="0 0 24 24"><path d="M12 3l8 9h-5v9H9v-9H4z" fill="#e8b64a"/></svg></span>Antike<span class="ac">${ok?costText({food:500,wood:300}):'Forschung '+n+'/'+AGE_NEED}</span></button>`; }
      if(q) h += `<div class="bar"><div style="width:${(b.qT/WORKER_TIME*100)|0}%"></div></div>`;
    }
    if(b.owner===0 && b.built>=1 && b.kind==='wall' && b.seg){ const pl=wallTowerPlan(b); const tot={}; for(const r in WT_COST) tot[r]=WT_COST[r]*pl.length; h += `<button class="ab${pl.length?'':' lock'}" data-a="wtowers"><span class="ai">${towerSVG()}</span>${pl.length?pl.length+' Türme einbauen':'Türme fertig'}<span class="ac">${pl.length?costText(tot):'alle 10 m ein Turm'}</span></button>`;
      h += `<button class="ab" data-a="wtower1"><span class="ai">${towerSVG()}</span>1 Turm hier<span class="ac">${costText(WT_COST)}</span></button>`; }
    if(b.owner===0 && b.built>=1 && b.kind==='wall' && b.seg) h += `<button class="ab" data-a="togate"><span class="ai"><svg viewBox="0 0 24 24"><path d="M4 21V8l8-5 8 5v13h-5v-7H9v7z" fill="#a8743e"/></svg></span>Zu Tor machen<span class="ac">${costText(BUILD.gate.cost)}</span></button>`;
    if(b.owner===0 && b.built>=1 && b.kind==='tower'){ const c=crew(b).length;
      h += `<div class="info"><small>Besatzung ${c}/${TOWER_MAX} · Krieger oben sind geschützt und schießen weiter</small></div>`;
      h += `<button class="ab" data-a="crewin"><span class="ai">${swordSVG()}</span>Krieger rein<span class="ac">${c}/${TOWER_MAX}</span></button>`;
      if(c) h += `<button class="ab" data-a="crewout"><span class="ai">${ICON.pop}</span>Alle raus<span class="ac">${c}</span></button>`;
      h += `<div class="info hint"><small>Tipp: Krieger auswählen und auf den Turm tippen</small></div>`; }
    if(b.owner===0 && b.built>=1 && b.kind==='barracks'){
      const q=b.queue.length;
      for(const k of ['club','spear','bow']) h += `<button class="ab" data-a="t-${k}"><span class="ai">${unitPic({owner:0,kind:k,hp:1,maxHp:1})}</span>${UNIT[k].name}<span class="ac">${costText(UNIT[k].cost)}</span>${q&&b.queue[0]===k?'<i class="q">'+q+'</i>':''}</button>`;
      if(q){ const qt=b.queue[0]==='worker'?WORKER_TIME:UNIT[b.queue[0]].time; h += `<div class="bar"><div style="width:${(b.qT/qt*100)|0}%"></div></div>`; }
    }
    { const inn=G.units.filter(u=>u.inside===b && u.inHut && !u.dead); if(b.owner===0 && inn.length) h += `<button class="ab tool" data-a="hutout"><span class="ai"><svg viewBox="0 0 24 24"><path d="M4 21V9l8-6 8 6v12z" fill="none" stroke="#e8b64a" stroke-width="2" stroke-linejoin="round"/><path d="M10 21v-6h4v6" fill="#e8b64a"/></svg></span>Raus (${inn.length})<span class="ac">sind drinnen</span></button>`; }
    if(b.owner===0 && b.built>=1 && b.kind==='elder'){ const P=G.players[0], tab=G.resTab||'mil', n=elders(b).length, rate=researchRate(b);
      if(b.rk){ const T0=TECH[b.rk]; h += `<div class="info"><small>Forscht: <b>${T0.n}</b> · noch ${Math.ceil((T0.time-(b.rp||0))/rate)} s</small></div><div class="bar"><div style="width:${Math.min(100,(b.rp||0)/T0.time*100)|0}%"></div></div>`; }
      else h += `<div class="info"><small>Forschungen ${techCount(0)}/12 · ab ${AGE_NEED} kannst du im Stadtzentrum aufsteigen · Greise forschen doppelt</small></div>`;
      h += `<button class="ab" data-a="elderin"><span class="ai">${ICON.pop}</span>Älteste rein<span class="ac">${n}/${ELDER_MAX}</span></button>`;
      if(n) h += `<button class="ab" data-a="elderout"><span class="ai">${ICON.pop}</span>Alle raus<span class="ac">${n}</span></button>`;
      for(const [t,tn] of TECH_TREES) h += `<button class="ab tool${tab===t?' on':''}" data-a="rt-${t}"><span class="ai">${t==='mil'?swordSVG():t==='eco'?hammerSVG():dipSVG()}</span>${tn}<span class="ac">${Object.keys(TECH).filter(k=>TECH[k].t===t&&P.tech&&P.tech[k]).length}/4</span></button>`;
      for(const k of Object.keys(TECH).filter(k=>TECH[k].t===tab)){ const T0=TECH[k], done=P.tech&&P.tech[k], run=b.rk===k;
        h += `<button class="ab${done?' done':run?' run':b.rk?' lock':''}" data-a="r-${k}"><span class="ai">${done?'✔':run?'⏳':'🔬'}</span>${T0.n}<span class="ac">${done?'erforscht':run?T0.d:costText(T0.cost)}</span><small class="td">${T0.d}</small></button>`; } }
    if(b.owner===0 && b.built>=1 && b.kind==='market'){ const M=mkt();
      h += `<div class="info"><small>Marktplatz: Überschuss gegen Gold verkaufen oder Fehlendes kaufen (je 100). Viel verkaufen drückt den Preis.</small></div>`;
      for(const r of ['food','wood','stone']){ const sp=mktSell(r), bp=mktBuy(r);
        h += `<button class="ab" data-a="sell-${r}"><span class="ai">${ICON[r]||''}</span>100 ${RES_DE[r]} verkaufen<span class="ac">+${sp} Gold</span></button>`;
        h += `<button class="ab" data-a="buy-${r}"><span class="ai">${ICON[r]||''}</span>100 ${RES_DE[r]} kaufen<span class="ac">${bp} Gold</span></button>`; } }
    // Einzelne Bauteile abreißen (Palisadenstück, Turm, Tor, Gebäude) – zweimal tippen zur Sicherheit
    if(b.owner===0){ const armed=b.delArm && G.t-b.delArm<3;
      h += `<button class="ab del${armed?' armed':''}" data-a="demolish"><span class="ai"><svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" stroke="#ff7a6a" stroke-width="2" fill="none" stroke-linejoin="round"/></svg></span>${armed?'Wirklich?':'Abreißen'}<span class="ac">${armed?'nochmal tippen':(Object.values(refundOf(b)).some(v=>v>0)?'+'+costText(refundOf(b)).replace(/"c (ok|miss)"/g,'"c ok"'):'nur dieses Stück')}</span></button>`; }
    el.innerHTML = h; el.className='';
  } else if(G.sel.length){
    const ws = G.sel.slice();
    const carry = ws.length===1 && ws[0].carry.amt>=1 ? ' · trägt '+Math.floor(ws[0].carry.amt)+' '+RES_DE[ws[0].carry.type] : '';
    const job = ws.length===1 ? ({idle:'Wartet',move:'Läuft',gather:'Sammelt',drop:'Bringt Ressourcen',build:'Baut',hunt:'Jagt'})[ws[0].state] : '';
    // Auswahl-Leiste wie in Age of Empires: kleine Figuren je Sorte, Anzahl und X zum Abwählen
    const MAXP = 16, groups = {};
    ws.forEach((u,i)=>{ (groups[u.kind]||(groups[u.kind]={n:0,list:[]})).n++; groups[u.kind].list.push(i); });
    // Kompakt: je Sorte nur EIN Bild mit der Anzahl darauf (z. B. 20 Bauern = ein Bild mit „20“)
    let h = `<div class="selx kompakt"><div class="grp">`;
    for(const k in groups){ const g=groups[k], u0=ws[g.list[0]], hp=g.list.reduce((a,i)=>a+ws[i].hp/ws[i].maxHp,0)/g.n;
      h += `<button class="gpic${u0.owner!==0?' foe':''}" data-g="${k}" aria-label="${g.n} ${UNIT_DE[k]||k}">${unitPic(u0)}<b>${g.n}</b><i style="width:${Math.round(hp*100)}%;background:${hp>.5?'#62e06a':hp>.25?'#f2c230':'#e23b3b'}"></i></button>`; }
    if(!G.buildMenu && !G.formMenu) h += `<button class="pclose sx" aria-label="Auswahl aufheben">✕</button>`;
    h += `</div>${ws.length===1?`<small>${UNIT[ws[0].kind]?UNIT[ws[0].kind].name:''} · ${ws[0].ageSt==='greis'?'spielt mit den Kindern':job}${carry}${ws[0].kind==='worker'&&ws[0].age!=null?' · '+ageYears(ws[0])+' Jahre'+(ws[0].ageSt==='greis'?' (zu alt zum Arbeiten)':ws[0].ageSt==='alt'?' (alt)':''):''}</small>`:''}</div>`;
    if(ws.length===1 && !G.buildMenu && !ws[0].dead){
      h += `<button class="ab tool" data-a="follow"><span class="ai"><svg viewBox="0 0 24 24"><path d="M3 8.5h3l1.6-2.5h8.8L18 8.5h3v10H3z" fill="none" stroke="#e8b64a" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="13.2" r="3.4" fill="none" stroke="#e8b64a" stroke-width="2"/></svg></span>Folgen</button>`;
    }
    // „Hier bleiben“ entfernt: wie in Empire Earth 2 bleiben Einheiten ohnehin dort, wo man sie hinschickt
    if(ws[0].owner===0 && ws.some(u=>isSoldier(u)) && !G.buildMenu){ const f=FORMS.find(x=>x[0]===(G.form||'block'));
      if(G.formMenu){ h += `<button class="pclose" data-a="form" aria-label="Formationen schließen">✕</button>`;
        for(const [k,n] of FORMS) h += `<button class="ab tool${k===(G.form||'block')?' on':''}" data-a="fs-${k}"><span class="ai"><svg viewBox="0 0 24 24">${FORM_SVG[k]}</svg></span>${n}</button>`; }
      else h += `<button class="ab tool" data-a="form"><span class="ai"><svg viewBox="0 0 24 24">${FORM_SVG[f[0]]}</svg></span>Formation: ${f[1]}</button>`;
    }
    if(ws[0].owner===0 && !G.buildMenu && ws.some(u=>u.kind!=='ox' && u.ageSt!=='greis')){ const on=ws.every(u=>u.state==='explore');
      h += `<button class="ab tool${on?' on':''}" data-a="explore"><span class="ai"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#e8b64a" stroke-width="2"/><path d="M12 5l2.4 7H9.6z" fill="#ff6a5a"/><path d="M12 19l-2.4-7h4.8z" fill="#cfd6dc"/></svg></span>${on?'Erkundet …':'Erkunden'}</button>`; }
    if(ws[0].owner===0 && ws.some(u=>isSoldier(u)) && !G.buildMenu){
      h += `<button class="ab tool" data-a="seek"><span class="ai"><svg viewBox="0 0 24 24"><path d="M4 4l11 11M20 4L9 15" stroke="#e8b64a" stroke-width="2.2" stroke-linecap="round"/><path d="M13 17l4 4M11 17l-4 4M15 15l2-2M9 15l-2-2" stroke="#ff7a6a" stroke-width="2.2" stroke-linecap="round"/></svg></span>Gegner suchen</button>`;
    }
    if(ws[0].owner===0 && ws.some(u=>u.kind==='worker') && !G.buildMenu){
      h += `<button class="ab tool" data-a="autowork"><span class="ai"><svg viewBox="0 0 24 24"><path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="#e8b64a" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="5" fill="none" stroke="#e8b64a" stroke-width="2"/><path d="M10 12l1.6 1.6L14.5 10.5" stroke="#7cff7c" stroke-width="2" fill="none" stroke-linecap="round"/></svg></span>Arbeit suchen</button>`;
      h += `<button class="ab tool" data-a="bmenu"><span class="ai">${hammerSVG()}</span>Bauen</button>`;
    }
    if(ws[0].owner===0 && ws.some(u=>u.kind==='worker') && G.buildMenu){
      h += `<button class="pclose" data-a="bback" aria-label="Baumenü schließen">✕</button>`;
      h += `<button class="ab tool back" data-a="bback"><span class="ai"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" stroke="#e8b64a" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></span>Zurück</button>`;
      h += `<button class="ab" data-a="b-tc"><span class="ai">${buildPic('tc',hutSVG())}</span>Stadtzentrum<span class="ac">${costText(BUILD.tc.cost)}</span></button>`;
      h += `<button class="ab" data-a="b-house"><span class="ai">${buildPic('house',hutSVG())}</span>Hütte<span class="ac">${costText(BUILD.house.cost)}</span></button>`;
      h += `<button class="ab" data-a="b-store"><span class="ai">${buildPic('store',storeSVG())}</span>Lager<span class="ac">${costText(BUILD.store.cost)}</span></button>`;
      h += `<button class="ab" data-a="b-wall"><span class="ai">${buildPic('wall',wallSVG())}</span>Palisade<span class="ac">${costText(BUILD.wall.cost)}/Stück</span></button>`;
      h += `<button class="ab" data-a="b-road"><span class="ai">${roadSVG()}</span>Weg<span class="ac">kostenlos</span></button>`;
      h += `<button class="ab" data-a="b-barracks"><span class="ai">${buildPic('barracks',swordSVG())}</span>Kriegerhütte<span class="ac">${costText(BUILD.barracks.cost)}</span></button>`;
      h += `<button class="ab" data-a="b-market"><span class="ai">${buildPic('market',storeSVG())}</span>Marktplatz<span class="ac">${costText(BUILD.market.cost)}</span></button>`;
      h += `<button class="ab" data-a="b-elder"><span class="ai">${buildPic('elder',hutSVG())}</span>Ältestenhütte<span class="ac">${costText(BUILD.elder.cost)}</span></button>`;
      h += `<button class="ab" data-a="b-tower"><span class="ai">${buildPic('tower',towerSVG())}</span>Wachturm<span class="ac">${costText(BUILD.tower.cost)}</span></button>`;
    }
    el.innerHTML = h; el.className='';
  } else {
    // Kleiner Tipp nur in den ersten 30 Sekunden, danach ist unten frei
    if(G.t<30){ el.innerHTML = `<div class="tipmini">☝ Ziehen: auswählen · ✌ Zwei Finger: bewegen & zoomen</div>`; el.className='tiphint'; }
    else { el.innerHTML=''; el.className='hidden'; }
  }
  el.querySelectorAll('.ab,.pclose[data-a]').forEach(b=>b.onclick=()=>action(b.dataset.a));
  el.querySelectorAll('.sx').forEach(b=>b.onclick=()=>{ EE.click(); select([],null); });
  if(G.sel.length){ const ws=G.sel.slice(); el.querySelectorAll('.pic').forEach(b=>b.onclick=()=>{ EE.click(); const u=ws[+b.dataset.u]; if(u){ select([u],null); } }); el.querySelectorAll('.gpic').forEach(b=>b.onclick=()=>{ EE.click(); const us=ws.filter(u=>u.kind===b.dataset.g); if(us.length && us.length<ws.length) select(us,null); }); }
}
const UNIT_DE = {worker:'Bauern'};
/* ---------- Kleine Bilder (Icons) aus den echten 3D-Modellen ---------- */
const THUMB = {}; let thumbRT = null;
function renderThumb(obj, portrait){
  const S=512, r=G.renderer;   // hohe Auflösung (auch für PC)
  if(!thumbRT){ thumbRT=new T.WebGLRenderTarget(S,S,{samples:4}); thumbRT.texture.colorSpace=T.SRGBColorSpace; }
  const sc=new T.Scene(); sc.add(new T.HemisphereLight(0xfff6e8,0x5a4a38,1.7)); const d=new T.DirectionalLight(0xffffff,2.3); d.position.set(3,6,5); sc.add(d);
  if(obj.rig) poseRig(obj,'idle',0);
  sc.add(obj); obj.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(obj), c=box.getCenter(new T.Vector3()), sz=box.getSize(new T.Vector3());
  let rad; if(portrait){ c.y=box.max.y-sz.y*.24; rad=sz.y*.3; } else if(obj.rig){ const H=1.55*HUMAN; c.set(0,H*.52,0); rad=H*.62; } else rad=Math.max(sz.x,sz.y,sz.z)*.6;
  const cam=new T.PerspectiveCamera(30,1,.02,500);
  cam.position.set(c.x+rad*1.1, c.y+rad*(portrait||obj.rig?.35:1.05), c.z+rad*2.4); cam.lookAt(c);
  const old=r.getRenderTarget(), oc=r.getClearColor(new T.Color()), oa=r.getClearAlpha(), sh=r.shadowMap.enabled;
  r.shadowMap.enabled=false; r.setRenderTarget(thumbRT); r.setClearColor(0x000000,0); r.clear(); r.render(sc,cam);
  const px=new Uint8Array(S*S*4); r.readRenderTargetPixels(thumbRT,0,0,S,S,px);
  r.setRenderTarget(old); r.setClearColor(oc,oa); r.shadowMap.enabled=sh;
  const cv=document.createElement('canvas'); cv.width=cv.height=S; const x=cv.getContext('2d'), im=x.createImageData(S,S);
  for(let j=0;j<S;j++) im.data.set(px.subarray((S-1-j)*S*4,(S-j)*S*4), j*S*4);
  x.putImageData(im,0,0); sc.remove(obj); return cv.toDataURL();
}
function thumb(key, make, portrait){
  if(key in THUMB) return THUMB[key];
  try{ const o=make(); THUMB[key] = o ? renderThumb(o, portrait) : null; }catch(e){ console.warn('Icon', key, e); THUMB[key]=null; }
  return THUMB[key];
}
const img = src => `<img class="th" src="${src}" alt="">`;
// Gebäude-Icon aus dem echten Modell, sonst das alte Zeichen
function buildPic(kind, fallback){
  const col=COLORS[0];
  const src = thumb('b:'+kind, ()=> kind==='tc'?makeTC(col, G.players[0].civ, 0) : kind==='house'?makeHouse(col,0) : kind==='store'?makeStore(col,0) :
    kind==='barracks'?makeBarracks(col,0) : kind==='tower'?makeTower(col,0) : kind==='market'?makeMarket(col,0) : kind==='wall'?makeWallPiece(col,false,2.4) : null);
  return src ? img(src) : fallback;
}
function unitPic(u){
  if(u.kind==='ox') return OX_SVG;
  const ks = u.kind==='worker' ? (u.sex==='f'?'f':'m') : u.kind;
  if(UNIT[u.kind] && u.kind!=='kid' && G && G.renderer){
    const col=COLORS[u.owner];
    const src = thumb('u:'+ks+':'+u.owner, ()=>{ if(u.kind==='worker'){ G.nextSex=ks; return makeWorker(col); } return makeSoldier(u.kind, col); }, false);
    if(src) return img(src);
  }
  return unitPicSVG(u);
}
function unitPicSVG(u){
  const col='#'+COLORS[u.owner].toString(16).padStart(6,'0'), f=u.sex==='f';
  return `<svg viewBox="0 0 24 28"><path d="M5 27q0-11 7-11t7 11z" fill="#8a5a2b"/><path d="M6 21l12-3v3l-12 3z" fill="${col}"/>`+
    (f?`<path d="M6.5 11q0-7 5.5-7t5.5 7v5h-2v-4h-7v4h-2z" fill="#3a2414"/>`:'')+
    `<circle cx="12" cy="10" r="4.6" fill="#e0b088"/><path d="M7.4 9q.5-5.5 4.6-5.5t4.6 5.5q-2-2.6-4.6-2.6t-4.6 2.6z" fill="#3a2414"/>`+
    `<circle cx="10.3" cy="10.3" r=".7" fill="#2a1a10"/><circle cx="13.7" cy="10.3" r=".7" fill="#2a1a10"/>`+
    (u.kind==='spear'?'<path d="M20 26L21 3" stroke="#7a5230" stroke-width="1.4"/><path d="M21 1l-1.6 3.4h3.2z" fill="#9aa3ad"/>':u.kind==='club'?'<path d="M19 26l2-12" stroke="#7a5230" stroke-width="1.8"/><path d="M18 11l5 1.5-1 3-5-1.5z" fill="#8a8f96"/>':u.kind==='bow'?'<path d="M3 6q-3 9 0 18" stroke="#7a5230" stroke-width="1.5" fill="none"/><path d="M3 6v18" stroke="#ddd" stroke-width=".5"/>':'')+`</svg><i style="width:${Math.round(20*(u.hp==null?1:u.hp/(u.maxHp||1)))}px"></i>`;
}
/* ============================================================
   VOLK: Familien, Kinder und Hütten
   Leute wohnen in Hütten (4 Plätze) oder im Stadtzentrum (5). Wo Platz ist und Nahrung da ist,
   kommen Babys zur Welt. Babys werden zu Kindern, Kinder zu Arbeitern – die müssen dann
   in eine eigene Hütte ziehen. Ohne Platz in einer Hütte arbeiten sie nicht.
   ============================================================ */
const BABY_T = 60, CHILD_T = 120, BIRTH_T = 35, BIRTH_FOOD = 50;
const homeCap = b => (b && !b.dead && b.built>=1 && (b.kind==='house'||b.kind==='tc')) ? popOf(b) : 0;
function occupancy(){ const m=new Map(); for(const u of G.units) if(u.home && !u.dead) m.set(u.home,(m.get(u.home)||0)+1); return m; }
function findHome(u, occ, avoid){
  let best=null, bd=1e9;
  for(const b of G.builds){ if(b.owner!==u.owner || b===avoid) continue; const c=homeCap(b); if(!c || (occ.get(b)||0)>=c) continue;
    const d=Math.hypot(b.x-u.x,b.z-u.z); if(d<bd){ bd=d; best=b; } }
  return best;
}
function residentsTxt(b){
  let a=0,k=0,y=0; for(const u of G.units) if(u.home===b && !u.dead){ if(u.kind!=='kid') a++; else if(u.stage==='baby') y++; else k++; }
  return `Bewohner: ${a} Erwachsene`+(k?`, ${k} Kind${k>1?'er':''}`:'')+(y?`, ${y} Baby${y>1?'s':''}`:'')+` (${a+k+y}/${homeCap(b)})`;
}
function setStage(u, st){
  u.stage=st; const s = st==='baby' ? .42 : st==='child' ? .68 : 1;
  u.mesh.scale.setScalar(s); u.speed = st==='baby' ? 1.1 : st==='child' ? 2.3 : UNIT.worker.speed;
}
function bornAt(b){
  const p=G.players[b.owner]; p.res.food -= BIRTH_FOOD;
  const a=G.rand()*6.28, r=b.size*.5+1;
  G.nextSex = G.rand()<.5 ? 'm' : 'f';
  const u = spawnWorker(b.owner, b.x+Math.cos(a)*r, b.z+Math.sin(a)*r, 'kid');
  u.home=b; u.grow=0; setStage(u,'baby');
  if(b.owner===0){ EE.toast(u.sex==='f' ? 'Ein Mädchen ist geboren!' : 'Ein Junge ist geboren!'); EE.sfx('trained',.5); updateHUD(); }
}
/* ---------- ALTER: Bauern werden älter (1 Spielminute ≈ 0,85 Jahre). Ab ca. 50 Jahren „alt“ (langsamer),
   ab ca. 67 „Greis“: arbeitet nicht mehr, spielt mit den Kindern; mit 75–85 Jahren stirbt er friedlich. ---------- */
const AGE_OLD = 40*60, AGE_VOLD = 60*60, AGE_DIE = 70*60;
const ageYears = u => Math.floor(16 + (u.age||0)/60*.85);
function setAgeStage(u, st){
  u.ageSt=st; u.stoop = st==='greis' ? .5 : st==='alt' ? .22 : 0;
  u.speed = UNIT.worker.speed * (st==='greis' ? .6 : st==='alt' ? .82 : 1);
  if(st==='greis'){ if(['gather','build','hunt','drop'].includes(u.state)){ u.state='idle'; u.target=null; u.site=null; u.path=null; } u.auto=false; u.carry.amt=0; }
}
function updateAge(u,dt){
  u.age=(u.age||0)+dt;
  if(!u.ageSt && u.age>AGE_OLD){ setAgeStage(u,'alt'); }
  else if(u.ageSt==='alt' && u.age>AGE_VOLD){ setAgeStage(u,'greis'); if(u.owner===0) EE.toast('Ein Bauer ist jetzt zu alt zum Arbeiten – er kümmert sich um die Kinder'); }
  if(u.ageSt==='greis'){
    if(u.dieAt==null) u.dieAt = AGE_DIE + G.rand()*12*60;
    if(u.age>u.dieAt){ if(u.owner===0){ EE.toast('Ein alter Mensch ist mit '+ageYears(u)+' Jahren friedlich gestorben'); } killUnit(u,true); return true; }
    // spielt mit den Kindern: geht zu einem Kind in der Nähe, sonst ein paar Schritte ums Haus
    if(u.state==='idle' && !u.inside){ u.playT=(u.playT||0)-dt; if(u.playT<=0){ u.playT=5+G.rand()*7;
      const kids=G.units.filter(k=>k.kind==='kid' && k.owner===u.owner && !k.inside && Math.hypot(k.x-u.x,k.z-u.z)<35);
      if(kids.length){ const k=kids[(G.rand()*kids.length)|0], a=G.rand()*6.28; u.state='move'; u.goal={x:k.x+Math.cos(a)*1.2, z:k.z+Math.sin(a)*1.2, tries:30}; moveTo(u,u.goal.x,u.goal.z); }
      else idleLife(u); } }
  }
  return false;
}
function growUp(u){
  u.kind='worker'; u.age=0; u.hp=u.maxHp=UNIT.worker.hp; setStage(u,null); u.stage=null;
  const old=u.home; u.home=null; u.moveOut=true; u.oldHome=old;
  const nh = findHome(u, occupancy(), old);
  if(nh){ u.home=nh; cmdMove(u, nh.x+(G.rand()-.5)*3, nh.z+nh.size*.5+1.2); }
  if(u.owner===0){ EE.toast(nh ? 'Ein Kind ist erwachsen und zieht als Bauer in eine eigene Hütte' : 'Ein Kind ist erwachsen – es braucht eine eigene Hütte!'); drawPanelSoon(); }
}
function updateKid(u,dt){
  u.grow += dt;
  if(u.stage==='baby' && u.grow>=BABY_T) setStage(u,'child');
  if(u.grow>=BABY_T+CHILD_T){ growUp(u); return; }
  if(u.state!=='idle' && u.state!=='move') u.state='idle';
  u.wanderT=(u.wanderT||0)-dt;
  if(u.state==='idle' && u.wanderT<=0 && u.stage==='child' && G.rand()<.4){ const g=G.units.find(o=>o.ageSt==='greis' && o.owner===u.owner && !o.inside && Math.hypot(o.x-u.x,o.z-u.z)<25);
    if(g){ u.wanderT=4+G.rand()*5; const a=G.rand()*6.28; cmdMove(u, g.x+Math.cos(a)*1.3, g.z+Math.sin(a)*1.3); } }
  if(u.state==='idle' && u.wanderT<=0){ u.wanderT = 4+G.rand()*6; const h=u.home||G.players[u.owner].tc; if(h){ const a=G.rand()*6.28, r=h.size*.5+1.5+G.rand()*(u.stage==='baby'?1.5:5); cmdMove(u, h.x+Math.cos(a)*r, h.z+Math.sin(a)*r); } }
}
// Tempo im Stadtzentrum: Hütten im selben Gebiet (+5 % je Hütte, höchstens 6) und Helfer drinnen (+10 % je Helfer, höchstens 3)
const HELP_MAX = 3;
function trainMul(b){
  if(b.kind!=='tc') return 1;
  const id=regionAt(b.x,b.z); let h=0; for(const o of G.builds) if(o.kind==='house' && o.owner===b.owner && o.built>=1 && regionAt(o.x,o.z)===id) h++;
  return 1 + .05*Math.min(6,h) + .1*helpers(b).length;
}
const helpers = b => G.units.filter(u=>u.inside===b && !u.dead);
function helperIn(b){
  if(helpers(b).length>=HELP_MAX){ EE.toast('Höchstens '+HELP_MAX+' Helfer'); return; }
  const w = G.units.filter(u=>u.owner===b.owner && u.kind==='worker' && !u.inside && !u.dead).sort((p,q)=>Math.hypot(p.x-b.x,p.z-b.z)-Math.hypot(q.x-b.x,q.z-b.z))[0];
  if(!w){ EE.toast('Kein Bauer frei'); return; }
  if(G.sel.includes(w)) G.sel=G.sel.filter(x=>x!==w);
  w.inside=b; w.state='idle'; w.path=null; w.site=null; w.target=null; w.ring.visible=false; if(w.bar) w.bar.visible=false;
}
// Älteste in die Ältestenhütte: zuerst Greise (die sonst nur mit Kindern spielen), dann Bauern
function elderIn(b){
  if(elders(b).length>=ELDER_MAX){ EE.toast('Höchstens '+ELDER_MAX+' Älteste'); return; }
  const free=G.units.filter(u=>u.owner===b.owner && u.kind==='worker' && !u.inside && !u.dead), d=u=>Math.hypot(u.x-b.x,u.z-b.z);
  const w = free.filter(u=>u.ageSt==='greis').sort((p,q)=>d(p)-d(q))[0] || free.sort((p,q)=>d(p)-d(q))[0];
  if(!w){ EE.toast('Niemand frei'); return; }
  if(G.sel.includes(w)) G.sel=G.sel.filter(x=>x!==w);
  w.inside=b; w.state='idle'; w.path=null; w.site=null; w.target=null; w.ring.visible=false; if(w.bar) w.bar.visible=false;
  if(w.ageSt==='greis') EE.toast('Ein Greis gibt jetzt sein Wissen weiter');
}
const TOWER_MAX = 4;
const crew = b => G.units.filter(u=>u.inside===b && !u.dead);
function cmdGarrison(u,b){ u.state='garrison'; u.site=b; u.target=null; u.repath=0; moveTo(u,b.x,b.z); }
function enterTower(u,b){
  const c=crew(b); if(c.length>=TOWER_MAX){ if(u.owner===0) EE.toast('Der Wachturm ist voll'); u.state='idle'; u.site=null; return; }
  const used=new Set(c.map(o=>o.slot)); let sl=0; while(used.has(sl)) sl++;
  if(G.sel.includes(u)){ G.sel=G.sel.filter(x=>x!==u); u.ring.visible=false; drawPanelSoon(); }
  u.inside=b; u.slot=sl; u.state='idle'; u.path=null; u.site=null; u.target=null; u.cd=0; u.ring.visible=false;
  if(u.owner===0){ EE.sfx('place',.4); if(G.selB===b) drawPanelSoon(); }
}
function crewOut(b){ crew(b).forEach((u,i)=>{ u.inside=null; const a=i*1.57+.8; u.x=b.x+Math.cos(a)*(b.size*.5+1); u.z=b.z+Math.sin(a)*(b.size*.5+1); u.state='idle'; }); }
// Krieger oben auf dem Turm: stehen auf der Plattform, zielen und schießen (Bogen) oder werfen (Speer, Axt)
function updateTowerCrew(u,dt){
  const b=u.inside, m=u.mesh, U=UNIT[u.kind];
  if(b.dead){ u.inside=null; u.hp=Math.max(1,u.hp*.5); u.state='idle'; return; }
  const k=b.mesh, sx=(u.slot&1?1:-1)*(k.slotX||.55), sz=(u.slot&2?1:-1)*(k.slotZ||.55);
  u.x=b.x+sx; u.z=b.z+sz;
  m.position.set(u.x, k.position.y+(k.platY||4.9)*k.scale.y, u.z);
  const R = U.ranged ? 14 : 10;
  u.scanT=(u.scanT||0)-dt; if(u.scanT<=0){ u.scanT=.5; if(!alive(u.target) || Math.hypot(u.target.x-u.x,u.target.z-u.z)>R+(u.target.size?u.target.size*.5:0)) u.target=nearestFoe(u,R); }
  const t=u.target; u.working=false;
  if(b.built>=1 && alive(t)){ u.working=true; u.face=Math.atan2(t.x-u.x,t.z-u.z); u.cd-=dt;
    if(u.cd<=0){ u.cd=U.cd*(U.ranged?1:1.4); const dmg=(t.size?U.atk*Math.max(U.bld,.3):U.atk)*(U.ranged?1.3:.75)*(.85+G.rand()*.3); shootArrow(u,t,dmg,m.position.y+1.3); } }
  let df=u.face-m.rotation.y; df=Math.atan2(Math.sin(df),Math.cos(df)); m.rotation.y+=df*Math.min(1,dt*8);
  u.phase+=dt*(u.working?6:2);
  if(m.isRigged){ const shoot=u.working && U.ranged; if(m.bowK) setBowSlot(m, shoot); if(!G.farView && m.visible) poseRig(m, shoot?'shoot':u.working?'work':'idle', shoot?1-clamp(u.cd/U.cd,0,1):u.phase); }
  if(m.load) m.load.visible=false;
}
function helpersOut(b){ for(const u of helpers(b)){ u.inside=null; const a=G.rand()*6.28; u.x=b.x+Math.cos(a)*(b.size*.5+1); u.z=b.z+Math.sin(a)*(b.size*.5+1); autoJob(u); } }
function updatePopulation(dt){
  G.popT=(G.popT||0)-dt; if(G.popT>0) return; G.popT=1;
  const occ=occupancy();
  // ohne Zuhause: Hütte suchen
  let homeless=0;
  for(const u of G.units){ if(u.dead) continue;
    if(u.home && (u.home.dead || !homeCap(u.home))) u.home=null;
    if(!u.home){ const h=findHome(u, occ, u.oldHome && !u.oldHome.dead ? u.oldHome : null); if(h){ u.home=h; occ.set(h,(occ.get(h)||0)+1); if(u.homeless){ u.homeless=false; if(u.kind==='worker' && u.state==='idle') autoJob(u); } } else { u.homeless=true; if(u.owner===0) homeless++; } }
    if(u.moveOut && u.state==='idle'){ u.moveOut=false; if(u.home) autoJob(u); }
  }
  if(homeless){ G.hlT=(G.hlT||0)-1; if(G.hlT<=0){ G.hlT=25; EE.toast(homeless+(homeless>1?' Leute haben':' Person hat')+' keine Hütte und arbeitet nicht – baue Hütten!'); } }
  // Neue leere Hütte: ein Paar aus einem vollen Haus zieht ein
  for(const h of G.builds){
    if(h.kind!=='house' || !homeCap(h) || (occ.get(h)||0)>0) continue;
    const src=G.builds.find(b=>b.owner===h.owner && b!==h && (occ.get(b)||0)>=3 && G.units.some(u=>u.home===b && u.sex==='m' && u.kind!=='kid') && G.units.some(u=>u.home===b && u.sex==='f' && u.kind!=='kid'));
    if(!src) continue;
    const pair=[G.units.find(u=>u.home===src && u.sex==='m' && u.kind!=='kid' && !u.dead), G.units.find(u=>u.home===src && u.sex==='f' && u.kind!=='kid' && !u.dead)];
    for(const u of pair){ u.home=h; }
    occ.set(src,(occ.get(src)||0)-2); occ.set(h,2);
    if(h.owner===0) EE.toast('Ein Paar ist in die neue Hütte gezogen');
  }
  // Geburten
  for(const b of G.builds){
    const c=homeCap(b); if(!c) continue;
    b.birthT = (b.birthT==null ? BIRTH_T*(.5+G.rand()) : b.birthT) - 1;
    if(b.birthT>0) continue; b.birthT = BIRTH_T*(.8+G.rand()*.4);
    const p=G.players[b.owner]; if((occ.get(b)||0)>=c || p.res.food<BIRTH_FOOD+20) continue;
    let m=0,f=0, here=0; for(const u of G.units) if(u.owner===b.owner && u.kind!=='kid' && !u.dead){ if(u.sex==='f') f++; else m++; if(u.home===b) here++; }
    if(!m || !f || !here) continue;
    bornAt(b); occ.set(b,(occ.get(b)||0)+1);
  }
}
/* ============================================================
   KRIEGER & KAMPF (Steinzeit): Krieger sind Höhlenmenschen mit Waffen
   ============================================================ */
const UNIT = {
  worker:{name:'Bauer', hp:40, atk:2, range:.9, cd:1.3, speed:3.1, bld:.2},
  club:  {name:'Axtkrieger', hp:95, atk:9, range:1.1, cd:1.15, speed:3.0, bld:.6, cost:{food:50,wood:20}, time:12, weapon:'w_axe', wlen:.5},
  spear: {name:'Speerträger', hp:85, atk:7, range:1.7, cd:1.0, speed:3.2, bld:.4, cost:{food:45,wood:30}, time:12, weapon:'w_spear', wlen:1.35},
  bow:   {name:'Bogenschütze', hp:55, atk:6, range:9, cd:1.7, speed:3.0, bld:.25, cost:{food:40,wood:45}, time:14, weapon:'w_bow', wlen:1.0, ranged:true},
};
UNIT_DE.club='Axtkrieger'; UNIT_DE.spear='Speerträger'; UNIT_DE.bow='Bogenschützen';
const isSoldier = u => u.kind!=='worker' && u.kind!=='kid' && u.kind!=='ox';
UNIT.ox = {name:'Ochse', hp:140, atk:0, range:.9, cd:2, speed:2.3, bld:0, cost:{food:120}, time:25}; UNIT_DE.ox='Ochsen';
const OX_CAP = 60;
UNIT.kid = {name:'Kind', hp:25, atk:0, range:.6, cd:2, speed:2.3, bld:0}; UNIT_DE.kid='Kinder';
function attachWeapon(g, kind){
  const U=UNIT[kind], m=MODELS[U.weapon]; if(!m || !g.rig) return;
  const sk=g.children[0], s=sk.scale.x, bb=m.geo.boundingBox, L=bb.max.y-bb.min.y;
  const w=new T.Mesh(m.geo, m.mat); w.castShadow=true;
  const k=U.wlen/L/s; w.scale.setScalar(k);
  if(kind==='bow'){ g.bowK=k; g.bowL=L; g.bowS=s; g.weapon=w; setBowSlot(g,false); if(g.club) g.club.visible=false; return; }
  else { const grip = kind==='spear' ? .35 : .12; w.rotation.set(kind==='spear'?.15:1.25,0,0);
    // Griffpunkt der Waffe genau in die Hand legen (Verschiebung in gedrehter Richtung)
    w.position.copy(new T.Vector3(0,bb.min.y+L*grip,0).applyEuler(w.rotation).multiplyScalar(-k)).add(g.palmR); g.rig.handR.add(w); }
  g.weapon=w;
  if(g.club) g.club.visible=false;
}
// Bogen: auf dem Rücken getragen, nur beim Schießen senkrecht in der linken Hand
const BOW_T = {back:{p:[0,.95,-.2], r:[0,0,.55]}, hand:{r:[Math.PI/2,-Math.PI/2,0]}};
function setBowSlot(g, inHand){
  const w=g.weapon; if(!w || g.bowInHand===inHand) return; g.bowInHand=inHand;
  if(w.parent) w.parent.remove(w);
  const bb=w.geometry.boundingBox, mid=new T.Vector3(0,(bb.min.y+bb.max.y)/2,0);
  if(inHand){ w.scale.setScalar(g.bowK); w.rotation.set(...BOW_T.hand.r); w.position.copy(mid.applyEuler(w.rotation).multiplyScalar(-g.bowK)).add(g.palmL); g.rig.handL.add(w); }
  else { const ws=g.bowK*g.bowS; w.scale.setScalar(ws); w.rotation.set(...BOW_T.back.r); w.position.set(...BOW_T.back.p).add(mid.applyEuler(w.rotation).multiplyScalar(-ws)); g.add(w); }
}
function makeSoldier(kind, color){
  const key = MODELS.warrior ? 'warrior' : (Math.random()<.5?'cavem':'cavef');
  const g = makeRigged(key, 1.5*HUMAN, color); if(!g) return makeWorker(color);
  g.rig.hips.userData.y0 = g.rig.hips.position.y; g.userData.key=key;
  attachWeapon(g, kind);
  return g;
}
// Lebensbalken über der Figur
const BAR_GEO = new T.PlaneGeometry(1,1);
function makeBar(){
  const g=new T.Group();
  const bg=new T.Sprite(new T.SpriteMaterial({color:0x220000, depthTest:false})); bg.scale.set(.9,.11,1);
  const fg=new T.Sprite(new T.SpriteMaterial({color:0x5fe36a, depthTest:false})); fg.scale.set(.86,.07,1); fg.center.set(0,.5); fg.position.x=-.43;
  bg.renderOrder=8; fg.renderOrder=9; g.add(bg); g.add(fg); g.fg=fg; g.visible=false; return g;
}
function updateBar(u){
  if(!u.bar){ u.bar=makeBar(); G.scene.add(u.bar); }
  const f=clamp(u.hp/u.maxHp,0,1), show=!G.farView && (u.ring.visible || f<.999);
  u.bar.visible=show; if(!show) return;
  u.bar.position.set(u.x, u.mesh.position.y+2.05*HUMAN+.1, u.z); u.bar.quaternion.copy(G.cam.quaternion); u.bar.fg.scale.x=.86*f;
  u.bar.fg.material.color.setHex(f>.5?0x5fe36a:f>.25?0xf2c230:0xe23b3b);
}
const alive = t => t && t.hp>0 && !t.dead;
function cmdAttack(u,t){ if(u.kind==='ox') return; u.state='attack'; u.target=t; u.site=null; u.path=null; u.repath=0; }
// „Gegner suchen“: nächster Feind in der Nähe, sonst der nächste Feind auf der ganzen Karte
function seekFoe(u){ return nearestFoe(u,80) || nearestFoe(u,1e9); }
function nearestFoe(u, R){
  let best=null, bd=R;
  for(const o of G.units){ if(!alive(o) || o.inside || !hostile(u.owner,o.owner)) continue; const d=Math.hypot(o.x-u.x,o.z-u.z); if(d<bd){ bd=d; best=o; } }
  if(best) return best;
  if(R<200) for(const a of G.deer){ if(a.dead || a.hp==null || !(a.pred || a.angry)) continue; const d=Math.hypot(a.x-u.x,a.z-u.z); if(d<bd){ bd=d; best=a; } }   // Raubtiere / wütende Elefanten
  if(best) return best;
  for(const b of G.builds){ if(!alive(b) || b.kind==='road' || !hostile(u.owner,b.owner)) continue; const d=Math.hypot(b.x-u.x,b.z-u.z)-b.size*.5; if(d<bd){ bd=d; best=b; } }
  return best;
}
const arrows=[];
function shootArrow(u,t,dmg,yStart){
  const m=new T.Mesh(new T.CylinderGeometry(.015,.015,.7,4), mat(0x5a3818)); m.rotation.x=Math.PI/2;
  const g=new T.Group(); g.add(m); const y0=yStart!=null?yStart:getH(u.x,u.z)+1.3; g.position.set(u.x,y0,u.z); G.scene.add(g);
  arrows.push({g, x0:u.x, z0:u.z, y0, t, dmg, k:0, src:u, len:Math.max(1,Math.hypot(t.x-u.x,t.z-u.z))});
}
function updateArrows(dt){
  for(let i=arrows.length-1;i>=0;i--){ const a=arrows[i]; a.k += dt*22/a.len;
    const tx=a.t.x, tz=a.t.z, ty=getH(tx,tz)+(a.t.size?1.2:1.0), k=Math.min(1,a.k);
    a.g.position.set(lerp(a.x0,tx,k), lerp(a.y0,ty,k)+Math.sin(k*Math.PI)*a.len*.12, lerp(a.z0,tz,k));
    a.g.lookAt(tx, ty, tz);
    if(a.k>=1){ G.scene.remove(a.g); arrows.splice(i,1); if(alive(a.t)) damage(a.t, a.dmg, a.src); }
  }
}
function damage(t, dmg, src){
  if(t.deer){ animalHit(t, dmg, src); return; }
  if(t.inside && t.inside.kind==='tower' && alive(t.inside)){ t=t.inside; dmg*=.35; }
  if(t.owner===0 || (src && src.owner===0)) G.fightT=G.t;   // Kampf mit uns: Kriegsmusik
  if(!t.size) bloodFx(t.x,t.z,5+(G.rand()*4|0), G.rand()<.35?.35:0);
  if(src && G.reg && friendlyLand(src.owner, src.x, src.z)) dmg *= 1.15; // Heimvorteil wie in EE2
  t.hp -= dmg;
  if(t.owner===0) G.alarmAt={x:t.x,z:t.z,t:G.t};
  if(t.size){ if(t.owner===0 && !G.alarmT){ G.alarmT=8; EE.toast('Deine '+BUILD[t.kind].name+' wird angegriffen!'); EE.sfx('error',.6); } if(t.hp<=0) destroyBuilding(t); return; }
  if(t.owner===0 && !G.alarmT){ G.alarmT=8; EE.toast('Deine Leute werden angegriffen!'); EE.vib(40); }
  if(t.hp<=0){ killUnit(t); return; }
  if(isSoldier(t) && (t.state==='idle' || t.state==='move' && t.owner!==0) && src && alive(src)) cmdAttack(t, src);
}
// Blut: Spritzer bei Treffern und eine Lache am Boden, die langsam verblasst
const BLOOD = {parts:[], pools:[]};
function bloodFx(x,z,n,pool){
  if(!G || G.farView) return;
  if(!BLOOD.geo){ BLOOD.geo=new T.IcosahedronGeometry(.05,0); BLOOD.mat=new T.MeshBasicMaterial({color:0x8a0b0b}); BLOOD.pgeo=new T.CircleGeometry(.5,10); BLOOD.pgeo.rotateX(-Math.PI/2); }
  const y=getH(x,z);
  for(let i=0;i<n && BLOOD.parts.length<80;i++){ const m=new T.Mesh(BLOOD.geo,BLOOD.mat); m.position.set(x,y+.9+G.rand()*.3,z); const s=.6+G.rand()*.9; m.scale.setScalar(s); G.scene.add(m);
    const a=G.rand()*6.28, v=.8+G.rand()*1.6; BLOOD.parts.push({m, vx:Math.cos(a)*v, vz:Math.sin(a)*v, vy:1+G.rand()*1.8}); }
  if(pool && BLOOD.pools.length<40){ const mat=new T.MeshBasicMaterial({color:0x5e0606, transparent:true, opacity:.85, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2});
    const m=new T.Mesh(BLOOD.pgeo, mat); const s=pool*(.7+G.rand()*.5); m.scale.set(s,1,s*(.7+G.rand()*.5)); m.rotation.y=G.rand()*6.28; m.position.set(x+(G.rand()-.5)*.3,y+.03,z+(G.rand()-.5)*.3); G.scene.add(m); BLOOD.pools.push({m,t:0}); }
}
// Schwimm-Skelett automatisch: Knochenkette entlang des Körpers (Kopf → Schwanz), Gewichte nach Lage,
// Bewegung als laufende Welle (Fisch: seitlich, Delfin: auf und ab)
const SWIM_RIG = {};
function makeSwimmer(key, len, vertical){
  const md=MODELS[key]; if(!md) return null;
  let R=SWIM_RIG[key];
  if(!R){
    const geo=md.geo.clone(), bb=geo.boundingBox||(geo.computeBoundingBox(),geo.boundingBox), pos=geo.attributes.position, NB=5;
    const z0=bb.min.z, z1=bb.max.z, cy=(bb.min.y+bb.max.y)/2, si=[], sw=[];
    for(let v=0;v<pos.count;v++){ const f=clamp((z1-pos.getZ(v))/(z1-z0),0,.9999)*(NB-1), a=Math.floor(f), w=f-a;
      si.push(a, Math.min(a+1,NB-1), 0, 0); sw.push(1-w, w, 0, 0); }
    geo.setAttribute('skinIndex', new T.Uint16BufferAttribute(si,4)); geo.setAttribute('skinWeight', new T.Float32BufferAttribute(sw,4));
    R=SWIM_RIG[key]={geo, NB, z0, z1, cy};
  }
  const bones=[]; for(let i=0;i<R.NB;i++){ const b=new T.Bone(); if(i===0) b.position.set(0,R.cy,R.z1); else { b.position.set(0,0,-(R.z1-R.z0)/(R.NB-1)); bones[i-1].add(b); } bones.push(b); }
  const sk=new T.SkinnedMesh(R.geo, md.mat); sk.add(bones[0]); sk.bind(new T.Skeleton(bones)); sk.frustumCulled=false;
  const s=len/(R.z1-R.z0); sk.scale.setScalar(s);
  const g=new T.Group(); g.add(sk); g.userData.swim={bones, vertical, ph:Math.random()*6.28}; return g;
}
function swimPose(g, dt, speed){
  const S=g.userData.swim; if(!S) return; S.ph+=dt*speed;
  for(let i=1;i<S.bones.length;i++){ const a=Math.sin(S.ph - i*.9)*.12*i; if(S.vertical) S.bones[i].rotation.x=a; else S.bones[i].rotation.y=a; }
}
// Delfine: kleine Gruppen springen im warmen und gemäßigten Meer in Kameranähe aus dem Wasser
/* ---------- Haustiere im Dorf: Hunde (und in warmen Gegenden Katzen) laufen herum und spielen mit den Kindern ---------- */
const PETS = [];
function spawnPets(){
  PETS.length=0;
  G.players.forEach((p,i)=>{ const b=G.bases[i]; if(!b) return; const lat=toLat(b.z), n=1+(G.rand()*2|0);
    for(let k=0;k<n;k++){ const kind=['dog1','dog2','dog3'][(G.rand()*3)|0]; addPet(kind, b.x+(G.rand()-.5)*10, b.z+(G.rand()-.5)*10, i); }
    if(Math.abs(lat)<45 && G.rand()<.7) addPet('cat', b.x+(G.rand()-.5)*8, b.z+(G.rand()-.5)*8, i); });
}
function addPet(kind,x,z,owner){
  if(!MODELS[kind]) return; const m=makeDeer(kind); if(!m) return; m.position.set(x,getH(x,z),z); G.scene.add(m);
  PETS.push({kind, owner, x, z, tx:x, tz:z, wait:G.rand()*3, phase:G.rand()*6, mesh:m, speed:kind==='cat'?1.6:2.6});
}
function updatePets(dt){
  for(const d of PETS){ const m=d.mesh, home=G.players[d.owner] && G.players[d.owner].tc; if(!home){ m.visible=false; continue; }
    d.wait-=dt; let moving=false;
    if(d.wait<=0){ const dx=d.tx-d.x, dz=d.tz-d.z, dist=Math.hypot(dx,dz);
      if(dist<.3){ d.wait=1.5+G.rand()*(d.kind==='cat'?8:4);
        // Hunde laufen gern zu Kindern, Alten oder Bauern in der Nähe, sonst ums Dorf
        const pals=G.units.filter(u=>u.owner===d.owner && !u.inside && (u.kind==='kid'||u.ageSt==='greis'||d.kind!=='cat') && Math.hypot(u.x-home.x,u.z-home.z)<30);
        const f = d.kind!=='cat' && pals.length && G.rand()<.6 ? pals[(G.rand()*pals.length)|0] : null, a=G.rand()*6.28;
        if(f){ d.tx=f.x+Math.cos(a)*1.2; d.tz=f.z+Math.sin(a)*1.2; } else { const r=home.size*.5+2+G.rand()*9; d.tx=home.x+Math.cos(a)*r; d.tz=home.z+Math.sin(a)*r; } }
      else { const sp=d.speed*dt*(dist>8?1.6:1); d.x+=dx/dist*Math.min(sp,dist); d.z+=dz/dist*Math.min(sp,dist); m.rotation.y=Math.atan2(dx,dz); moving=true; } }
    d.phase+=dt*(moving?11:1); m.position.set(d.x,getH(d.x,d.z),d.z);
    if(m.quad && m.visible && !G.farView) poseAnimal(m, moving?'move':'idle', d.phase); }
}
/* ---------- Haie: schwimmen dicht unter der Oberfläche in warmen und gemäßigten Meeren (Rückenflosse sichtbar) ---------- */
const SHARKS = {list:[], t:4};
function updateSharks(dt){
  if((!MODELS.shark1 && !MODELS.shark2) || G.farView){ for(const d of SHARKS.list) G.scene.remove(d.m); SHARKS.list.length=0; return; }
  SHARKS.t-=dt;
  if(SHARKS.t<=0 && SHARKS.list.length<2){ SHARKS.t=10+G.rand()*20; const c=G.camS;
    if(Math.abs(toLat(c.z))<45) for(let k=0;k<12;k++){ const a=G.rand()*6.28, r=c.dist*(.3+G.rand()*.6), x=c.x+Math.cos(a)*r, z=c.z+Math.sin(a)*r;
      if(getH(x,z) > WATER_Y-2.2) continue;
      const key = MODELS.shark2 && (Math.abs(toLat(z))>20 || !MODELS.shark1) ? 'shark2' : 'shark1';
      const o=makeSwimmer(key, key==='shark2'?4.2:2.8, false); if(!o) break; G.scene.add(o);
      SHARKS.list.push({m:o, x, z, hd:G.rand()*6.28, life:40+G.rand()*40, sp:1.4+G.rand()*.8}); break; } }
  for(let i=SHARKS.list.length-1;i>=0;i--){ const d=SHARKS.list[i], o=d.m; d.life-=dt;
    d.hd+=Math.sin(G.t*.3+i)*dt*.25; const nx=d.x+Math.sin(d.hd)*d.sp*dt, nz=d.z+Math.cos(d.hd)*d.sp*dt;
    if(getH(nx,nz) > WATER_Y-1.6) d.hd+=dt*2.5; else { d.x=nx; d.z=nz; }
    o.position.set(d.x, WATER_Y-.42, d.z); o.rotation.set(0,d.hd,0); swimPose(o, dt, 3);
    if(d.life<=0 || Math.hypot(d.x-G.camS.x,d.z-G.camS.z)>G.camS.dist*2.5){ G.scene.remove(o); SHARKS.list.splice(i,1); } }
}
const DOLPH = {list:[], t:6};
function splashFx(x,z,n){
  if(!DEBRIS.wmat){ const c=document.createElement('canvas'); c.width=c.height=64; const x2=c.getContext('2d'), gr=x2.createRadialGradient(32,32,2,32,32,31); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.6,'rgba(255,255,255,.4)'); gr.addColorStop(1,'rgba(255,255,255,0)'); x2.fillStyle=gr; x2.fillRect(0,0,64,64); DEBRIS.wmat=new T.SpriteMaterial({map:new T.CanvasTexture(c), transparent:true, opacity:.8, depthWrite:false}); }
  for(let i=0;i<n;i++){ const s=new T.Sprite(DEBRIS.wmat.clone()); const a=G.rand()*6.28, r=G.rand()*.4; s.position.set(x+Math.cos(a)*r, WATER_Y+.15, z+Math.sin(a)*r); s.scale.setScalar(.5); G.scene.add(s); DEBRIS.dust.push({s,t:1.8,vx:Math.cos(a)*1.2,vz:Math.sin(a)*1.2}); }
}
function updateDolphins(dt){
  if(!MODELS.dolphin || G.farView){ for(const d of DOLPH.list) G.scene.remove(d.m); DOLPH.list.length=0; return; }
  DOLPH.t-=dt;
  if(DOLPH.t<=0 && DOLPH.list.length===0){
    DOLPH.t = 12+G.rand()*18;
    const c=G.camS, lat=toLat(c.z);
    if(Math.abs(lat)<48) for(let k=0;k<14;k++){
      const a=G.rand()*6.28, r=c.dist*(.3+G.rand()*.6), x=c.x+Math.cos(a)*r, z=c.z+Math.sin(a)*r;
      if(getH(x,z) > WATER_Y-2.6 || getH(x+6,z) > WATER_Y-2 || getH(x,z+6) > WATER_Y-2) continue;
      const hd=G.rand()*6.28, n=2+(G.rand()*3|0);
      for(let i=0;i<n;i++){ const o=makeSwimmer('dolphin', 2.2, true); if(!o) break; o.visible=false; G.scene.add(o);
        DOLPH.list.push({m:o, x:x+(G.rand()-.5)*3, z:z+(G.rand()-.5)*3, hd:hd+(G.rand()-.5)*.25, ph:-(i*.35+G.rand()*.3), jumps:3+(G.rand()*3|0), L:4+G.rand()*1.5, H:1.4+G.rand()*.8, air:false}); }
      break;
    }
  }
  const CYC=2.6, AIR=1.15;
  for(let i=DOLPH.list.length-1;i>=0;i--){ const d=DOLPH.list[i], o=d.m;
    d.ph+=dt; if(d.ph<0) continue;
    const t=d.ph%CYC, sp=d.L/AIR*.85; d.x+=Math.sin(d.hd)*sp*dt; d.z+=Math.cos(d.hd)*sp*dt;
    const inAir = t<AIR;
    if(inAir && !d.air){ d.air=true; splashFx(d.x,d.z,3); }
    if(!inAir && d.air){ d.air=false; splashFx(d.x,d.z,4); if(--d.jumps<=0){ G.scene.remove(o); DOLPH.list.splice(i,1); continue; } }
    o.visible=inAir; if(!inAir) continue;
    const k=t/AIR, y=WATER_Y-.4+Math.sin(k*Math.PI)*d.H, vy=Math.cos(k*Math.PI)*Math.PI*d.H/AIR;
    o.position.set(d.x,y,d.z); o.rotation.set(-Math.atan2(vy, sp),d.hd,0,'YXZ'); swimPose(o, dt, 7);
  }
}
// Fische: Fischschwärme im flachen Wasser am Ufer (Nahrung – Bauern fischen vom Ufer aus mit dem Speer)
const FISH = [];
function addFish(x,z,gx,gz){
  if(FISH.some(f=>Math.hypot(f.x-x,f.z-z)<14)) return null;
  const g=new T.Group(); g.position.set(x, WATER_Y-.45, z);
  const n=G.gfx===0?2:G.gfx>=3?9:7;
  for(let i=0;i<n;i++){ const o=makeSwimmer('fish', .45+G.rand()*.25, false); if(!o) break; o.userData.a=i/n*6.28+G.rand()*.5; o.userData.r=.6+G.rand()*.9; o.userData.s=(.5+G.rand()*.4)*(G.rand()<.5?1:-1); o.userData.y=-G.rand()*.35; g.add(o); }
  G.scene.add(g);
  const r={type:'fish', kind:'food', amt:220, max:220, x, z, gx, gz, mesh:g, alive:true, r:.6, fish:true, jumpT:3+G.rand()*6};
  G.res.push(r); FISH.push(r);
  if(G.resMod){ const k=resKey(x,z); if(k in G.resMod){ r.amt=G.resMod[k]; if(r.amt<=0){ G.noFell=1; removeRes(r); G.noFell=0; } } }
  return r;
}
// zusätzlich frei schwimmende Schwärme (nur zum Anschauen) im klaren Flachwasser bei der Kamera
const SCHOOL = {list:[], t:3};
function updateFish(dt){
  const c=G.camS, R=c.dist*1.4+20;
  const swim=(o,dt)=>{ const u=o.userData; u.a+=dt*u.s*.9; o.position.set(Math.cos(u.a)*u.r, u.y+Math.sin(u.a*3)*.04, Math.sin(u.a)*u.r); o.rotation.y = -u.a + (u.s>0?0:Math.PI); swimPose(o, dt, 9); };
  for(const f of FISH){ if(!f.alive || Math.abs(f.x-c.x)>R || Math.abs(f.z-c.z)>R || G.farView) continue;
    const n=f.mesh.children.length, show=Math.ceil(n*f.amt/f.max);
    f.mesh.children.forEach((o,i)=>{ o.visible=i<show; if(o.visible) swim(o,dt); });
    f.jumpT-=dt; if(f.jumpT<=0){ f.jumpT=4+G.rand()*8; splashFx(f.x+(G.rand()-.5),f.z+(G.rand()-.5),2); }
  }
  // freie Schwärme
  SCHOOL.t-=dt;
  if(SCHOOL.t<=0 && !G.farView && MODELS.fish){ SCHOOL.t=4;
    for(let i=SCHOOL.list.length-1;i>=0;i--){ const s=SCHOOL.list[i]; if(Math.hypot(s.g.position.x-c.x, s.g.position.z-c.z)>c.dist*1.6+10){ G.scene.remove(s.g); SCHOOL.list.splice(i,1); } }
    if(SCHOOL.list.length<(G.gfx===0?1:3)) for(let k=0;k<10;k++){
      const a=G.rand()*6.28, r=c.dist*(.2+G.rand()*.7), x=c.x+Math.cos(a)*r, z=c.z+Math.sin(a)*r, h=getH(x,z);
      if(h>WATER_Y-.8 || h<WATER_Y-4) continue;
      const g=new T.Group(); g.position.set(x, WATER_Y-.6, z); const n=G.gfx===0?6:12;
      for(let i=0;i<n;i++){ const o=makeSwimmer('fish', .35+G.rand()*.2, false); o.userData.a=G.rand()*.8; o.userData.r=1.5+G.rand()*1.2; o.userData.s=.55; o.userData.y=-G.rand()*.5; g.add(o); }
      G.scene.add(g); SCHOOL.list.push({g, hd:G.rand()*6.28}); break;
    }
  }
  for(const s of SCHOOL.list){ s.g.children.forEach(o=>swim(o,dt)); s.hd+=dt*.05; s.g.position.x+=Math.sin(s.hd)*dt*.6; s.g.position.z+=Math.cos(s.hd)*dt*.6;
    if(getH(s.g.position.x, s.g.position.z)>WATER_Y-.7) s.hd+=Math.PI*.6; }
}
// Speer zum Fischen in die Hand (sonst die normale Keule)
function fishSpear(m, on){
  if(!m.rig || !MODELS.w_spear) return;
  if(on && !m.fspear){ const md=MODELS.w_spear, sk=m.children[0], s=sk.scale.x, bb=md.geo.boundingBox, L=bb.max.y-bb.min.y, k=1.3/L/s;
    const w=new T.Mesh(md.geo, md.mat); w.scale.setScalar(k); w.rotation.set(.15,0,0); w.position.copy(new T.Vector3(0,bb.min.y+L*.35,0).applyEuler(w.rotation).multiplyScalar(-k)).add(m.palmR||new T.Vector3()); m.rig.handR.add(w); m.fspear=w; }
  if(m.fspear){ m.fspear.visible=on; if(m.club) m.club.visible=!on; }
}
function updateBlood(dt){
  for(let i=BLOOD.parts.length-1;i>=0;i--){ const p=BLOOD.parts[i], m=p.m; p.vy-=9.8*dt; m.position.x+=p.vx*dt; m.position.z+=p.vz*dt; m.position.y+=p.vy*dt;
    if(m.position.y<getH(m.position.x,m.position.z)){ G.scene.remove(m); BLOOD.parts.splice(i,1); } }
  for(let i=BLOOD.pools.length-1;i>=0;i--){ const p=BLOOD.pools[i]; p.t+=dt; if(p.t>20){ p.m.material.opacity=.85*(1-(p.t-20)/10); if(p.t>30){ G.scene.remove(p.m); p.m.material.dispose(); BLOOD.pools.splice(i,1); } } }
}
function hit(u,t){
  const U=UNIT[u.kind]; const dmg = (t.size ? U.atk*U.bld : U.atk) * (.85+G.rand()*.3) * atkMul(u);
  if(U.ranged) shootArrow(u,t,dmg); else { damage(t,dmg,u); sfxAt('chop',u.x,u.z,.6); }
}
function killUnit(u, natural){
  if(!natural) bloodFx(u.x,u.z,10,.8);
  u.dead=true; u.hp=0; const i=G.units.indexOf(u); if(i>=0) G.units.splice(i,1);
  G.players[u.owner].pop = Math.max(0, G.players[u.owner].pop-1);
  if(G.sel.includes(u)){ G.sel=G.sel.filter(x=>x!==u); drawPanelSoon(); }
  u.ring.visible=false; if(u.bar) u.bar.visible=false;
  const m=u.mesh, sl=natural?.35:1; let t=0; const fall=()=>{ if(!G) return; t+=.016*sl; m.rotation.x=-Math.min(1,t*2.2)*Math.PI/2; m.position.y = getH(u.x,u.z)+.12 - Math.max(0,t-1.6)*.6;
    if(t<2.6) requestAnimationFrame(fall); else { G.scene.remove(m); G.scene.remove(u.ring); if(u.bar) G.scene.remove(u.bar); } }; fall();
  if(u.owner===0) updateHUD();
}
// Gebäude zerbrechen bei 0 Leben in Einzelteile: das Modell wird in Brocken zerlegt,
// die wegfliegen, aufschlagen, abprallen, rollen und liegen bleiben
const DEBRIS = {list:[], dust:[]};
function shatterBuilding(b){
  const root=b.mesh; root.updateMatrixWorld(true);
  const box=new T.Box3().setFromObject(root), size=box.getSize(new T.Vector3()), ctr=box.getCenter(new T.Vector3());
  const N = b.kind==='wall'||b.kind==='gate' ? 2 : G.gfx===0 ? 3 : 4, NY=N+1;
  const cx=size.x/N||1, cy=size.y/NY||1, cz=size.z/N||1, made=[];
  root.traverse(o=>{
    if(!o.isMesh || o.isInstancedMesh || !o.geometry || !o.geometry.attributes.position || !o.visible) return;
    let g=o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(o.matrixWorld);
    const P=g.attributes.position.array, Nn=g.attributes.normal&&g.attributes.normal.array, U=g.attributes.uv&&g.attributes.uv.array, C=g.attributes.color&&g.attributes.color.array;
    const bk=new Map();
    for(let t=0;t<P.length/9;t++){ const i=t*9, mx=(P[i]+P[i+3]+P[i+6])/3, my=(P[i+1]+P[i+4]+P[i+7])/3, mz=(P[i+2]+P[i+5]+P[i+8])/3;
      const key=Math.min(N-1,Math.floor((mx-box.min.x)/cx))+','+Math.min(NY-1,Math.floor((my-box.min.y)/cy))+','+Math.min(N-1,Math.floor((mz-box.min.z)/cz));
      let a=bk.get(key); if(!a){ a=[]; bk.set(key,a); } a.push(t); }
    const mat = Array.isArray(o.material) ? o.material[0] : o.material;
    for(const tris of bk.values()){
      const n=tris.length*3, pos=new Float32Array(n*3), nor=Nn?new Float32Array(n*3):null, uv=U?new Float32Array(n*2):null, col=C?new Float32Array(n*3):null;
      let sx=0,sy=0,sz=0;
      tris.forEach((t,j)=>{ for(let v=0;v<3;v++){ const si=t*3+v, di=j*3+v; pos[di*3]=P[si*3]; pos[di*3+1]=P[si*3+1]; pos[di*3+2]=P[si*3+2]; sx+=P[si*3]; sy+=P[si*3+1]; sz+=P[si*3+2];
        if(nor){ nor[di*3]=Nn[si*3]; nor[di*3+1]=Nn[si*3+1]; nor[di*3+2]=Nn[si*3+2]; } if(uv){ uv[di*2]=U[si*2]; uv[di*2+1]=U[si*2+1]; } if(col){ col[di*3]=C[si*3]; col[di*3+1]=C[si*3+1]; col[di*3+2]=C[si*3+2]; } } });
      sx/=n; sy/=n; sz/=n; let r=0;
      for(let k=0;k<n;k++){ pos[k*3]-=sx; pos[k*3+1]-=sy; pos[k*3+2]-=sz; r=Math.max(r, Math.abs(pos[k*3+1])); }
      const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.BufferAttribute(pos,3)); if(nor) geo.setAttribute('normal',new T.BufferAttribute(nor,3)); else geo.computeVertexNormals();
      if(uv) geo.setAttribute('uv',new T.BufferAttribute(uv,2)); if(col) geo.setAttribute('color',new T.BufferAttribute(col,3));
      const m=new T.Mesh(geo, mat); m.position.set(sx,sy,sz); m.castShadow=G.gfx>0; m.frustumCulled=true; G.scene.add(m);
      // Wucht: nach außen und oben, oben liegende Teile fliegen weiter; dazu zufälliges Drehen
      const dx=sx-ctr.x, dz=sz-ctr.z, dl=Math.hypot(dx,dz)||1, hgt=(sy-box.min.y)/(size.y||1), push=1.2+G.rand()*2.2+hgt*2;
      made.push({m, vx:dx/dl*push+(G.rand()-.5), vy:1+G.rand()*2.5+hgt*1.5, vz:dz/dl*push+(G.rand()-.5),
        wx:(G.rand()-.5)*6, wy:(G.rand()-.5)*4, wz:(G.rand()-.5)*6, r:Math.max(.08,Math.min(r,.6)), t:0, rest:false, delay:hgt*.25*G.rand()});
    }
    g.dispose();
  });
  DEBRIS.list.push(...made);
  while(DEBRIS.list.length>700){ const d=DEBRIS.list.shift(); G.scene.remove(d.m); d.m.geometry.dispose(); }
  // Staubwolke
  if(!DEBRIS.dmat){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'), gr=x.createRadialGradient(32,32,2,32,32,31); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.5,'rgba(255,255,255,.5)'); gr.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=gr; x.fillRect(0,0,64,64);
    DEBRIS.dmat=new T.SpriteMaterial({map:new T.CanvasTexture(c), color:0xa89478, transparent:true, opacity:.55, depthWrite:false}); }
  for(let i=0;i<(G.gfx===0?4:9);i++){ const sp=new T.Sprite(DEBRIS.dmat.clone()); const a=G.rand()*6.28, rr=G.rand()*b.size*.4; sp.position.set(ctr.x+Math.cos(a)*rr, box.min.y+.5+G.rand()*size.y*.4, ctr.z+Math.sin(a)*rr); sp.scale.setScalar(1.5); G.scene.add(sp); DEBRIS.dust.push({s:sp,t:0,vx:Math.cos(a)*.8,vz:Math.sin(a)*.8}); }
  G.scene.remove(root);
}
// Trümmer: liegen 8 s, sinken dann in 4 s in den Boden und werden kleiner
function updateDebris(dt){
  for(let i=DEBRIS.list.length-1;i>=0;i--){ const d=DEBRIS.list[i], m=d.m; d.t+=dt;
    if(d.t<d.delay) continue;
    if(!d.rest){
      d.vy-=9.8*dt; m.position.x+=d.vx*dt; m.position.y+=d.vy*dt; m.position.z+=d.vz*dt;
      m.rotation.x+=d.wx*dt; m.rotation.y+=d.wy*dt; m.rotation.z+=d.wz*dt;
      const gy=getH(m.position.x,m.position.z)+d.r*.45;
      if(m.position.y<gy){ m.position.y=gy;
        if(d.vy<-1.2){ d.vy=-d.vy*.28; d.vx*=.55; d.vz*=.55; d.wx*=.5; d.wy*=.5; d.wz*=.5; }   // aufschlagen und abprallen
        else { d.vy=0; d.vx*=.86; d.vz*=.86; d.wx*=.8; d.wz*=.8; d.wy*=.8; }                     // rutschen/rollen
        if(Math.hypot(d.vx,d.vz)<.12 && Math.abs(d.vy)<.2){ d.rest=true; d.restT=d.t; } }
    } else if(d.t-d.restT>8){ m.position.y-=dt*.35; m.scale.setScalar(Math.max(.05,1-(d.t-d.restT-8)/4)); if(d.t-d.restT>12){ G.scene.remove(m); m.geometry.dispose(); DEBRIS.list.splice(i,1); } }
  }
  for(let i=DEBRIS.dust.length-1;i>=0;i--){ const p=DEBRIS.dust[i]; p.t+=dt; const s=p.s; s.position.x+=p.vx*dt; s.position.z+=p.vz*dt; s.position.y+=dt*.4; s.scale.setScalar(1.5+p.t*1.6); s.material.opacity=.55*Math.max(0,1-p.t/3.5); if(p.t>3.5){ G.scene.remove(s); s.material.dispose(); DEBRIS.dust.splice(i,1); } }
}
function destroyBuilding(b){
  if(b.seg && b.kind!=='road') G.wallVer=(G.wallVer||0)+1;
  b.dead=true; b.hp=0; const i=G.builds.indexOf(b); if(i>=0) G.builds.splice(i,1);
  for(const k of b.cells) if(k>=0) G.grid[k]=0;
  const p=G.players[b.owner], d=BUILD[b.kind];
  if(b.built>=1 && d.pop) p.popCap=Math.max(0,p.popCap-popOf(b));
  if(b===p.tc) p.tc=G.builds.find(o=>o.owner===b.owner && o.kind==='tc' && o.built>=1) || null;
  if(b.kind==='tc'){ releaseRegion(b); buildBorders(); }
  if(G.selB===b){ G.selB=null; drawPanelSoon(); }
  b.ring.visible=false; removePiles(b); if(b.bar) G.scene.remove(b.bar); sfxAt('build',b.x,b.z,1); EE.sfx('place',.5);
  G.scene.remove(b.ring);
  if(b.kind==='road' || b.quietRemove) G.scene.remove(b.mesh); else { shatterBuilding(b); sfxAt('chop',b.x,b.z,1); }
  if(b.owner===0 && !b.quietRemove) EE.toast(d.name+' wurde zerstört');
  checkEnd();
}
function checkEnd(){
  if(G.over) return;
  const has = i => G.builds.some(b=>b.owner===i && b.kind!=='road') || G.units.some(u=>u.owner===i);
  if(!has(0)){ G.over=true; try{localStorage.removeItem(SAVE_KEY)}catch(e){} setTimeout(()=>{ EE.toast('Niederlage – dein Volk ist untergegangen'); EE.sfx('error'); }, 400); return; }
  for(let i=1;i<G.players.length;i++){ const p=G.players[i]; if(!p.out && !has(i)){ p.out=true; EE.toast(CN(p)+' '+cv(p,'ist','sind')+' besiegt!'); EE.sfx('fanfare',.8); } }
  if(G.players.slice(1).every(p=>p.out)){ G.over=true; try{localStorage.removeItem(SAVE_KEY)}catch(e){} setTimeout(()=>{ EE.toast('Sieg! Alle Gegner sind besiegt'); EE.sfx('fanfare'); }, 600); }
}
// KI: Kriegerhütte bauen, Krieger ausbilden, im Krieg angreifen
const swordSVG = () => '<svg viewBox="0 0 24 24"><path d="M5 4l10 10M19 4L9 14M7 13l-3 3 2 2 3-3M17 13l3 3-2 2-3-3" stroke="#e8b64a" stroke-width="2.2" stroke-linecap="round" fill="none"/></svg>';
const towerSVG = () => '<svg viewBox="0 0 24 24"><path d="M7 22l2-12h6l2 12M9 14h6M8.4 18h7.2" stroke="#a86d36" stroke-width="1.8" fill="none"/><rect x="6" y="6" width="12" height="4" fill="#c9a46a" stroke="#5a3818"/><path d="M8 6V3M16 6V3" stroke="#5a3818" stroke-width="1.6"/></svg>';
const hammerSVG = () => '<svg viewBox="0 0 24 24"><path d="M13.5 9.5l-9 9 2 2 9-9z" fill="#a8743e" stroke="#5a3818" stroke-width=".8"/><path d="M11 4.5l4-1.5 6 6-1.5 4-3-3-2.5 1-3-3 1-2.5z" fill="#b9c2cc" stroke="#4a525a" stroke-width=".9" stroke-linejoin="round"/></svg>';
const roadSVG = () => '<svg viewBox="0 0 24 24"><path d="M8 22L11 2h2l3 20z" fill="#b08a58"/><path d="M12 4v3M12 10v3M12 16v3" stroke="#f3e2b8" stroke-width="1.4"/><circle cx="6" cy="18" r="1.3" fill="#9aa3ad"/><circle cx="18" cy="9" r="1" fill="#9aa3ad"/></svg>';
const wallSVG = () => '<svg viewBox="0 0 24 24"><path d="M3 21V8l2-3 2 3v13M9 21V7l2-3 2 3v14M15 21V8l2-3 2 3v13" fill="#a86d36" stroke="#5a3818"/><path d="M2 12h20M2 17h20" stroke="#5a3818" stroke-width="1.6"/></svg>';
const hutSVG = () => '<svg viewBox="0 0 24 24"><path d="M12 3L3 18h18z" fill="#c9a46a"/><path d="M12 3L8 18h8z" fill="#8a5a2b"/></svg>';
const storeSVG = () => '<svg viewBox="0 0 24 24"><rect x="3" y="15" width="18" height="4" fill="#8a5a2b"/><rect x="4" y="10" width="7" height="5" rx="2" fill="#a86d36"/><rect x="12" y="11" width="8" height="4" rx="2" fill="#a86d36"/><path d="M8 10l2-4 3 3z" fill="#9aa3ad"/></svg>';

// Beim Abreißen gibt es 40 % der Baukosten zurück
function refundOf(b){ const c = b.wallT ? WT_COST : (BUILD[b.kind].cost||{}), out={}; for(const r in c) out[r]=Math.floor(c[r]*.4); return out; }
function action(a){
  if(a==='demolishAll'){ const bs=(G.selBs||[]).filter(o=>!o.dead && o.owner===0); if(!bs.length) return;
    if(!(G.multiDel && G.t-G.multiDel<3)){ G.multiDel=G.t; EE.click(); drawPanel(); setTimeout(()=>{ if(G && G.selBs) drawPanel(); },3100); return; }
    G.multiDel=0; const p0=G.players[0], back={};
    for(const o of bs){ const r=refundOf(o); for(const k in r){ back[k]=(back[k]||0)+r[k]; p0.res[k]+=r[k]; } }
    select([],null); for(const o of bs) destroyBuilding(o);
    EE.vib(30); EE.toast(bs.length+' Teile abgerissen – zurück: '+Object.keys(back).filter(k=>back[k]>0).map(k=>'+'+back[k]+' '+RES_DE[k]).join(' · ')); drawPanel(); updateHUD(); return; }
  if(a==='demolish'){ const b=G.selB; if(!b || b.owner!==0) return;
    if(!(b.delArm && G.t-b.delArm<3)){ b.delArm=G.t; EE.click(); drawPanel(); setTimeout(()=>{ if(G && G.selB===b) drawPanel(); },3100); return; }
    const back=refundOf(b), p0=G.players[0]; for(const r in back) p0.res[r]+=back[r];
    const txt=Object.keys(back).filter(r=>back[r]>0).map(r=>'+'+back[r]+' '+RES_DE[r]).join(' · ');
    G.selB=null; destroyBuilding(b); EE.vib(25); if(txt) EE.toast('Abgerissen – zurück: '+txt); drawPanel(); updateHUD(); return; }
  if(a==='wtowers'){ buildWallTowers(G.selB); return; }
  if(a==='wtower1'){ buildWallTowers(G.selB, true); return; }
  if(a==='follow'){ startFollow(G.sel[0]); return; }
  if(a.startsWith('sell-') || a.startsWith('buy-')){ const [op,r]=a.split('-'), pl=G.players[0], M=mkt();
    if(op==='sell'){ if(pl.res[r]<100){ EE.toast('Nicht genug '+RES_DE[r]); EE.sfx('error'); return; } const g=mktSell(r); pl.res[r]-=100; pl.res.gold+=g; M[r]=Math.max(.3,M[r]*.94); EE.toast('100 '+RES_DE[r]+' verkauft: +'+g+' Gold'); }
    else { const c=mktBuy(r); if(pl.res.gold<c){ EE.toast('Nicht genug Gold ('+c+' nötig)'); EE.sfx('error'); return; } pl.res.gold-=c; pl.res[r]+=100; M[r]=Math.min(3,M[r]*1.06); EE.toast('100 '+RES_DE[r]+' gekauft: −'+c+' Gold'); }
    EE.sfx('click'); updateHUD(); drawPanel(); return; }
  if(a==='pin'){ const ws=G.sel.filter(u=>u.owner===0 && !u.dead), on=!ws.every(u=>u.pin);
    for(const u of ws){ if(on){ u.auto=u.seek=false; u.state='idle'; u.path=null; u.target=null; u.site=null; } else { u.hold=false; u.post=null; } setPin(u,on); }
    EE.toast(on?'📌 Bleibt hier stehen':'📌 Aufgehoben'); EE.sfx('click'); drawPanelSoon(); return; }
  if(a==='form'){ G.formMenu=!G.formMenu; EE.click(); drawPanel(); return; }   // Formations-Auswahl auf- und zuklappen
  if(a.startsWith('fs-')){ G.form=a.slice(3); G.formMenu=false;
    const ss=G.sel.filter(u=>isSoldier(u) && u.owner===0 && !u.dead && !u.inside);
    if(ss.length>1){ const cx=ss.reduce((a,u)=>a+u.x,0)/ss.length, cz=ss.reduce((a,u)=>a+u.z,0)/ss.length; formationMove(ss, cx, cz); }
    EE.toast('Formation: '+FORMS.find(x=>x[0]===G.form)[1]); EE.sfx('click'); drawPanelSoon(); return; }
  if(a==='hutout'){ const b=G.selB; if(b) for(const u of G.units.filter(u=>u.inside===b && u.inHut)){ exitHut(u); u.lifeT=40; } EE.sfx('click'); drawPanelSoon(); return; }
  if(a==='explore'){ const us=G.sel.filter(u=>u.owner===0 && !u.dead && !u.inside && u.kind!=='ox' && u.ageSt!=='greis'); if(!us.length) return;
    const base=G.rand()*Math.PI*2;
    us.forEach((u,i)=>{ u.auto=u.seek=u.hold=false; u.post=null; u.target=null; u.site=null; u.expA=base+i*2.39996; u.expN=0; exploreNext(u); });   // jede Einheit eine eigene Richtung (goldener Winkel)
    EE.toast(us.length===1?'Erkundet die Welt – tippe einen Befehl, um ihn zurückzuholen':us.length+' Einheiten erkunden die Welt in alle Richtungen'); EE.sfx('confirm'); drawPanelSoon(); return; }
  if(a==='seek'){ const ss=G.sel.filter(u=>isSoldier(u) && u.owner===0 && !u.dead && !u.inside); let first=null;
    for(const u of ss){ const t=seekFoe(u); u.seek=!!t; u.auto=false; u.post=null; u.hold=false; if(u.pin) setPin(u,false); if(t){ cmdAttack(u,t); first=first||t; } }
    if(first){ iconMarker(first,'sword'); marker(first.x,first.z,0xff4444); EE.toast(ss.length+(ss.length===1?' Soldat sucht':' Soldaten suchen')+' Gegner'); } else EE.toast('Kein Gegner gefunden – du bist mit niemandem im Krieg');
    EE.sfx('click'); drawPanelSoon(); return; }
  if(a==='autowork'){ const n=smartWork(G.sel.filter(u=>u.kind==='worker' && u.owner===0 && !u.dead)); EE.toast(n?n+(n===1?' Bauer sucht':' Bauern suchen')+' sich selbst Arbeit':'Keine Arbeit in der Nähe gefunden'); EE.sfx('click'); drawPanelSoon(); return; }
  const p = G.players[0];
  EE.click();
  if(a==='worker'){
    const b = G.selB;
    if(b.queue.length>=5){ EE.toast('Warteschlange voll'); return; }
    if(!canPay(p,workerCost(0))){ EE.toast('Nicht genug Nahrung'); EE.sfx('error'); return; }
    pay(p,workerCost(0)); b.queue.push('worker'); EE.vib(15);
  } else if(a==='age'){ if(techCount(0)<AGE_NEED){ EE.toast('Erst '+AGE_NEED+' Forschungen in der Ältestenhütte – du hast '+techCount(0)); EE.sfx('error',.6); return; } if(G.era>=G.eraEnd){ EE.toast('Endepoche erreicht – dein Volk bleibt in dieser Epoche'); return; } EE.toast('Die Antike kommt bald – dein Volk ist bereit');
  } else if(a.startsWith('t-')){ const k=a.slice(2), b=G.selB, c=unitCost(0,k);
    if(b.queue.length>=5){ EE.toast('Warteschlange voll'); return; }
    if(!canPay(p,c)){ EE.toast('Nicht genug Rohstoffe'); EE.sfx('error'); return; }
    pay(p,c); b.queue.push(k); EE.vib(15);
  } else if(a==='bmenu'){ G.buildMenu=true;
  } else if(a==='bback'){ G.buildMenu=false;
  } else if(a.startsWith('rt-')){ G.resTab=a.slice(3); EE.click(); drawPanel();
  } else if(a.startsWith('r-')){ const k=a.slice(2), b=G.selB, T0=TECH[k];
    if(!b || !T0) return; if(p.tech && p.tech[k]){ EE.toast(T0.n+' ist schon erforscht'); return; }
    if(b.rk){ EE.toast('Hier wird schon geforscht: '+TECH[b.rk].n); return; }
    if(!canPay(p,T0.cost)){ EE.sfx('error'); EE.toast(T0.n+': '+missingTxt(p,T0.cost)); return; }
    pay(p,T0.cost); b.rk=k; b.rp=0; EE.sfx('confirm'); EE.vib(15); updateHUD(); drawPanel();
  } else if(a==='elderin'){ elderIn(G.selB); drawPanel();
  } else if(a==='elderout'){ helpersOut(G.selB); drawPanel();
  } else if(a==='helpin'){ helperIn(G.selB); drawPanel();
  } else if(a==='helpout'){ helpersOut(G.selB); drawPanel();
  } else if(a==='crewin'){ const b=G.selB, free=TOWER_MAX-crew(b).length-G.units.filter(u=>u.state==='garrison'&&u.site===b).length;
    if(free<=0){ EE.toast('Der Wachturm ist voll'); return; }
    const s=G.units.filter(u=>u.owner===0 && isSoldier(u) && !u.inside && !u.dead && u.state!=='garrison').sort((p,q)=>(p.state==='idle'?0:50)+Math.hypot(p.x-b.x,p.z-b.z)-(q.state==='idle'?0:50)-Math.hypot(q.x-b.x,q.z-b.z)).slice(0,free);
    if(!s.length){ EE.toast('Keine Krieger frei – bilde welche in der Kriegerhütte aus'); return; }
    s.forEach(u=>cmdGarrison(u,b)); EE.toast(s.length+' Krieger '+(s.length>1?'gehen':'geht')+' in den Wachturm');
  } else if(a==='crewout'){ crewOut(G.selB); drawPanel();
  } else if(a==='togate'){ const w=G.selB; if(!canPay(p,BUILD.gate.cost)){ EE.sfx('error'); EE.toast('Tor: '+missingTxt(p,BUILD.gate.cost)); return; }
    // Breites Tor: das angetippte Stück und seine Nachbarn werden zu EINEM Tor (Steinzeit ca. 5 m, später breiter für Panzer)
    const parts=gateParts(w);
    pay(p,BUILD.gate.cost);
    const ks=[], a0=w.seg.ang||0; let sx=0, sz=0, len=0;
    for(const q of parts){ q.seg.ks.forEach(k=>ks.push(k)); sx+=q.x; sz+=q.z; len+=q.seg.len||1; q.quietRemove=true; destroyBuilding(q); G.scene.remove(q.ring); }
    const g=addWall(0, {ks:[...new Set(ks)], x:sx/parts.length, z:sz/parts.length, len, gate:true}, a0, w.wallId, false);
    G.units.filter(u=>u.owner===0 && u.kind==='worker' && !u.inside && !u.dead).sort((a,b)=>Math.hypot(a.x-g.x,a.z-g.z)-Math.hypot(b.x-g.x,b.z-g.z)).slice(0,2).forEach(u=>cmdBuild(u,g));
    G.selB=null; EE.toast('Tor wird gebaut'); EE.sfx('place');
  } else if(a==='b-tc'){ if(!canPay(p,BUILD.tc.cost)){ EE.sfx('error'); EE.toast('Stadtzentrum: '+missingTxt(p,BUILD.tc.cost)); return; } startPlace('tc');
  } else if(a==='b-wall'){ startWall('wall');
  } else if(a==='b-road'){ startWall('road');
  } else if(a==='dip'){ openDip('rel');
  } else if(a.startsWith('b-')){
    const kind = a.slice(2);
    if(!canPay(p,BUILD[kind].cost)){ EE.sfx('error'); EE.toast(BUILD[kind].name+': '+missingTxt(p,BUILD[kind].cost)); return; }
    startPlace(kind);
  }
  updateHUD(); drawPanel();
}

/* ============================================================
   DIPLOMATIE & HANDEL (wie in Empire Earth 2): Bündnis, Neutral, Krieg, Tribut, Rohstoffhandel
   Neutrale und verbündete Völker greifen nicht an.
   ============================================================ */
const DIP_DE = {ally:'Verbündet', neutral:'Neutral', enemy:'Krieg'}, DIP_IC = {ally:'🤝', neutral:'🕊️', enemy:'⚔️'};
const RES_VAL = {food:1, wood:1, stone:1.3, gold:2};
const dipSVG = () => '<svg viewBox="0 0 24 24"><path d="M2 11l4-4 4 2 3-2 4 1 5 4-3 3-2-1-4 4q-1 1-2 0l-6-5z" fill="#e8b64a"/><path d="M9 13l2 2M11 11l3 3M13 10l3 3" stroke="#7a4a12" stroke-width="1.3" stroke-linecap="round"/></svg>';
function initDip(){
  G.dip = {};
  for(let i=1;i<G.players.length;i++) G.dip[i] = {state:'enemy', mood:Math.round((G.rand()-.5)*40), ask:120+G.rand()*200, hard:G.rand()<.3, greed:.6+G.rand()*1.2};   // greed: jedes Volk verhandelt anders (gierig oder genügsam)   // hard = unversöhnlich: im Krieg kein Bündnis, auch nicht für Gold
  G.dipUI = {tab:'rel', who:1, give:'wood', get:'gold', amt:100};
}
const hostile = (a,b) => { if(a===b) return false; const o=a===0?b:b===0?a:-1; if(o<0) return true; return G.dip[o].state==='enemy'; };
function setDip(i, st, quiet){
  const d=G.dip[i], p=G.players[i];
  d.state=st;
  if(!quiet){ EE.toast(NM(p)+': '+(st==='ally'?'Wir sind jetzt Verbündete!':st==='neutral'?'Frieden – wir lassen uns in Ruhe.':'Krieg!')); EE.sfx(st==='enemy'?'error':'done', .8); }
  if(G.dipOpen) renderDip();
}
function propose(i, st){
  const d=G.dip[i], p=G.players[i]; EE.click();
  if(st===d.state) return;
  if(st==='enemy'){ d.mood=Math.max(-100,d.mood-40); setDip(i,'enemy'); return; }
  if(d.hard && d.state==='enemy' && st==='ally'){ d.mood=Math.max(-100,d.mood-5); G.dipUI.bribe=null;
    EE.toast(CN(p)+' '+cv(p,'ist','sind')+' unversöhnlich – kein Bündnis, auch nicht für Gold'); EE.sfx('error',.6); if(G.dipOpen) renderDip(); return; }
  const need = dipNeed(d.state, st);
  const bonus = (G.rand()-.5)*14;
  if(d.mood+bonus >= need){ d.mood=Math.min(100,d.mood+5); setDip(i,st); }
  else { d.mood=Math.max(-100,d.mood-3); EE.sfx('error',.6);
    // Bestechung: sie nennen einen Preis in Gold, für den sie doch zustimmen
    G.dipUI.bribe = {i, st, cost: bribeCost(i, st)};
    if(!G.dipOpen) openDip('rel'); else renderDip(); }
}
// Neutrale nehmen Freundschaft schnell und billig an, Kriegsgegner wollen viel mehr
function dipNeed(from, to){ return from==='enemy' ? (to==='ally' ? 60 : 5) : (to==='ally' ? 15 : -10); }
function bribeCost(i, st){
  const d=G.dip[i], war = d.state==='enemy';
  const gap = Math.max(0, dipNeed(d.state, st) + 10 - d.mood);
  // reiche Völker lassen sich schwer kaufen, arme sind billig; dazu der eigene Charakter (greed)
  const rich = 1 + Math.min(2, (G.players[i].res.gold||0)/800);
  const c = (war ? 150 + gap*6 : 40 + gap*2) * (d.greed||1) * rich;
  return Math.ceil(c/RES_VAL.gold/10)*10;
}
function payBribe(){
  const B=G.dipUI.bribe; if(!B) return;
  const me=G.players[0], p=G.players[B.i], d=G.dip[B.i];
  if(me.res.gold < B.cost){ EE.sfx('error'); EE.toast('Nicht genug Gold – dir fehlen '+Math.ceil(B.cost-me.res.gold)); return; }
  me.res.gold -= B.cost; p.res.gold += B.cost;
  G.dipUI.bribe=null;
  d.mood = Math.min(100, Math.max(d.mood, dipNeed(d.state,B.st)) + 12);
  EE.toast(CN(p)+' '+cv(p,'nimmt','nehmen')+' das Gold an 💰'); setDip(B.i, B.st); updateHUD(); renderDip();
}
function sendTribute(i, res, amt){
  const me=G.players[0], p=G.players[i], d=G.dip[i]; EE.click();
  if(me.res[res]<amt){ EE.toast('Nicht genug '+RES_DE[res]); EE.sfx('error'); return; }
  me.res[res]-=amt; p.res[res]+=amt;
  d.mood = Math.min(100, d.mood + Math.round(amt*RES_VAL[res]/6));
  EE.toast(amt+' '+RES_DE[res]+' an '+cn(p,2)+' geschickt – Stimmung steigt'); EE.sfx('confirm');
  updateHUD(); renderDip();
}
// Verbündete um Rohstoffe bitten: hängt vom Charakter ab (großzügig, normal, geizig) und davon, was sie selbst übrig haben
const GEN_DE = g => g>.66 ? 'großzügig' : g<.3 ? 'geizig' : 'normal';
function genOf(i){ const d=G.dip[i]; if(d.gen==null) d.gen = ((Math.sin((G.seed|0)*.013+i*12.9898)*43758.5453)%1+1)%1; return d.gen; }
function askTribute(i, res, amt){
  const me=G.players[0], p=G.players[i], d=G.dip[i], gen=genOf(i); EE.click();
  if(d.state==='enemy'){ EE.toast(CN(p)+' '+cv(p,'lacht','lachen')+' nur – ihr seid im Krieg'); EE.sfx('error',.6); return; }
  if(d.askT && G.t-d.askT<60){ EE.toast(NM(p)+': „Ihr habt doch gerade erst gefragt!“'); EE.sfx('error',.6); return; }
  d.askT=G.t;
  const keep = 150 + (1-gen)*350, spare = Math.max(0, Math.floor(p.res[res]-keep));
  const willing = (d.state==='ally' ? .25 : -.2) + gen*.7 + d.mood/250;
  if(gen<.3 && G.rand() > willing){ d.mood=Math.max(-100,d.mood-3); EE.toast(CN(p)+' '+cv(p,'ist geizig und gibt','sind geizig und geben')+' nichts'); EE.sfx('error',.6); }
  else if(spare<=0){ EE.toast(NM(p)+': „Wir haben selbst kaum '+RES_DE[res]+'.“'); EE.sfx('error',.6); }
  else if(G.rand() > willing){ d.mood=Math.max(-100,d.mood-4); EE.toast(CN(p)+' '+cv(p,'lehnt','lehnen')+' ab'); EE.sfx('error',.6); }
  else { const give=Math.min(amt, spare, Math.round(amt*(gen>.66?1:gen<.3?.4:.75))); p.res[res]-=give; me.res[res]+=give; d.mood=Math.max(-100,d.mood-(give>=amt?6:3));
    EE.toast(give>=amt ? CN(p)+' '+cv(p,'schickt','schicken')+' dir '+give+' '+RES_DE[res] : CN(p)+' '+cv(p,'kann','können')+' nur '+give+' '+RES_DE[res]+' entbehren'); EE.sfx('confirm'); }
  updateHUD(); renderDip();
}
function demandTribute(i, res, amt){
  const me=G.players[0], p=G.players[i], d=G.dip[i]; EE.click();
  const weaker = p.pop < me.pop*.9 || d.state==='ally';
  if(weaker && d.mood > -25 && p.res[res]>=amt){ p.res[res]-=amt; me.res[res]+=amt; d.mood=Math.max(-100,d.mood-22); EE.toast(CN(p)+' '+cv(p,'zahlt','zahlen')+' '+amt+' '+RES_DE[res]+' – aber sie sind verärgert'); EE.sfx('confirm'); }
  else { d.mood=Math.max(-100,d.mood-12); EE.toast(CN(p)+' '+cv(p,'weigert','weigern')+' sich zu zahlen'); EE.sfx('error',.6); }
  updateHUD(); renderDip();
}
function tradeQuote(i, give, get, amt){
  const d=G.dip[i]; if(give===get) return 0;
  const fair = amt*RES_VAL[give]/RES_VAL[get];
  const rate = (d.state==='ally'?.9:.75) * (1 + d.mood/500);
  return Math.max(0, Math.floor(fair*rate));
}
function doTrade(i, give, get, amt){
  const me=G.players[0], p=G.players[i], d=G.dip[i]; EE.click();
  if(d.state==='enemy'){ EE.toast('Mit Feinden kann man nicht handeln'); EE.sfx('error'); return; }
  if(d.mood < -30){ EE.toast(CN(p)+' '+cv(p,'will','wollen')+' gerade nicht mit dir handeln'); EE.sfx('error'); return; }
  const q = tradeQuote(i,give,get,amt);
  if(me.res[give]<amt){ EE.toast('Nicht genug '+RES_DE[give]); EE.sfx('error'); return; }
  if(p.res[get]<q){ EE.toast(CN(p)+' '+cv(p,'hat','haben')+' nur '+Math.floor(p.res[get])+' '+RES_DE[get]); EE.sfx('error'); return; }
  me.res[give]-=amt; p.res[give]+=amt; me.res[get]+=q; p.res[get]-=q; d.mood=Math.min(100,d.mood+2);
  EE.toast('Handel: '+amt+' '+RES_DE[give]+' gegen '+q+' '+RES_DE[get]); EE.sfx('confirm');
  updateHUD(); renderDip();
}
function openDip(tab){ G.dipOpen=true; G.dipUI.tab=tab||G.dipUI.tab; G.paused=true; $('#dip').classList.remove('hidden'); renderDip(); }
function closeDip(){ G.dipOpen=false; G.paused=false; $('#dip').classList.add('hidden'); EE.click(); }
function moodTxt(m){ return m>=50?'freundlich':m>=15?'wohlgesonnen':m>-15?'zurückhaltend':m>-50?'misstrauisch':'feindselig'; }
// Kleine Flagge wie bei der Volksauswahl (Steinzeit: Fellbanner, Antike–Neuzeit: altes Reich, danach heutige Flagge)
function dipFlag(p){ if(!window.EE_FLAG) return ''; const e=(G.era|0);
  return `<svg class="dflag" viewBox="0 0 30 36">${window.EE_FLAG(p.civ, e, 'd'+p.id)}</svg>`; }
// damit man sich merkt, wer wer ist: „→ Türkei“ (das heutige Land)
function laterName(p){ return (G.era|0)>=4 ? '' : `<em class="later">später ${p.civ[0]}</em>`; }
function renderDip(){
  const el=$('#dipBody'); if(!el || !G.dipOpen) return;
  const U=G.dipUI, me=G.players[0];
  $$('#dip .dtab').forEach(b=>b.classList.toggle('on', b.dataset.t===U.tab));
  const col=i=>'#'+COLORS[i].toString(16).padStart(6,'0');
  const civBtns = (onlyPeace)=> G.players.slice(1).map(p=>`<button class="dciv${U.who===p.id?' on':''}${onlyPeace&&G.dip[p.id].state==='enemy'?' off':''}" data-w="${p.id}"><i style="background:${col(p.id)}"></i>${NM(p)}</button>`).join('');
  const resBtns = (k)=> RES.map(r=>`<button class="dres${U[k]===r?' on':''}" data-${k}="${r}">${ICON[r]}<span>${RES_DE[r]}</span></button>`).join('');
  const amtBtns = [100,500,1000,5000].map(a=>`<button class="damt${U.amt===a?' on':''}" data-amt="${a}">${a}</button>`).join('');
  let h='';
  if(U.tab==='rel'){
    const B=U.bribe;
    if(B && G.dip[B.i].state!==B.st){ const bp=G.players[B.i], ok=me.res.gold>=B.cost;
      h += `<div class="dbribe"><i style="background:${col(B.i)}"></i><span><b>${CN(bp)}</b> ${cv(bp,'lehnt','lehnen')} ${B.st==='ally'?'das Bündnis':'den Frieden'} ab – für <b class="${ok?'ok':'miss'}">${ICON.gold} ${B.cost} Gold</b> stimmen sie zu.</span><button class="btn small" id="dBrNo">Nein</button><button class="btn main small" id="dBrYes">Bestechen</button></div>`; }
    else { U.bribe=null; h += `<p class="dnote">Lehnen sie ab, hilft Gold: Neutrale billig, Kriegsgegner teuer, ⚔ unversöhnlich = nie.</p>`; }
    h += `<div class="drows${G.players.length>17?' three':G.players.length>7?' two':''}">`;
    for(const p of G.players.slice(1)){ const d=G.dip[p.id];
      h += `<div class="drow st-${d.state}"><i style="background:${col(p.id)}"></i>${dipFlag(p)}<div class="dn"><b>${NM(p)}${d.hard&&d.state==='enemy'?' <em class="hard" title="unversöhnlich">⚔</em>':''}</b><span class="dsub">${laterName(p)}<span class="mood" title="${d.hard&&d.state==='enemy'?'unversöhnlich':moodTxt(d.mood)}"><s style="width:${(d.mood+100)/2}%"></s></span></span></div>
        <div class="dst">${['ally','neutral','enemy'].map(s=>`<button class="${s}${d.state===s?' on':''}" data-p="${p.id}" data-s="${s}"><span>${DIP_IC[s]}</span>${DIP_DE[s]}</button>`).join('')}</div></div>`; }
    h += `</div>`;
  } else if(U.tab==='trade'){
    const q = tradeQuote(U.who,U.give,U.get,U.amt), p=G.players[U.who], d=G.dip[U.who];
    h += `<div class="dlab">Handelspartner</div><div class="dline">${civBtns(true)}</div>
      <div class="dlab">Du gibst</div><div class="dline">${resBtns('give')}</div>
      <div class="dlab">Du bekommst</div><div class="dline">${resBtns('get')}</div>
      <div class="dlab">Menge</div><div class="dline">${amtBtns}</div>
      <div class="deal">${d.state==='enemy'?'Mit Feinden wird nicht gehandelt – schließe erst Frieden.':U.give===U.get?'Wähle zwei verschiedene Rohstoffe.':`${U.amt} ${RES_DE[U.give]} → <b>${q} ${RES_DE[U.get]}</b> <small>(${CN(p)} ${cv(p,"hat","haben")} ${Math.floor(p.res[U.get])})</small>`}
      <button class="btn main small" id="dTrade"${d.state==='enemy'||U.give===U.get?' disabled':''}>Handeln</button></div>`;
  } else if(U.tab==='war'){
    const allies=G.players.slice(1).filter(p=>G.dip[p.id].state==='ally'), foes=G.players.slice(1).filter(p=>G.dip[p.id].state==='enemy');
    if(!allies.length) h += `<p class="dnote">Du hast noch keine Verbündeten. Schließe unter „Beziehungen“ ein Bündnis – dann kannst du hier gemeinsame Angriffe planen und Hilfe anfordern.</p>`;
    else { if(!allies.some(p=>p.id===U.ally)) U.ally=allies[0].id; if(!foes.some(p=>p.id===U.foe)) U.foe=foes[0]?foes[0].id:null;
      const a=G.players[U.ally], aS=G.units.filter(u=>u.owner===a.id && isSoldier(u) && !u.dead).length;
      h += `<div class="dlab">Verbündeter</div><div class="dline">${allies.map(p=>`<button class="dciv${U.ally===p.id?' on':''}" data-al="${p.id}"><i style="background:${col(p.id)}"></i>${NM(p)}</button>`).join('')}</div>`;
      h += `<div class="dlab">Angriffsziel</div><div class="dline">${foes.length?foes.map(p=>`<button class="dciv${U.foe===p.id?' on':''}" data-fo="${p.id}"><i style="background:${col(p.id)}"></i>${NM(p)}</button>`).join(''):'<small>Du bist mit niemandem im Krieg.</small>'}</div>`;
      h += `<div class="deal">${NM(a)}: ${aS} Krieger · ${moodTxt(G.dip[a.id].mood)}${a.helpT>G.t?' · hilft dir gerade':''}${a.joint?' · greift gerade an':''}
        <button class="btn small" id="dHelp">Hilfe anfordern</button><button class="btn main small" id="dPlan"${U.foe==null?' disabled':''}>Angriff planen</button></div>`; }
  } else {
    const p=G.players[U.who];
    h += `<div class="dlab">Land</div><div class="dline">${civBtns(false)}</div>
      <div class="dlab">Rohstoff</div><div class="dline">${resBtns('give')}</div>
      <div class="dlab">Menge</div><div class="dline">${amtBtns}</div>
      <div class="deal">Du hast ${Math.floor(me.res[U.give])} ${RES_DE[U.give]} · ${NM(p)}: ${moodTxt(G.dip[U.who].mood)}, ${GEN_DE(genOf(U.who))}
      <button class="btn small" id="dAsk">Bitten</button><button class="btn small" id="dDemand">Fordern</button><button class="btn main small" id="dSend">Schenken</button></div>`;
  }
  el.innerHTML=h; el.parentElement.classList.toggle('many', G.players.length>10);
  el.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>propose(+b.dataset.p, b.dataset.s));
  el.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{ EE.click(); U.who=+b.dataset.w; renderDip(); });
  el.querySelectorAll('[data-give]').forEach(b=>b.onclick=()=>{ EE.click(); U.give=b.dataset.give; renderDip(); });
  el.querySelectorAll('[data-get]').forEach(b=>b.onclick=()=>{ EE.click(); U.get=b.dataset.get; renderDip(); });
  el.querySelectorAll('[data-amt]').forEach(b=>b.onclick=()=>{ EE.click(); U.amt=+b.dataset.amt; renderDip(); });
  const t=$('#dTrade'); if(t) t.onclick=()=>doTrade(U.who,U.give,U.get,U.amt);
  const s=$('#dSend'); if(s) s.onclick=()=>sendTribute(U.who,U.give,U.amt);
  const dm=$('#dDemand'); if(dm) dm.onclick=()=>demandTribute(U.who,U.give,U.amt);
  const da=$('#dAsk'); if(da) da.onclick=()=>askTribute(U.who,U.give,U.amt);
  el.querySelectorAll('[data-al]').forEach(b=>b.onclick=()=>{ EE.click(); U.ally=+b.dataset.al; renderDip(); });
  el.querySelectorAll('[data-fo]').forEach(b=>b.onclick=()=>{ EE.click(); U.foe=+b.dataset.fo; renderDip(); });
  const dh=$('#dHelp'); if(dh) dh.onclick=()=>askAllyHelp(U.ally);
  const dp=$('#dPlan'); if(dp) dp.onclick=()=>planJointAttack(U.ally, U.foe);
  const by=$('#dBrYes'); if(by) by.onclick=()=>payBribe();
  const bn=$('#dBrNo'); if(bn) bn.onclick=()=>{ EE.click(); U.bribe=null; renderDip(); };
}
// Stimmung ändert sich langsam; freundliche Völker bieten von selbst ein Bündnis an
function updateDip(dt){
  if(!G.dip) return;
  for(const k in G.dip){ const d=G.dip[k];
    d.mood += dt*(d.state==='ally'?.08:d.state==='enemy'?-.04:.02) - d.mood*dt*.002;
    d.mood = clamp(d.mood,-100,100);
    d.ask -= dt;
    if(d.ask<=0){ d.ask = 150+G.rand()*200;
      const p=G.players[k], me=G.players[0], st=d.state==='enemy'?'neutral':'ally';
      if(G.offer || d.state==='ally' || (d.hard && d.state==='enemy')) continue;
      if(d.mood>(d.state==='enemy'?5:30)) showOffer(+k, st);
      // reiches Volk will Freundschaft und legt Gold drauf
      else if(p.res.gold>600 && G.rand()<.5){ const g=Math.round(p.res.gold*(.08+G.rand()*.12)/10)*10; showOffer(+k, st, g); }
      // armes Volk will Freundschaft gegen Gold von dir
      else if(p.res.gold<120 && me.res.gold>300 && G.rand()<.35){ const g=Math.round(Math.min(me.res.gold*.2, 80+120*(d.greed||1))/10)*10; showOffer(+k, st, -g); } }
  }
}
/* ---------- Kriegsplan mit Verbündeten ----------
   Hilfe anfordern: der Verbündete schickt einen Teil seiner Krieger zu deinem Stadtzentrum; sie kämpfen dort ~3 Minuten mit und ziehen dann heim.
   Angriff planen: der Verbündete greift dein Ziel mit an (gemeinsame Welle). Ob er mitmacht, hängt von Stimmung und Stärke ab. */
function allySoldiers(a){ return G.units.filter(u=>u.owner===a && isSoldier(u) && !u.dead && !u.inside && !u.wave); }
function askAllyHelp(i){
  const p=G.players[i], d=G.dip[i]; if(!p || d.state!=='ally'){ EE.toast('Nur Verbündete helfen'); return; }
  if(p.helpT>G.t){ EE.toast(CN(p)+' '+cv(p,'hilft','helfen')+' dir schon'); return; }
  const ss=allySoldiers(i), give=Math.floor(ss.length*(d.mood>=50?.6:d.mood>=15?.45:.3));
  if(give<1 || d.mood<-10){ EE.toast(NM(p)+': „Wir können gerade niemanden entbehren.“'); EE.sfx('error',.5); d.ask=Math.max(d.ask,60); renderDip(); return; }
  const me=G.players[0].tc; if(!me) return;
  const t=(G.alarmAt && G.t-G.alarmAt.t<40) ? G.alarmAt : me;   // dorthin, wo du gerade angegriffen wirst – sonst zum Stadtzentrum
  for(const s of ss.slice(0,give)){ s.help=true; cmdMove(s, t.x+(G.rand()-.5)*10, t.z+(G.rand()-.5)*10); }
  p.helpT=G.t+180; d.mood=Math.max(-100,d.mood-4);
  EE.toast(NM(p)+': „Wir schicken '+give+' Krieger zu dir!“'); EE.sfx('confirm'); EE.vib(25); marker(t.x,t.z,0x62e06a); renderDip();
}
function planJointAttack(i, vs){
  const p=G.players[i], d=G.dip[i], X=G.players[vs]; if(!p || !X || d.state!=='ally') return;
  if(p.joint){ EE.toast(CN(p)+' '+cv(p,'greift','greifen')+' schon '+cn(G.players[p.joint.vs],2)+' an'); return; }
  const ss=allySoldiers(i), xs=G.units.filter(u=>u.owner===vs && isSoldier(u) && !u.dead).length;
  if(G.dip[vs] && G.dipAI && G.dipAI[i] && G.dipAI[i][vs]==='ally'){ EE.toast(NM(p)+': „'+NM(X)+' ist unser Freund – da machen wir nicht mit.“'); return; }
  if(ss.length<3 || d.mood<15 || ss.length<xs*.35){ EE.toast(NM(p)+': „'+(ss.length<3||ss.length<xs*.35?'Wir sind zu schwach für diesen Krieg.':'Dafür vertrauen wir dir noch nicht genug.')+'“'); EE.sfx('error',.5); return; }
  p.joint={vs}; p.waveT=0; p.helpT=0; d.mood=Math.min(100,d.mood+5);
  if(X.tc) marker(X.tc.x,X.tc.z,0xff4444);
  EE.toast(NM(p)+': „Abgemacht – wir greifen '+cn(X,2)+' an!“ Schick deine Krieger dazu.'); EE.sfx('fanfare',.6); EE.vib(40); closeDip();
}
// Helfer-Krieger: bei dir kämpfen, nach der Zeit heimkehren
function updateAllyHelp(p, soldiers, tc){
  for(const s of soldiers){ if(!s.help) continue;
    if(!(p.helpT>G.t)){ s.help=false; if(tc) cmdMove(s, tc.x+(G.rand()-.5)*8, tc.z+(G.rand()-.5)*8); continue; }
    if(s.state==='attack' && alive(s.target)) continue;
    const f=nearestFoe(s, 18); if(f && hostile(0,f.owner)) cmdAttack(s,f); }
  if(p.helpT && p.helpT<=G.t && p.helpT>G.t-2 && p.id!==0){ p.helpT=0; EE.toast(NM(p)+': „Unsere Krieger ziehen wieder heim.“'); }
}
// Nächstes Erkundungsziel: 45–80 m weiter in die eigene Richtung, Richtung schwankt leicht; Wasser/Rand → abbiegen
function exploreNext(u){
  const hx=G.NX/2-4, hz=G.NZ/2-4;
  for(let k=0;k<12;k++){ u.expA += (G.rand()-.5)*(k?1.6:.5); const d=45+G.rand()*35;
    let x=u.x+Math.cos(u.expA)*d, z=u.z+Math.sin(u.expA)*d;
    if(x<-hx||x>hx){ u.expA=Math.PI-u.expA; continue; } if(z<-hz||z>hz){ u.expA=-u.expA; continue; }
    if(getH(x,z)<WATER_Y+.25 || G.grid[cellIdx(x,z)]){ continue; }
    u.state='explore'; u.goal=null; moveTo(u,x,z); u.expN=(u.expN||0)+1; return; }
  u.expA+=Math.PI; u.state='explore'; moveTo(u,u.x+Math.cos(u.expA)*30,u.z+Math.sin(u.expA)*30);
}
// Allgemeine Anfrage eines Volkes oben im Bild (Hilfe, gemeinsamer Angriff …)
function showAsk(i, text, yesLabel, onYes, onNo){
  const p=G.players[i]; G.offer={i,st:'ask'};
  const el=$('#offer'); el.innerHTML=`<span><i style="background:#${COLORS[i].toString(16).padStart(6,'0')}"></i>${text}</span><button class="pb no" id="oNo">✕</button><button class="pb ok" id="oYes" style="width:auto;padding:0 10px">${yesLabel}</button>`;
  el.classList.remove('hidden'); EE.sfx('fanfare',.5); EE.vib(30);
  const done=(yes)=>{ el.classList.add('hidden'); G.offer=null; EE.click(); if(yes) onYes(); else onNo(); };
  $('#oYes').onclick=()=>done(true); $('#oNo').onclick=()=>done(false);
  clearTimeout(G.offerT); G.offerT=setTimeout(()=>{ if(G && G.offer) done(false); }, 25000);
}
// Eigene freie Krieger zu Verbündeten schicken: sie greifen das Ziel an und suchen danach weitere Feinde in der Nähe
function sendMyArmy(target){
  const ss=G.units.filter(u=>u.owner===0 && isSoldier(u) && !u.dead && !u.inside && !u.pin && u.state!=='garrison');
  for(const u of ss){ u.seek=true; u.hold=false; u.post=null; u.auto=false; cmdAttack(u, target); }
  return ss.length;
}
// Verbündete bitten um Hilfe, wenn sie angegriffen werden, und schlagen gemeinsame Angriffe vor
function allyRequests(p, soldiers, tc, threat){
  const d=G.dip[p.id]; if(G.offer) return;
  if(threat && (!p.helpT || G.t-p.helpT>150)){ p.helpT=G.t;
    showAsk(p.id, `${CN(p)} ${cv(p,'wird','werden')} angegriffen! Schickst du Krieger?`, '⚔ Krieger schicken',
      ()=>{ const n=sendMyArmy(threat); d.mood=Math.min(100,d.mood+(n?15:2)); EE.toast(n? n+' Krieger ziehen '+cn(p,1)+' zu Hilfe' : 'Du hast keine Krieger – bilde welche in der Kriegerhütte aus'); },
      ()=>{ d.mood=Math.max(-100,d.mood-10); EE.toast(CN(p)+' '+cv(p,'ist','sind')+' enttäuscht'); });
    return; }
  p.jointT=(p.jointT ?? 300+G.rand()*300)-1.5;
  if(p.jointT<=0 && !p.joint && soldiers.length>=5){ p.jointT=400+G.rand()*300;
    const foes=G.players.filter(o=>o.id!==0 && o.id!==p.id && G.dip[o.id].state==='enemy' && o.tc && !o.tc.dead); if(!foes.length) return;
    const X=foes.sort((a,b)=>Math.hypot(a.tc.x-tc.x,a.tc.z-tc.z)-Math.hypot(b.tc.x-tc.x,b.tc.z-tc.z))[0];
    showAsk(p.id, `${NM(p)}: „Wir greifen ${cn(X,2)} an – bist du dabei?“`, '⚔ Ja, Krieger mitschicken',
      ()=>{ p.joint={vs:X.id}; p.waveT=0; const n=sendMyArmy(X.tc); d.mood=Math.min(100,d.mood+12); EE.toast(n? n+' Krieger ziehen mit '+cn(p,1)+' gegen '+cn(X,2) : CN(p)+' '+cv(p,'greift','greifen')+' allein an – du hast keine Krieger'); },
      ()=>{ d.mood=Math.max(-100,d.mood-6); EE.toast(CN(p)+' '+cv(p,'greift','greifen')+' ohne dich an'); p.joint={vs:X.id}; p.waveT=0; });
  }
}
function showOffer(i, st, gold){
  const p=G.players[i]; G.offer={i,st}; gold=gold|0;
  const el=$('#offer'); el.innerHTML=`<span><i style="background:#${COLORS[i].toString(16).padStart(6,'0')}"></i>${CN(p)} ${cv(p,'bietet','bieten')} ${st==='ally'?'ein Bündnis':'Frieden'} an${gold>0?` <b class="og">+${gold} Gold für dich</b>`:gold<0?` <b class="og ask">– ${cv(p,'will','wollen')} ${-gold} Gold</b>`:''}</span><button class="pb no" id="oNo">✕</button><button class="pb ok" id="oYes">✓</button>`;
  el.classList.remove('hidden'); EE.sfx('fanfare',.5);
  const done=(yes)=>{ el.classList.add('hidden'); G.offer=null;
    if(yes){ const me=G.players[0];
      if(gold<0 && me.res.gold < -gold){ EE.sfx('error'); EE.toast('Nicht genug Gold für dieses Angebot'); G.dip[i].mood-=4; return; }
      if(gold){ me.res.gold+=gold; p.res.gold=Math.max(0,p.res.gold-gold); updateHUD(); }
      setDip(i,st); G.dip[i].mood=Math.min(100,G.dip[i].mood+10); }
    else { G.dip[i].mood-=8; EE.click(); } };
  $('#oYes').onclick=()=>done(true); $('#oNo').onclick=()=>done(false);
  clearTimeout(G.offerT); G.offerT=setTimeout(()=>{ if(G && G.offer) done(false); }, 25000);
}

/* ============================================================
   RENDERER & KAMERA
   ============================================================ */
function initRenderer(){
  const c = $('#gc');
  const r = new T.WebGLRenderer({canvas:c, antialias:G.gfx>=1, powerPreference:'high-performance'});
  r.setPixelRatio(gfxPR(G.gfx));
  r.shadowMap.enabled = G.gfx>=1;
  r.shadowMap.type = T.PCFSoftShadowMap; r.shadowMap.autoUpdate = false;
  r.outputColorSpace = T.SRGBColorSpace;
  G.renderer = r;
  const sc = new T.Scene();
  sc.background = new T.Color(0x9fd3ff);
  sc.fog = new T.Fog(0x9fd3ff, 60, 140);
  G.scene = sc;
  G.cam = new T.PerspectiveCamera(42, 1, .5, 400);
  G.camS = { x:0, z:0, dist:27, yaw:-.6, pitch:.95 };
  G.hemi = new T.HemisphereLight(0xdff2ff, 0x5a6b3a, 1.1); sc.add(G.hemi);
  const sun = new T.DirectionalLight(0xfff1d6, 2.1);
  sun.castShadow = G.gfx>=1;
  const sz = G.gfx>=3 ? 4096 : G.gfx>=2 ? 2048 : 1024;
  sun.shadow.mapSize.set(sz,sz);
  const sc2 = sun.shadow.camera; sc2.left=-40; sc2.right=40; sc2.top=40; sc2.bottom=-40; sc2.near=1; sc2.far=140;
  sun.shadow.bias = -.0006; sun.shadow.normalBias = .03;
  sc.add(sun); sc.add(sun.target);
  G.sun = sun;
  onResize();
  window.addEventListener('resize', onResize);
}
function onResize(){
  if(!G) return;
  const w = window.innerWidth, h = window.innerHeight;
  G.renderer.setSize(w,h,false);
  G.cam.aspect = w/h; G.cam.updateProjectionMatrix();
  G.W = w; G.H = h;
}
// ===== THIRD PERSON: „Folgen“ = Kamera hinter der Schulter, die Figur arbeitet selbst (KI).
//       „Übernehmen“ = selbst steuern (Joystick / WASD, Aktion je nach Ziel), „Loslassen“ = die KI macht weiter. =====
const TP = { yaw:0, pitch:.22, dist:3.6, lookT:0, ctxT:0, ctx:null, stepT:0, mark:null, vx:0, vz:0 };
function canTake(u){ return u && u.owner===0 && !u.dead && (u.kind==='worker' || isSoldier(u)) && !G.online; }
function startFollow(u){
  if(!u || u.dead) return; EE.click();
  G.follow=u; G.fcam=null; G.camReset=false; select([],null);
  TP.yaw = u.mesh ? u.mesh.rotation.y : (u.face||0); TP.pitch=.22; TP.dist=3.6; TP.lookT=0;
  G.cam.fov=58; G.cam.updateProjectionMatrix();
  const g=document.querySelector('#game'); g.classList.add('fview'); g.classList.toggle('tpcan', canTake(u)); applyRes();
  tpHudName(u);
  EE.toast(canTake(u) ? 'Kamera folgt – „Übernehmen“ zum Selbststeuern' : 'Kamera folgt – „Zurück“ beendet');
}
function takeControl(on){
  const u=G.follow; if(!u || !canTake(u)) return; EE.click();
  const g=document.querySelector('#game');
  if(on){
    u.manual=true; u.memo={state:u.state, target:u.target, site:u.site, lastType:u.lastType};
    u.state='manual'; u.path=null; u.auto=u.seek=false; if(u.pin) setPin(u,false); TP.vx=TP.vz=0; G.joy={x:0,y:0}; G.act=false;
    g.classList.add('tpctrl'); $('#bTake').textContent='🤖 Loslassen';
    EE.toast(isSoldier(u) ? 'Du führst den Krieger – Joystick laufen, ⚔ angreifen' : 'Du steuerst den Bauern – Joystick laufen, Knopf zum Arbeiten');
  } else {
    u.manual=false; u.moving=u.working=false; G.act=false; g.classList.remove('tpctrl'); $('#bTake').textContent='🎮 Übernehmen'; tpMark(null);
    // die KI macht mit der letzten Aufgabe weiter
    const r = u.kind==='worker' ? (u.lastType ? nextSame(u, 25) : null) : null;
    if(r) cmdGather(u,r); else { u.state='idle'; u.hold=true; if(isSoldier(u)) u.post={x:u.x,z:u.z}; }
    EE.toast('Die Figur macht selbst weiter');
  }
}
function stopFollow(quiet){
  const u=G.follow; if(!u) return;
  if(u.manual) takeControl(false);
  G.follow=null; tpMark(null);
  const g=document.querySelector('#game'); g.classList.remove('fview','tpctrl','tpcan'); applyRes();
  G.cam.fov=42; G.cam.updateProjectionMatrix();
  if(!quiet) EE.click();
  if(u && !u.dead){ G.camS.x=u.x; G.camS.z=u.z; G.camS.dist=Math.max(G.camS.dist,14); }
}
// Kamera-Arm: Schulter rechts, weich gefedert, stößt nicht in Hänge oder Gebäude
function tpBlocked(x,z,y){ if(y < getH(x,z)+.35) return true; const k=cellIdx(x,z); if(k>=0 && G.grid[k]){ for(const b of G.builds){ if(!b.dead && Math.abs(b.x-x)<b.size*.5 && Math.abs(b.z-z)<b.size*.5 && y < getH(b.x,b.z)+b.size*.9) return true; } } return false; }
function followCam(){
  const u=G.follow;
  if(!u || u.dead || !G.units.includes(u)){ stopFollow(true); return false; }
  const dt=G.dtW||.016, m=u.mesh;
  // ohne eigenes Umschauen schwenkt die Kamera langsam hinter die Figur
  TP.lookT=Math.max(0,TP.lookT-dt);
  const face = m ? m.rotation.y : (u.face||0);
  if(TP.lookT<=0){ let d=face-TP.yaw; d=Math.atan2(Math.sin(d),Math.cos(d)); TP.yaw+=d*Math.min(1,dt*(u.manual?(u.moving?1.8:.4):1.2)); }
  const gy=getH(u.x,u.z), sc=(m && m.scale.y)||1, ph=1.45*Math.min(1.2,sc/ .8 * .8);
  const px=u.x, py=gy+ph, pz=u.z;
  const cy=Math.cos(TP.pitch), fx=Math.sin(TP.yaw), fz=Math.cos(TP.yaw), rx=Math.cos(TP.yaw), rz=-Math.sin(TP.yaw), sh=.42;
  let dist=TP.dist;
  for(let i=0;i<6;i++){ const x=px-fx*dist*cy+rx*sh, z=pz-fz*dist*cy+rz*sh, y=py+Math.sin(TP.pitch)*dist; if(!tpBlocked(x,z,y)) break; dist*=.78; }
  let tx=px-fx*dist*cy+rx*sh, tz=pz-fz*dist*cy+rz*sh, ty=py+Math.sin(TP.pitch)*dist;
  ty=Math.max(ty, getH(tx,tz)+.45, WATER_Y+.35);
  const lx=px+fx*2.2+rx*sh*.6, lz=pz+fz*2.2+rz*sh*.6, ly=py-.15+Math.sin(TP.pitch)*.4;
  if(!G.fcam) G.fcam={x:tx,y:ty,z:tz,lx,ly,lz};
  const c=G.fcam, k=Math.min(1,dt*(u.manual?11:6)), kl=Math.min(1,dt*(u.manual?14:6));
  c.x+=(tx-c.x)*k; c.y+=(ty-c.y)*k; c.z+=(tz-c.z)*k; c.lx+=(lx-c.lx)*kl; c.ly+=(ly-c.ly)*kl; c.lz+=(lz-c.lz)*kl;
  G.cam.position.set(c.x,c.y,c.z); G.cam.near=.08; G.cam.far=G.gfx>=2?170:120; G.cam.updateProjectionMatrix();
  G.cam.lookAt(c.lx,c.ly,c.lz);
  G.scene.fog.near=G.gfx>=2?35:25; G.scene.fog.far=G.gfx>=2?150:105;
  G.sun.position.set(u.x+30, gy+55, u.z+18); G.sun.target.position.set(u.x,gy,u.z);
  G.camMoved=true; tpHud(u); return true;
}
function tpHudName(u){ const n=$('#tpName'); if(n) n.textContent=(UNIT[u.kind]?UNIT[u.kind].name:'')+(u.kind==='worker'&&u.age!=null?' · '+ageYears(u)+' Jahre':''); }
function tpHud(u){
  G.tpHudT=(G.tpHudT||0)-(G.dtW||.016); if(G.tpHudT>0) return; G.tpHudT=.12;
  const U=UNIT[u.kind]; $('#tpHp').style.width=Math.max(0,100*u.hp/U.hp)+'%';
  const cw=u.kind==='worker' && u.carry; $('#tpCarry').parentNode.style.display=cw?'':'none';
  if(cw){ $('#tpCarry').style.width=Math.min(100,100*u.carry.amt/carryCap(u))+'%'; $('#tpCarryT').textContent=u.carry.amt>=1?Math.floor(u.carry.amt)+'/'+carryCap(u)+' '+RES_DE[u.carry.type]:''; } else $('#tpCarryT').textContent='';
}
// Ziel-Markierung über dem anvisierten Gegner / Rohstoff
function tpMark(o, kind){
  if(!o){ if(TP.mark){ TP.mark.visible=false; } TP.markObj=null; return; }
  if(!TP.mark){ TP.mark=new T.Sprite(new T.SpriteMaterial({map:iconTexture('sword'), transparent:true, depthTest:false, depthWrite:false})); TP.mark.renderOrder=13; G.scene.add(TP.mark); }
  if(TP.markKind!==kind){ TP.mark.material.map=iconTexture(kind); TP.mark.material.needsUpdate=true; TP.markKind=kind; }
  TP.markObj=o; TP.mark.visible=true;
  const top = o.size ? getH(o.x,o.z)+o.size*.9 : o.kind==='wood' ? getH(o.x,o.z)+4.6 : getH(o.x,o.z)+(o.mesh&&o.mesh.scale?2.2:2);
  TP.mark.position.set(o.x, top+Math.sin(G.t*4)*.12, o.z); TP.mark.scale.setScalar(.7);
}
// Was liegt vor der Figur? (für den Aktionsknopf)
function tpContext(u){
  const U=UNIT[u.kind], f=u.face;
  const ahead=(x,z,rad,R,cone)=>{ const dx=x-u.x, dz=z-u.z, dd=Math.hypot(dx,dz), d=dd-rad; if(d>R) return 1e9; const dot=(dx*Math.sin(f)+dz*Math.cos(f))/(dd||1); return (dot>=cone||d<.5) ? d-dot*.4 : 1e9; };
  if(isSoldier(u)){
    const R=U.ranged?U.range:U.range+1.6, cone=U.ranged?.55:.1; let best=null, bd=1e9;
    for(const o of G.units){ if(o.dead||o.inside||!hostile(u.owner,o.owner)) continue; const d=ahead(o.x,o.z,0,R,cone); if(d<bd){ bd=d; best=o; } }
    for(const a of G.deer){ if(a.dead||!a.alive) continue; const d=ahead(a.x,a.z,a.r||.5,R,cone); if(d<bd){ bd=d; best=a; } }
    for(const b of G.builds){ if(b.dead||!hostile(u.owner,b.owner)||b.kind==='road') continue; const d=ahead(b.x,b.z,b.size*.5,R,cone); if(d<bd){ bd=d; best=b; } }
    return best ? {t:best, a:'attack', ic:U.ranged?'🏹':'⚔️', l:best.deer?'Jagen':best.size?'Angreifen':'Angreifen', mk:'sword'} : {a:'swing', ic:U.ranged?'🏹':'⚔️', l:U.ranged?'Schießen':'Zuschlagen'};
  }
  if(u.ageSt==='greis') return {a:'none', ic:'🧓', l:'Zu alt'};
  // abladen
  if(u.carry.amt>=1){ const b=dropoffFor(u); if(b && b.kind!=='ox' && Math.hypot(b.x-u.x,b.z-u.z)<b.size*.5+2.2) return {t:b, a:'drop', ic:'📦', l:'Abladen'}; }
  let best=null, bd=1e9, act=null;
  for(const b of G.builds){ if(b.owner!==u.owner||b.dead) continue; if(b.built>=1 && b.hp>=BUILD[b.kind].hp) continue; const d=ahead(b.x,b.z,b.size*.5,1.8,0); if(d<bd){ bd=d; best=b; act=b.built<1?'build':'repair'; } }
  for(const r of G.res){ if(!r.alive||r.amt<=0) continue; const tx=r.fish?r.gx:r.x, tz=r.fish?r.gz:r.z; const d=ahead(tx,tz,r.fish?0:(r.r||.5),1.6,0); if(d<bd){ bd=d; best=r; act='gather'; } }
  if(!best) return {a:'none', ic:'✋', l:'Arbeiten'};
  if(act!=='gather') return {t:best, a:act, ic:'🔨', l:act==='build'?'Bauen':'Reparieren', mk:'hammer'};
  const r=best; if(r.deer && !r.dead) return {t:r, a:'hunt', ic:'🗡️', l:'Jagen', mk:'spear'};
  if(u.carry.amt>=carryCap(u)) return {t:r, a:'full', ic:'📦', l:'Voll!', mk:resIcon(r)};
  return {t:r, a:'gather', ic:{wood:'🪓',stone:'⛏️',gold:'⛏️',food:r.fish?'🎣':'🧺'}[r.kind]||'✋', l:{wood:'Fällen',stone:'Abbauen',gold:'Abbauen',food:r.fish?'Fischen':r.dead?'Zerlegen':'Pflücken'}[r.kind]||'Arbeiten', mk:resIcon(r)};
}
function canWalk(x,z){ const k=cellIdx(x,z); if(k<0) return false; if(G.grid[k] && !(G.gateAt && G.gateAt[k] && !hostile(G.gateAt[k].owner,0))) return false; const h=getH(x,z); return h>WATER_Y-.15 && h<WATER_Y+snowLineAt(x,z)+2; }
function updateManual(u,dt){
  const U=UNIT[u.kind], p=G.players[u.owner]; let jx=G.joy?G.joy.x:0, jy=G.joy?G.joy.y:0;
  const K=PC.keys; if(K.has('w')||K.has('arrowup')) jy=-1; if(K.has('s')||K.has('arrowdown')) jy=1; if(K.has('a')||K.has('arrowleft')) jx=-1; if(K.has('d')||K.has('arrowright')) jx=1;
  const run = G.run || K.has('shift'), act = G.act || K.has(' ') || K.has('e') || G.mouseAct;
  const fx=Math.sin(TP.yaw), fz=Math.cos(TP.yaw), rx=Math.cos(TP.yaw), rz=-Math.sin(TP.yaw);
  let wx=fx*(-jy)+rx*(-jx), wz=fz*(-jy)+rz*(-jx); const wl=Math.min(1,Math.hypot(wx,wz)); if(wl>.01){ const n=Math.hypot(wx,wz); wx/=n; wz/=n; }
  const maxSp=(u.speed||U.speed)*(run?1.5:1)*(wl>.12?wl:0)*(act && !isSoldier(u) ? .3 : 1);
  // weich beschleunigen und abbremsen
  const kk=Math.min(1,dt*9); TP.vx+=(wx*maxSp-TP.vx)*kk; TP.vz+=(wz*maxSp-TP.vz)*kk;
  const sp=Math.hypot(TP.vx,TP.vz); u.moving=sp>.25; u.working=false;
  if(sp>.02){ const ck=cellIdx(u.x,u.z), road=ck>=0&&G.road[ck]?1.4:1; const nx=u.x+TP.vx*dt*road, nz=u.z+TP.vz*dt*road;
    if(canWalk(nx,nz)){ u.x=nx; u.z=nz; } else if(canWalk(nx,u.z)){ u.x=nx; TP.vz*=.5; } else if(canWalk(u.x,nz)){ u.z=nz; TP.vx*=.5; } else { TP.vx=TP.vz=0; }
    if(wl>.12){ const want=Math.atan2(wx,wz); let d=want-u.face; d=Math.atan2(Math.sin(d),Math.cos(d)); u.face+=d*Math.min(1,dt*12); } }
  if(u.moving){ TP.stepT-=dt*sp; if(TP.stepT<=0){ TP.stepT=.95; EE.sfx('step',.25); } }
  u.cd=(u.cd||0)-dt;
  // Abladen automatisch, wenn man am Lager vorbeiläuft
  if(u.kind==='worker' && u.carry.amt>=1){ const b=dropoffFor(u); if(b && b.kind!=='ox' && near(u,b.x,b.z,b.size*.5+1.4)) tpDrop(u,b); }
  // Kontext alle 0,12 s
  TP.ctxT-=dt; if(TP.ctxT<=0){ TP.ctxT=.12; TP.ctx=tpContext(u); const c=TP.ctx; $('#bActI').textContent=c.ic; $('#bActL').textContent=c.l; $('#bAct').classList.toggle('dim', c.a==='none'||c.a==='full');
    $('#tpPrompt').textContent = c.t ? (c.a==='full'?'Voll – zum Lager oder Hauptgebäude bringen':c.l+(c.t.size?' · '+BUILD[c.t.kind].name:c.t.deer&&c.t.animal?' · '+(ANIMAL[c.t.animal]&&ANIMAL[c.t.animal].name||'Tier'):'')) : '';
    tpMark(c.t && c.mk ? c.t : null, c.mk); }
  else if(TP.markObj) tpMark(TP.markObj, TP.markKind);
  if(!act) return;
  const c=TP.ctx||{a:'none'}; u.working = c.a!=='none';
  if(c.t) { const dx=c.t.x-u.x, dz=c.t.z-u.z; let d=Math.atan2(dx,dz)-u.face; d=Math.atan2(Math.sin(d),Math.cos(d)); u.face+=d*Math.min(1,dt*14); }   // zum Ziel drehen (Zielhilfe)
  if(isSoldier(u)){
    if(u.cd<=0){ u.cd=U.cd; u.working=true;
      if(c.a==='attack' && c.t && !c.t.dead){ const t=c.t; if(t.deer && t.hp==null){ animalDie(t); EE.sfx('hit',.7); } else { hit(u,t); if(!U.ranged) EE.sfx('hit',.7); } EE.vib(18); }
      else EE.sfx(U.ranged?'bow':'swing',.5); }
    return;
  }
  if(c.a==='drop'){ tpDrop(u,c.t); return; }
  if(c.a==='none' || c.a==='full'){ u.working=false; return; }
  const t=c.t; u.hitT=(u.hitT||0)+dt;
  if(c.a==='build' || c.a==='repair'){ const b=t; if(u.hitT>.9){ u.hitT=0; sfxAt('build',u.x,u.z,.9); EE.vib(8); }
    if(b.built>=1){ b.hp=Math.min(BUILD[b.kind].hp, b.hp+dt*BUILD[b.kind].hp/BUILD[b.kind].time*.6); return; }
    b.built=Math.min(1,b.built+dt/BUILD[b.kind].time/(b.slow?3:1)*1.2); b.hp=Math.max(1,BUILD[b.kind].hp*b.built);
    if(b.kind==='road') b.mesh.children[0].material.opacity=.35+.6*b.built; else b.mesh.scale.y=.25+.75*b.built;
    if(b.built>=1){ finishBuilding(b); EE.sfx('done',.6); } return; }
  const r=t;
  if(c.a==='hunt'){ if(r.hp!=null){ if(u.cd<=0){ u.cd=1; animalHit(r, 10, u); EE.sfx('hit',.7); EE.vib(18); } } else { EE.sfx('hit',.7); animalDie(r); } return; }
  if(u.carry.amt>0 && u.carry.type!==r.kind) u.carry.amt=0;
  if(u.hitT>1.0){ u.hitT=0; sfxAt(r.kind==='wood'?'chop':r.kind==='stone'?'stone':r.kind==='gold'?'gold':'berry', u.x,u.z,1); EE.vib(6); }
  const amount=Math.min(r.amt, carryCap(u)-u.carry.amt, dt*(r.kind==='wood'?1.1:r.kind==='food'?1.25:.85)*(u.ageSt==='alt'?.75:1)*gatherMul(u.owner,r.kind));
  r.amt-=amount; u.carry.type=r.kind; u.carry.amt+=amount; u.lastType=r.kind; u.lastSrc=srcType(r);
  if(r.deer) r.mesh.scale.setScalar(.5+.5*r.amt/r.max);
  if(r.amt<=0) removeRes(r);
}
function tpDrop(u,b){ if(u.carry.amt<1) return; const n=Math.floor(u.carry.amt); G.players[u.owner].res[u.carry.type]+=u.carry.amt; EE.toast('+'+n+' '+RES_DE[u.carry.type]); EE.sfx('confirm',.4); u.carry.amt=0; updateHUD(); }
function initTP(){
  const joy=$('#joy'), knob=joy.querySelector('i'); let jid=null, cx=0, cy=0;
  const set=(x,y)=>{ const R=joy.offsetWidth*.42, dx=x-cx, dy=y-cy, l=Math.hypot(dx,dy), k=l>R?R/l:1; knob.style.transform=`translate(${dx*k}px,${dy*k}px)`; G.joy={x:dx*k/R, y:dy*k/R}; };
  joy.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); jid=e.pointerId; joy.setPointerCapture(jid); const r=joy.getBoundingClientRect(); cx=r.left+r.width/2; cy=r.top+r.height/2; set(e.clientX,e.clientY); });
  joy.addEventListener('pointermove',e=>{ if(e.pointerId===jid) set(e.clientX,e.clientY); });
  const end=e=>{ if(e.pointerId!==jid) return; jid=null; knob.style.transform=''; if(G) G.joy={x:0,y:0}; };
  joy.addEventListener('pointerup',end); joy.addEventListener('pointercancel',end);
  const ab=$('#bAct');
  ab.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); ab.setPointerCapture(e.pointerId); if(G) G.act=true; ab.classList.add('on'); });
  const up=()=>{ if(G) G.act=false; ab.classList.remove('on'); }; ab.addEventListener('pointerup',up); ab.addEventListener('pointercancel',up);
  const rb=$('#bRun'); rb.addEventListener('pointerdown',e=>{ e.preventDefault(); e.stopPropagation(); if(G){ G.run=!G.run; rb.classList.toggle('on',G.run); } });
  $('#bTake').onclick=()=>{ if(G && G.follow) takeControl(!G.follow.manual); };
  // PC: Maus festhalten zum Umschauen, Linksklick = Aktion, Mausrad = Abstand
  const cv=$('#gc');
  cv.addEventListener('wheel',e=>{ if(G && G.follow){ e.preventDefault(); TP.dist=clamp(TP.dist*(e.deltaY>0?1.1:.9),2,8); } },{passive:false});
  document.addEventListener('mousemove',e=>{ if(G && G.follow && document.pointerLockElement===cv){ TP.yaw-=e.movementX*.0032; TP.pitch=clamp(TP.pitch+e.movementY*.0025,-.15,.85); TP.lookT=1.5; } });
}
function updateCam(){
  const s = G.camS;
  if(G.follow){ s.x=G.follow.x; s.z=G.follow.z; s.dist=Math.min(s.dist,14); }
  s.x = clamp(s.x,-G.NX/2+6,G.NX/2-6); s.z = clamp(s.z,-G.NZ/2+6,G.NZ/2-6);
  const maxD = Math.max(G.NX,G.NZ)*1.05;
  s.dist = clamp(s.dist, G.camMin||5, maxD);
  const far = clamp((s.dist-45)/(maxD-45),0,1);
  // Nah heran: Kamera flacher wie ein Beobachter (realistischer Blick), weit weg: steil von oben
  const near = clamp((27-s.dist)/Math.max(1,27-(G.camMin||5)),0,1);
  const pitch = lerp(.95, 1.38, far) - near*near*.32;
  const y = Math.max(getH(s.x,s.z), WATER_Y);
  const hd = Math.cos(pitch)*s.dist, yaw = s.yaw*(1-far);
  G.cam.position.set(s.x+Math.sin(yaw)*hd, y+Math.sin(pitch)*s.dist, s.z+Math.cos(yaw)*hd);
  G.cam.far = s.dist*4+200; G.cam.near = clamp(s.dist*.02,.5,40); G.cam.updateProjectionMatrix();
  G.cam.lookAt(s.x, y, s.z);
  const fv = G.gfx===0 ? .7 : 1; G.scene.fog.near = (s.dist*1.6+20)*fv; G.scene.fog.far = (s.dist*4+120)*fv;
  if(G.follow && followCam()) { G.farView=false; return; }
  G.sun.position.set(s.x+30, y+55, s.z+18);
  G.sun.target.position.set(s.x, y, s.z);
  const shadows = G.gfx>=1 && s.dist<60;
  if(G.sun.castShadow!==shadows){ G.sun.castShadow=shadows; }
  G.farView = s.dist>55;
}
function centerCamOn(x,z){ G.camS.x=x; G.camS.z=z+4; }


/* ============================================================
   WELTKARTE
   ============================================================ */
const LAT0 = 90, LAT1 = -90;                // Kartenausschnitt (Breitengrade)
const CIV_POS = { 'Türkei':[32.5,39.5], 'Italien':[12.5,42], 'Griechenland':[22,39], 'Ägypten':[31,27], 'Irak':[44.5,33],
  'Deutschland':[10,51], 'Großbritannien':[-1.5,52.5], 'Frankreich':[2.5,47], 'Norwegen':[10,60.5], 'Mongolei':[105,47],
  'China':[113,34], 'Japan':[138,36], 'Korea':[127.5,37], 'Mexiko':[-99,19.5], 'Peru':[-72,-13.5],
  'Guatemala':[-89.5,17.5], 'Russland':[37.5,55.7], 'Südafrika':[31,-28.5],
  'Iran':[53,32.5], 'Saudi-Arabien':[45,24.5], 'Indien':[78,22], 'Mali':[-4,14], 'Spanien':[-3.7,40.4], 'Portugal':[-8.2,39.5],
  'Irland':[-8,53.3], 'Niederlande':[5.5,52.2], 'Polen':[19.5,52], 'USA':[-100,40], 'Australien':[134,-25], 'Brasilien':[-47,-14] };
// Wüsten [lonMin, lonMax, latMin, latMax]
const DESERTS = [[-17,34,15,31],[34,58,14,31],[50,66,25,34],[68,76,24,30],[76,92,36,42],[92,116,37,47],[118,146,-32,-18],
  [17,25,-27,-19],[-118,-104,29,37],[-72,-68,-28,-17],[55,66,39,45]];
// Gebirge [lon, lat, rLon, rLat, Höhe]
const MOUNTAINS = [[86,31,11,4,6],[76,36,5,3,5],[96,30,4,4,4.5],[10.5,46.4,5,1.3,3.2],[-74,-15,3,10,4.5],[-70,-32,2.2,10,4.5],[-77,-2,2.5,6,4],
  [-71,-45,2,7,3.4],[-113,45,6,9,3.6],[-122,55,4,6,3],[59,58,2,8,2.5],[44,42.5,4,1.3,3.2],[-3,32,7,2,2.6],[39,10,3,4,2.8],[30,-2,3,4,2],
  [102,35,7,3,3.3],[83,43,7,2,3.2],[71,38,3,2,3.6],[24,46,4,2,2],[14,62,4,4,2.2],[138,36,1.5,2,2.4],[148,-34,2,6,2],[-80,37,4,6,1.8],[-104,24,3,6,2.6]];
// Rohstoff-Vorkommen [Art, lonMin, lonMax, latMin, latMax, Anzahl]
const DEPOSITS = [
  ['oil',45,55,20,30,5],['oil',44,48,30,36,3],['oil',49,54,38,45,3],['oil',65,80,58,66,4],['oil',-103,-94,28,34,3],['oil',-72,-64,7,11,2],
  ['oil',4,9,4,7,2],['oil',15,25,26,31,3],['oil',-118,-110,52,58,2],['oil',110,125,40,48,2],
  ['gold',25,30,-28,-24,4],['gold',-122,-119,37,40,3],['gold',-140,-135,62,65,2],['gold',-3,0,5,8,3],['gold',-78,-70,-15,-8,3],
  ['gold',118,123,-32,-28,3],['gold',110,135,55,62,3],['gold',20,26,44,47,2],
  ['metal',57,62,50,65,4],['metal',-71,-68,-28,-20,3],['metal',-45,-42,-21,-18,2],['metal',17,22,65,68,2],['metal',25,29,-12,-10,3],
  ['metal',116,120,-24,-21,3],['metal',-93,-88,46,48,2],['metal',110,118,30,40,3],['metal',33,36,34,35.5,2],['metal',8,14,49,52,2]];
let WMASK = null, WMW = 0, WMH = 0;
function loadWorldMask(){
  if(WMASK) return Promise.resolve();
  return new Promise(res=>{
    const img = new Image();
    img.onload = ()=>{ const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const x=c.getContext('2d'); x.drawImage(img,0,0);
      const d=x.getImageData(0,0,c.width,c.height).data; WMW=c.width; WMH=c.height; WMASK=new Float32Array(WMW*WMH);
      for(let i=0;i<WMASK.length;i++) WMASK[i]=d[i*4]/255; res(); };
    img.onerror = ()=>res();
    img.src = window.EE_WORLD || 'weltkarte.png?v=141';
  });
}
function landAt(lon,lat){
  if(!WMASK) return 0;
  const fx=(lon+180)/360*(WMW-1), fy=(LAT0-lat)/(LAT0-LAT1)*(WMH-1);
  const x0=clamp(Math.floor(fx),0,WMW-2), y0=clamp(Math.floor(fy),0,WMH-2), tx=clamp(fx-x0,0,1), ty=clamp(fy-y0,0,1);
  const a=WMASK[y0*WMW+x0], b=WMASK[y0*WMW+x0+1], c=WMASK[(y0+1)*WMW+x0], d=WMASK[(y0+1)*WMW+x0+1];
  return lerp(lerp(a,b,tx),lerp(c,d,tx),ty);
}
const toLon = x => (x+G.NX/2)/G.NX*360-180;
const toLat = z => LAT0-(z+G.NZ/2)/G.NZ*(LAT0-LAT1);
const fromLon = lon => (lon+180)/360*G.NX-G.NX/2;
const fromLat = lat => (LAT0-lat)/(LAT0-LAT1)*G.NZ-G.NZ/2;
function inBox(lon,lat,b,soft){ const cx=(b[0]+b[1])/2, cy=(b[2]+b[3])/2, rx=(b[1]-b[0])/2+soft, ry=(b[3]-b[2])/2+soft;
  const d=Math.max(Math.abs(lon-cx)/rx, Math.abs(lat-cy)/ry); return clamp((1-d)/(soft/Math.max(rx,ry)+.001),0,1); }
function desertAt(lon,lat){ let v=0; const w=(vnoise(lon*.09,lat*.09,77)-.5)*9+(vnoise(lon*.4,lat*.4,79)-.5)*2.5, w2=(vnoise(lon*.09+5,lat*.09,78)-.5)*6; for(const b of DESERTS){ v=Math.max(v, inBox(lon+w,lat+w2,b,3)); } return v; }
function mountainAt(lon,lat){ let v=0; for(const m of MOUNTAINS){ const d=Math.hypot((lon-m[0])/m[2],(lat-m[1])/m[3]); if(d<1) v=Math.max(v,(1-d*d)*m[4]); } return v; }
function coldAt(lat){ return clamp((Math.abs(lat)-55)/12,0,1); }
// Tropischer Regenwald [lonMin, lonMax, latMin, latMax]: Amazonas, Mittelamerika, Karibik, Kongo, Westafrika, Südostasien, Indonesien, Neuguinea …
const JUNGLES = [[-79,-44,-15,6],[-92,-77,7,18],[-85,-60,11,22],[8,31,-6,6],[-13,9,4,9],[95,108,-8,20],[108,125,-9,10],[125,152,-10,0],
  [73,77,8,16],[88,97,20,28],[47,51,-25,-12],[142,147,-19,-11]];
function jungleAt(lon,lat){ let v=0; for(const b of JUNGLES) v=Math.max(v, inBox(lon,lat,b,2)); return v; }
// Klima an einer Stelle: Wüste, Dschungel, Kälte (Sibirien, Kanada, Hochgebirge), sonst mild
function climateAt(x,z){
  const lon=toLon(x), lat=toLat(z), ds=desertAt(lon,lat), jg=jungleAt(lon,lat)*(1-ds);
  const cold=Math.max(coldAt(lat), lon>50&&lat>48?clamp((lat-48)/6,0,1):0, lon<-52&&lat>50?clamp((lat-50)/6,0,1):0, clamp((mountainAt(lon,lat)-2.6)/1.4,0,1));
  return {ds, jg, cold, lat, lon};
}

/* ============================================================
   WELT
   ============================================================ */
let H_SEED = 1;
const PEAKS = [ // [Länge, Breite, Höhe, Radius°, Name]
  [86.93,27.99,46,1.62,'Mount Everest'], [76.51,35.88,43,1.44,'K2'], [-70.01,-32.65,38,1.44,'Aconcagua'], [-151.0,63.07,33,1.62,'Denali'],
  [37.35,-3.07,30,0.99,'Kilimandscharo'], [42.44,43.35,29,1.08,'Elbrus'], [44.30,39.70,27,0.99,'Ararat'], [6.86,45.83,26,0.90,'Mont Blanc'],
  [7.66,45.98,24,0.63,'Matterhorn'], [138.73,35.36,22,0.90,'Fuji'], [37.31,-0.15,25,0.81,'Mount Kenya'], [-77.4,-9.12,32,1.08,'Huascarán'],
  [22.36,40.09,16,0.72,'Olymp'], [148.26,-36.46,14,0.81,'Kosciuszko'], [-121.76,46.85,22,0.81,'Mount Rainier'], [-98.62,19.02,26,0.90,'Popocatépetl'] ];
function rawH(x,z){
  const lon=toLon(x), lat=toLat(z);
  const m = landAt(lon,lat);
  let h = WATER_Y + (m-.5)*3.2;
  if(m>.5){
    const land = clamp((m-.5)*4,0,1);
    h += land*(fbm(x*.05+50, z*.05+50, H_SEED)*1.8 + (fbm(x*.15,z*.15,H_SEED+7)-.5)*.6);
    // sanfte Hügellandschaft im Flachland
    const hl = fbm(x*.011+9, z*.011+9, H_SEED+31); h += land*hl*hl*2.4;
    // Gebirge: Grate, Gipfel und Täler (geriffeltes Rauschen) statt runder Buckel
    const mt = mountainAt(lon,lat);
    if(mt>0){ const rg = ridged(x*.045, z*.045, H_SEED+21), rg2 = fbm(x*.11+3, z*.11+3, H_SEED+41);
      const m2 = Math.min(mt, 1.2) + Math.max(0, mt-1.2)*.55, mm = clamp(mt*1.5,0,1);
      // breite Massive mit abgerundeten Graten (keine Nadelspitzen): Grat weich geglättet, dazu sanfte Hänge
      const ridge = rg*rg*(3-2*rg);
      h += land*(m2*2.4 + mm*ridge*m2*13 + mm*(rg2-.5)*m2*2.2); }
    // berühmte Gipfel an ihrem echten Ort (Höhe in Spiel-Metern, Radius in Grad)
    for(const p of PEAKS){ const dl=(lon-p[0])*Math.cos(lat*Math.PI/180), dd=Math.hypot(dl, lat-p[1]); if(dd<p[3]*2.2){ const q=dd/p[3], f=Math.exp(-q*q*2.2); h = Math.max(h, WATER_Y + p[2]*f*(.9+.1*fbm(x*.08,z*.08,H_SEED+5)) ); } }
    const ds = desertAt(lon,lat);
    if(ds>0) h += ds*land*Math.sin(x*.9+Math.sin(z*.35)*2)*.12;   // Dünen
  }
  for(const b of G.bases){ const d=Math.hypot(x-b.x,z-b.z);
    if(d<7) h = lerp(h, b.h, clamp((7-d)/2,0,1));                            // Stadtplatz immer Land
    else if(d<18 && h>WATER_Y+.1) h = lerp(h, b.h, clamp((18-d)/7,0,1)*.85); // vorhandenes Land großzügig einebnen
  }
  const e = Math.min(x+G.NX/2, G.NX/2-x, z+G.NZ/2, G.NZ/2-z);
  if(e<3) h = Math.min(h, WATER_Y-1);
  return h;
}
function tileH(t,x,z){
  const gx=clamp((x-t.x0)/HSF,0,TN-.0001), gz=clamp((z-t.z0)/HSF,0,TN-.0001), ix=gx|0, iz=gz|0, fx=gx-ix, fz=gz-iz, n=TN+1, a=t.h;
  const k=iz*n+ix;
  return lerp(lerp(a[k],a[k+1],fx), lerp(a[k+n],a[k+n+1],fx), fz);
}
function getH(x,z){
  if(G.tiles){ const ti=Math.floor((x+G.NX/2)/TILE), tj=Math.floor((z+G.NZ/2)/TILE);
    if(ti>=0&&tj>=0&&ti<G.tnx&&tj<G.tnz){ const t=G.tiles[tj*G.tnx+ti]; if(t) return tileH(t,x,z); } }
  return coarseH(x,z);
}
function coarseH(x,z){
  const s=G.hs, gx=(x+G.NX/2)/s, gz=(z+G.NZ/2)/s, n=G.hnx;
  const ix=clamp(Math.floor(gx),0,G.hnx-2), iz=clamp(Math.floor(gz),0,G.hnz-2);
  const fx=clamp(gx-ix,0,1), fz=clamp(gz-iz,0,1), a=G.hm;
  const h00=a[iz*n+ix], h10=a[iz*n+ix+1], h01=a[(iz+1)*n+ix], h11=a[(iz+1)*n+ix+1];
  return lerp(lerp(h00,h10,fx), lerp(h01,h11,fx), fz);
}
const WATER_Y = -.55;
/* ---------- Welt in Kacheln: feine Höhen (alle 2 Einheiten) entstehen erst, wenn sie gebraucht werden ---------- */
const TILE = 64, HSF = 2, TN = TILE/HSF;
function ensureTile(ti,tj){
  if(ti<0||tj<0||ti>=G.tnx||tj>=G.tnz) return null;
  const id=tj*G.tnx+ti; let t=G.tiles[id]; if(t) return t;
  const n=TN+1, A=n+2, x0=ti*TILE-G.NX/2, z0=tj*TILE-G.NZ/2;
  const ha=new Float32Array(A*A);
  for(let j=0;j<A;j++) for(let i=0;i<A;i++) ha[j*A+i]=rawH(x0+(i-1)*HSF, z0+(j-1)*HSF);
  const h=new Float32Array(n*n);
  for(let j=0;j<n;j++) for(let i=0;i<n;i++) h[j*n+i]=ha[(j+1)*A+i+1];
  t={ti,tj,id,x0,z0,h,ha,mesh:null};
  G.tiles[id]=t; G.tileCount=(G.tileCount||0)+1;
  // Raster für Wegfindung (Wasser, Rand, steile Hänge)
  const NX=G.NX, NZ=G.NZ, gi0=ti*TILE, gj0=tj*TILE;
  for(let cj=0;cj<TILE;cj++) for(let ci=0;ci<TILE;ci++){
    const gi=gi0+ci, gj=gj0+cj, x=x0+ci+.5, z=z0+cj+.5, hh=tileH(t,x,z);
    const edge = gi<2||gj<2||gi>NX-3||gj>NZ-3;
    const steep = Math.abs(tileH(t,x+.5,z)-tileH(t,x-.5,z))+Math.abs(tileH(t,x,z+.5)-tileH(t,x,z-.5)) > 1.8;
    const high = hh > WATER_Y+6.5 && !G.bases.some(b=>Math.abs(b.x-x)<40 && Math.abs(b.z-z)<40);   // Hochland um eine Startstadt bleibt begehbar   // Hochgebirge: nicht begehbar, nur am Fuß des Bergs kann man laufen und bauen
    if(hh<WATER_Y+.15 || edge || steep || high) G.grid[gj*NX+gi]=1;
  }
  return t;
}
function ensureArea(x0,z0,x1,z1){
  const a=Math.floor((Math.min(x0,x1)+G.NX/2)/TILE), b=Math.floor((Math.max(x0,x1)+G.NX/2)/TILE);
  const c=Math.floor((Math.min(z0,z1)+G.NZ/2)/TILE), d=Math.floor((Math.max(z0,z1)+G.NZ/2)/TILE);
  for(let j=c;j<=d;j++) for(let i=a;i<=b;i++) ensureTile(i,j);
}

function genChunk(ci,cj){
  const NX=G.NX, NZ=G.NZ, CH=G.CH;
  if(ci<0||cj<0||ci*CH>=NX||cj*CH>=NZ) return;
  const key=ci+','+cj; if(G.chunks.has(key)) return; G.chunks.add(key);
  const R = rng((G.seed ^ (ci*73856093) ^ (cj*19349663))>>>0);
  const x0=ci*CH-NX/2, z0=cj*CH-NZ/2;
  // schnell prüfen, ob überhaupt Land im Chunk ist
  let land=0; for(let k=0;k<9;k++){ if(rawLand(x0+((k%3)+.5)*CH/3, z0+(((k/3)|0)+.5)*CH/3)>.55) land++; }
  if(!land) return;
  const saveR=G.rand; G.rand=R;
  const tries = Math.round(CH*CH/13);
  for(let i=0;i<tries;i++){
    const x=x0+R()*CH, z=z0+R()*CH;
    if(rawLand(x,z)<.7) continue;
    const bd = G.bases.reduce((m,b)=>Math.min(m,Math.hypot(b.x-x,b.z-z)),1e9); if(bd<12) continue;
    const lon=toLon(x), lat=toLat(z), ds=desertAt(lon,lat), cold=coldAt(lat), mt=mountainAt(lon,lat);
    const forest = fbm(x*.03,z*.03,H_SEED+40);
    const r = R();
    if(ds>.5){ if(r<.02) placeCluster('tree',x,z,3,1.5); else if(r<.05) placeCluster('stone',x,z,2,1); }
    else if(bd>24 && forest>.6 && cold<.85 && r<.2 && getH(x,z)<WATER_Y+snowLineAt(x,z)-7) placeCluster('tree',x,z,G.gfx===0&&!G.online?3+(R()*4|0):5+(R()*6|0),(3+R()*3)*2.1);
    else if(mt>.2 && cold<.85 && r<.16 && getH(x,z)>WATER_Y+3.5 && getH(x,z)<WATER_Y+snowLineAt(x,z)-7) placeCluster('tree',x,z,G.gfx===0&&!G.online?2+(R()*3|0):4+(R()*4|0),5);   // Bergwald
    else if(bd>18 && r<.008 && cold<.85 && getH(x,z)<WATER_Y+snowLineAt(x,z)-7) placeCluster('tree',x,z,1,3);
    else if(r<.05) placeCluster('bush',x,z,3,1.6);
    else if(r<.075 && mt>.4) placeCluster('stone',x,z,3,1.5);
    else if(r<.085) placeCluster('gold',x,z,2,1.2);
    else if(r<.13 && cold<.9){ if(!(G.gfx===0 && !G.online && R()<.5)) spawnDeer(x,z); }   // Niedrig: halb so viele Tiere
    else if(r<.1307 && bd>45 && !(G.gfx===0 && !G.online && R()<.5)){ const al=Math.abs(lat), jg=jungleAt(lon,lat), africa=lon>-20&&lon<55&&lat<20;
      if(al>35 && al<70 && cold<.9 && ds<.4 && (lon<-50 || lon>-15) && R()<.55) spawnPack(x,z,'wolf',3+(R()*4|0));                 // Wölfe: Nordamerika, Europa, Asien
      else if(africa && lat>-30 && ds<.5 && jg<.5) spawnPack(x,z,'lion',3+(R()*4|0));                                   // Löwen: afrikanische Savanne
      else if(africa && R()<.5) spawnPack(x,z,'elephant',2+(R()*3|0));
      else if(africa && ds<.5) spawnDeer(x,z,'cheetah');                                                    // Elefantenherde
      else if(lon>68 && lon<100 && lat>8 && lat<30) spawnPack(x,z,'elephant',1+(R()*3|0));
      else if(al>35 && al<62 && ds<.4 && lon>-15 && lon<120) spawnPack(x,z,'aurochs',2+(R()*3|0)); }                             // Indien
    else if(r<.1316 && bd>30 && Math.abs(lat)<28 && getH(x,z)<WATER_Y+.9){                                               // Krokodile am Wasser (Tropen)
      let w=0; for(let k=0;k<8;k++){ const a=k/8*6.28; if(getH(x+Math.cos(a)*3,z+Math.sin(a)*3)<WATER_Y) w++; } if(w>=2) spawnDeer(x,z,R()<.55?'croc':'turtle'); }
  }
  // Fischschwärme: flaches Wasser direkt am Ufer
  for(let i=0;i<10;i++){
    const x=x0+R()*CH, z=z0+R()*CH, h=getH(x,z); if(h>WATER_Y-.6 || h<WATER_Y-2.8 || coldAt(toLat(z))>.95) continue;
    let best=null; for(let a=0;a<6.28 && !best;a+=.4) for(let d=2;d<=5;d+=1){ const sx=x+Math.cos(a)*d, sz=z+Math.sin(a)*d; if(getH(sx,sz)>WATER_Y+.25 && freeCell(sx,sz)){ best=[sx,sz]; break; } }
    if(best) addFish(x,z,best[0],best[1]);
  }
  addDecorChunk(x0,z0,CH,R);
  const dl=G.depo && G.depo[key]; if(dl){ for(const d of dl) placeCluster(d.type, d.x, d.z, d.type==='oil'?1:3, 1.6); delete G.depo[key]; }
  G.rand=saveR;
  if(G.farView){ for(const r of G.res) if(r.mesh && !r.mesh.inst && r.mesh.visible) r.mesh.visible=false; }
}
function updateChunks(){
  if(!G.chunks || G.farView) return;
  const CH=G.CH, ci=Math.floor((G.camS.x+G.NX/2)/CH), cj=Math.floor((G.camS.z+G.NZ/2)/CH);
  // so weit füllen, wie man sehen kann – nächste Stücke zuerst, eins pro Aufruf (kein Ruckeln)
  const fx=(G.camS.x+G.NX/2)/CH, fz=(G.camS.z+G.NZ/2)/CH, rad=Math.min(5, Math.ceil(G.scene.fog.far*.9/CH));
  let best=null, bd=1e9;
  for(let dj=-rad;dj<=rad;dj++) for(let di=-rad;di<=rad;di++){ const i=ci+di, j=cj+dj, key=i+','+j; if(G.chunks.has(key)) continue;
    const d=Math.hypot(i+.5-fx, j+.5-fz); if(d<=rad+.5 && d<bd){ bd=d; best=[i,j]; } }
  if(best){ genChunk(best[0],best[1]); G.chunkT=.03; }
}
function rawLand(x,z){ const m=landAt(toLon(x),toLat(z)); return m; }
function genWorld(){
  const NX=G.NX, NZ=G.NZ, R=G.rand; H_SEED=(G.seed%997)+1;
  // Startorte der Zivilisationen (echte Orte, bei Platzmangel etwas verschoben)
  G.bases = [];
  const nP = G.players.length;
  const minD = Math.max(40, Math.round(NX/360*(nP<=2 ? 12 : nP<=4 ? 9 : nP<=8 ? 7 : 5)));
  const landFrac=(x,z,r)=>{ let n=0; for(let i=0;i<24;i++){ const a=i/24*6.283, rr=r*(i%2?1:.55); if(rawLand(x+Math.cos(a)*rr, z+Math.sin(a)*rr)>.55) n++; } return n/24; };
  G.players.forEach(p=>{
    const ll = CIV_POS[p.civ[0]] || [0,30];
    let bx=fromLon(ll[0]), bz=fromLat(ll[1]), found=false;
    for(let r=0;r<Math.max(60,minD*2.5) && !found;r+=2){
      for(let k=0;k<Math.max(1,r*3);k++){
        const a=k/Math.max(1,r*3)*Math.PI*2, x=bx+Math.cos(a)*r, z=bz+Math.sin(a)*r;
        if(rawLand(x,z)<(r<6?.5:.7)) continue;
        if(landFrac(x,z,13) < (r<28?.78:r<45?.6:.4)) continue;
        if(Math.abs(x)>NX/2-10||Math.abs(z)>NZ/2-10) continue;
        if(G.bases.some(b=>Math.hypot(b.x-x,b.z-z)<minD)) continue;
        bx=x; bz=z; found=true; break;
      }
    }
    G.bases.push({x:Math.round(bx), z:Math.round(bz), h:0});
  });
  const saveB = G.bases; G.bases = [];
  saveB.forEach(b=>{ b.h = Math.max(WATER_Y+.7, rawH(b.x,b.z)); });
  G.bases = saveB;
  // Höhenkarte
  G.hs = G.HS; G.hnx = NX/G.hs+1; G.hnz = NZ/G.hs+1;
  G.hm = new Float32Array(G.hnx*G.hnz);
  for(let j=0;j<G.hnz;j++) for(let i=0;i<G.hnx;i++) G.hm[j*G.hnx+i] = rawH(i*G.hs-NX/2, j*G.hs-NZ/2);
  // Raster für Wegfindung: wird kachelweise gefüllt, sobald eine Gegend gebraucht wird
  G.grid = new Uint8Array(NX*NZ); G.road = new Uint8Array(NX*NZ);
  initRegions();
  G.tnx = NX/TILE; G.tnz = NZ/TILE; G.tiles = new Array(G.tnx*G.tnz); G.tileCount=0; G.tileMeshes=[];
  const PW=320; G.pfW=PW; G.pfG = new Float32Array(PW*PW); G.pfF = new Int32Array(PW*PW); G.pfS = new Uint32Array(PW*PW); G.pfC = new Uint32Array(PW*PW); G.pfStamp = 0;
  G.bases.forEach(b=>ensureArea(b.x-90,b.z-90,b.x+90,b.z+90));
  buildTerrain();
  buildWater();
  // Spieler: Stadtzentrum, Arbeiter, faire Startressourcen
  G.players.forEach((p,i)=>{
    const b = G.bases[i];
    p.tc = addBuilding('tc', i, b.x, b.z, true);
    for(let k=0;k<4;k++){ const a=k/4*Math.PI*2+.4; G.nextSex=k%2?'f':'m'; spawnWorker(i, b.x+Math.cos(a)*4.2, b.z+Math.sin(a)*4.2).home=p.tc; }
    const ang = R()*Math.PI*2;
    placeCluster('bush', b.x+Math.cos(ang)*8, b.z+Math.sin(ang)*8, 6, 2.6, 6.5);
    placeCluster('stone', b.x+Math.cos(ang+2)*10, b.z+Math.sin(ang+2)*10, 3, 1.6, 6.5);
    placeCluster('gold', b.x+Math.cos(ang+3.3)*11, b.z+Math.sin(ang+3.3)*11, 3, 1.6, 6.5);
    placeCluster('tree', b.x+Math.cos(ang+4.6)*17, b.z+Math.sin(ang+4.6)*17, 22, 9, 8.5);
    for(let k=0;k<4;k++) spawnDeer(b.x+Math.cos(ang+1)*15+R()*4, b.z+Math.sin(ang+1)*15+R()*4);
  });
  try{ spawnPets(); }catch(e){}
  // Natur entsteht in Chunks (Stücken): zuerst rund um alle Städte, der Rest beim Hinschauen
  G.chunks = new Set(); G.CH = TILE;
  // Rohstoffe an echten Orten (werden gesetzt, sobald die Gegend entsteht)
  G.depo = {};
  for(const d of DEPOSITS){
    const n = Math.max(1, Math.round(d[5]*Math.sqrt(NX/320)));
    for(let k=0;k<n;k++) for(let t=0;t<25;t++){
      const lon=d[1]+R()*(d[2]-d[1]), lat=d[3]+R()*(d[4]-d[3]), x=fromLon(lon), z=fromLat(lat);
      if(rawLand(x,z)<.7) continue;
      const key=Math.floor((x+NX/2)/TILE)+','+Math.floor((z+NZ/2)/TILE); (G.depo[key]||(G.depo[key]=[])).push({type:d[0],x,z}); break;
    }
  }
  G.bases.forEach(b=>{ const ci=Math.floor((b.x+NX/2)/G.CH), cj=Math.floor((b.z+NZ/2)/G.CH); for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++) genChunk(ci+di,cj+dj); });
  buildMinimapBase();
}

/* ---------- Gelände ---------- */
/* ---------- Boden-Texturen (nahtlos, selbst erzeugt; können durch Bilder ersetzt werden) ---------- */
function tileNoise(size, cells, seed){
  const out=new Float32Array(size*size), P=cells;
  const hv=(i,j)=>hash2(((i%P)+P)%P, ((j%P)+P)%P, seed);
  for(let y=0;y<size;y++) for(let x=0;x<size;x++){
    const fx=x/size*P, fy=y/size*P, i=Math.floor(fx), j=Math.floor(fy), u=fx-i, v=fy-j;
    const su=u*u*(3-2*u), sv=v*v*(3-2*v);
    out[y*size+x]=lerp(lerp(hv(i,j),hv(i+1,j),su),lerp(hv(i,j+1),hv(i+1,j+1),su),sv);
  }
  return out;
}
function fbmTile(size, seed){ const a=tileNoise(size,4,seed), b=tileNoise(size,8,seed+1), c=tileNoise(size,16,seed+2), d=tileNoise(size,32,seed+3), o=new Float32Array(size*size);
  for(let i=0;i<o.length;i++) o[i]=a[i]*.45+b[i]*.28+c[i]*.17+d[i]*.1; return o; }
// Feinere Struktur für hochauflösende Texturen: zwei zusätzliche feine Rauschstufen
function fbmTileHD(size, seed){ const o=fbmTile(size,seed), e=tileNoise(size,64,seed+4), f=tileNoise(size,128,seed+5);
  for(let i=0;i<o.length;i++) o[i]=o[i]*.84+e[i]*.1+f[i]*.06; return o; }
function makeGroundTex(kind){
  const S=1024, cv=document.createElement('canvas'); cv.width=cv.height=S; const x=cv.getContext('2d'), img=x.createImageData(S,S);   // HD-Boden (V1.78)
  const n=fbmTileHD(S, {grass:11,dirt:23,sand:37,rock:51,snow:67}[kind]);
  const pal={grass:[[70,120,40],[112,160,62]], dirt:[[104,78,50],[150,118,80]], sand:[[205,166,104],[236,206,146]], rock:[[96,94,90],[150,148,140]], snow:[[214,224,236],[250,252,255]]}[kind];
  for(let i=0;i<S*S;i++){ const t=n[i], o=i*4, xx=i%S, yy=(i/S)|0;
    let v=t;
    if(kind==='sand') v = t*.6 + .4*(.5+.5*Math.sin((xx+Math.sin(yy/S*Math.PI*4)*10)/S*Math.PI*2*10));
    if(kind==='rock') v = Math.abs(t-.5)<.03 ? .05 : t;
    img.data[o]=lerp(pal[0][0],pal[1][0],v); img.data[o+1]=lerp(pal[0][1],pal[1][1],v); img.data[o+2]=lerp(pal[0][2],pal[1][2],v); img.data[o+3]=255; }
  x.putImageData(img,0,0);
  const rnd=rng(kind.length*977);
  if(kind==='grass'){ for(let i=0;i<2600;i++){ const px=rnd()*S, py=rnd()*S, l=3+rnd()*5, a=-Math.PI/2+(rnd()-.5)*.9; const g=110+rnd()*80|0;
      x.strokeStyle=`rgba(${g*.45|0},${g},${g*.35|0},.55)`; x.lineWidth=1; x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l); x.stroke(); } }
  if(kind==='dirt'||kind==='sand'){ for(let i=0;i<(kind==='dirt'?260:90);i++){ const px=rnd()*S, py=rnd()*S, r=.8+rnd()*2.2, g=kind==='dirt'?(120+rnd()*70|0):(190+rnd()*50|0);
      x.fillStyle=`rgba(${g},${g*.88|0},${g*.72|0},.85)`; x.beginPath(); x.arc(px,py,r,0,7); x.fill(); } }
  if(kind==='rock'){ for(let i=0;i<70;i++){ const px=rnd()*S, py=rnd()*S; x.strokeStyle='rgba(40,40,40,.35)'; x.lineWidth=1; x.beginPath(); x.moveTo(px,py); for(let k=0;k<4;k++) x.lineTo(px+(rnd()-.5)*30,py+(rnd()-.5)*30); x.stroke(); }
      for(let i=0;i<90;i++){ x.fillStyle='rgba(80,110,50,.35)'; x.beginPath(); x.arc(rnd()*S,rnd()*S,1+rnd()*3,0,7); x.fill(); } }
  const t=new T.CanvasTexture(cv); t.wrapS=t.wrapT=T.RepeatWrapping; t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; t.generateMipmaps=true; t.minFilter=T.LinearMipmapLinearFilter;
  return t;
}
// Höhenstufen wie in echten Gebirgen (z. B. Kilimandscharo): unten Grün, dann Bergwald bis zur Baumgrenze,
// darüber Bergwiese und Fels, ganz oben Schnee. In den Tropen liegen Baum- und Schneegrenze viel höher.
function snowLineAt(x,z){ const al=Math.abs(toLat(z)), t=clamp((al-15)/35,0,1); return 14 + 11*(1-t*t*(3-2*t)) + (vnoise(x*.08,z*.08,5)-.5)*3; }
function groundW(x,z,h,out,o){
  const lon=toLon(x), lat=toLat(z);
  let sand=0;
  const n1 = fbm(x*.07,z*.07,H_SEED+3);
  let dirt = clamp((n1-.62)*3,0,.6);
  const ds = desertAt(lon,lat); sand = Math.max(sand, ds);
  for(const b of G.bases){ const d=Math.hypot(x-b.x,z-b.z); if(d<9) dirt=Math.max(dirt, clamp((9-d)/5,0,1)*.85); }
  if(h<WATER_Y+.45) sand = Math.max(sand, clamp((WATER_Y+.45-h)/.4,0,1));
  const hh = h-WATER_Y, sl = snowLineAt(x,z), tl = sl-7;
  const rock = clamp((hh-(tl+1))/(sl-tl-1),0,1)*.8 + clamp((hh-sl+2)/2,0,1)*.15;   // über der Baumgrenze Fels
  if(hh>tl-1 && hh<sl) dirt = Math.max(dirt, clamp((hh-tl+1)/3,0,1)*.45);          // Bergwiese mit Erde
  const cold = coldAt(lat);
  const sn = WATER_Y + sl;
  // Sibirien und Nordkanada: Schneedecke mit grünen Flecken
  const sib = lon>45&&lat>52 ? clamp((lat-52)/5,0,1) : lon<-55&&lat>54 ? clamp((lat-54)/5,0,1) : 0;
  const snow = Math.max(clamp((h-sn)/1.2,0,1), cold>.55 ? clamp((cold-.55)*2.5,0,1) : 0, sib*clamp(.55+(vnoise(x*.05,z*.05,17)-.5)*1.6,0,1));
  let rest = 1;
  const ws = snow*rest; rest -= ws;
  const wr = rock*rest; rest -= wr;
  const wsa = sand*rest; rest -= wsa;
  const wd = dirt*rest; rest -= wd;
  out.wA[o*4]=rest; out.wA[o*4+1]=wd; out.wA[o*4+2]=wsa; out.wA[o*4+3]=wr; out.wB[o]=ws;
  const v = .9+hash2(x,z,9)*.2, tn = cold*.25;
  const forest = clamp((hh-3)/2,0,1)*(1-clamp((hh-tl+1)/2,0,1));   // Bergwald-Gürtel: dunkleres, satteres Grün
  out.tint[o*3]=v*(1-tn*.4)*(1-forest*.3); out.tint[o*3+1]=v*(1-forest*.12); out.tint[o*3+2]=v*(1+tn*.3)*(1-forest*.3);
}
const TERRAIN_T = {value:0};
/* ---------- JAHRESZEITEN: 15 Minuten je Jahreszeit (1 Jahr = 60 Minuten), Start im Frühling (Nordhalbkugel).
   Südhalbkugel umgekehrt, in den Tropen Regen- und Trockenzeit. ---------- */
// Baumkronen nah an der Kamera durchsichtig – beim Selbststeuern nur ganz nah (sonst verschwindet der Baum, den man fällt)
const FADE_U = {value:new T.Vector2(.3,.9)};
const SEASON_LEN = 900, YEAR_LEN = 4*SEASON_LEN, YEAR_U = {value:0}, NZ_U = {value:1}, SNOW_U = {value:0};   // SNOW_U: liegengebliebener Schnee nach Schneefall (taut bei Wärme)
const yearPhase = () => (((G && G.t) || 0) / YEAR_LEN) % 1;
const SEASONS = [['Frühling','🌸'],['Sommer','☀️'],['Herbst','🍂'],['Winter','❄️']];
function seasonAt(lat){
  const ph=(yearPhase()+(lat<0?.5:0))%1;
  if(Math.abs(lat)<23){ const wet=Math.cos(2*Math.PI*(ph-.33))>0; return wet?{name:'Regenzeit',ic:'🌧️',ph}:{name:'Trockenzeit',ic:'🌾',ph}; }
  const i=Math.floor(ph*4)%4; return {name:SEASONS[i][0], ic:SEASONS[i][1], ph};
}
// Kontinentalität: wie viel Land rundherum (Sibirien hoch, Küsten niedrig) – wird pro Gegend zwischengespeichert
const _cont = new Map();
function continentality(x,z){
  const k=Math.round(x/60)+','+Math.round(z/60); if(_cont.has(k)) return _cont.get(k);
  let land=0, n=0; for(const r of [120,300,520]) for(let i=0;i<10;i++){ const a=i/10*6.283; land+=rawLand(x+Math.cos(a)*r, z+Math.sin(a)*r)>.5?1:0; n++; }
  const v=clamp((land/n-.35)/.6,0,1); if(_cont.size>4000) _cont.clear(); _cont.set(k,v); return v;
}
// Echte Temperatur: Jahresmittel nach Breitengrad, Schwankung über das Jahr (Küste mild, Landesinneres extrem),
// Höhe (-0,65 °C je 100 m; 1 Höheneinheit ≈ 190 m), Wüsten heißer
function tempAt(x,z){
  const lat=toLat(z), lon=toLon(x), al=Math.abs(lat), cont=continentality(x,z), ds=desertAt(lon,lat);
  const ph=(yearPhase()+(lat<0?.5:0))%1;
  const mean = 27.5 - .0072*lat*lat - cont*al*.06 + ds*4;
  const amp = al*(.12+.18*cont) + ds*3;
  const alt = Math.max(0, getH(x,z)-WATER_Y);
  return mean + amp*Math.sin(2*Math.PI*(ph-.08)) - 1.24*alt;
}
function terrainMat(coarse){
  const tex = G.groundTex;
  const mt = new T.MeshLambertMaterial({vertexColors:true});
  const tk2 = (coarse ? 'terrainC' : 'terrainF') + G.gfx; mt.customProgramCacheKey = () => tk2;
  mt.onBeforeCompile = sh => {
    for(const k in tex) sh.uniforms['t_'+k] = {value:tex[k]};
    sh.uniforms.uTime = TERRAIN_T; sh.uniforms.uYear = YEAR_U; sh.uniforms.uNZ = NZ_U; sh.uniforms.uSnow = SNOW_U;
    if(coarse){ sh.uniforms.tCov={value:G.covTex}; sh.uniforms.uCov={value:new T.Vector4(G.tnx,G.tnz,G.NX,G.NZ)}; }
    sh.vertexShader = 'attribute vec4 aW;\nattribute float aS;\nvarying vec4 vW;\nvarying float vS;\nvarying vec3 vWP;\nvarying vec3 vWN;\n' + sh.vertexShader
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n vW=aW; vS=aS; vWP=position; vWN=normalize(objectNormal);');
    sh.fragmentShader = 'uniform sampler2D t_grass,t_dirt,t_sand,t_rock,t_snow;\nuniform float uTime, uYear, uNZ, uSnow;\n'+(coarse?'uniform sampler2D tCov;\nuniform vec4 uCov;\n':'')+'varying vec4 vW;\nvarying float vS;\nvarying vec3 vWP;\nvarying vec3 vWN;\n' + sh.fragmentShader
      .replace('void main() {', 'void main() {\n'+(coarse?` vec2 tcv = floor((vWP.xz + uCov.zw*.5)/${TILE}.0);
 if(texture2D(tCov, (tcv+.5)/uCov.xy).r > .5) discard;
`:''))
      .replace('#include <map_fragment>', `
        vec2 uv1 = vWP.xz*.28, uv2 = vWP.xz*.061 + vec2(.37,.11);
        ${G.gfx===0 ? `vec3 cg = texture2D(t_grass,uv1).rgb, cd = texture2D(t_dirt,uv1).rgb, cs = texture2D(t_sand,uv1*.7).rgb, cr = texture2D(t_rock,uv1*.8).rgb;` : `
        vec3 cg = mix(texture2D(t_grass,uv1).rgb, texture2D(t_grass,uv2).rgb, .45);
        vec3 cd = mix(texture2D(t_dirt,uv1).rgb, texture2D(t_dirt,uv2).rgb, .4);
        vec3 cs = mix(texture2D(t_sand,uv1*.7).rgb, texture2D(t_sand,uv2).rgb, .4);
        vec3 cr = mix(texture2D(t_rock,uv1*.8).rgb, texture2D(t_rock,uv2).rgb, .4);`}
        vec3 cn = texture2D(t_snow,uv1*.6).rgb;
        vec3 ground = cg*vW.x + cd*vW.y + cs*vW.z + cr*vW.w + cn*vS;
        // steile Hänge: Fels, Schnee rutscht ab
        float steep = 1.0 - smoothstep(.62, .86, normalize(vWN).y);
        ground = mix(ground, cr*vec3(.92,.9,.88), steep*.92);
        // nasser Sand und Brandung an der Küste (scheint durch das Wasser)
        float wl = vWP.y - (${WATER_Y.toFixed(2)});
        ground *= mix(1.0, .72, (1.0-smoothstep(.02, .35, wl)) * step(-1.2, wl));
        float nz = texture2D(t_grass, vWP.xz*.05 + uTime*.01).g;
        float band = smoothstep(-.22, -.04, wl) * (1.0-smoothstep(-.01, .06, wl));
        float wave = .5 + .5*sin(wl*26.0 - uTime*2.2 + nz*9.0);
        ground = mix(ground, vec3(1.0,1.04,1.06), band * smoothstep(.6, .95, wave) * .7);
        ground = mix(ground, ground*vec3(.55,.75,.85), 1.0-smoothstep(-1.4, -.05, wl));
        // Jahreszeiten: Schnee bei Frost (nach Breitengrad, Jahreszeit und Höhe), Herbstgras, Trockenzeit in den Tropen
        {
          float lat = 90.0 - (vWP.z + uNZ*.5)/uNZ*180.0, al = abs(lat);
          float ph = fract(uYear + (lat < 0.0 ? .5 : 0.0));
          float Tp = 27.5 - .0072*lat*lat + al*.2*sin(6.2832*(ph-.08)) - 1.24*max(wl, 0.0);
          float nn = texture2D(t_grass, vWP.xz*.011).g;
          float sn = max(smoothstep(1.5, -3.0, Tp), uSnow*smoothstep(9.0, 3.0, Tp)) * smoothstep(.15, .6, wl) * (1.0 - steep*.65);
          sn *= smoothstep(.25, .55, nn*.6 + sn*.7);
          float aut = al > 26.0 ? smoothstep(.46, .58, ph)*(1.0 - smoothstep(.74, .82, ph)) : 0.0;
          float dry = (al > 7.0 && al < 26.0) ? clamp(cos(6.2832*(ph-.83)), 0.0, 1.0)*.55 : 0.0;
          ground = mix(ground, ground*vec3(1.22, .96, .58), vW.x*max(aut*.5, dry));
          ground = mix(ground, cn, sn*.93);
        }
        diffuseColor.rgb *= ground;`);
  };
  return mt;
}
function buildTerrain(){
  const NX=G.NX, NZ=G.NZ;
  G.groundTex = { grass:makeGroundTex('grass'), dirt:makeGroundTex('dirt'), sand:makeGroundTex('sand'), rock:makeGroundTex('rock'), snow:makeGroundTex('snow') };
  // Abdeckung: welche Kacheln schon fein gezeichnet werden
  G.covData = new Uint8Array(G.tnx*G.tnz);
  G.covTex = new T.DataTexture(G.covData, G.tnx, G.tnz, T.RedFormat, T.UnsignedByteType);
  G.covTex.magFilter = G.covTex.minFilter = T.NearestFilter; G.covTex.needsUpdate = true;
  // grobe Welt in Blöcken (nur sichtbare Blöcke werden gezeichnet)
  const cmat = terrainMat(true), B = 48; G.coarse = [];
  const W = G.hnx, Hh = G.hnz, NA = new Float32Array(W*Hh*3);
  for(let j=0;j<Hh;j++) for(let i=0;i<W;i++){ const hl=G.hm[j*W+Math.max(0,i-1)], hr=G.hm[j*W+Math.min(W-1,i+1)], hd=G.hm[Math.max(0,j-1)*W+i], hu=G.hm[Math.min(Hh-1,j+1)*W+i];
    let nx=hl-hr, ny=2*G.hs, nz=hd-hu; const L=Math.hypot(nx,ny,nz); const k=(j*W+i)*3; NA[k]=nx/L; NA[k+1]=ny/L; NA[k+2]=nz/L; }
  for(let bj=0;bj<Hh-1;bj+=B) for(let bi=0;bi<W-1;bi+=B){
    const i1=Math.min(W-1,bi+B), j1=Math.min(Hh-1,bj+B), w=i1-bi+1, hgt=j1-bj+1, n=w*hgt;
    const P=new Float32Array(n*3), N=new Float32Array(n*3), A={wA:new Float32Array(n*4), wB:new Float32Array(n), tint:new Float32Array(n*3)}, I=[];
    for(let j=0;j<hgt;j++) for(let i=0;i<w;i++){ const gi=bi+i, gj=bj+j, k=j*w+i, x=gi*G.hs-NX/2, z=gj*G.hs-NZ/2, h=G.hm[gj*W+gi];
      P[k*3]=x; P[k*3+1]=h; P[k*3+2]=z; const s=(gj*W+gi)*3; N[k*3]=NA[s]; N[k*3+1]=NA[s+1]; N[k*3+2]=NA[s+2]; groundW(x,z,h,A,k); }
    for(let j=0;j<hgt-1;j++) for(let i=0;i<w-1;i++){ const a=j*w+i, b=a+1, c=a+w, d=c+1; I.push(a,c,b, b,c,d); }
    const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.BufferAttribute(P,3)); geo.setAttribute('normal',new T.BufferAttribute(N,3));
    geo.setAttribute('aW',new T.BufferAttribute(A.wA,4)); geo.setAttribute('aS',new T.BufferAttribute(A.wB,1)); geo.setAttribute('color',new T.BufferAttribute(A.tint,3));
    geo.setIndex(I); geo.computeBoundingSphere();
    const m=new T.Mesh(geo,cmat); m.receiveShadow=true; G.scene.add(m);
    G.coarse.push({m, cx:(bi+w/2)*G.hs-NX/2, cz:(bj+hgt/2)*G.hs-NZ/2, r:Math.hypot(w,hgt)*G.hs*.5});
  }
  G.terrain = G.coarse[0].m;
  G.tileMat = terrainMat(false);
  const skirt = new T.Mesh(new T.PlaneGeometry(NX*6,NZ*6), new T.MeshLambertMaterial({color:0x0e3558}));
  skirt.rotation.x = -Math.PI/2; skirt.position.y = WATER_Y-2.5; G.scene.add(skirt);
}
// feine Kachel als Mesh (mit Schürze nach unten, damit an den Rändern keine Ritzen entstehen)
function tileMesh(t){
  const n=TN+1, A=n+2, cnt=n*n+4*n;
  const P=new Float32Array(cnt*3), N=new Float32Array(cnt*3), O={wA:new Float32Array(cnt*4), wB:new Float32Array(cnt), tint:new Float32Array(cnt*3)};
  for(let j=0;j<n;j++) for(let i=0;i<n;i++){
    const k=j*n+i, x=t.x0+i*HSF, z=t.z0+j*HSF, h=t.h[k];
    P[k*3]=x; P[k*3+1]=h; P[k*3+2]=z;
    const hl=t.ha[(j+1)*A+i], hr=t.ha[(j+1)*A+i+2], hd=t.ha[j*A+i+1], hu=t.ha[(j+2)*A+i+1];
    let nx=hl-hr, ny=2*HSF, nz=hd-hu; const L=Math.hypot(nx,ny,nz); N[k*3]=nx/L; N[k*3+1]=ny/L; N[k*3+2]=nz/L;
    groundW(x,z,h,O,k);
  }
  const edges=[[],[],[],[]]; for(let i=0;i<n;i++){ edges[0].push(i); edges[1].push((n-1)*n+i); edges[2].push(i*n); edges[3].push(i*n+n-1); }
  let v=n*n; const idx=[];
  for(let j=0;j<n-1;j++) for(let i=0;i<n-1;i++){ const a=j*n+i, b=a+1, c=a+n, d=c+1; idx.push(a,c,b, b,c,d); }
  edges.forEach((E,ei)=>{
    const s0=v;
    for(const k of E){ P[v*3]=P[k*3]; P[v*3+1]=P[k*3+1]-3; P[v*3+2]=P[k*3+2]; for(let q=0;q<3;q++){ N[v*3+q]=N[k*3+q]; O.tint[v*3+q]=O.tint[k*3+q]; } for(let q=0;q<4;q++) O.wA[v*4+q]=O.wA[k*4+q]; O.wB[v]=O.wB[k]; v++; }
    for(let q=0;q<n-1;q++){ const a=E[q], b=E[q+1], c=s0+q, d=s0+q+1; idx.push(a,b,c, b,d,c, a,c,b, b,c,d); }
  });
  const geo=new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(P,3)); geo.setAttribute('normal', new T.BufferAttribute(N,3));
  geo.setAttribute('aW', new T.BufferAttribute(O.wA,4)); geo.setAttribute('aS', new T.BufferAttribute(O.wB,1)); geo.setAttribute('color', new T.BufferAttribute(O.tint,3));
  geo.setIndex(idx); geo.computeBoundingSphere();
  const m=new T.Mesh(geo, G.tileMat); m.receiveShadow=true;
  return m;
}
function showTile(t){
  if(t.mesh) return; t.mesh=tileMesh(t); G.scene.add(t.mesh); G.tileMeshes.push(t);
  G.covData[t.id]=255; G.covTex.needsUpdate=true;
}
function hideTile(t){
  if(!t.mesh) return; G.scene.remove(t.mesh); t.mesh.geometry.dispose(); t.mesh=null;
  G.covData[t.id]=0; G.covTex.needsUpdate=true;
}
// Alles, was ganz im Nebel liegt, wird nicht gezeichnet (spart viel Leistung, sieht gleich aus)
function cullFar(){
  const s=G.camS, R=G.scene.fog.far+8, R2=R*R, cx=s.x, cz=s.z;
  const vis=(x,z,r)=>{ const dx=x-cx, dz=z-cz, rr=R+(r||0); return dx*dx+dz*dz < rr*rr; };
  batchesUpdate();
  if(G.coarse) for(const c of G.coarse) c.m.visible = vis(c.cx,c.cz,c.r);
  for(const t of G.tileMeshes) if(t.mesh){ const v=vis(t.x0+TILE/2, t.z0+TILE/2, TILE*.75); if(t.mesh.visible!==v){ t.mesh.visible=v; G.covData[t.id]=v?255:0; G.covTex.needsUpdate=true; } }
  const R7=R*.7; for(const r of G.res) if(r.alive && r.mesh && !r.mesh.inst){ const dx=r.x-cx, dz=r.z-cz; r.mesh.visible = !G.farView && dx*dx+dz*dz < R7*R7; }
  for(const d of G.deer) if(d.alive && d.mesh) d.mesh.visible = vis(d.x,d.z,2);
  for(const u of G.units) u.mesh.visible = !G.farView && vis(u.x,u.z,2);
  for(const b of G.builds) b.mesh.visible = vis(b.x,b.z,b.size+4);
}
function updateTiles(force){
  const s=G.camS, R=clamp(s.dist*2.4+70, 110, 300)*(G.gfx===0?.7:1);
  const ci=(s.x+G.NX/2)/TILE, cj=(s.z+G.NZ/2)/TILE, r=Math.ceil(R/TILE);
  const want=[];
  for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){
    const i=Math.floor(ci)+di, j=Math.floor(cj)+dj; if(i<0||j<0||i>=G.tnx||j>=G.tnz) continue;
    const d=Math.hypot(i+.5-ci, j+.5-cj)*TILE; if(d>R+TILE*.7) continue;
    const t=G.tiles[j*G.tnx+i]; if(t && t.mesh) continue;
    want.push([d,i,j]);
  }
  want.sort((a,b)=>a[0]-b[0]);
  const budget = force ? 1e9 : 3, t0=performance.now();
  for(let k=0;k<want.length && k<budget;k++){ const t=ensureTile(want[k][1],want[k][2]); if(t) showTile(t); if(!force && performance.now()-t0>5) break; }
  // weit entfernte Kacheln wieder freigeben (die Höhen bleiben gespeichert)
  if(G.tileMeshes.length>260){
    G.tileMeshes.sort((a,b)=>Math.hypot(b.ti+.5-ci,b.tj+.5-cj)-Math.hypot(a.ti+.5-ci,a.tj+.5-cj));
    while(G.tileMeshes.length>200){ const t=G.tileMeshes.shift(); if(Math.hypot(t.ti+.5-ci,t.tj+.5-cj)*TILE < R+TILE){ G.tileMeshes.push(t); break; } hideTile(t); }
  }
}
function waterNormalTex(){
  const S=512, h=fbmTileHD(S, 313), h2=tileNoise(S,24,517), cv=document.createElement('canvas'); cv.width=cv.height=S;
  const x=cv.getContext('2d'), img=x.createImageData(S,S);
  const H=(i,j)=>{ i=(i+S)%S; j=(j+S)%S; return h[j*S+i]*1.0 + h2[j*S+i]*.35; };
  for(let j=0;j<S;j++) for(let i=0;i<S;i++){ const dx=(H(i+1,j)-H(i-1,j))*6, dz=(H(i,j+1)-H(i,j-1))*6, L=Math.hypot(dx,1,dz), o=(j*S+i)*4;
    img.data[o]=(-dx/L*.5+.5)*255; img.data[o+1]=(-dz/L*.5+.5)*255; img.data[o+2]=(1/L*.5+.5)*255; img.data[o+3]=255; }
  x.putImageData(img,0,0);
  const t=new T.CanvasTexture(cv); t.wrapS=t.wrapT=T.RepeatWrapping; t.colorSpace=T.NoColorSpace; t.anisotropy=8;
  return t;
}
function waterDepthTex(){
  const W=G.hnx, H=G.hnz, d=new Uint8Array(W*H*4);
  for(let i=0;i<W*H;i++){ const dep=clamp((WATER_Y-G.hm[i])/6,0,1); d[i*4]=dep*255; d[i*4+3]=255; }
  const t=new T.DataTexture(d, W, H, T.RGBAFormat, T.UnsignedByteType);
  t.magFilter=t.minFilter=T.LinearFilter; t.needsUpdate=true; return t;
}
function buildWater(){
  const NX=G.NX, NZ=G.NZ;
  const geo = new T.PlaneGeometry(NX*1.4, NZ*1.6, 96, 48);
  geo.rotateX(-Math.PI/2);
  const U = T.UniformsUtils.merge([T.UniformsLib.fog, {
    uTime:{value:0}, tN:{value:null}, tD:{value:null}, uWorld:{value:new T.Vector2(NX,NZ)},
    uSun:{value:new T.Vector3(30,55,18).normalize()},
    cShallow:{value:new T.Color(0x35c6c0)}, cDeep:{value:new T.Color(0x0b3f74)}, cSkyH:{value:new T.Color(0xcfeaff)}, cSkyZ:{value:new T.Color(0x5aa6e6)}, cSun:{value:new T.Color(0xfff1d6)} }]);
  U.tN.value = waterNormalTex(); U.tD.value = waterDepthTex();
  const mt = new T.ShaderMaterial({ uniforms:U, transparent:true, fog:true, depthWrite:false, defines: G.gfx===0 ? {LOWQ:1} : {},
    vertexShader:`
      varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){
        vec4 wp = modelMatrix * vec4(position,1.0); vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`
      uniform float uTime; uniform sampler2D tN, tD; uniform vec2 uWorld; uniform vec3 uSun;
      uniform vec3 cShallow, cDeep, cSkyH, cSkyZ, cSun;
      varying vec3 vW;
      #include <fog_pars_fragment>
      vec3 nmap(vec2 uv){ return texture2D(tN, uv).xyz*2.0-1.0; }
      void main(){
        vec2 p = vW.xz;
        float depth = texture2D(tD, (p + uWorld*.5)/uWorld).r * 6.0;
        // Wellen: zwei Normalen-Ebenen, die gegeneinander ziehen, dazu große Dünung
        vec3 n1 = nmap(p*.045 + vec2(uTime*.045, uTime*.028));
        #ifdef LOWQ
        vec3 n2 = vec3(0.0), n3 = vec3(0.0);
        #else
        vec3 n2 = nmap(p*.11 + vec2(-uTime*.06, uTime*.07));
        vec3 n3 = nmap(p*.012 + vec2(uTime*.012, -uTime*.016));
        #endif
        // laufende Wellenzüge (sichtbare Bewegung): drei Richtungen, Steigung als Normale
        vec2 d1=vec2(.83,.55), d2=vec2(-.42,.91), d3=vec2(.2,-.98);
        float k1=.55, k2=.9, k3=.33;
        vec2 sw = d1*cos(dot(p,d1)*k1 - uTime*1.6)*.32 + d2*cos(dot(p,d2)*k2 - uTime*2.1)*.2 + d3*cos(dot(p,d3)*k3 - uTime*1.2)*.26;
        float calm = .35 + .65*smoothstep(.1, 1.2, depth);   // am Ufer flacher
        vec3 N = normalize(vec3((n1.x+n2.x*.7+n3.x*1.2)*.55 + sw.x*calm, 1.0, (n1.y+n2.y*.7+n3.y*1.2)*.55 + sw.y*calm));
        vec3 V = normalize(cameraPosition - vW);
        float fres = .03 + .97*pow(1.0-max(dot(N,V),0.0), 5.0);
        vec3 Rf = reflect(-V, N);
        vec3 sky = mix(cSkyH, cSkyZ, clamp(Rf.y*1.6,0.0,1.0));
        float dk = smoothstep(.15, 1.35, depth);
        // Tropen (z. B. Malediven, Karibik): helles türkises Wasser, zum Rand der Tropen hin fließender Übergang
        float lat = 90.0 - (p.y + uWorld.y*.5)/uWorld.y*180.0;
        float trop = 1.0 - smoothstep(20.0, 30.0, abs(lat));
        vec3 shallowC = mix(cShallow, vec3(.42,.93,.9), trop);
        vec3 deepC = mix(cDeep, vec3(.05,.48,.72), trop*.85);
        dk = mix(dk, smoothstep(.4, 2.2, depth), trop);       // in den Tropen bleibt es länger hell
        vec3 body = mix(shallowC, deepC, dk);
        float sss = max(dot(N, uSun),0.0);
        vec3 col = body*(.55+.45*sss);
        col = mix(col, sky, clamp(fres*1.15,0.0,.85));
        float spec = pow(max(dot(Rf, uSun),0.0), 220.0)*3.0 + pow(max(dot(Rf, uSun),0.0), 28.0)*.18;
        col += cSun*spec;
        // Schaum auf flachem Wasser
        float fn = texture2D(tN, p*.07 + vec2(uTime*.02,0.0)).z;
        float foam = (1.0-smoothstep(.03, .3, depth)) * smoothstep(.62, .9, fn + .25*sin(uTime*1.5 + p.x*.3 + p.y*.2));
        // Brandung: Schaumstreifen laufen aufs Ufer zu und verlaufen
        float surf = sin(depth*16.0 + uTime*2.0 + fn*3.0);
        foam = max(foam, (1.0-smoothstep(.04, .3, depth)) * smoothstep(.8, .98, surf) * fn);
        col = mix(col, vec3(1.0), foam*.4);
        // klares Wasser: am Rand sieht man den Boden, in den Tropen besonders weit hinaus
        float a = mix(mix(.4, .12, trop), .95, smoothstep(.0, mix(1.2, 3.0, trop), depth));
        a = max(a, fres*mix(.9, .6, trop));
        gl_FragColor = vec4(col, a);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`
  });
  G.waterU = U.uTime;
  const w = new T.Mesh(geo, mt);
  w.position.y = WATER_Y; w.renderOrder = 2; G.scene.add(w); G.water = w;
}

/* ---------- Materialien & Modelle ---------- */
const MAT = {};
function mat(hex, extra){ const k=hex+(extra?JSON.stringify(extra):''); return MAT[k] || (MAT[k]=new T.MeshLambertMaterial(Object.assign({color:hex, flatShading:true}, extra||{}))); }
function mesh(geo, m, x,y,z){ const o=new T.Mesh(geo,m); o.position.set(x||0,y||0,z||0); o.castShadow=true; o.receiveShadow=true; return o; }
const GEO = {};
function geos(){
  if(GEO.ok) return; GEO.ok=1;
  GEO.trunk = new T.CylinderGeometry(.13,.2,1.2,6);
  GEO.cone = new T.ConeGeometry(.9,1.6,7);
  GEO.cone2 = new T.ConeGeometry(.68,1.3,7);
  GEO.ball = new T.IcosahedronGeometry(.85,0);
  GEO.bush = new T.IcosahedronGeometry(.62,0);
  GEO.berry = new T.SphereGeometry(.1,6,4);
  GEO.rock = new T.DodecahedronGeometry(.8,0);
  GEO.nug = new T.OctahedronGeometry(.16,0);
  GEO.box = new T.BoxGeometry(1,1,1);
  GEO.ring = new T.RingGeometry(.5,.56,32); GEO.ring.rotateX(-Math.PI/2);
  GEO.head = new T.IcosahedronGeometry(.19,1);
  GEO.limb = new T.CylinderGeometry(.065,.06,.42,5); GEO.limb.translate(0,-.21,0);
  GEO.body = new T.CylinderGeometry(.17,.23,.52,7);
  GEO.flame = new T.ConeGeometry(.22,.6,5);
}

function makeTree(R){
  geos();
  const g = new T.Group();
  const kind = R();
  g.add(mesh(GEO.trunk, mat(0x7a4d28), 0,.6,0));
  if(kind<.6){
    const c = [0x2f7a3a,0x3a8a3c,0x2a6b34][(R()*3)|0];
    g.add(mesh(GEO.cone, mat(c), 0,1.6,0));
    g.add(mesh(GEO.cone2, mat(c), 0,2.35,0));
  } else {
    const c = [0x5a9c3a,0x6aa842,0x4c8a30][(R()*3)|0];
    const b = mesh(GEO.ball, mat(c), 0,1.75,0); b.scale.set(1,1.1,1); g.add(b);
  }
  const s = .85+R()*.5; g.scale.set(s,s,s); g.rotation.y = R()*6.28;
  return g;
}
// Viele kleine Teile (Beeren, Goldnuggets) zu EINER Geometrie verschmelzen = 1 Zeichenaufruf statt 15
function mergeParts(parts){ const P=[], N=[];
  for(const [geo,m] of parts){ const g=geo.index?geo.toNonIndexed():geo.clone(); g.applyMatrix4(m); P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array); g.dispose(); }
  const out=new T.BufferGeometry(); out.setAttribute('position',new T.Float32BufferAttribute(P,3)); out.setAttribute('normal',new T.Float32BufferAttribute(N,3)); out.computeBoundingSphere(); return out; }
const PART_CACHE={};
function partsVariant(key, n, make){ const a=PART_CACHE[key]||(PART_CACHE[key]=[]); if(a.length<n){ a.push(make(a.length)); } return a[(Math.random()*n)|0] || a[0]; }
function makeBush(R){
  const F=flora(), g=new T.Group();
  const m=new T.Mesh(F.geo.bush[(R()*2)|0], F.mat); m.castShadow=true; m.receiveShadow=true; m.customDepthMaterial=F.depth;
  const sc=.62+R()*.16; m.scale.set(sc,sc*(.9+R()*.2),sc); g.add(m);
  const bg = partsVariant('berries', 6, ()=>{ const parts=[]; for(let c=0;c<9;c++){ const a=Math.random()*6.28, y=(.4+Math.random()*.6)*.7, r=(.5+Math.random()*.25)*.7; for(let i=0;i<3+(Math.random()*3|0);i++){ const s=.75+Math.random()*.5; parts.push([F.berryGeo, new T.Matrix4().compose(new T.Vector3(Math.cos(a)*r+(Math.random()-.5)*.09, y+(Math.random()-.5)*.08, Math.sin(a)*r+(Math.random()-.5)*.09), new T.Quaternion(), new T.Vector3(s,s,s))]); } } return mergeParts(parts); });
  g.add(new T.Mesh(bg, F.berryMat));
  g.rotation.y = R()*6.28; return g;
}
// Golderz: heller als normaler Stein, mit glänzenden Goldadern, die im Licht funkeln (läuft im Shader, kostet kaum Leistung)
function goldOreMat(base){
  const x=base.clone(); x.color.setRGB(1.38,1.24,.92); x.emissive=new T.Color(0x140c00);
  x.onBeforeCompile=sh=>{
    sh.uniforms.uTime=TERRAIN_T;
    sh.vertexShader='varying vec3 vOP;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n vOP = position;');
    sh.fragmentShader='uniform float uTime;\nvarying vec3 vOP;\n'+sh.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      { vec3 q=vOP*3.1;
        float n=sin(q.x*1.7+sin(q.y*2.3)*1.6)+sin(q.z*1.9+sin(q.x*1.3)*1.4)+sin(q.y*2.1+q.z*.7);
        float vein=1.0-smoothstep(.0,.22,abs(n));                          // schmale Adern
        float spark=pow(max(0.0,sin(dot(floor(q*6.0),vec3(12.9,78.2,37.7))*43.7+uTime*2.2)),40.0);   // Funkeln
        vec3 gold=vec3(1.0,.74,.18);
        diffuseColor.rgb=mix(diffuseColor.rgb, gold*1.05, vein*.85);
        totalEmissiveRadiance += gold*(vein*.32 + spark*vein*1.6 + spark*.25); }`);
  };
  x.customProgramCacheKey=()=>'goldore'; return x;
}
function makeRock(R, kind){
  geos();
  const g = new T.Group();
  const gold = kind==='gold';
  if(kind==='stone' && MODELS.rock){
    const big = MODELS.mono && R()<.25;
    const m = modelMesh(big?'mono':'rock', big?1.1:1.5+R()*.4); if(big) m.scale.multiplyScalar(1.4); g.add(m);
    g.rotation.y = R()*6.28; return g;
  }
  if((kind==='gold'||kind==='metal') && MODELS.ore){
    const m = modelMesh('ore', 1.5+R()*.3);
    if(gold){ m.material = MODELS.ore.goldMat || (MODELS.ore.goldMat = goldOreMat(MODELS.ore.mat)); }
    g.add(m);
    // keine gelben Kugeln mehr auf dem Golderz (V1.55)
    g.rotation.y = R()*6.28; return g;
  }
  const r = mesh(GEO.rock, mat(gold?0x8a7a55:kind==='metal'?0x7a5a4a:0x9aa1a8), 0,.35,0); r.scale.set(1.1,.7,1); r.rotation.set(R(),R(),R()); g.add(r);
  const r2 = mesh(GEO.rock, mat(gold?0x7d6d48:0x868d94), .45,.2,.3); r2.scale.set(.55,.45,.55); g.add(r2);
  g.rotation.y = R()*6.28; return g;
}
function makeOil(R){
  geos();
  const g = new T.Group();
  const pool = new T.Mesh(new T.CircleGeometry(.75,20), new T.MeshPhongMaterial({color:0x07070a, specular:0x6a6a80, shininess:90}));
  pool.rotation.x=-Math.PI/2; pool.position.y=.05; pool.scale.set(1,.7,1); g.add(pool);
  const rim = new T.Mesh(new T.RingGeometry(.72,.95,20), new T.MeshLambertMaterial({color:0x2a2016}));
  rim.rotation.x=-Math.PI/2; rim.position.y=.04; rim.scale.set(1,.72,1); g.add(rim);
  g.rotation.y = R()*6.28;
  return g;
}
function makeDeer(kind){
  if(kind==='rabbit' && MODELS.rabbit){ const g=makeAnimal('rabbit',.32); if(g){ g.quad.hop=true; g.userData.deadY=.06; return g; } }
  if(kind==='horse' && MODELS.horse){ const g=makeAnimal('horse',1.62); if(g){ g.userData.deadY=.2; return g; } }
  // Neue Tiere mit automatischem Skelett: Beine und Hals (Vierbeiner), Krokodil schlängelt sich (Wirbelkette)
  const AN={ox:1.6, aurochs:1.65, sheep:1.0, wolf:.88, lion:1.18, lioness:1.0, cheetah:.95, turtle:.38, elephant:3.1, dog1:.7, dog2:.72, dog3:.68, cat:.32};
  if(kind==='lion' && MODELS.lion2 && G.rand()<.5) kind='lion2';
  if(AN[kind] || kind==='lion2'){ const k=kind, h=AN[kind]||1.2; const g=MODELS[k] && makeAnimal(k,h); if(g) g.userData.deadY=h*.14; if(g) return g; }
  if(kind==='croc' && MODELS.croc){ const g=makeSwimmer('croc', 3.0, false); if(g){ g.userData.croc=true; g.userData.deadY=.05; return g; } }
  if(MODELS.antelope){ const g=makeAnimal('antelope',1.4); if(g){ g.userData.deadY=.14; return g; } }
  geos();
  const g = new T.Group(), c = mat(0xa0643a), d = mat(0x6a3e1e);
  const body = mesh(GEO.box, c, 0,.62,0); body.scale.set(.32,.3,.78); g.add(body);
  const neck = mesh(GEO.box, c, 0,.85,.36); neck.scale.set(.16,.36,.16); neck.rotation.x=-.5; g.add(neck);
  const head = mesh(GEO.box, c, 0,1.02,.5); head.scale.set(.16,.15,.3); g.add(head);
  const ant1 = mesh(GEO.box, d, -.08,1.2,.45); ant1.scale.set(.03,.22,.03); ant1.rotation.z=.4; g.add(ant1);
  const ant2 = mesh(GEO.box, d, .08,1.2,.45); ant2.scale.set(.03,.22,.03); ant2.rotation.z=-.4; g.add(ant2);
  g.legs = [];
  for(const [x,z] of [[-.11,.28],[.11,.28],[-.11,-.28],[.11,-.28]]){
    const l = mesh(GEO.limb, d, x,.5,z); l.scale.set(.8,1.15,.8); g.add(l); g.legs.push(l);
  }
  g.scale.setScalar(1.3); // Rothirsch: Schulterhöhe etwa wie die Brust eines Menschen
  return g;
}
function makeWorker(color){
  geos();
  const sx = G && G.nextSex; if(G) G.nextSex=null;
  const key = sx==='f' ? 'cavef' : sx==='m' ? 'cavem' : Math.random()<.5 ? 'cavem' : 'cavef';
  if(MODELS[key]){ const g = makeRigged(key, 1.45*HUMAN, color); if(g){ g.rig.hips.userData.y0 = g.rig.hips.position.y; g.userData.key=key; return g; } }
  const g = new T.Group();
  const skin = mat(0xe0b088), fur = mat(0x7d4f2a), hair = mat(0x3a2414), team = mat(color);
  const body = mesh(GEO.body, fur, 0,.72,0); g.add(body);
  const sash = mesh(GEO.box, team, 0,.8,0); sash.scale.set(.48,.09,.4); sash.rotation.z=.5; g.add(sash);
  const head = mesh(GEO.head, skin, 0,1.15,0); g.add(head);
  const hr = mesh(GEO.head, hair, 0,1.22,-.03); hr.scale.set(1.08,.75,1.08); g.add(hr);
  g.legs = [], g.arms = [];
  for(const x of [-.09,.09]){ const l=mesh(GEO.limb, skin, x,.47,0); g.add(l); g.legs.push(l); }
  for(const x of [-.25,.25]){ const a=mesh(GEO.limb, skin, x,.94,0); a.scale.set(.85,1,.85); g.add(a); g.arms.push(a); }
  const club = mesh(GEO.box, mat(0x6a4020), .26,.62,.12); club.scale.set(.07,.42,.07); club.rotation.x=.6; g.add(club); g.club=club;
  const load = mesh(GEO.box, mat(0x9a6232), 0,1.0,-.24); load.scale.set(.34,.22,.22); load.visible=false; g.add(load); g.load=load;
  g.scale.setScalar(1.4);
  return g;
}
const LOADCOL = {food:0xd8283a, wood:0x9a6232, stone:0x9aa3ad, gold:0xffd24a};

/* ============================================================
   AUTOMATISCHES SKELETT (Auto-Rig) für Meshy-Figuren ohne Knochen
   ============================================================ */
const RIGS = {};
function buildRig(key){
  const m = MODELS[key]; if(!m) return null;
  const geo = m.geo, pos = geo.attributes.position, n = pos.count;
  const bb = geo.boundingBox, H = bb.max.y-bb.min.y;
  const V = (x,y,z)=>new T.Vector3(x,y,z);
  // Hände finden: äußerste Punkte links/rechts
  const hand = [0,0].map(()=>V(0,0,0)), cnt=[0,0];
  let maxX=0; for(let i=0;i<n;i++) maxX=Math.max(maxX,Math.abs(pos.getX(i)));
  for(let i=0;i<n;i++){ const x=pos.getX(i); if(Math.abs(x)>maxX*.9){ const k=x<0?0:1; hand[k].add(V(x,pos.getY(i),pos.getZ(i))); cnt[k]++; } }
  hand.forEach((h,k)=>h.multiplyScalar(1/Math.max(1,cnt[k])));
  // Körperpunkte (Anteile der Höhe)
  const J = {
    hips:V(0,.52*H,0), spine:V(0,.64*H,0), chest:V(0,.76*H,0), neck:V(0,.85*H,0), head:V(0,.9*H,0), top:V(0,H,0),
    shL:V(-.13*H,.81*H,0), shR:V(.13*H,.81*H,0),
    hipL:V(-.06*H,.5*H,0), hipR:V(.06*H,.5*H,0), kneeL:V(-.065*H,.27*H,.01*H), kneeR:V(.065*H,.27*H,.01*H),
    ankL:V(-.07*H,.045*H,0), ankR:V(.07*H,.045*H,0), toeL:V(-.07*H,.01*H,.09*H), toeR:V(.07*H,.01*H,.09*H),
    handL:hand[0], handR:hand[1]
  };
  J.elL = J.shL.clone().lerp(J.handL,.5).add(V(0,0,-.02*H)); J.elR = J.shR.clone().lerp(J.handR,.5).add(V(0,0,-.02*H));
  J.tipL = J.handL.clone().add(J.handL.clone().sub(J.elL).multiplyScalar(.35)); J.tipR = J.handR.clone().add(J.handR.clone().sub(J.elR).multiplyScalar(.35));
  // Knochen: [Name, Elternteil, Gelenk]
  const BONES = [['hips',-1,'hips'],['spine',0,'spine'],['chest',1,'chest'],['neck',2,'neck'],['head',3,'head'],
    ['shL',2,'shL'],['elL',5,'elL'],['handL',6,'handL'],['shR',2,'shR'],['elR',8,'elR'],['handR',9,'handR'],
    ['hipL',0,'hipL'],['kneeL',11,'kneeL'],['ankL',12,'ankL'],['hipR',0,'hipR'],['kneeR',14,'kneeR'],['ankR',15,'ankR']];
  // Segmente (Bereich, der einem Knochen folgt) mit Seite: 0 Mitte, -1 links, 1 rechts, Art
  const SEG = [[0,'hips','spine',0,'t'],[1,'spine','chest',0,'t'],[2,'chest','neck',0,'t'],[3,'neck','head',0,'t'],[4,'head','top',0,'t'],
    [5,'shL','elL',-1,'a'],[6,'elL','handL',-1,'a'],[7,'handL','tipL',-1,'a'],[8,'shR','elR',1,'a'],[9,'elR','handR',1,'a'],[10,'handR','tipR',1,'a'],
    [11,'hipL','kneeL',-1,'l'],[12,'kneeL','ankL',-1,'l'],[13,'ankL','toeL',-1,'l'],[14,'hipR','kneeR',1,'l'],[15,'kneeR','ankR',1,'l'],[16,'ankR','toeR',1,'l']];
  const skinI = new Uint16Array(n*4), skinW = new Float32Array(n*4);
  const p=V(0,0,0), ab=V(0,0,0), ap=V(0,0,0), q=V(0,0,0);
  const armX = Math.abs(J.shL.x)*.95;
  for(let i=0;i<n;i++){
    p.set(pos.getX(i),pos.getY(i),pos.getZ(i));
    const ds=[];
    for(const [bi,a,b,side,kind] of SEG){
      const A=J[a], B=J[b]; ab.subVectors(B,A); ap.subVectors(p,A);
      const t=clamp(ap.dot(ab)/ab.lengthSq(),0,1); q.copy(A).addScaledVector(ab,t);
      let d=p.distanceTo(q);
      if(kind==='a' && side*p.x < armX) d+=H;                       // Arme nur außen
      if(kind==='l' && (p.y>.56*H || side*p.x < -.02*H)) d+=H;       // Beine nur unten und auf ihrer Seite
      if(kind==='t' && p.y<.46*H) d+=H*.5;                           // Rumpf nicht in den Beinen
      if(kind==='t' && Math.abs(p.x)>armX*1.25 && p.y<.84*H) d+=H*.5; // Rumpf nicht in den Armen
      ds.push([d,bi]);
    }
    ds.sort((a,b)=>a[0]-b[0]);
    const w0=1/Math.pow(ds[0][0]+.004,4), w1=1/Math.pow(ds[1][0]+.004,4), sw=w0+w1;
    skinI[i*4]=ds[0][1]; skinI[i*4+1]=ds[1][1]; skinW[i*4]=w0/sw; skinW[i*4+1]=w1/sw;
  }
  const g2 = geo.clone();
  g2.setAttribute('skinIndex', new T.Uint16BufferAttribute(skinI,4));
  g2.setAttribute('skinWeight', new T.Float32BufferAttribute(skinW,4));
  g2.computeBoundingSphere();
  const dL=J.handL.clone().sub(J.shL), dR=J.handR.clone().sub(J.shR);
  const restZ=[Math.atan2(-dL.x,-dL.y)-.18, -(Math.atan2(dR.x,-dR.y)-.18)];
  return RIGS[key] = {geo:g2, mat:m.mat, J, BONES, H, restZ};
}
let HEADBAND_Y = .042, PALM = .5;
const HUMAN = .8;   // Menschen kleiner, damit Türen und Hütten zur Körpergröße passen (V1.72)
function makeRigged(key, height, color){
  const r = RIGS[key] || buildRig(key); if(!r) return null;
  const bones = r.BONES.map(([name,par,j])=>{ const b=new T.Bone(); b.name=name; return b; });
  r.BONES.forEach(([name,par,j],i)=>{ const jp=r.J[j]; if(par<0) bones[i].position.copy(jp); else { bones[i].position.copy(jp).sub(r.J[r.BONES[par][2]]); bones[par].add(bones[i]); } });
  const sk = new T.SkinnedMesh(r.geo, r.mat);
  sk.add(bones[0]); sk.bind(new T.Skeleton(bones));
  sk.castShadow=true; sk.receiveShadow=true; sk.frustumCulled=false;
  const g = new T.Group(); const sc = height/r.H; sk.scale.setScalar(sc); g.add(sk);
  const B = {}; r.BONES.forEach(([name],i)=>B[name]=bones[i]);
  // Teamfarbe: Band über der Brust, Keule in der rechten Hand, Last auf dem Rücken
  // Teamfarbe als Stirnband (statt Ring um die Brust)
  const band = new T.Mesh(new T.TorusGeometry(.052*r.H,.0045*r.H,5,20), new T.MeshLambertMaterial({color}));
  band.rotation.set(Math.PI/2+.12,0,0); band.position.set(0,HEADBAND_Y*r.H,.012*r.H); band.scale.set(1,1.18,1); B.head.add(band); g.band=band;
  const club = new T.Mesh(new T.CylinderGeometry(.012*r.H,.028*r.H,.28*r.H,6), new T.MeshLambertMaterial({color:0x6a4020}));
  club.position.set(0,-.06*r.H,.08*r.H); club.rotation.x=1.4; B.handR.add(club);
  const load = new T.Mesh(new T.BoxGeometry(.2*r.H,.12*r.H,.1*r.H), new T.MeshLambertMaterial({color:0x9a6232}));
  load.position.set(0,0,-.13*r.H); load.visible=false; B.chest.add(load);
  g.rig = B; g.load = load; g.club = club; g.isRigged = true; g.restZ = r.restZ;
  // Handflächen-Mitte (Griffpunkt) relativ zum Handgelenk-Knochen
  if(!r.palm){ // Mitte der echten Hand-Geometrie (Ecken, die am Hand-Knochen hängen) = Griffpunkt
    const si=r.geo.attributes.skinIndex, sw=r.geo.attributes.skinWeight, pos=r.geo.attributes.position, idx={}; r.BONES.forEach(([n],i)=>idx[n]=i);
    const cen=(name)=>{ const bi=idx[name], c=new T.Vector3(); let n=0; for(let v=0;v<pos.count;v++){ for(let k=0;k<4;k++){ if(si.getComponent(v,k)===bi && sw.getComponent(v,k)>.5){ c.x+=pos.getX(v); c.y+=pos.getY(v); c.z+=pos.getZ(v); n++; break; } } }
      return n ? c.divideScalar(n).sub(r.J[name]) : r.J[name==='handR'?'tipR':'tipL'].clone().sub(r.J[name]).multiplyScalar(PALM); };
    r.palm={R:cen('handR'), L:cen('handL')}; }
  g.palmR = r.palm.R.clone(); g.palmL = r.palm.L.clone();
  return g;
}
function poseRig(g, mode, ph){
  const B = g.rig, s=Math.sin(ph), c=Math.cos(ph);
  const set=(b,x,y,z)=>{ B[b].rotation.set(x||0,y||0,z||0); };
  set('hips'); set('spine'); set('chest'); set('neck'); set('head');
  set('elL'); set('elR'); set('hipL'); set('kneeL'); set('ankL'); set('hipR'); set('kneeR'); set('ankR');
  const zL=g.restZ[0], zR=g.restZ[1];
  const arm=(b,x,z)=>B[b].rotation.set(x||0,0,(b==='shL'?zL:zR)+(z||0));
  arm('shL'); arm('shR');
  if(mode==='walk'){
    set('hipL',-s*.55); set('hipR',s*.55);
    set('kneeL',Math.max(0,s)*.85); set('kneeR',Math.max(0,-s)*.85);
    arm('shL',s*.5); arm('shR',-s*.5); set('elL',-.25); set('elR',-.25);
    set('spine',.06,0,0); set('chest',0,s*.08,0);
    B.hips.position.y = g.rig.hips.userData.y0 + Math.abs(c)*.02*g.children[0].geometry.boundingSphere.radius;
  } else if(mode==='shoot'){
    // Bogen schießen: linker Arm gestreckt nach vorn, rechte Hand zieht die Sehne zurück
    const draw = Math.min(1, ph*1.6);
    set('chest',0,-.35,0); set('spine',.05,0,0); set('head',0,.3,0);
    arm('shL',-1.5,.05); set('elL',0);
    arm('shR',-1.45,.25+draw*.2); set('elR',-.4-draw*1.5);
    set('hipL',-.15); set('kneeL',.1); set('hipR',.2); set('kneeR',.05);
  } else if(mode==='work'){
    const t=(Math.sin(ph)+1)/2;
    set('spine',.25*t,0,0); set('chest',.15*t,0,0);
    arm('shR',-2.4+t*1.9,-.2); set('elR',-.4*(1-t));
    arm('shL',-.9+t*.5,.2); set('elL',-.6);
    set('hipL',-.15); set('kneeL',.25); set('hipR',.2); set('kneeR',.15);
  } else {
    set('chest',Math.sin(ph*.5)*.03,0,0); set('elL',-.15); set('elR',-.15); set('head',0,Math.sin(ph*.3)*.25,0);
  }
}


/* ---------- Tiere: automatisches Vierbeiner-Rig (Beine, Hals) für Meshy-Modelle ---------- */
const QRIGS = {};
function buildQuadRig(key){
  const m = MODELS[key]; if(!m) return null;
  const geo=m.geo, pos=geo.attributes.position, n=pos.count, bb=geo.boundingBox;
  const H=bb.max.y-bb.min.y, L=bb.max.z-bb.min.z;
  // Bauchhöhe: dort, wo die Zahl der Punkte pro Schicht stark ansteigt (über den Beinen beginnt der Körper)
  const NB=24, cnt=new Array(NB).fill(0);
  { const seen=new Set(); for(let i=0;i<n;i++){ const y=pos.getY(i), k=Math.round(pos.getX(i)*500)+','+Math.round(y*500)+','+Math.round(pos.getZ(i)*500); if(seen.has(k)) continue; seen.add(k); cnt[Math.min(NB-1, Math.floor(y/H*NB))]++; } }   // jede Stelle nur einmal zählen (gebackene Modelle haben je Dreieck eigene Ecken)
  let legTop=.42*H;
  for(let b=3;b<NB*.65;b++){ const base=cnt.slice(1,b).sort((a,c)=>a-c)[Math.floor((b-1)/2)]||1; if(cnt[b]>base*1.9){ legTop=b/NB*H; break; } }
  // Beine: vier Gruppen (vorne/hinten, links/rechts)
  let zmin=1e9, zmax=-1e9; for(let i=0;i<n;i++){ if(pos.getY(i)<legTop*.7){ const z=pos.getZ(i); zmin=Math.min(zmin,z); zmax=Math.max(zmax,z); } }
  const zMid=(zmin+zmax)/2, legs=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]; // FL FR BL BR: sx, sz, n
  const legOf=(x,z)=>(z>zMid?0:2)+(x<0?0:1);
  for(let i=0;i<n;i++){ const y=pos.getY(i); if(y<legTop*.7){ const x=pos.getX(i), z=pos.getZ(i), k=legOf(x,z); legs[k][0]+=x; legs[k][1]+=z; legs[k][2]++; } }
  const hips=legs.map(l=>new T.Vector3(l[0]/Math.max(1,l[2]), legTop*1.05, l[1]/Math.max(1,l[2])));
  // Körper vorne -> Halsansatz
  let bzMax=-1e9; for(let i=0;i<n;i++){ const y=pos.getY(i); if(y>legTop && y<legTop+.2*H) bzMax=Math.max(bzMax,pos.getZ(i)); }
  const neck=new T.Vector3(0, legTop+(H-legTop)*.32, bzMax-.12*L);
  const skinI=new Uint16Array(n*4), skinW=new Float32Array(n*4);
  for(let i=0;i<n;i++){
    const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
    let bone=0, w=0;
    const wl=clamp((legTop*1.1-y)/(legTop*.35),0,1);
    if(wl>0){ bone=1+legOf(x,z); w=wl; }
    else { const wn=clamp((z-(neck.z-.04*L))/(.12*L),0,1)*clamp((y-(neck.y-.12*H))/(.12*H),0,1); if(wn>0){ bone=5; w=wn; } }
    skinI[i*4]=bone; skinW[i*4]=w; skinI[i*4+1]=0; skinW[i*4+1]=1-w;
  }
  const g2=geo.clone(); g2.setAttribute('skinIndex',new T.Uint16BufferAttribute(skinI,4)); g2.setAttribute('skinWeight',new T.Float32BufferAttribute(skinW,4)); g2.computeBoundingSphere();
  return QRIGS[key]={geo:g2, mat:m.mat, hips, neck, H, L, legTop};
}
function makeAnimal(key, height){
  const r=QRIGS[key]||buildQuadRig(key); if(!r) return null;
  const root=new T.Bone(); const bones=[root];
  r.hips.forEach(h=>{ const b=new T.Bone(); b.position.copy(h); root.add(b); bones.push(b); });
  const nb=new T.Bone(); nb.position.copy(r.neck); root.add(nb); bones.push(nb);
  const sk=new T.SkinnedMesh(r.geo, r.mat); sk.add(root); sk.bind(new T.Skeleton(bones));
  sk.castShadow=!G || G.gfx>=2; sk.receiveShadow=true;
  const inner=new T.Group(); inner.scale.setScalar(height/r.H); inner.add(sk);
  const g=new T.Group(); g.add(inner); g.quad={legs:bones.slice(1,5), neck:nb, inner}; g.userData.deadY=r.L*height/r.H*.0+.08;
  return g;
}
function poseAnimal(m, mode, ph){
  const q=m.quad; if(!q) return;
  if(q.hop){ // Hase: hüpfen
    const s=Math.abs(Math.sin(ph*.5)); q.inner.position.y = mode==='move' ? s*.12 : 0; q.inner.rotation.x = mode==='move' ? -Math.cos(ph*.5)*.25 : 0;
    q.inner.scale.y = q.inner.scale.x*(mode==='move' ? 1+.08*Math.sin(ph) : 1+.03*Math.sin(ph*.3)); return; }
  const s=Math.sin(ph), a=mode==='move'?.55:0;
  q.legs[0].rotation.x= s*a; q.legs[3].rotation.x= s*a; q.legs[1].rotation.x=-s*a; q.legs[2].rotation.x=-s*a;
  q.neck.rotation.x = mode==='graze' ? .85+Math.sin(ph*2)*.05 : mode==='move' ? -.05+Math.sin(ph*2)*.04 : Math.sin(ph*.4)*.06;
  q.inner.position.y = mode==='move' ? Math.abs(Math.cos(ph))*.03 : 0;
}

// Varianten: jedes Volk bekommt dauerhaft eine eigene Auswahl (Steinzeit: alle Modelle für alle gleich)
function variant(owner, keys){ const ok=keys.filter(k=>MODELS[k]); if(!ok.length) return null; return ok[((owner|0)*7 + (G?G.seed:0)) % ok.length]; }
function modelByHeight(k, h){ const m=MODELS[k]; const bb=m.geo.boundingBox; const o=new T.Mesh(m.geo,m.mat); o.scale.setScalar(h/(bb.max.y-bb.min.y)); o.castShadow=true; o.receiveShadow=true; return o; }
function addDecor(g, k, x, z, size, rotY, byHeight){ if(!MODELS[k]) return; const o = byHeight ? modelByHeight(k,size) : modelMesh(k,size); o.position.set(x,0,z); o.rotation.y=rotY||0; g.add(o); return o; }
function makeTC(color, civ, owner){
  geos();
  const g = new T.Group();
  const tk = variant(owner, ['tc','bigtc']);
  if(tk){
    g.add(modelMesh(tk, tk==='bigtc'?6.6:6.2));
    // Leben rund ums Stadtzentrum
    if(G.gfx>=1){ addDecor(g,'banner', -2.7, 2.9, 2.3, .3, true); addDecor(g,'banner', 2.9, -2.6, 2.3, 2.5, true);
    addDecor(g,'thron', -1.9, 4.4, 1.3, Math.PI*.85); addDecor(g,'bank', 1.9, 4.6, 1.4, -Math.PI*.15);
    addDecor(g,'fellgestell', -4.2, -1.2, 1.7, 1.2); addDecor(g,'trockengestell', 4.3, 1.1, 1.8, -1.3);
    addDecor(g,'werkzeuge', -3.8, 1.9, 1.3, .8); addDecor(g,'trog', 3.7, -.8+3, 1.3, -1.9); addDecor(g,'leiter', 2.6, 1.6, 2.4, -.7, true);
    addDecor(g,'fishrack', -4.7, 3.4, 1.5, .6, true); addDecor(g,'bushes', 4.9, 3.6, .8, -.5, true); addDecor(g,'blooms', -.6, -4.9, .6, .2, true); } else addDecor(g,'banner', -2.7, 2.9, 2.3, .3, true);
    g.flag = civ ? civFlag(g, civ, color, 2.2, 0, 2.0, 4.2) : teamFlag(g, color, 2.2, 0, 2.0, 3.6);
    const fire = makeCampfire(); fire.position.set(0,0,3.9);
    g.add(fire); g.fire=fire.flames; g.fireFx=fire;
    return g;
  }
  const wall = mesh(new T.CylinderGeometry(1.7,1.85,1.3,10), mat(0x8a5a2e), 0,.65,0); g.add(wall);
  const roof = mesh(new T.ConeGeometry(2.25,1.9,10), mat(0xc9a14e), 0,2.25,0); g.add(roof);
  const roof2 = mesh(new T.ConeGeometry(1.2,1,10), mat(0xb08a3e), 0,3.1,0); g.add(roof2);
  const door = mesh(GEO.box, mat(0x3a2414), 0,.5,1.72); door.scale.set(.6,.9,.15); g.add(door);
  // Palisade
  for(let i=0;i<22;i++){ const a=i/22*Math.PI*2; if(Math.abs(Math.sin(a/2-Math.PI/4*0))<.0) continue;
    if(a>1.2 && a<1.95) continue;
    const p = mesh(GEO.box, mat(0x7a4d28), Math.cos(a)*2.85, .5, Math.sin(a)*2.85); p.scale.set(.18,1+((i*7)%3)*.12,.18); g.add(p); }
  // Banner
  const pole = mesh(GEO.box, mat(0x5a3818), 1.6,1.8,1.4); pole.scale.set(.08,3.6,.08); g.add(pole);
  const flag = mesh(GEO.box, mat(color), 1.95,3.2,1.4); flag.scale.set(.7,.5,.04); g.add(flag); g.flag = flag;
  // Lagerfeuer
  const fire = new T.Group(); fire.position.set(0,0,3.6);
  for(let i=0;i<5;i++){ const s=mesh(GEO.rock, mat(0x777777), Math.cos(i*1.26)*.42,.06,Math.sin(i*1.26)*.42); s.scale.set(.16,.12,.16); fire.add(s); }
  const f1 = new T.Mesh(GEO.flame, new T.MeshBasicMaterial({color:0xffa31a})); f1.position.y=.32; fire.add(f1);
  const f2 = new T.Mesh(GEO.flame, new T.MeshBasicMaterial({color:0xffe066})); f2.position.y=.25; f2.scale.set(.55,.6,.55); fire.add(f2);
  g.add(fire); g.fire=[f1,f2];
  return g;
}
function makeBarracks(color, owner){
  geos();
  const g = new T.Group();
  const bk = variant(owner, ['barr1','barr2','barr3','barracks']);
  if(bk){ g.add(modelMesh(bk, 4.6)); addDecor(g,'barrikade', 0, 2.9, 2.2, 0); return g; }
  const hut = mesh(new T.ConeGeometry(1.9,2.6,8), mat(0x7a5230), 0,1.3,0); g.add(hut); return g;
}
// Wachturm: Krieger stehen oben auf der Plattform, sind geschützt und schießen weiter
// Das kleine Dach über der Plattform weglassen, damit man die Krieger oben sieht
function towerGeo(){
  const M=MODELS.tower; if(M.cut) return M.cut;
  const g=M.geo, bb=g.boundingBox, cy=bb.min.y+(bb.max.y-bb.min.y)*.865, P=g.attributes.position.array, I=g.index?g.index.array:null, n=I?I.length:P.length/3, out=[];
  for(let i=0;i<n;i+=3){ const a=I?I[i]:i, b=I?I[i+1]:i+1, c=I?I[i+2]:i+2; if(Math.max(P[a*3+1],P[b*3+1],P[c*3+1])<cy) out.push(a,b,c); }
  const ng=g.clone(); ng.setIndex(out); ng.boundingBox=bb.clone(); ng.computeBoundingSphere(); M.cut=ng; return ng;
}
function makeTower(color, owner){
  geos();
  const g = new T.Group();
  if(MODELS.tower){ const m=modelMesh('tower', 3.0), bb=MODELS.tower.geo.boundingBox, s=m.scale.x; m.geometry=towerGeo(); g.add(m);
    g.platY = (bb.min.y + (bb.max.y-bb.min.y)*.75)*s; g.slotX=(bb.max.x-bb.min.x)*s*.2; g.slotZ=(bb.max.z-bb.min.z)*s*.22;
 return g; }
  for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ const p=mesh(GEO.box, mat(0x6b4a2a), x,2.4,z); p.scale.set(.25,4.8,.25); g.add(p); }
  const pl=mesh(GEO.box, mat(0x8a6238), 0,4.8,0); pl.scale.set(2.6,.2,2.6); g.add(pl);
  g.platY=4.9; g.slotX=.55; g.slotZ=.55; return g;
}
function makeHouse(color, owner){
  geos();
  const g = new T.Group();
  const hk = variant(((owner|0)*3+G.builds.length)%97, ['house','tent','tent2','hutskull']);
  if(hk){ g.add(modelMesh(hk, {tent:3.3, tent2:3.0, hutskull:3.8}[hk]||3.6)); return g; }   // Hütten ohne Fahne
  const tent = mesh(new T.ConeGeometry(1.05,1.9,7), mat(0xb98b56), 0,.95,0); g.add(tent);
  const hide = mesh(new T.ConeGeometry(.75,1.1,7,1,true,0,2.2), mat(0x8a5a2e,{side:T.DoubleSide}), 0,.7,0); hide.rotation.y=1; g.add(hide);
  for(let i=0;i<4;i++){ const a=i*1.57+.4; const p=mesh(GEO.box, mat(0x5a3818), Math.cos(a)*.18,2,Math.sin(a)*.18); p.scale.set(.05,.6,.05); p.rotation.set(Math.sin(a)*.4,0,-Math.cos(a)*.4); g.add(p); }
  const band = mesh(GEO.box, mat(color), 0,1.25,.62); band.scale.set(.35,.12,.05); g.add(band);
  return g;
}
// Marktplatz (Markt wie in Empire Earth 2): Preise in Gold je 100, Verkauf drückt den Preis, Kauf hebt ihn, pendelt sich wieder ein
const MKT_BASE = {food:50, wood:50, stone:70};
function mkt(){ return G.mkt || (G.mkt={food:1, wood:1, stone:1}); }
const mktSell = r => Math.max(5, Math.round(MKT_BASE[r]*mkt()[r]*.85));
const mktBuy  = r => Math.round(MKT_BASE[r]*mkt()[r]*1.2);
const OX_SVG = '<svg viewBox="0 0 24 24"><path d="M4 11c0-3 3-4 8-4s8 1 8 4v3h-2v4h-2v-4H8v4H6v-4H4z" fill="#8a5a2b"/><path d="M3 8c1-2 3-2 4-1M21 8c-1-2-3-2-4-1" stroke="#e8dcc0" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="12" cy="15.5" r="1.4" fill="#e8b64a"/></svg>';
/* ---------- OCHSE als Hilfstier: steht als Sammelstelle bei den Bauern, sie laden bei ihm ab statt weit zum Lager zu laufen;
   ist er voll (60), bringt er alles zum Lager und kommt zurück ---------- */
function oxLoad(o){ return o.load ? o.load.food+o.load.wood+o.load.stone+o.load.gold : 0; }
function updateOx(u,dt){
  const m=u.mesh, p=G.players[u.owner]; u.moving=false; if(!u.load) u.load={food:0,wood:0,stone:0,gold:0};
  if(u.state==='move'){ if(followPath(u,dt)){ const gl=u.goal; if(gl && Math.hypot(gl.x-u.x,gl.z-u.z)>2 && gl.tries++<40) moveTo(u,gl.x,gl.z); else { u.station={x:u.x,z:u.z}; u.state='wait'; u.idleLoadT=0; } } }
  else if(u.state==='wait'){ const L=oxLoad(u); if(L>=OX_CAP || (L>0 && (u.idleLoadT=(u.idleLoadT||0)+dt)>25)){ u.state='haul'; u.path=null; } }
  else if(u.state==='haul'){ let b=null, bd=1e9; for(const o of G.builds){ if(o.owner!==u.owner||o.built<1||!BUILD[o.kind].drop) continue; const d=Math.hypot(o.x-u.x,o.z-u.z); if(d<bd){ bd=d; b=o; } }
    if(!b){ u.state='wait'; }
    else if(near(u,b.x,b.z,b.size*.5+1.6)){ for(const k in u.load){ p.res[k]+=u.load[k]; u.load[k]=0; } if(u.owner===0) updateHUD(); u.path=null;
      if(u.station){ u.state='back'; moveTo(u,u.station.x,u.station.z); } else u.state='idle'; }
    else { if(!u.path || u.pi>=u.path.length) moveTo(u,b.x,b.z); followPath(u,dt); } }
  else if(u.state==='back'){ if(followPath(u,dt)){ u.state='wait'; u.idleLoadT=0; } }
  else if(u.state!=='idle'){ u.state='idle'; }
  m.position.set(u.x, getH(u.x,u.z), u.z); let df=u.face-m.rotation.y; df=Math.atan2(Math.sin(df),Math.cos(df)); m.rotation.y+=df*Math.min(1,dt*6);
  u.phase=(u.phase||0)+dt*(u.moving?8:1); if(m.quad && m.visible && !G.farView) poseAnimal(m, u.moving?'move':'idle', u.phase);
  u.ring.position.set(u.x, m.position.y+.06, u.z); u.ring.scale.setScalar(1.6); updateBar(u);
}
// Ältestenhütte: große Hornschädel-Hütte mit Thron und Fellgestell davor
function makeElder(color, owner){ const g=new T.Group(); if(MODELS.hutskull){ g.add(modelMesh('hutskull', 4.6)); addDecor(g,'thron', 1.7, 2.1, 1.1, Math.PI*.9); addDecor(g,'fellgestell', -1.9, 1.9, 1.4, .5); return g; } return makeStore(color, owner); }
function makeMarket(color, owner){ const g=new T.Group(); if(MODELS.market){ g.add(modelMesh('market', 4.4)); addDecor(g,'trog', 1.6, 1.8, 1.1, .4); return g; } return makeStore(color, owner); }
function makeStore(color, owner){
  geos();
  const g = new T.Group();
  const sk = variant(((owner|0)*5+G.builds.length)%97, ['store','store2','store3']);
  if(sk){ const m=modelMesh(sk, 4.3); g.add(m); return g; }
  const base = mesh(GEO.box, mat(0x7a4d28), 0,.15,0); base.scale.set(2.6,.3,2.4); g.add(base);
  for(let i=0;i<4;i++){ const l=mesh(new T.CylinderGeometry(.16,.16,1.6,6), mat(0x9a6232), -.4,.48+i*.0,-.7+i*.34); l.rotation.z=Math.PI/2; g.add(l); }
  for(let i=0;i<3;i++){ const l=mesh(new T.CylinderGeometry(.16,.16,1.6,6), mat(0x8a5428), -.4,.78,-.53+i*.34); l.rotation.z=Math.PI/2; g.add(l); }
  const r = mesh(GEO.rock, mat(0x9aa1a8), .75,.55,.4); r.scale.set(.55,.45,.5); g.add(r);
  const r2 = mesh(GEO.rock, mat(0x8a7a55), .8,.5,-.5); r2.scale.set(.4,.35,.4); g.add(r2);
  for(const [x,z] of [[-1.2,-1.1],[1.2,-1.1],[-1.2,1.1],[1.2,1.1]]){ const p=mesh(GEO.box, mat(0x5a3818), x,1,z); p.scale.set(.12,1.7,.12); g.add(p); }
  const roof = mesh(GEO.box, mat(0xc9a14e), 0,1.9,0); roof.scale.set(2.8,.12,2.6); roof.rotation.z=.08; g.add(roof);
  const band = mesh(GEO.box, mat(color), 0,1.75,1.32); band.scale.set(.6,.18,.04); g.add(band);
  return g;
}


/* ============================================================
   3D-MODELLE (eigene, verkleinerte GLB-Dateien)
   ============================================================ */
const MODEL_FILES = { aurochs:'models/stier.glb', ox:'models/ochse.glb', tent2:'models/zelt2.glb', hutskull:'models/hornschaedel_huette.glb', market:'models/fellunterstand.glb', fishrack:'models/fischgestell.glb', bushes:'models/buesche.glb', blooms:'models/blumen.glb', lioness:'models/loewin.glb', lion2:'models/loewe2.glb', cheetah:'models/gepard.glb', turtle:'models/schildkroete.glb', dog1:'models/hund_schwarz.glb', dog2:'models/hund_berner.glb', dog3:'models/hund_braunweiss.glb', cat:'models/katze.glb', shark1:'models/bullenhai.glb', shark2:'models/weisser_hai.glb', sheep:'models/schaf.glb', wolf:'models/wolf.glb', lion:'models/loewe.glb', elephant:'models/elefant.glb', croc:'models/krokodil.glb', tc:'models/rundhuette.glb', house:'models/rundhuette.glb', store:'models/steinhaus.glb', barracks:'models/zahnhaus.glb', fence:'models/zaun.glb', rock:'models/monolith.glb', ore:'models/erz.glb', mono:'models/monolith.glb', cavem:'models/hoehlenmann.glb', bigtc:'models/grosse_huette.glb', tent:'models/zelt.glb', store2:'models/vorratshuette.glb', store3:'models/kornspeicher.glb', barr1:'models/festung.glb', barr2:'models/aussenposten.glb', barr3:'models/zahnhaus2.glb', w_spear:'models/speer.glb', w_axe:'models/steinaxt.glb', w_bow:'models/langbogen.glb', banner:'models/banner.glb', bank:'models/bank.glb', thron:'models/thron.glb', werkzeuge:'models/werkzeuge.glb', leiter:'models/leiter.glb', trog:'models/trog.glb', fellgestell:'models/fellgestell.glb', barrikade:'models/barrikade.glb', antelope:'models/antilope.glb', rabbit:'models/hase.glb', horse:'models/pferd.glb', cavef:'models/hoehlenfrau.glb', warrior:'models/krieger.glb', palisade:'models/zaun_knochen.glb', fire:'models/lagerfeuer.glb', tower:'models/wachturm.glb', dolphin:'models/delfin.glb', fish:'models/fisch.glb', bird:'models/vogel.glb' };
const MODELS = {};
let modelsReady = null;
function parseGLB(buf){
  const dv = new DataView(buf), jl = dv.getUint32(12,true);
  const j = JSON.parse(new TextDecoder().decode(new Uint8Array(buf,20,jl)));
  const binOff = 20+jl+8;
  const view = i => { const bv=j.bufferViews[i]; return {off:binOff+(bv.byteOffset||0), len:bv.byteLength}; };
  const accArr = i => { const a=j.accessors[i], v=view(a.bufferView), n={SCALAR:1,VEC2:2,VEC3:3,VEC4:4}[a.type];
    const C = a.componentType===5126?Float32Array:a.componentType===5125?Uint32Array:Uint16Array;
    return new C(buf.slice(v.off, v.off + a.count*n*C.BYTES_PER_ELEMENT)); };
  const pr = j.meshes[0].primitives[0], at = pr.attributes;
  const geo = new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(accArr(at.POSITION),3));
  if(at.NORMAL!=null) geo.setAttribute('normal', new T.BufferAttribute(accArr(at.NORMAL),3));
  if(at.COLOR_0!=null) geo.setAttribute('color', new T.BufferAttribute(accArr(at.COLOR_0),3));
  if(at.TEXCOORD_0!=null) geo.setAttribute('uv', new T.BufferAttribute(accArr(at.TEXCOORD_0),2));
  geo.setIndex(new T.BufferAttribute(accArr(pr.indices),1));
  if(at.NORMAL==null) geo.computeVertexNormals();
  geo.computeBoundingBox();
  const bb = geo.boundingBox, c = new T.Vector3(); bb.getCenter(c);
  geo.translate(-c.x, -bb.min.y, -c.z); geo.computeBoundingBox();
  const mat = new T.MeshLambertMaterial({side:T.DoubleSide, vertexColors: at.COLOR_0!=null});
  let texP = Promise.resolve();
  if(j.images && j.images.length){
    const v = view(j.images[0].bufferView);
    const blob = new Blob([new Uint8Array(buf, v.off, v.len)], {type:j.images[0].mimeType||'image/jpeg'});
    texP = new Promise(res=>{ const img=new Image(); img.onload=()=>{ const t=new T.Texture(img); t.flipY=false; t.colorSpace=T.SRGBColorSpace; t.needsUpdate=true; mat.map=t; mat.needsUpdate=true; res(); }; img.onerror=res; img.src=URL.createObjectURL(blob); });
  }
  return texP.then(()=>({geo, mat}));
}
// Grafik „Niedrig“: Gebäude in einfacher Fassung (models/niedrig/), ab „Mittel“ volle Qualität
const MODEL_LOW = new Set(['ore','aurochs','ox','tent2','hutskull','market','fishrack','bushes','blooms','lioness','lion2','cheetah','turtle','dog1','dog2','dog3','cat','shark1','shark2','sheep','wolf','lion','elephant','croc','antelope','bank','banner','barr1','barr2','barr3','barrikade','bigtc','bird','cavef','cavem','dolphin','fellgestell','fence','fire','fish','horse','house','leiter','palisade','rabbit','store','store2','store3','tc','tent','thron','tower','trog','warrior','werkzeuge']);   // Niedrig = einfache Fassung, sonst HD-Texturen (V1.78)
let modelsLow = null;
window.EE_MODEL_LIST=()=>{ const l=[]; for(const [k,f] of Object.entries(MODEL_FILES)){ l.push(f); if(MODEL_LOW.has(k)) l.push(f.replace('models/','models/niedrig/')); } return [...new Set(l)]; };   // für das Offline-Spielen
// Auf „Mittel“ nehmen Tiere, Erz und Deko die schlanke Fassung (viele davon gleichzeitig im Bild), Gebäude bleiben voll
const MID_LOW = new Set(['ore','sheep','wolf','lion','lion2','lioness','cheetah','turtle','elephant','croc','aurochs','ox','dog1','dog2','dog3','cat','shark1','shark2','horse','antelope','rabbit','bird','fish','dolphin','bushes','blooms','fishrack','fellgestell','werkzeuge','trog','leiter','bank','thron','banner']);
const lowFor = (k, gfx) => MODEL_LOW.has(k) && (gfx===0 || (gfx===1 && MID_LOW.has(k)));
function loadModels(gfx){
  const low = gfx===0 ? 0 : gfx===1 ? 1 : 2;
  if(modelsReady && modelsLow===low) return modelsReady;
  const src = window.EE_MODELS || {}, again = modelsReady && modelsLow!==low;
  modelsLow = low;
  const list = Object.entries(MODEL_FILES).filter(([k])=> !again || MODEL_LOW.has(k));
  modelsReady = Promise.all(list.map(([k,f]) => {
    const useLow = lowFor(k, gfx), url = useLow ? (src[k+'_low'] || src[k] || f.replace('models/','models/niedrig/')) : (src[k] || f);   // Einzeldatei ohne niedrige Fassung: volle nehmen
    return fetch(url).then(r=>{ if(!r.ok) throw 0; return r.arrayBuffer(); }).then(parseGLB).then(m=>{ MODELS[k]=m; }).catch(()=>{});
  }));
  return modelsReady;
}
function modelMesh(k, width){
  const m = MODELS[k]; const bb = m.geo.boundingBox;
  const s = width / Math.max(bb.max.x-bb.min.x, bb.max.z-bb.min.z);
  const o = new T.Mesh(m.geo, m.mat); o.scale.setScalar(s); o.castShadow=true; o.receiveShadow=true;
  return o;
}
/* ============================================================
   PFLANZEN: Laubbaum, Nadelbaum, Palme, Beerenbusch (selbst gebaut, mit Blätter-Textur und Wind)
   ============================================================ */
let FLORA = null;
function floraAtlas(){
  const W=1024, H=512, cv=document.createElement('canvas'); cv.width=W; cv.height=H; const x=cv.getContext('2d');
  const R=rng(4711);
  // Rinde (0..256)
  let gr=x.createLinearGradient(0,0,256,0); gr.addColorStop(0,'#4a3222'); gr.addColorStop(.5,'#6e4a30'); gr.addColorStop(1,'#4a3222');
  x.fillStyle=gr; x.fillRect(0,0,256,512);
  for(let i=0;i<260;i++){ const px=R()*256, w=1+R()*3; x.strokeStyle=`rgba(${30+R()*30|0},${20+R()*20|0},${12},${.35+R()*.4})`; x.lineWidth=w; x.beginPath(); x.moveTo(px,0); let yy=0; while(yy<512){ yy+=10+R()*30; x.lineTo(px+(R()-.5)*6,yy); } x.stroke(); }
  for(let i=0;i<120;i++){ x.fillStyle=`rgba(${140+R()*40|0},${110+R()*30|0},${80},.18)`; x.fillRect(R()*256,R()*512,2+R()*5,6+R()*16); }
  // Palmenstamm (256..512): Ringe
  x.fillStyle='#8a6a44'; x.fillRect(256,0,256,512);
  for(let y=0;y<512;y+=16){ const g=x.createLinearGradient(0,y,0,y+16); g.addColorStop(0,'#5a4128'); g.addColorStop(.35,'#9c7a50'); g.addColorStop(1,'#6e5233'); x.fillStyle=g; x.fillRect(256,y,256,16);
    for(let k=0;k<14;k++){ x.fillStyle='rgba(50,34,20,.35)'; x.fillRect(256+R()*256, y+R()*4, 6+R()*14, 2); } }
  // Laubbüschel (512..768, oben) und kleinblättriges Büschel (512..768, unten)
  const clump=(ox,oy,S,cols,leafL,leafW,count)=>{
    for(let i=0;i<count;i++){
      const a=R()*6.283, rr=Math.pow(R(),.65)*S*.46, cx=ox+S/2+Math.cos(a)*rr, cy=oy+S/2+Math.sin(a)*rr*.95;
      const c=cols[(R()*cols.length)|0], sh=.75+ (1-rr/(S*.46))*.35 + (R()-.5)*.15;
      x.save(); x.translate(cx,cy); x.rotate(R()*6.283);
      x.fillStyle=`rgb(${c[0]*sh|0},${c[1]*sh|0},${c[2]*sh|0})`;
      const L=leafL*(.7+R()*.6), Wd=leafW*(.7+R()*.6);
      x.beginPath(); x.moveTo(-L/2,0); x.quadraticCurveTo(0,-Wd,L/2,0); x.quadraticCurveTo(0,Wd,-L/2,0); x.fill();
      x.strokeStyle='rgba(20,40,10,.35)'; x.lineWidth=.8; x.beginPath(); x.moveTo(-L/2,0); x.lineTo(L/2,0); x.stroke();
      x.restore();
    }
  };
  clump(512,0,256,[[62,120,40],[78,140,46],[52,104,36],[92,152,58],[70,128,44]],24,10,900);
  clump(512,256,256,[[70,130,46],[88,150,56],[60,116,40],[104,160,66]],15,7,1300);
  // Tannen-Nadeln (768..1024, oben): dichte Nadeln, unten gezackter Rand
  { x.fillStyle='#24502c'; x.fillRect(768,0,256,200);
    for(let i=0;i<2600;i++){ const px=768+R()*256, py=R()*200, L=5+R()*9, g=60+R()*60|0;
      x.strokeStyle=`rgb(${20+R()*25|0},${g},${30+R()*20|0})`; x.lineWidth=1.5; x.beginPath(); x.moveTo(px,py); x.lineTo(px+(R()-.5)*4, py+L); x.stroke(); }
    for(let k=0;k<16;k++){ const cx=768+k*16+8, d=200+18+R()*30; x.fillStyle='#2a5a30'; x.beginPath(); x.moveTo(cx-9,198); x.lineTo(cx,d); x.lineTo(cx+9,198); x.fill();
      for(let i=0;i<30;i++){ const py=198+R()*(d-200), w=(1-(py-198)/(d-198))*8; x.strokeStyle=`rgb(${26+R()*20|0},${70+R()*50|0},${34})`; x.lineWidth=1.3; x.beginPath(); x.moveTo(cx+(R()-.5)*w*2,py); x.lineTo(cx+(R()-.5)*w*2,py+5); x.stroke(); } } }
  // Palmwedel (768..1024, unten): Mittelrippe entlang u
  { const oy=256+128; x.strokeStyle='#6a7a2a'; x.lineWidth=4; x.beginPath(); x.moveTo(770,oy); x.lineTo(1020,oy); x.stroke();
    for(let i=0;i<70;i++){ const t=i/70, px=772+t*246, L=(1-Math.pow(t,1.4)*.8)*(60+R()*18);
      for(const side of [-1,1]){ const g=110+R()*40|0; x.strokeStyle=`rgb(${50+R()*20|0},${g},${36})`; x.lineWidth=4.5*(1-t*.5);
        x.beginPath(); x.moveTo(px,oy); x.quadraticCurveTo(px+L*.35, oy+side*L*.45, px+L*.55, oy+side*L*.95); x.stroke(); } } }
  const t=new T.CanvasTexture(cv); t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; t.flipY=false;
  return t;
}
// Geometrie-Baukasten
function GB(){ return {p:[],n:[],u:[],c:[],i:[]}; }
function gbAdd(g,p,n,u,c){ g.p.push(p[0],p[1],p[2]); g.n.push(n[0],n[1],n[2]); g.u.push(u[0],u[1]); g.c.push(c,c,c); return g.p.length/3-1; }
function gbCyl(g, pts, rads, seg, u0, u1, vRep, shade){
  const base=g.p.length/3;
  for(let s=0;s<pts.length;s++){
    const [px,py,pz]=pts[s], r=rads[s], v=s/(pts.length-1)*vRep;
    for(let k=0;k<=seg;k++){ const a=k/seg*6.283, cx=Math.cos(a), cz=Math.sin(a);
      gbAdd(g,[px+cx*r,py,pz+cz*r],[cx,.15,cz],[u0+(u1-u0)*k/seg, v], shade*(s===0?.7:1)); }
  }
  for(let s=0;s<pts.length-1;s++) for(let k=0;k<seg;k++){ const a=base+s*(seg+1)+k, b=a+1, c=a+seg+1, d=c+1; g.i.push(a,c,b, b,c,d); }
}
// Blätterkarte: Quadrat um Mittelpunkt, Normalen zeigen kugelig vom Kronenzentrum weg (weiches Licht)
function gbCard(g, ctr, axU, axV, size, uv, crown, shade){
  const [u0,v0,u1,v1]=uv, idx=[];
  for(const [su,sv,uu,vv] of [[-1,-1,u0,v0],[1,-1,u1,v0],[1,1,u1,v1],[-1,1,u0,v1]]){
    const p=[ctr[0]+(axU[0]*su+axV[0]*sv)*size/2, ctr[1]+(axU[1]*su+axV[1]*sv)*size/2, ctr[2]+(axU[2]*su+axV[2]*sv)*size/2];
    let n=[p[0]-crown[0], (p[1]-crown[1])*1.3+.4, p[2]-crown[2]]; const L=Math.hypot(...n)||1; n=n.map(v=>v/L);
    idx.push(gbAdd(g,p,n,[uu,vv],shade*(.82+.3*Math.max(0,(p[1]-crown[1])/size+.3))));
  }
  g.i.push(idx[0],idx[1],idx[2], idx[0],idx[2],idx[3]);
}
function randAxes(R){
  const a=R()*6.283, b=(R()-.5)*2.2, n=[Math.cos(a)*Math.cos(b), Math.sin(b), Math.sin(a)*Math.cos(b)];
  let u=[-n[2],0,n[0]]; let L=Math.hypot(...u)||1; u=u.map(v=>v/L);
  const v=[n[1]*u[2]-n[2]*u[1], n[2]*u[0]-n[0]*u[2], n[0]*u[1]-n[1]*u[0]];
  const r=R()*6.283, c=Math.cos(r), s=Math.sin(r);
  return [[u[0]*c+v[0]*s,u[1]*c+v[1]*s,u[2]*c+v[2]*s],[v[0]*c-u[0]*s,v[1]*c-u[1]*s,v[2]*c-u[2]*s]];
}
function gbBlob(g, c, r, C, det){
  const ico=new T.IcosahedronGeometry(1,det==null?1:det), p=ico.attributes.position, base=g.p.length/3, [u0,v0,u1,v1]=UV_LEAF;
  for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), z=p.getZ(i), k=.85+hash2(x*3,z*3,y*5)*.3;
    const pp=[c[0]+x*r*k, c[1]+y*r*.85*k, c[2]+z*r*k]; let n=[pp[0]-C[0],(pp[1]-C[1])*1.3+.4,pp[2]-C[2]]; const L=Math.hypot(...n)||1;
    gbAdd(g, pp, n.map(v=>v/L), [u0+(u1-u0)*(.35+.3*(x*.5+.5)), v0+(v1-v0)*(.35+.3*(z*.5+.5))], .62+.25*(y*.5+.5)); }
  const ix=ico.index ? ico.index.array : [...Array(p.count).keys()];
  for(let i=0;i<ix.length;i++) g.i.push(base+ix[i]);
  ico.dispose();
}
function gbGeo(g){
  const geo=new T.BufferGeometry();
  geo.setAttribute('position', new T.Float32BufferAttribute(g.p,3)); geo.setAttribute('normal', new T.Float32BufferAttribute(g.n,3));
  geo.setAttribute('uv', new T.Float32BufferAttribute(g.u,2)); geo.setAttribute('color', new T.Float32BufferAttribute(g.c,3));
  geo.setIndex(g.i); geo.computeBoundingBox(); geo.computeBoundingSphere(); return geo;
}
const UV_BARK=[0,0,.25,1], UV_PALMT=[.25,0,.5,1], UV_LEAF=[.5,0,.75,.5], UV_LEAF2=[.5,.5,.75,1], UV_FIR=[.75,0,1,.5], UV_FROND=[.75,.5,1,1];
function makeBroadleaf(R, small, lod){
  const g=GB(), H=small?2.4:3.4;
  const tr=[[0,0,0],[.05,H*.35,.03],[-.04,H*.7,.06],[.08,H,0]];
  gbCyl(g, lod?[[0,0,0],[0,H,0]]:tr, lod?[.3,.15]:[.34,.26,.2,.15], lod?5:8, 0,.25, 1, .9);
  const crowns=[[0,H+1.6,0,1.9]];
  for(let b=0;b<4;b++){ const a=b/4*6.283+R()*.8, y=H*.75+R()*H*.25, L=1.3+R()*.5, ex=Math.cos(a)*L, ez=Math.sin(a)*L, ey=y+.9+R()*.6;
    if(!lod) gbCyl(g, [[0,y,0],[ex*.5,y+.45,ez*.5],[ex,ey,ez]], [.13,.09,.05], 5, 0,.25, 1, .85);
    crowns.push([ex*1.05, ey+.5, ez*1.05, 1.35+R()*.4]); }
  const C=[0,H+1.2,0];
  const LQ=G.gfx===0;
  for(const [cx,cy,cz,r] of crowns){ const n=lod?3:LQ?7:small?10:14;
    for(let k=0;k<n;k++){ const [au,av]=randAxes(R); const a=R()*6.283, e=(R()-.3)*1.4, d=r*(.35+R()*.45);
      const o=[cx+Math.cos(a)*Math.cos(e)*d, cy+Math.sin(e)*d*.8, cz+Math.sin(a)*Math.cos(e)*d];
      gbCard(g, o, au, av, r*(.9+R()*.4), R()<.7?UV_LEAF:UV_LEAF2, C, .9+R()*.2); }
    gbBlob(g, [cx,cy,cz], r*.78, C, (LQ||lod)?0:1); }
  return gbGeo(g);
}
function makeFir(R, lod){
  const g=GB(), H=8.8;
  gbCyl(g, [[0,0,0],[0,H*.5,0],[0,H,0]], [.3,.18,.04], 7, 0,.25, 1, .85);
  const tiers=lod?4:G.gfx===0?5:7, seg=lod?6:G.gfx===0?8:10, [u0,v0,u1,v1]=UV_FIR;
  for(let t=0;t<tiers;t++){
    const f=t/(tiers-1), yb=1.4+f*(H-2.6), r=2.6*(1-f)+.6, th=2.3-f*.9, yt=yb+th;
    const base=g.p.length/3, rings=[[.06,yt,0],[.55,yt-th*.5,.45],[1,yb,1]];
    for(let ri=0;ri<3;ri++){ const [rf,y,vv]=rings[ri];
      for(let k=0;k<=seg;k++){ const a=k/seg*6.283+t*.5, ca=Math.cos(a), sa=Math.sin(a), wob=ri===2?(.85+R()*.3):1;
        const rr=r*rf*wob, yy=y-(ri===2?R()*.25:0);
        const n=[ca,.75,sa], L=Math.hypot(...n);
        gbAdd(g,[ca*rr,yy,sa*rr],n.map(v=>v/L),[u0+(u1-u0)*(k/seg*2%1||(k?1:0)), v0+(v1-v0)*vv*.99], (.62+.38*ri/2)*(.8+.35*f)); } }
    for(let ri=0;ri<2;ri++) for(let k=0;k<seg;k++){ const a=base+ri*(seg+1)+k, b=a+1, c=a+seg+1, d=c+1; g.i.push(a,b,c, b,d,c); }
  }
  return gbGeo(g);
}
function makePalm(R, lod){
  const g=GB(), H=6.4, lean=.9+R()*.8, pts=[], rads=[];
  for(let s=0;s<=7;s++){ const t=s/7; pts.push([lean*t*t, H*t, 0]); rads.push(.24-.08*t); }
  gbCyl(g, pts, rads, 7, .25,.5, 1, .95);
  const top=pts[7], C=[top[0],top[1],top[2]];
  const fr=lod?6:9;
  for(let f=0;f<fr;f++){ const a=f/fr*6.283+R()*.3, ca=Math.cos(a), sa=Math.sin(a), L=3+R()*.7, seg=lod?2:6, ups=.5+R()*.5;
    const base=g.p.length/3;
    for(let s=0;s<=seg;s++){ const t=s/seg, d=L*t, y=top[1]+ups*Math.sin(t*2.2)*1.0 - t*t*1.9, w=.75*(1-t*.6)+.1;
      const cx=top[0]+ca*d, cz=top[2]+sa*d, sx=-sa*w, sz=ca*w;
      const [u0,v0,u1,v1]=UV_FROND, uu=u0+(u1-u0)*t;
      gbAdd(g,[cx+sx,y-.08*t,cz+sz],[ca*.3,1,sa*.3],[uu,v0],1); gbAdd(g,[cx-sx,y-.08*t,cz-sz],[ca*.3,1,sa*.3],[uu,v1],1); }
    for(let s=0;s<seg;s++){ const a0=base+s*2; g.i.push(a0,a0+1,a0+2, a0+1,a0+3,a0+2); }
  }
  return gbGeo(g);
}
function makeBushGeo(R){
  const g=GB(), C=[0,.55,0];
  for(let k=0;k<16;k++){ const [au,av]=randAxes(R); const a=R()*6.283, r=R()*.55;
    gbCard(g,[Math.cos(a)*r, .5+R()*.45, Math.sin(a)*r], au, av, 1.05+R()*.4, UV_LEAF2, C, .95); }
  return gbGeo(g);
}
function floraMat(tex){
  const m=new T.MeshLambertMaterial({map:tex, vertexColors:true, alphaTest:.45, side:T.DoubleSide});
  const fk='flora'+G.gfx; m.customProgramCacheKey=()=>fk;
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = TERRAIN_T; sh.uniforms.uYear = YEAR_U; sh.uniforms.uNZ = NZ_U; sh.uniforms.uSnow = SNOW_U; sh.uniforms.uFade = FADE_U;
    // Jahreszeiten an den Bäumen: Laubbäume färben sich im Herbst und werden bei Frost kahl, Nadelbäume bekommen Schnee
    sh.fragmentShader = 'uniform vec2 uFade;\nvarying vec3 vSea;\nvarying float vHs;\n' + sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
      {
        float bl = step(.5, vMapUv.x) * step(vMapUv.x, .75);
        if(bl > .5){
          vec3 au = mix(vec3(.95,.55,.12), vec3(.78,.2,.08), vHs); au = mix(au, vec3(.96,.82,.22), step(.72, vHs));
          float lum = dot(diffuseColor.rgb, vec3(.3,.59,.11));
          diffuseColor.rgb = mix(diffuseColor.rgb, au*(.45 + lum*1.4), vSea.x*(.6 + .4*vHs));
          float ig = fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(.06711056,.00583715))));
          if(vSea.y > .03 && ig < vSea.y*(.8 + .2*vHs)) discard;
        }
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.93,.96,1.0), vSea.z * step(.75, vMapUv.x) * .55);
      }`);
    // nah an der Kamera werden Baumkronen durchsichtig, damit man beim Heranzoomen etwas sieht
    sh.fragmentShader = sh.fragmentShader.replace('void main() {', `void main() {
      float cdist = length(vViewPosition);
      if(cdist < uFade.y){ float a = smoothstep(uFade.x, uFade.y, cdist); float ign = fract(52.9829189*fract(dot(gl_FragCoord.xy, vec2(.06711056,.00583715)))); if(ign > a) discard; }`);
    sh.vertexShader = 'uniform float uTime, uYear, uNZ, uSnow;\nvarying vec3 vSea;\nvarying float vHs;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      #ifdef USE_INSTANCING
        vec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]); float iy = instanceMatrix[3][1];
      #else
        vec2 ip = vec2(modelMatrix[3][0], modelMatrix[3][2]); float iy = modelMatrix[3][1];
      #endif
      {
        float lat = 90.0 - (ip.y + uNZ*.5)/uNZ*180.0, al = abs(lat);
        float ph = fract(uYear + (lat < 0.0 ? .5 : 0.0));
        float Tp = 27.5 - .0072*lat*lat + al*.2*sin(6.2832*(ph-.08)) - 1.24*max(iy - (${WATER_Y.toFixed(2)}), 0.0);
        vHs = fract(sin(dot(ip, vec2(12.9898, 78.233)))*43758.5453);
        float temperate = step(26.0, al);
        float aut = temperate * smoothstep(.47 + vHs*.06, .62, ph) * (1.0 - smoothstep(.96, 1.0, ph));
        // Laub fällt im Spätherbst, treibt im Frühling wieder aus – nur wo der Winter kalt genug ist (Mittelmeer bleibt grüner)
        float win = clamp(smoothstep(.69 + vHs*.05, .8, ph) + 1.0 - smoothstep(.03, .13 + vHs*.04, ph), 0.0, 1.0);
        float bare = temperate * win * smoothstep(14.0, 7.0, Tp + 6.0*win);
        vSea = vec3(max(aut, bare*.7), bare, max(smoothstep(.5, -3.0, Tp), uSnow*smoothstep(8.0, 2.0, Tp)));
      }
      float bend = ${G.gfx===0 ? '0.0' : 'max(0.0, position.y-1.2) * .018'};
      transformed.x += sin(uTime*1.7 + ip.x*.37 + ip.y*.21 + position.y*.4) * bend;
      transformed.z += cos(uTime*1.3 + ip.x*.23 - ip.y*.3) * bend * .7;`);
  };
  return m;
}
function flora(){
  if(FLORA && FLORA.gfx===G.gfx) return FLORA;
  const tex=floraAtlas(), R=rng(99);
  const mat=floraMat(tex);
  const depth=new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking, map:tex, alphaTest:.45, side:T.DoubleSide});
  FLORA={tex, mat, depth,
    geo:{ oak:[makeBroadleaf(R),makeBroadleaf(R),makeBroadleaf(R,true)], fir:[makeFir(R),makeFir(R)], palm:[makePalm(R),makePalm(R)], bush:[makeBushGeo(R),makeBushGeo(R)] },
    lod:{ oak:makeBroadleaf(R,false,true), fir:makeFir(R,true), palm:makePalm(R,true) },
    gfx:G.gfx, berryGeo:new T.IcosahedronGeometry(.032,1), berryMat:new T.MeshLambertMaterial({color:0xb3121f, emissive:0x220000})};
  return FLORA;
}
function treeKind(x,z,h,R){
  const lon=toLon(x), lat=toLat(z), al=Math.abs(lat), cold=coldAt(lat), mt=mountainAt(lon,lat), ds=desertAt(lon,lat);
  if(al<33 && (h<WATER_Y+1.2 || ds>.3) && R()<.85) return 'palm';
  if(al<16 && R()<.25) return 'palm';
  if(cold>.1 || mt>.5 || al>55) return R()<.9?'fir':'oak';
  if(al>44) return R()<.45?'fir':'oak';
  return R()<.12?'fir':'oak';
}
/* ---------- Sammel-Zeichnen: alle Bäume / alles Gras einer Sorte in EINEM Zeichenaufruf ----------
   Jede Sorte hat Daten pro Weltstück; gezeichnet wird nur, was nahe der Kamera liegt. */
function makeBatch(geo, mat, opt){ return {geo, mat, opt:opt||{}, chunks:new Map(), im:null, cap:0, dirty:true}; }
function batchAdd(B, ck, matrix, color){
  let c=B.chunks.get(ck); if(!c){ c={m:new Float32Array(16*32), c:new Float32Array(3*32), n:0, cx:0, cz:0}; const [i,j]=ck.split(',').map(Number); c.cx=(i+.5)*TILE-G.NX/2; c.cz=(j+.5)*TILE-G.NZ/2; B.chunks.set(ck,c); }
  if(c.n*16>=c.m.length){ const m2=new Float32Array(c.m.length*2); m2.set(c.m); c.m=m2; const c2=new Float32Array(c.c.length*2); c2.set(c.c); c.c=c2; }
  matrix.toArray(c.m, c.n*16); if(color) color.toArray(c.c, c.n*3); else c.c.fill(1, c.n*3, c.n*3+3);
  B.dirty=true; return {B, c, i:c.n++};
}
function batchHide(ref){ ref.c.m.fill(0, ref.i*16, ref.i*16+16); ref.B.dirty=true; }
const _fr=new T.Frustum(), _fm=new T.Matrix4(), _sp=new T.Sphere();
function batchFill(im, list){ const M=im.instanceMatrix.array, C=im.instanceColor.array; let o=0;
  for(const c of list){ M.set(c.m.subarray(0,c.n*16), o*16); C.set(c.c.subarray(0,c.n*3), o*3); o+=c.n; }
  im.count=o; im.instanceMatrix.needsUpdate=true; im.instanceColor.needsUpdate=true; }
function batchRefill(B, cx, cz, R){
  let n=0, nl=0; const list=[], far=[], shl=[]; let sn=0; const LR=[45,65,95,130][G.gfx];
  G.cam.updateMatrixWorld(); _fm.multiplyMatrices(G.cam.projectionMatrix, G.cam.matrixWorldInverse); _fr.setFromProjectionMatrix(_fm);
  for(const c of B.chunks.values()){ const dx=c.cx-cx, dz=c.cz-cz, rr=R+TILE*.75, d2=dx*dx+dz*dz; if(d2>=rr*rr) continue;
    _sp.center.set(c.cx, getH(c.cx,c.cz)+4, c.cz); _sp.radius=TILE*.75+8;
    if(_fr.intersectsSphere(_sp)){ if(B.opt.lod && d2 > LR*LR){ far.push(c); nl+=c.n; } else { list.push(c); n+=c.n; } }
    if(B.opt.shadow && G.gfx>=1 && d2 < (56+TILE*.75)**2){ shl.push(c); sn+=c.n; } }
  // eigene, unsichtbare Schattenwerfer nur nahe der Kamera (Schatten reichen ohnehin nur ~40 Einheiten)
  if(B.opt.shadow && G.gfx>=1){
    if(!B.sh || sn>B.shCap){ if(B.sh){ G.scene.remove(B.sh); B.sh.dispose(); } B.shCap=Math.max(128,Math.ceil(sn*1.5));
      B.sh=new T.InstancedMesh(B.geo, B.shMat||(B.shMat=new T.MeshBasicMaterial({colorWrite:false, depthWrite:false})), B.shCap);
      B.sh.instanceColor=new T.InstancedBufferAttribute(new Float32Array(B.shCap*3),3); B.sh.frustumCulled=false; B.sh.castShadow=true; B.sh.customDepthMaterial=B.opt.depth; B.sh.layers.set(1); G.sun.shadow.camera.layers.enable(1); G.scene.add(B.sh); }
    batchFill(B.sh, shl);
  }
  if(!B.im || n>B.cap){
    if(B.im){ G.scene.remove(B.im); B.im.dispose(); }
    B.cap=Math.max(256, Math.ceil(n*1.5)); const im=new T.InstancedMesh(B.geo, B.mat, B.cap);
    im.instanceColor=new T.InstancedBufferAttribute(new Float32Array(B.cap*3),3); im.frustumCulled=false;
    im.castShadow=false; im.receiveShadow=true;
    G.scene.add(im); B.im=im;
  }
  batchFill(B.im, list); B.dirty=false;
  if(B.opt.lod){
    if(!B.imL || nl>B.capL){ if(B.imL){ G.scene.remove(B.imL); B.imL.dispose(); } B.capL=Math.max(256,Math.ceil(nl*1.5));
      B.imL=new T.InstancedMesh(B.opt.lod, B.mat, B.capL); B.imL.instanceColor=new T.InstancedBufferAttribute(new Float32Array(B.capL*3),3); B.imL.frustumCulled=false; B.imL.receiveShadow=true; G.scene.add(B.imL); }
    batchFill(B.imL, far);
  }
}
function batchesUpdate(force){
  if(!G.batches) return;
  const s=G.camS, ci=Math.floor((s.x+G.NX/2)/TILE), cj=Math.floor((s.z+G.NZ/2)/TILE);
  const fogR=G.scene.fog.far+8, key=ci+','+cj+','+Math.round(fogR/32)+','+Math.round(s.yaw*6)+','+(G.farView?1:0)+','+(G.follow?1:0);
  const moved = key!==G.batchKey; G.batchKey=key;
  for(const k in G.batches){ const B=G.batches[k]; if(!(moved||B.dirty||force)) continue;
    const R = B.opt.decor ? Math.min(fogR*(G.follow?.4:.6), TILE*[1.6,2.6,3.2,4.4][G.gfx]) : Math.min(fogR, TILE*6);   // Schulterperspektive: Gras/Blumen nur in der Nähe
    batchRefill(B, s.x, s.z, R);
    if(B.im) B.im.visible = !(G.farView && B.opt.decor); }
}
function batch(key, geo, mat, opt){ if(!G.batches) G.batches={}; return G.batches[key] || (G.batches[key]=makeBatch(geo, mat, opt)); }
const chunkKeyOf = (x,z) => Math.floor((x+G.NX/2)/TILE)+','+Math.floor((z+G.NZ/2)/TILE);
function treeInstance(x,z,force){
  const R=G.rand, h=getH(x,z), F=flora();
  const kind=force||treeKind(x,z,h,R), variants=F.geo[kind], vi=(R()*variants.length)|0;
  const B = batch('tree:'+kind+vi, variants[vi], F.mat, {shadow:true, depth:F.depth, lod:F.lod[kind]});
  const sc=(kind==='fir'?.72:kind==='palm'?.85:.8)+R()*.35;
  const o=new T.Object3D(); o.position.set(x,h-.1,z); o.rotation.y=R()*6.28; o.scale.setScalar(sc); o.updateMatrix();
  const c=new T.Color(), v=.85+R()*.25; c.setRGB(v*(.95+R()*.12), v, v*(.9+R()*.1));
  const d=new T.Object3D(); d.inst=batchAdd(B, chunkKeyOf(x,z), o.matrix, c); d.o=o; d.sc=sc; d.tk=kind; return d;
}
const civTexCache = {};
/* Steinzeit: keine Länderflaggen, sondern ein Fell-Banner mit dem Stammeszeichen der Zivilisation (mit Ocker/Farbe aufgemalt) */
const stoneAge = () => !G || !G.age || G.age<=1;
function hideCanvas(W,H,seed){
  const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'); let s=seed||7; const rnd=()=>((s=(s*16807)%2147483647)/2147483647);
  // unregelmäßiger Fellumriss
  x.beginPath(); const pts=[]; const N=28;
  for(let i=0;i<N;i++){ const t=i/N, edge=Math.floor(t*4); let px,py; const k=(t*4)%1;
    if(edge===0){ px=6+k*(W-12); py=4; } else if(edge===1){ px=W-6; py=4+k*(H-8); } else if(edge===2){ px=W-6-k*(W-12); py=H-4; } else { px=6; py=H-4-k*(H-8); }
    const j=edge===0?2:9; pts.push([px+(rnd()-.5)*j*(edge%2?2:1), py+(rnd()-.5)*j*(edge%2?1:2)]); }
  pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.closePath();
  const gr=x.createLinearGradient(0,0,W,H); gr.addColorStop(0,'#c39a66'); gr.addColorStop(.5,'#b08452'); gr.addColorStop(1,'#8e6438');
  x.fillStyle=gr; x.fill(); x.save(); x.clip();
  for(let i=0;i<900;i++){ x.fillStyle=`rgba(${rnd()<.5?'70,45,20':'235,210,170'},${.05+rnd()*.08})`; const r=1+rnd()*5; x.beginPath(); x.ellipse(rnd()*W,rnd()*H,r*2,r,rnd()*3,0,6.3); x.fill(); }
  const vg=x.createRadialGradient(W/2,H/2,Math.min(W,H)*.25,W/2,H/2,Math.max(W,H)*.65); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(40,22,8,.55)'); x.fillStyle=vg; x.fillRect(0,0,W,H);
  x.restore();
  x.beginPath(); pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1])); x.closePath();   // Umriss neu (sonst wird der letzte Fellfleck als Ring nachgezogen)
  x.strokeStyle='rgba(60,36,14,.9)'; x.lineWidth=3; x.stroke();
  // Lederschnüre am Mast
  x.fillStyle='#3a2410'; for(let i=0;i<4;i++){ x.fillRect(2,14+i*(H-28)/3,10,4); }
  return [c,x];
}
function civFlagTex(civ, color){
  const key = (stoneAge()?'S':'')+civ[0]+color;
  if(civTexCache[key]) return civTexCache[key];
  if(stoneAge()){
    const W=256, H=184, [c,x]=hideCanvas(W,H,(civ[0].charCodeAt(0)*131+civ[0].length*17)|0);
    const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; t.anisotropy=8; civTexCache[key]=t;
    const hex='#'+color.toString(16).padStart(6,'0');
    // Farbstreifen oben und unten wie aufgemalt
    x.globalAlpha=.85; x.fillStyle=hex; x.fillRect(16,14,W-34,9); x.fillRect(16,H-24,W-34,9); x.globalAlpha=1;
    // Stammeszeichen der Steinzeit-Kultur (Stierkopf, Speerspitze, Steinkreis …) mit Ocker und Kohle aufs Fell gemalt – keine moderne Flagge
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="4 5 22 23" width="176" height="184"><filter id="p"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="0.9" xChannelSelector="R" yChannelSelector="G"/></filter><g filter="url(#p)">'+(EE.stoneSym?EE.stoneSym(civ):'')+'</g></svg>';
    const img=new Image(); img.onload=()=>{
      x.save(); x.globalAlpha=.9; x.shadowColor='rgba(30,15,5,.5)'; x.shadowBlur=2; x.drawImage(img, W/2-66+6, H/2-69, 132, 138); x.restore();
      t.needsUpdate=true; };
    img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
    return t;
  }
  if(civTexCache[key]) return civTexCache[key];
  const c=document.createElement('canvas'); c.width=128; c.height=96; const x=c.getContext('2d');
  x.fillStyle='#'+color.toString(16).padStart(6,'0'); x.fillRect(0,0,128,96);
  const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; civTexCache[key]=t;
  const body=civ[2].replace(/cp/g,'cpf').split('M0 0H30V34L15 27L0 34Z').join('M0 0H30V36H0Z').replace(/<path d="M0 0H30V36H0Z" fill="none"[^>]*\/>/,'');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 3 30 27" preserveAspectRatio="none">'+body+'</svg>';
  const img=new Image(); img.onload=()=>{ x.clearRect(0,0,128,96); x.drawImage(img,0,0,128,96); t.needsUpdate=true; };
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  return t;
}
const FLAG_T = {value:0};
function clothMat(opts){
  const m = new T.MeshLambertMaterial(Object.assign({side:T.DoubleSide}, opts));
  m.onBeforeCompile = sh => {
    sh.uniforms.uTime = FLAG_T;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader
      .replace('#include <beginnormal_vertex>', `
        float fx = uv.x;                                  // 0 = am Mast, 1 = frei
        float ph = position.x*4.2 - uTime*6.0 + position.y*1.3;
        float amp = .16*fx*fx + .03*fx;
        float dz = cos(ph)*4.2*amp;
        vec3 objectNormal = normalize(vec3(-dz, 0.0, 1.0));
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif`)
      .replace('#include <begin_vertex>', `vec3 transformed = vec3(position);
        transformed.z += sin(ph)*amp + sin(position.x*9.0 - uTime*11.0)*.025*fx;
        transformed.y -= fx*fx*.06*(1.0+.5*sin(uTime*2.3));`);
  };
  return m;
}
function clothGeo(w,h){ const g=new T.PlaneGeometry(w,h,14,8); g.translate(w/2,0,0); return g; }
function civFlag(g, civ, color, x, y, z, h){
  const pole = mesh(GEO.box, mat(0x5a3818), x, y+h/2, z); pole.scale.set(.1,h,.1); g.add(pole);
  const fl = new T.Mesh(clothGeo(1.6,1.15), clothMat(stoneAge()?{map:civFlagTex(civ,color), alphaTest:.5}:{map:civFlagTex(civ,color)}));
  if(stoneAge()){ const top=mesh(GEO.box, mat(0xe8dcc4), x, y+h+.08, z); top.scale.set(.18,.16,.18); g.add(top); }   // Knochenkappe oben
  fl.position.set(x+.05, y+h-.62, z); fl.castShadow=true; g.add(fl);
  return fl;
}
let GLOW_TEX=null, SMOKE_TEX=null, FLAME_TEX=null;
function radialTex(inner, outer){ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const gr=x.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,inner); gr.addColorStop(1,outer); x.fillStyle=gr; x.fillRect(0,0,64,64); return new T.CanvasTexture(c); }
function makeCampfire(){
  geos();
  const g = new T.Group();
  if(MODELS.fire){ const m=modelMesh('fire', 1.7); m.material = MODELS.fire.glowMat || (MODELS.fire.glowMat=(()=>{ const x=MODELS.fire.mat.clone(); x.emissive=new T.Color(0x3a1200); return x; })()); g.add(m); }
  else for(let i=0;i<5;i++){ const s2=mesh(GEO.rock, mat(0x777777), Math.cos(i*1.26)*.42,.06,Math.sin(i*1.26)*.42); s2.scale.set(.16,.12,.16); g.add(s2); }
  // Echtes Feuer aus vielen leuchtenden Flammen-Partikeln statt fester Kegel (V1.78)
  if(!FLAME_TEX){ const c=document.createElement('canvas'); c.width=64; c.height=128; const x=c.getContext('2d');
    const gr=x.createRadialGradient(32,92,2,32,80,44); gr.addColorStop(0,'rgba(255,250,220,1)'); gr.addColorStop(.25,'rgba(255,210,90,.95)'); gr.addColorStop(.55,'rgba(255,120,20,.55)'); gr.addColorStop(1,'rgba(200,40,0,0)');
    x.fillStyle=gr; x.beginPath(); x.moveTo(32,4); x.bezierCurveTo(52,48,62,86,32,124); x.bezierCurveTo(2,86,12,48,32,4); x.fill();
    FLAME_TEX=new T.CanvasTexture(c); FLAME_TEX.colorSpace=T.SRGBColorSpace; }
  const flames=[]; for(let i=0;i<16;i++){ const sp=new T.Sprite(new T.SpriteMaterial({map:FLAME_TEX, blending:T.AdditiveBlending, depthWrite:false, transparent:true}));
    sp.userData={t:i/16, a:Math.random()*6.28, r:.05+Math.random()*.28, s:.55+Math.random()*.5}; g.add(sp); flames.push(sp); }
  const sparks=[]; for(let i=0;i<10;i++){ const sp=new T.Sprite(new T.SpriteMaterial({color:0xffc060, blending:T.AdditiveBlending, depthWrite:false, transparent:true}));
    sp.userData={t:Math.random(), a:Math.random()*6.28, v:.6+Math.random()}; sp.scale.set(.05,.05,1); g.add(sp); sparks.push(sp); }
  if(!GLOW_TEX){ GLOW_TEX=radialTex('rgba(255,170,60,.85)','rgba(255,120,20,0)'); SMOKE_TEX=radialTex('rgba(90,90,90,.55)','rgba(90,90,90,0)'); }
  const glow = new T.Sprite(new T.SpriteMaterial({map:GLOW_TEX, blending:T.AdditiveBlending, depthWrite:false, transparent:true}));
  glow.scale.set(3.2,3.2,1); glow.position.y=.6; g.add(glow);
  const smoke=[]; for(let i=0;i<5;i++){ const sp=new T.Sprite(new T.SpriteMaterial({map:SMOKE_TEX, depthWrite:false, transparent:true, opacity:.5})); sp.userData.t=i/5; g.add(sp); smoke.push(sp); }
  g.flames=flames; g.sparks=sparks; g.glow=glow; g.smoke=smoke;
  return g;
}
function animateFire(fx, t, dt){
  // Flammen steigen auf, werden schmaler und verblassen; Funken fliegen hoch
  for(const sp of fx.flames){ const u=sp.userData; u.t+=dt*(1.6+u.s*.6); if(u.t>=1){ u.t-=1; u.a=Math.random()*6.28; u.r=.04+Math.random()*.26; u.s=.55+Math.random()*.5; }
    const k=u.t, w=u.s*(1-k*.75)*(.9+Math.sin(t*23+u.a*7)*.12), h=w*1.9;
    sp.position.set(Math.cos(u.a)*u.r*(1-k)+Math.sin(t*6+u.a)*.06*k, .22+k*1.15+h*.4, Math.sin(u.a)*u.r*(1-k));
    sp.scale.set(w,h,1); sp.material.opacity=Math.min(1,k*8)*(1-k)*.95;
    sp.material.color.setRGB(1, .75-.35*k, .45-.4*k); }
  for(const sp of fx.sparks){ const u=sp.userData; u.t+=dt*u.v*.5; if(u.t>=1){ u.t=0; u.a=Math.random()*6.28; }
    sp.position.set(Math.cos(u.a)*.25+Math.sin(t*3+u.a)*.2*u.t, .4+u.t*3.2, Math.sin(u.a)*.25+Math.cos(t*2.6+u.a)*.2*u.t); sp.material.opacity=(1-u.t)*(.5+.5*Math.sin(t*30+u.a*9)); }
  fx.glow.material.opacity = .75+Math.sin(t*17)*.12+Math.sin(t*5.3)*.1;
  for(const sp of fx.smoke){ sp.userData.t=(sp.userData.t+dt*.22)%1; const k=sp.userData.t;
    sp.position.set(Math.sin(k*5+sp.id)*.35*k, 1+k*4.5, Math.cos(k*4)*.25*k); const sc=.6+k*2.4; sp.scale.set(sc,sc,1); sp.material.opacity=.45*(1-k)*Math.min(1,k*5); }
}
// kleiner Fellwimpel in der Volksfarbe (Steinzeit)
function teamHideTex(color){ const key='H'+color; if(civTexCache[key]) return civTexCache[key];
  const [c,x]=hideCanvas(128,80,color%997+3); const hex='#'+color.toString(16).padStart(6,'0');
  x.globalAlpha=.88; x.fillStyle=hex; x.fillRect(14,24,104,32); x.globalAlpha=1;
  const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace; civTexCache[key]=t; return t; }
function teamFlag(g, color, x, y, z, h){
  const pole = mesh(GEO.box, mat(0x5a3818), x, y+h/2, z); pole.scale.set(.08,h,.08); g.add(pole);
  const flag = new T.Mesh(clothGeo(.75,.45), stoneAge()?clothMat({map:teamHideTex(color), alphaTest:.5}):clothMat({color})); flag.position.set(x+.04, y+h-.27, z); flag.castShadow=true; g.add(flag);
  return flag;
}

/* ---------- Objekte anlegen ---------- */
const cellIdx = (x,z) => { const i=Math.floor(x+G.NX/2), j=Math.floor(z+G.NZ/2); if(i<0||j<0||i>=G.NX||j>=G.NZ) return -1; const ti=(i/TILE)|0, tj=(j/TILE)|0; if(!G.tiles[tj*G.tnx+ti]) ensureTile(ti,tj); return j*G.NX+i; };
function freeCell(x,z){ const k=cellIdx(x,z); return k>=0 && !G.grid[k]; }

// Bäume brauchen Abstand zueinander (Lücken im Wald, Kronen überlappen nicht zu stark)
const TREE_GAP = 3.4;
function treeTooClose(x,z){ if(!G.treeHash) G.treeHash=new Map(); const ci=Math.floor(x/4), cj=Math.floor(z/4);
  for(let j=cj-1;j<=cj+1;j++) for(let i=ci-1;i<=ci+1;i++){ const a=G.treeHash.get(i+','+j); if(a) for(let k=0;k<a.length;k+=2){ if(Math.hypot(a[k]-x,a[k+1]-z)<TREE_GAP) return true; } } return false; }
function treeMark(x,z){ const key=Math.floor(x/4)+','+Math.floor(z/4); let a=G.treeHash.get(key); if(!a) G.treeHash.set(key,a=[]); a.push(x,z); }
function placeCluster(type, cx, cz, count, spread, minB){
  const R = G.rand;
  for(let i=0,tries=0;i<count && tries<count*6;tries++){
    const a=R()*6.28, r=Math.sqrt(R())*spread;
    const x=Math.round(cx+Math.cos(a)*r)+.5, z=Math.round(cz+Math.sin(a)*r)+.5;
    if(!freeCell(x,z) && !(type==='tree' && getH(x,z)>WATER_Y+3.5)) continue;   // Bergwald auch am unbegehbaren Hang
    if(G.bases.some(b=>Math.hypot(b.x-x,b.z-z)<(minB||6.5))) continue;
    if(getH(x,z)<WATER_Y+.3) continue;
    if(type==='tree' && treeTooClose(x,z)) continue;
    addRes(type,x,z); i++;
    if(type==='tree') treeMark(x,z);
  }
}
/* ===== Nachwachsender Wald (V2.25): gefällter Baum → Stumpf → nach 1–2 min ein Setzling → wächst in ~3 min zum vollen Baum.
   Nur wo vorher Wald war: nie in der Nähe von Häusern (7 m), Mauern (5 m) oder Wegen (2 m) – in Dorf und Burg wächst kein Wald. Dichter Wald wächst schneller. ===== */
let STUMP_GEO=null, STUMP_MAT=null;
function nearBuilt(x,z){ return G.builds.some(b=>!b.dead && Math.hypot(b.x-x,b.z-z)<(b.kind==='road'?2:b.seg?5:b.size*.5+7)) || insideWalls(x,z); }
// Liegt der Punkt in einem von Palisaden/Mauern umschlossenen Gebiet? (Flutfüllung über freie Felder; kommt sie nicht weit heraus → innen)
const wallInCache=new Map();
function insideWalls(x,z){
  if(!G.wallVer) return false;
  const k0=cellIdx(x,z); if(k0<0) return false;
  const key=k0+'@'+G.wallVer; if(wallInCache.has(key)) return wallInCache.get(key);
  if(wallInCache.size>4000) wallInCache.clear();
  const NX=G.NX, i0=k0%NX, j0=(k0/NX)|0, R=70, seen=new Set([k0]), q=[k0]; let out=false;
  while(q.length){ const k=q.pop(), i=k%NX, j=(k/NX)|0;
    if(Math.abs(i-i0)>=R || Math.abs(j-j0)>=R || seen.size>9000){ out=true; break; }
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){ const a=i+di, b=j+dj; if(a<0||b<0||a>=NX||b>=G.NZ){ out=true; break; } const n=b*NX+a; if(seen.has(n)) continue;
      if(wallCell(n)) continue; seen.add(n); q.push(n); }   // Tore zählen auch als Grenze
    if(out) break; }
  wallInCache.set(key,!out); return !out;
}
// nur Mauer-/Palisaden-/Turm-/Torfelder zählen als Grenze (Wasser und Häuser nicht)
let wallCellSet=null, wallCellVer=-1;
function wallCell(n){ if(wallCellVer!==G.wallVer){ wallCellSet=new Set(); for(const b of G.builds) if(!b.dead && b.seg && b.kind!=='road') for(const k of (b.seg.ks||b.cells||[])) if(k>=0) wallCellSet.add(k); wallCellVer=G.wallVer; } return wallCellSet.has(n); }
function treeFelled(r){
  if(nearBuilt(r.x,r.z)) return;   // im Dorf: kein Stumpf, nichts wächst nach
  if(!STUMP_GEO){ STUMP_GEO=new T.CylinderGeometry(.16,.22,.28,9); STUMP_MAT=new T.MeshLambertMaterial({color:0x6e4a2a}); }
  const st=new T.Mesh(STUMP_GEO, STUMP_MAT); st.position.set(r.x, getH(r.x,r.z)+.1, r.z); st.receiveShadow=true; G.scene.add(st);
  let near=0; for(const o of G.res){ if(o.alive && o.type==='tree' && Math.abs(o.x-r.x)<6 && Math.abs(o.z-r.z)<6) near++; }
  (G.regrow||(G.regrow=[])).push({x:r.x, z:r.z, k:r.mesh&&r.mesh.tk, st, t:G.t + (near>=6?55:near>=3?80:115) + G.rand()*30});
}
function updateRegrow(dt){
  G.rgT=(G.rgT||0)-dt; if(G.rgT>0) return; G.rgT=1;
  if(G.regrow) for(let i=G.regrow.length-1;i>=0;i--){ const e=G.regrow[i];
    const k=cellIdx(e.x,e.z);
    // sobald in der Nähe gebaut wird: Stumpf sofort weg, hier wächst kein Wald mehr
    if(k<0 || G.grid[k]===1 || (G.road && G.road[k]) || nearBuilt(e.x,e.z)){ G.scene.remove(e.st); G.regrow.splice(i,1); continue; }
    if(G.t<e.t) continue;
    if(G.units.some(u=>!u.dead && Math.abs(u.x-e.x)<.7 && Math.abs(u.z-e.z)<.7)){ e.t=G.t+5; continue; }
    G.scene.remove(e.st); G.regrow.splice(i,1);
    if(G.resMod){ const q=resKey(e.x,e.z); delete G.resMod[q]; }
    if(G.grid[k]===2) G.grid[k]=0;
    const r=addRes('tree'+(e.k?':'+e.k:''), e.x, e.z); r.amt=0; r.grow=0; growTree(r,0);
    (G.growing||(G.growing=[])).push(r); }
  if(G.growing) for(let i=G.growing.length-1;i>=0;i--){ const r=G.growing[i]; if(!r.alive){ G.growing.splice(i,1); continue; }
    r.grow=Math.min(1, r.grow + 1/180); growTree(r, r.grow);
    if(r.grow>=1){ r.amt=r.max; G.growing.splice(i,1); } }
}
function growTree(r,g){ const d=r.mesh; if(!d || !d.o || !d.inst) return; const k=.12+.88*g;
  d.o.scale.setScalar(d.sc*k); d.o.updateMatrix(); d.o.matrix.toArray(d.inst.c.m, d.inst.i*16); d.inst.B.dirty=true; }
function addRes(type,x,z){
  let m, kind, amt;
  if(type.startsWith('tree')){ m=treeInstance(x,z,type.split(':')[1]); kind='wood'; amt=100; type='tree'; }
  else if(type==='bush'){ m=makeBush(G.rand); kind='food'; amt=125; }
  else if(type==='stone'){ m=makeRock(G.rand,'stone'); kind='stone'; amt=250; }
  else if(type==='gold'){ m=makeRock(G.rand,'gold'); kind='gold'; amt=250; }
  else if(type==='metal'){ m=makeRock(G.rand,'metal'); kind='metal'; amt=400; }
  else { m=makeOil(G.rand); kind='oil'; amt=1000; }
  m.position.set(x, getH(x,z), z);
  if(!m.inst) G.scene.add(m);
  const r = {type, kind, amt, max:amt, x, z, mesh:m, alive:true, r:.6};
  if(G.gfx<2 && m && m.traverse) m.traverse(o=>{ if(o.isMesh) o.castShadow=false; });   // Büsche, Steine, Erz: keine eigenen Schatten (spart den Schatten-Durchgang)
  { const k=cellIdx(x,z); if(k>=0 && !G.grid[k]) G.grid[k] = 2; }   // 2 = Baum/Stein: weich – Leute zwängen sich notfalls vorbei (V2.16)
  G.res.push(r);
  if(G.resMod){ const k=resKey(x,z); if(k in G.resMod){ r.amt=G.resMod[k]; if(r.amt<=0){ G.noFell=1; removeRes(r); G.noFell=0; } } }
  return r;
}
/* ---------- Wilde Tiere: Schafe (Europa/Asien), Elefanten (Afrika), Raubtiere Wolf, Löwe, Krokodil.
   Raubtiere greifen Menschen in ihrer Nähe an, Elefanten nur, wenn man sie angreift. Soldaten wehren sich;
   Jäger und Soldaten können sie erlegen (viel Nahrung). ---------- */
const ANIMAL = {
  sheep:   {food:140, speed:1.5},
  wolf:    {food:70,  speed:3.1, hp:45,  pred:true, aggro:8, leash:28, bite:6,  bcd:1.1, r:.4, name:'Wolf'},
  lion:    {food:130, speed:3.4, hp:95,  pred:true, aggro:9, leash:32, bite:12, bcd:1.4, r:.6, name:'Löwe'},
  croc:    {food:150, speed:2.4, hp:120, pred:true, aggro:4.5, leash:7, bite:16, bcd:1.8, r:.7, name:'Krokodil'},
  aurochs: {food:320, speed:2.2, hp:170, pred:false, aggro:0, leash:30, bite:13, bcd:1.5, r:.75, name:'Auerochse'},
  lioness: {food:110, speed:3.5, hp:75,  pred:true, aggro:9, leash:32, bite:10, bcd:1.3, r:.55, name:'Löwe'},
  cheetah: {food:60,  speed:4.6},
  turtle:  {food:50,  speed:.35},
  elephant:{food:700, speed:1.6, hp:420, pred:false, aggro:0, leash:40, bite:20, bcd:1.6, r:1.3, name:'Elefant'}
};
const PACKS = {}; let packN=0;
// Rudel wie in echt: Wölfe 3–6 Tiere, Löwen ein Löwe mit mehreren Löwinnen; sie bleiben zusammen und greifen gemeinsam an
function spawnPack(x,z,kind,n){ const id=++packN; const list=[];
  for(let i=0;i<n;i++){ const k = kind==='lion' && i>0 ? 'lioness' : kind; const a=G.rand()*6.28, r=G.rand()*3; const d=spawnDeer(x+Math.cos(a)*r, z+Math.sin(a)*r, k); if(d){ d.pack=id; d.hx=x; d.hz=z; list.push(d); } }
  PACKS[id]={list, tgt:null}; }
function animalHit(d, dmg, src){
  if(d.dead || d.hp==null) return;
  d.hp-=dmg; bloodFx(d.x,d.z,4,G.rand()<.3?.3:0); if(src && !src.dead) d.angry=src;
  if(d.hp<=0) animalDie(d);
}
function animalDie(d){
  d.hp=0; d.dead=true; d.angry=null; const m=d.mesh; sfxAt('deer',d.x,d.z);
  if(m.userData.croc){ m.rotation.z=Math.PI; m.position.y=getH(d.x,d.z)+.25; }
  else { m.rotation.z=Math.PI/2; m.position.y=getH(d.x,d.z)+(m.userData.deadY!=null?m.userData.deadY:.25); if(m.quad) poseAnimal(m,'idle',0); }
}
function updateBeast(d,dt){
  const PK=d.pack&&PACKS[d.pack]; if(PK && PK.list[0]===d){ PK.dr=(PK.dr||G.rand()*6.28)+(G.rand()-.5)*dt*.3; const nx=d.hx+Math.cos(PK.dr)*dt*.25, nz=d.hz+Math.sin(PK.dr)*dt*.25; if(freeCell(nx,nz)) for(const o of PK.list){ o.hx=nx; o.hz=nz; } }
  const ST=ANIMAL[d.animal], m=d.mesh; let tgt=null;
  d.bt=(d.bt||0)-dt; d.scanT=(d.scanT||0)-dt;
  if(d.angry && (d.angry.dead || !alive(d.angry) || d.angry.inside || Math.hypot(d.angry.x-d.x,d.angry.z-d.z)>ST.leash)) d.angry=null;
  if(d.angry) tgt=d.angry;
  const P=d.pack && PACKS[d.pack]; if(!tgt && P && P.tgt && !P.tgt.dead && alive(P.tgt) && !P.tgt.inside && Math.hypot(P.tgt.x-d.hx,P.tgt.z-d.hz)<ST.leash) tgt=P.tgt;
  else if(d.pred && d.hp>d.maxHp*.3){
    if(d.scanT<=0){ d.scanT=.6; d.prey=null; let bd=ST.aggro;
      for(const u of G.units){ if(u.dead || u.inside) continue; const dd=Math.hypot(u.x-d.x,u.z-d.z); if(dd<bd && Math.hypot(u.x-d.hx,u.z-d.hz)<ST.leash){ bd=dd; d.prey=u; } } }
    if(d.prey && !d.prey.dead && !d.prey.inside) tgt=d.prey;
  }
  if(P) P.tgt = tgt || (P.tgt && !P.tgt.dead && alive(P.tgt) ? P.tgt : null);
  let moving=false;
  if(tgt){
    const dx=tgt.x-d.x, dz=tgt.z-d.z, dist=Math.hypot(dx,dz), reach=ST.r+.7;
    if(dist>reach){ const sp=ST.speed*dt; d.x+=dx/dist*Math.min(sp,dist-reach); d.z+=dz/dist*Math.min(sp,dist-reach); moving=true; }
    else if(d.bt<=0){ d.bt=ST.bcd; damage(tgt, ST.bite*(.8+G.rand()*.4), null); sfxAt('deer',d.x,d.z,.8);
      if(tgt.owner===0 && !G.beastT){ G.beastT=10; EE.toast('⚠️ Ein '+ST.name+' greift deine Leute an!'); EE.vib(40); } }
    m.rotation.y=Math.atan2(dx,dz); d.tx=d.x; d.tz=d.z; d.wait=1;
  } else if(Math.hypot(d.hx-d.x,d.hz-d.z)>ST.leash*.6){ d.tx=d.hx; d.tz=d.hz; d.wait=0; }   // zurück ins Revier
  if(G.beastT) G.beastT=Math.max(0,G.beastT-dt);
  if(!tgt) return false;                          // sonst normal umherstreifen
  d.phase += dt*(moving?10:2);
  m.position.set(d.x, getH(d.x,d.z), d.z);
  if(m.quad && m.visible) poseAnimal(m, moving?'move':'idle', d.phase);
  if(m.userData.swim) m.userData.swim.ph += dt*(moving?6:1);
  return true;
}
function spawnDeer(x,z,kind){
  if(!freeCell(x,z) || getH(x,z)<WATER_Y+.3) return;
  if(!kind){ const lon=toLon(x), lat=toLat(z), africa = lon>-20 && lon<55 && lat<33, warm = Math.abs(lat)<28;
    const rr=G.rand(), temperate=Math.abs(lat)>=28 && Math.abs(lat)<58, asiaEu=lon>-15 && lon<140;
    kind = rr<.3 ? 'rabbit' : (africa||warm) ? (africa && rr>.9 ? 'elephant' : 'antelope') : (temperate && asiaEu && rr>.62) ? 'sheep' : 'horse'; }
  const m = makeDeer(kind); m.position.set(x,getH(x,z),z); m.rotation.y = G.rand()*6.28;
  G.scene.add(m);
  const rab = kind==='rabbit', ST=ANIMAL[kind]||{}, amt = ST.food || (rab?35:kind==='horse'?160:120);
  const d = {type:'deer', animal:kind, kind:'food', amt, max:amt, x, z, mesh:m, alive:true, dead:false, r:ST.r||(rab?.3:.5),
             tx:x, tz:z, wait:G.rand()*4, phase:G.rand()*6, deer:true, speed:ST.speed||(rab?2.4:kind==='horse'?1.9:1.5), hx:x, hz:z};
  if(ST.hp){ d.hp=d.maxHp=ST.hp; d.pred=!!ST.pred; d.big=true; }
  G.deer.push(d); G.res.push(d); return d;
}
function spawnWorker(owner,x,z,kind){
  kind = kind||'worker';
  const m = (kind==='worker'||kind==='kid') ? makeWorker(COLORS[owner]) : kind==='ox' ? (makeDeer('ox')||makeWorker(COLORS[owner])) : makeSoldier(kind, COLORS[owner]);
  m.position.set(x,getH(x,z),z);
  G.scene.add(m);
  const ring = new T.Mesh(GEO.ring, new T.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.6, depthWrite:false}));
  ring.visible=false; G.scene.add(ring);
  const U = UNIT[kind];
  const u = {kind, hp:U.hp, maxHp:U.hp, cd:0, sex:(m.userData.key==='cavef'?'f':'m'), owner, x, z, mesh:m, ring, state:'idle', path:null, pi:0, carry:{type:null,amt:0},
             target:null, site:null, speed:U.speed, phase:Math.random()*6, face:0, repath:0, gt:0, lastType:null};
  if(kind==='worker') u.age = G.rand()*AGE_OLD*.45;          // Erwachsene starten verschieden alt
  if(kind!=='worker' && kind!=='kid' && kind!=='ox' && hasTech(owner,'paint')){ u.maxHp=Math.round(u.maxHp*1.15); u.hp=u.maxHp; }
  if(G.farView) m.visible=false;
  G.units.push(u);
  G.players[owner].pop++;
  return u;
}
function footprint(kind,x,z){
  const s = BUILD[kind].size, cells=[];
  const x0 = Math.round(x - s/2), z0 = Math.round(z - s/2);
  for(let j=0;j<s;j++) for(let i=0;i<s;i++) cells.push(cellIdx(x0+i+.5, z0+j+.5));
  return {cells, cx:x0+s/2, cz:z0+s/2};
}
// Teile, die über die Grundfläche hinausragen (Felle, Gestelle, Feuer, Vordächer), sperren ihre Felder auch –
// sonst laufen Bauern mitten hindurch und bleiben daran hängen
function meshCells(m, own){
  m.updateMatrixWorld(true); const set=new Set(own), out=[], bb=new T.Box3(), y0=m.position.y;
  m.traverse(o=>{ if(!o.isMesh || !o.geometry) return;
    bb.setFromObject(o); if(bb.isEmpty() || bb.min.y-y0>1.2) return;               // hoch hängende Teile (Fahnentuch) sperren nichts
    const x0=Math.floor(bb.min.x+.25), x1=Math.floor(bb.max.x-.25), z0=Math.floor(bb.min.z+.25), z1=Math.floor(bb.max.z-.25);
    if(x1<x0 || z1<z0 || (x1-x0+1)*(z1-z0+1)>400) return;
    for(let z=z0;z<=z1;z++) for(let x=x0;x<=x1;x++){ const k=cellIdx(x+.5,z+.5); if(k>=0 && !set.has(k) && !G.grid[k]){ set.add(k); out.push(k); G.grid[k]=1; } } });
  return out;
}
// freier Platz in der Nähe (für Marschziele, die mitten in einem Gebäude liegen); used = schon vergebene Felder
function freeSpot(x,z,used){
  const k0=cellIdx(x,z); if(k0>=0 && !G.grid[k0] && !(used&&used.has(k0))){ used&&used.add(k0); return [x,z]; }
  const NX=G.NX, i=Math.floor(x+NX/2), j=Math.floor(z+G.NZ/2);
  for(let r=1;r<16;r++){ let best=-1, bd=1e9;
    for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){ if(Math.max(Math.abs(di),Math.abs(dj))!==r) continue;
      const k=cellIdx(i+di-NX/2+.5, j+dj-G.NZ/2+.5); if(k<0 || G.grid[k] || (used&&used.has(k))) continue; const d=di*di+dj*dj; if(d<bd){ bd=d; best=k; } }
    if(best>=0){ used&&used.add(best); return [best%NX-NX/2+.5, ((best/NX)|0)-G.NZ/2+.5]; } }
  return [x,z];
}
function addBuilding(kind, owner, x, z, done){
  const fp = footprint(kind,x,z);
  const d = BUILD[kind], col = COLORS[owner];
  const m = kind==='tc'?makeTC(col, G.players[owner] && G.players[owner].civ, owner):kind==='house'?makeHouse(col, owner):kind==='barracks'?makeBarracks(col, owner):kind==='tower'?makeTower(col, owner):kind==='market'?makeMarket(col, owner):kind==='elder'?makeElder(col, owner):makeStore(col, owner);
  let hy = 0; for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,0]]) hy += getH(fp.cx+dx*d.size/2*.8, fp.cz+dz*d.size/2*.8);
  m.position.set(fp.cx, hy/5-.05, fp.cz);
  G.scene.add(m);
  for(const k of fp.cells) if(k>=0) G.grid[k]=1;
  const ring = new T.Mesh(new T.RingGeometry(d.size*.62, d.size*.7, 32), new T.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.85, depthWrite:false}));
  ring.rotation.x = -Math.PI/2; ring.position.set(fp.cx, m.position.y+.08, fp.cz); ring.visible=false; G.scene.add(ring);
  const b = {kind, owner, x:fp.cx, z:fp.cz, size:d.size, mesh:m, ring, cells:fp.cells, built:done?1:0, hp:done?d.hp:1, queue:[], qT:0, slow:!done && kind!=='tc' && kind!=='road' && G.reg && !friendlyLand(owner,fp.cx,fp.cz)};
  if(!done){ m.scale.y = .25; m.traverse(o=>{ if(o.material && o.isMesh){ o.material = o.material.clone(); o.material.transparent=true; o.material.opacity=.55; } }); }
  else if(d.pop) G.players[owner].popCap += (d.pop + (kind==='house' && hasTech(owner,'fire') ? 1 : 0));
  if(kind!=='road') b.cells = b.cells.concat(meshCells(m, fp.cells));
  G.builds.push(b);
  if(kind==='tc' && G.borderGrp){ if(done) claimRegion(b); buildBorders(); }
  return b;
}

// Bodenbewuchs: Grasbüschel, Blumen, Sträucher und Steinchen – alles instanziert (billig zu zeichnen)
let TUFT_GEO=null, TUFT_MAT=null, FLOWER_GEO=null, FLOWER_MAT=null, PEBBLE_GEO=null, PEBBLE_MAT=null;
function decorAssets(){
  if(TUFT_GEO) return;
  const P=[], C=[], N=[];
  for(let k=0;k<7;k++){ const a=k/7*6.283+Math.random()*.5, r=.05+Math.random()*.1, h=.28+Math.random()*.3, lean=.12+Math.random()*.15;
    const bx=Math.cos(a)*r, bz=Math.sin(a)*r, px=-Math.sin(a)*.035, pz=Math.cos(a)*.035, tx=bx+Math.cos(a)*lean, tz=bz+Math.sin(a)*lean;
    P.push(bx-px,0,bz-pz, bx+px,0,bz+pz, tx,h,tz); C.push(.35,.5,.2, .35,.5,.2, .9,1,.6); N.push(0,1,0, 0,1,0, 0,1,0); }
  TUFT_GEO=new T.BufferGeometry(); TUFT_GEO.setAttribute('position',new T.Float32BufferAttribute(P,3)); TUFT_GEO.setAttribute('color',new T.Float32BufferAttribute(C,3)); TUFT_GEO.setAttribute('normal',new T.Float32BufferAttribute(N,3));
  TUFT_MAT=new T.MeshLambertMaterial({vertexColors:true, side:T.DoubleSide});
  FLOWER_GEO=new T.IcosahedronGeometry(.07,0); FLOWER_MAT=new T.MeshBasicMaterial({color:0xffffff});
  PEBBLE_GEO=new T.DodecahedronGeometry(.18,0); PEBBLE_GEO.scale(1,.55,1); PEBBLE_MAT=new T.MeshLambertMaterial({color:0x8d8a84});
}
function addDecorChunk(x0,z0,CH,R){
  decorAssets();
  const nT=[110,300,480,720][G.gfx], nS=[6,16,24,36][G.gfx], nP=[12,30,45,64][G.gfx];
  const F=flora();
  const BT=batch('d:tuft',TUFT_GEO,TUFT_MAT,{decor:true}), BF=batch('d:fl',FLOWER_GEO,FLOWER_MAT,{decor:true}), BS=batch('d:shrub',F.geo.bush[0],F.mat,{decor:true,shadow:true,depth:F.depth}), BP=batch('d:peb',PEBBLE_GEO,PEBBLE_MAT,{decor:true});
  const ck=chunkKeyOf(x0+CH/2, z0+CH/2);
  const m4=new T.Matrix4(), q=new T.Quaternion(), sv=new T.Vector3(), p=new T.Vector3(), e=new T.Euler(), c=new T.Color();
  const fcols=[0xfff1a8,0xff9fc4,0xb9a3ff,0xffffff,0xffd36b]; let gi=0, si=0, pi=0;
  for(let k=0;k<nT*2 && gi<nT;k++){
    const x=x0+R()*CH, z=z0+R()*CH, h=getH(x,z);
    if(h<WATER_Y+.35 || h>WATER_Y+13) continue;
    const lon=toLon(x), lat=toLat(z), ds=desertAt(lon,lat), cold=coldAt(lat); if(cold>.75) continue;
    if(G.bases.some(b=>Math.hypot(b.x-x,b.z-z)<6)) continue;
    if(ds>.5 && R()<.75) continue;
    e.set(0,R()*6.28,0); q.setFromEuler(e); const sc=.8+R()*.9; sv.set(sc,sc*(.8+R()*.5),sc); p.set(x,h-.02,z);
    m4.compose(p,q,sv);
    const v=.8+R()*.35; if(ds>.3) c.setRGB(1.3*v,1.1*v,.55*v); else if(h>WATER_Y+6) c.setRGB(.85*v,.95*v,.7*v); else c.setRGB(v*(.9+R()*.15), v, v*.85);
    batchAdd(BT, ck, m4, c); gi++;
    if(ds<.3 && h<WATER_Y+8 && R()<.2){ p.set(x+.1,h+.25,z+.08); sv.set(1,1,1); m4.compose(p,q,sv); batchAdd(BF, ck, m4, c.setHex(fcols[(R()*5)|0])); }
    if(si<nS && ds<.4 && R()<.03){ e.set(0,R()*6.28,0); q.setFromEuler(e); const s2=.45+R()*.35; sv.set(s2,s2*(.8+R()*.4),s2); p.set(x,h-.05,z); m4.compose(p,q,sv); batchAdd(BS, ck, m4, c.setRGB(1,1,1)); si++; }
    if(pi<nP && R()<.05){ e.set(R(),R()*6.28,R()); q.setFromEuler(e); const s3=.4+R()*1.1; sv.set(s3,s3,s3); p.set(x,h,z); m4.compose(p,q,sv); batchAdd(BP, ck, m4, c.setRGB(1,1,1)); pi++; }
  }
}

/* ============================================================
   WEGFINDUNG (A*)
   ============================================================ */
function nearestFree(i,j){
  const NX=G.NX, NZ=G.NZ;
  ensureArea(i-NX/2-14, j-NZ/2-14, i-NX/2+14, j-NZ/2+14);
  for(let r=0;r<14;r++){
    let best=-1, bd=1e9;
    for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){
      if(Math.max(Math.abs(di),Math.abs(dj))!==r) continue;
      const a=i+di, b=j+dj; if(a<0||b<0||a>=NX||b>=NZ) continue;
      if(!G.grid[b*NX+a]){ const d=di*di+dj*dj; if(d<bd){bd=d;best=b*NX+a;} }
    }
    if(best>=0) return best;
  }
  return -1;
}
function findPath(x0,z0,x1,z1,relax){
  const NX=G.NX, NZ=G.NZ, PW=G.pfW;
  // Ziel zu weit weg: Zwischenziel in Richtung des Ziels (der Rest wird später neu berechnet)
  const dd=Math.hypot(x1-x0,z1-z0), maxR=PW/2-30;
  if(dd>maxR){ const k=maxR/dd; x1=x0+(x1-x0)*k; z1=z0+(z1-z0)*k; }
  let s = cellIdx(x0,z0), t = cellIdx(x1,z1);
  if(s<0||t<0) return null;
  if(G.grid[s]===1) s = nearestFree(s%NX, (s/NX)|0);
  if(G.grid[t]) t = nearestFree(t%NX, (t/NX)|0);
  if(s<0||t<0) return null;
  if(s===t) return [[x1,z1]];
  const si=s%NX, sj=(s/NX)|0, ti=t%NX, tj=(t/NX)|0;
  const ox = clamp(Math.round((si+ti)/2)-PW/2, 0, Math.max(0,NX-PW)), oz = clamp(Math.round((sj+tj)/2)-PW/2, 0, Math.max(0,NZ-PW));
  ensureArea(ox-NX/2, oz-NZ/2, ox+PW-1-NX/2, oz+PW-1-NZ/2);
  const L = (i,j)=> (j-oz)*PW+(i-ox);
  const st = ++G.pfStamp, g=G.pfG, from=G.pfF, seen=G.pfS, closed=G.pfC;
  const heap = [], hp = (k,f)=>{ heap.push([f,k]); let i=heap.length-1; while(i>0){ const p=(i-1)>>1; if(heap[p][0]<=heap[i][0]) break; [heap[p],heap[i]]=[heap[i],heap[p]]; i=p; } };
  const pop = ()=>{ const top=heap[0], last=heap.pop(); if(heap.length){ heap[0]=last; let i=0; for(;;){ const l=i*2+1, r=l+1; let m=i; if(l<heap.length&&heap[l][0]<heap[m][0]) m=l; if(r<heap.length&&heap[r][0]<heap[m][0]) m=r; if(m===i) break; [heap[m],heap[i]]=[heap[i],heap[m]]; i=m; } } return top; };
  const hfun = (i,j) => { const dx=Math.abs(i-ti), dz=Math.abs(j-tj); return (dx+dz)+(1.414-2)*Math.min(dx,dz); };
  const ls=L(si,sj); g[ls]=0; seen[ls]=st; from[ls]=-1; hp(ls,hfun(si,sj));
  let it=0, found=-1, best=ls, bestH=hfun(si,sj);
  while(heap.length && it++<40000){
    const [,lk] = pop(); if(closed[lk]===st) continue; closed[lk]=st;
    const ki=lk%PW+ox, kj=((lk/PW)|0)+oz;
    if(ki===ti && kj===tj){ found=lk; break; }
    for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){
      if(!di&&!dj) continue;
      const a=ki+di, b=kj+dj; if(a<ox||b<oz||a>=ox+PW||b>=oz+PW||a>=NX||b>=NZ) continue;
      // relax: eingeklemmt zwischen Bäumen/Steinen – Hindernisse sind teuer statt verboten, so findet der Bauer heraus
      // 1 = fest (Gebäude, Mauer, Wasser, Steilhang), 2 = weich (Baum, Busch, Stein): wird lieber umgangen, ist aber passierbar
      const blk=G.grid[b*NX+a]; if(blk===1) continue;
      if(!relax && di&&dj && (G.grid[kj*NX+a]===1||G.grid[b*NX+ki]===1)) continue;
      const nl=L(a,b); if(closed[nl]===st) continue;
      const ng = g[lk] + (di&&dj?1.414:1)*(G.road[b*NX+a]?.62:1)*(blk?4:1);
      if(seen[nl]!==st || ng<g[nl]){ seen[nl]=st; g[nl]=ng; from[nl]=lk; const hh=hfun(a,b); hp(nl, ng+hh); if(hh<bestH){bestH=hh;best=nl;} }
    }
  }
  let k = found>=0 ? found : best; const pts=[];
  while(k!==ls && k>=0){ pts.push([k%PW+ox-NX/2+.5, ((k/PW)|0)+oz-NZ/2+.5]); k=from[k]; }
  pts.reverse();
  const out=[]; let cx=x0, cz=z0, i=0;
  while(i<pts.length){
    let j=Math.min(pts.length-1, i+40);
    while(j>i && !relax && !lineFree(cx,cz,pts[j][0],pts[j][1])) j--;
    if(relax) j=i;
    out.push(pts[j]); cx=pts[j][0]; cz=pts[j][1]; i=j+1;
  }
  if(found>=0 && !G.grid[cellIdx(x1,z1)]) { if(out.length) out[out.length-1]=[x1,z1]; }
  return out;
}
// Weg endet kaum näher am Ziel als der Start (Bauer sitzt in einer Lücke fest)
function pathStuck(u,x,z){ const p=u.path; if(!p||!p.length) return true; const e=p[p.length-1], d0=Math.hypot(x-u.x,z-u.z), d1=Math.hypot(x-e[0],z-e[1]);
  return d0>3 && d1>d0-1 && Math.hypot(e[0]-u.x,e[1]-u.z)<2.5; }
function lineFree(x0,z0,x1,z1){
  const d=Math.hypot(x1-x0,z1-z0), n=Math.ceil(d*4); if(d<1e-4) return true;
  const nx=-(z1-z0)/d*.32, nz=(x1-x0)/d*.32;                 // Körperbreite: links und rechts mitprüfen
  for(let i=1;i<n;i++){ const t=i/n, x=lerp(x0,x1,t), z=lerp(z0,z1,t);
    if(G.grid[cellIdx(x,z)] || G.grid[cellIdx(x+nx,z+nz)] || G.grid[cellIdx(x-nx,z-nz)]) return false; }
  return true;
}

/* ============================================================
   EINHEITEN-LOGIK
   ============================================================ */
// Wegsuche mit Zeitbudget pro Bild: viele Befehle auf einmal lassen das Spiel nicht mehr ruckeln
function moveTo(u,x,z){
  u.pathEnd=false;
  if(!G.pfDeadline || performance.now() < G.pfDeadline || G.pfLeft>0){ G.pfLeft--; u.pfWait=null; u.path = findPath(u.x,u.z,x,z); u.pi=0;
    // kein Weg / kein Fortschritt: eingeklemmt – Notweg durch die Lücken
    if((!u.path || !u.path.length || pathStuck(u,x,z)) && Math.hypot(x-u.x,z-u.z)>1.5){ const p2=findPath(u.x,u.z,x,z,true); if(p2 && p2.length){ u.path=p2; u.pi=0; } }
    return !!u.path; }
  if(!u.pfWait) (G.pfQ||(G.pfQ=[])).push(u);   // Warteschlange: wer zuerst wartet, kommt zuerst dran
  u.pfWait={x,z}; u.path=null; u.pi=0; return true;
}
function cmdMove(u,x,z,used){ [x,z]=freeSpot(x,z,used); u.state='move'; u.target=null; u.site=null; u.goal={x,z,tries:0}; moveTo(u,x,z); }
function cmdGather(u,r){
  if(u.kind==='ox'){ cmdMove(u, r.x+1.6, r.z+1.2); return; }   // Ochse stellt sich als Sammelstelle neben den Rohstoff
  u.target=r; u.site=null; u.lastType=r.kind; u.lastSrc=srcType(r);
  if(u.carry.amt>0 && u.carry.type!==r.kind){ u.carry.amt=0; }
  u.state = r.deer && !r.dead ? 'hunt' : 'gather';
  moveTo(u, r.fish?r.gx:r.x, r.fish?r.gz:r.z);
}
function cmdBuild(u,b){ if(u.kind==='ox') return; u.state='build'; u.site=b; u.target=null; moveTo(u,b.x,b.z); }
function dropoffFor(u){
  let best=null, bd=1e9;
  for(const o of G.units){ if(o.kind!=='ox' || o.owner!==u.owner || o.dead || o.state!=='wait' || oxLoad(o)>=OX_CAP) continue; const d=Math.hypot(o.x-u.x,o.z-u.z)-6; if(d<bd){ bd=d; best=o; } }   // Ochse in der Nähe zählt wie ein Lager
  for(const b of G.builds){ if(b.owner!==u.owner||b.built<1) continue; const d=BUILD[b.kind]; if(!d.drop||d.drop.indexOf(u.carry.type)<0) continue;
    const dd=Math.hypot(b.x-u.x,b.z-u.z); if(dd<bd){bd=dd;best=b;} }
  return best;
}
// Weiterarbeiten nach leerem Rohstoff: nur dieselbe Art (Beeren bleiben Beeren, Jäger jagen weiter, Fischer fischen) –
// eigene Bauern fangen nicht von selbst an, Tiere zu töten
function srcType(r){ return !r ? null : r.deer ? 'tier' : r.fish ? 'fisch' : r.kind; }
function nextSame(u, maxD){
  if(!u.lastType) return null;
  if(u.owner!==0) return nearestRes(u.lastType, u.x, u.z, maxD, u.owner);
  const want=u.lastSrc||u.lastType; let best=null, bd=maxD;
  for(const r of G.res){ if(!r.alive || r.amt<=0 || r.kind!==u.lastType || srcType(r)!==want || (r.blockT && G.t-r.blockT<60)) continue; const d=Math.hypot(r.x-u.x,r.z-u.z); if(d<bd){ bd=d; best=r; } }
  return best;
}
function nearestRes(kind,x,z,maxD,owner){
  let best=null, bd=maxD||1e9;
  for(const r of G.res){ if(!r.alive||r.kind!==kind||r.amt<=0) continue; if(r.deer && !r.dead && kind!=='food') continue;
    const d=Math.hypot(r.x-x,r.z-z); if(d<bd){bd=d;best=r;} }
  return best;
}
function followPath(u,dt){
  if(!u.path || u.pi>=u.path.length) return true;
  const [tx,tz] = u.path[u.pi];
  const dx=tx-u.x, dz=tz-u.z, d=Math.hypot(dx,dz);
  const ck = cellIdx(u.x,u.z), step = u.speed*dt*(ck>=0 && G.road[ck] ? 1.5 : 1);
  // Tore: eigene und Verbündete gehen durch, Feinde bleiben vor dem geschlossenen Tor stehen (und greifen es an)
  if(G.gateAt){ const nk=cellIdx(u.x+dx/d*Math.max(step,.35), u.z+dz/d*Math.max(step,.35)), gt=nk>=0 && nk!==ck ? G.gateAt[nk] : null;
    if(gt && alive(gt) && gt.built>=1 && hostile(gt.owner,u.owner)){ u.path=null; u.moving=false;
      if(isSoldier(u) && u.owner!==0){ cmdAttack(u,gt); } return true; } }
  if(d<=step+.05){ u.x=tx; u.z=tz; u.pi++; if(u.pi>=u.path.length){ u.pathEnd=true; return true; } return false; }
  u.x += dx/d*step; u.z += dz/d*step; u.face = Math.atan2(dx,dz); u.moving=true;
  return false;
}
function near(u,x,z,r){ return Math.hypot(u.x-x,u.z-z)<=r; }
// angekommen: nah genug – oder am Ende des Weges und knapp davor (Ziel ist rundum zugestellt)
function reach(u,x,z,r){ const d=Math.hypot(u.x-x,u.z-z); return d<=r || (u.pathEnd && (!u.path || u.pi>=u.path.length) && d<=r+2.2); }

/* ---------- Lebendige Welt: Bauern ohne Auftrag laufen herum, gehen in ihre Hütte (bei Regen, Schnee, Kälte öfter).
   Wer von Hand an eine Stelle geschickt wurde (hold) oder „Hier bleiben“ (pin) hat, bleibt stehen. Soldaten laufen nie herum. ---------- */
function badWeather(){ const w=G.wx; return (G.tempNow!=null && G.tempNow<4) || (w && w.kind!=='clear' && w.k>.3); }
function idleLife(u){
  const bad=badWeather(), h=u.home && !u.home.dead && u.home.built>=1 && u.home.kind==='house' ? u.home : null;
  if(h && G.rand() < (bad?.8:.35)){ u.state='gohome'; u.site=h; u.target=null; moveTo(u,h.x,h.z); return; }
  const c = h || G.players[u.owner].tc; if(!c) return;
  const a=G.rand()*6.28, r=c.size*.5+1.5+G.rand()*5;          // ein paar Schritte ums Haus oder ans Feuer
  u.state='move'; u.target=null; u.site=null; const [gx,gz]=freeSpot(c.x+Math.cos(a)*r, c.z+Math.sin(a)*r); u.goal={x:gx, z:gz, tries:30}; moveTo(u,gx,gz);
}
function exitHut(u){
  const b=u.inside; u.inside=null; u.inHut=false; u.hutT=0;
  const a=G.rand()*6.28, r=(b?b.size*.5:1)+.8; if(b){ u.x=b.x+Math.cos(a)*r; u.z=b.z+Math.sin(a)*r; }
  u.state='idle'; u.path=null; u.lifeT=8+G.rand()*10;
}
// 📌 „Hier bleiben“: kleines Symbol über der Einheit
function setPin(u,on){
  u.pin=!!on;
  if(on && !u.pinSp){ const sp=new T.Sprite(new T.SpriteMaterial({map:iconTexture('pin'), transparent:true, depthWrite:false})); sp.renderOrder=11; u.mesh.add(sp); u.pinSp=sp;
    const ms=u.mesh.scale.y||1; sp.scale.setScalar(.55/ms); sp.position.y=2.3/ms; }
  if(u.pinSp) u.pinSp.visible=!!on;
  if(on){ u.post={x:u.x, z:u.z}; u.hold=true; }
}
function updateWorker(u,dt){
  if(u.dead) return;
  if(u.kind==='ox'){ updateOx(u,dt); return; }
  const p = G.players[u.owner];
  u.moving=false; u.working=false;
  const gatherRate = ((u.owner===0 && G.civ[0]==='China') ? 1.15 : 1) * (u.owner!==0 ? aiD().gather : 1) * (u.ageSt==='alt' ? .75 : 1);
  if(u.inside && u.inside.kind==='tower'){ updateTowerCrew(u,dt); u.ring.visible=false; return; }
  if(isSoldier(u)){ u.scanT=(u.scanT||0)-dt; if(u.scanT<=0){ u.scanT=.5; if(u.state==='idle'){ const f=nearestFoe(u, u.pin ? UNIT[u.kind].range+.6 : UNIT[u.kind].ranged?10:7); if(f) cmdAttack(u,f);
      else if(u.post && Math.hypot(u.post.x-u.x,u.post.z-u.z)>1.6){ u.state='move'; u.goal={x:u.post.x,z:u.post.z,tries:0}; moveTo(u,u.post.x,u.post.z); } } } }   // nach dem Kampf zurück an den Platz
  if(u.inside){ u.x=u.inside.x; u.z=u.inside.z; u.mesh.position.set(u.x,-100,u.z); u.ring.visible=false; if(u.inHut){ u.hutT-=dt; if(u.hutT<=0 || u.inside.dead){ exitHut(u); return; } } else if(u.inside.dead){ u.inside=null; } return; }
  if(u.kind==='worker' && updateAge(u,dt)) return;
  if(u.kind==='kid') updateKid(u,dt);
  // aus: eigene Bauern ohne Auftrag bleiben ganz still stehen (kein Herumlaufen, kein Hüttenbesuch)
  else if(false && u.kind==='worker' && u.ageSt!=='greis' && u.owner===0 && u.state==='idle' && !u.hold && !u.pin && !u.auto && !u.homeless){ if(u.lifeT==null) u.lifeT=10+G.rand()*14; u.lifeT-=dt*(badWeather()?2:1); if(u.lifeT<=0){ u.lifeT=null; idleLife(u); } }
  else if(u.homeless && u.kind==='worker' && u.state!=='idle' && u.state!=='move'){ u.state='idle'; u.path=null; }
  // Wächter: hat der Bauer einen Auftrag, kommt aber 4 s nicht vom Fleck, sucht er einen Notweg heraus
  if(!u.inside && (u.state==='move'||u.state==='gather'||u.state==='build'||u.state==='hunt'||u.state==='drop'||u.state==='gohome'||u.state==='haul')){
    u.wT=(u.wT||0)+dt; if(u.wT>4){ const moved=u.wx==null || Math.hypot(u.x-u.wx,u.z-u.wz)>.6; u.wx=u.x; u.wz=u.z; u.wT=0;
      if(!moved){ const g=u.site||u.target||u.goal; const tx=g?(g.fish?g.gx:g.x):null, tz=g?(g.fish?g.gz:g.z):null;
        if(tx!=null && Math.hypot(tx-u.x,tz-u.z)>2.5){ const p=findPath(u.x,u.z,tx,tz,true); if(p && p.length){ u.path=p; u.pi=0; u.pathEnd=false; } } } } }
  else { u.wT=0; u.wx=null; }
  if(!u.manual && (!u.path || u.pi>=u.path.length) && !u.inside){ const ck=cellIdx(u.x,u.z);
    if(ck>=0 && G.grid[ck] && !(G.gateAt && G.gateAt[ck])){ const [fx,fz]=freeSpot(u.x,u.z), dd=Math.hypot(fx-u.x,fz-u.z), st=Math.min(dd,u.speed*dt*1.2); if(dd>1e-3){ u.x+=(fx-u.x)/dd*st; u.z+=(fz-u.z)/dd*st; u.face=Math.atan2(fx-u.x,fz-u.z); u.moving=true; } } }
  if(u.manual) updateManual(u,dt);
  else if(!u.pfWait) switch(u.state){
    case 'gohome': { const h=u.site; if(!h || h.dead){ u.state='idle'; u.site=null; break; }
      if(reach(u,h.x,h.z,h.size*.5+1.2)){ u.inside=h; u.inHut=true; u.hutT=(badWeather()?45:20)+G.rand()*30; u.site=null; u.path=null; u.state='idle'; u.ring.visible=false; break; }
      if(followPath(u,dt)) moveTo(u,h.x,h.z); break; }
    case 'garrison': {
      const b=u.site; if(!b || b.dead){ u.state='idle'; u.site=null; break; }
      if(reach(u,b.x,b.z,b.size*.5+1.4)){ enterTower(u,b); break; }
      u.repath-=dt; if(!u.path || u.pi>=u.path.length){ if(u.repath<=0){ u.repath=1; moveTo(u,b.x,b.z); } }
      followPath(u,dt); break; }
    case 'attack': {
      if(u.target && u.target.inside && u.target.inside.kind==='tower') u.target=u.target.inside;
      const t=u.target; if(!alive(t)){ u.target=null; const nx=u.seek && u.owner===0 ? seekFoe(u) : null; if(nx){ u.target=nx; u.repath=0; } else u.state='idle'; break; }
      const U=UNIT[u.kind], d=Math.hypot(t.x-u.x,t.z-u.z)-(t.size?t.size*.5+.2:.35);
      if(u.pin && d>U.range+.3){ u.target=null; u.state='idle'; break; }
      if(d<=U.range || (t.size && u.pathEnd && (!u.path||u.pi>=u.path.length) && d<=U.range+2.2)){ u.path=null; u.working=true; u.face=Math.atan2(t.x-u.x,t.z-u.z); u.cd-=dt; if(u.cd<=0){ u.cd=U.cd; hit(u,t); } }
      else { u.repath-=dt; if(u.repath<=0 || !u.path || u.pi>=u.path.length){ u.repath=.7; moveTo(u,t.x,t.z); } followPath(u,dt); }
      break; }
    case 'explore':   // Erkunden: quer durch die Welt, immer weiter in eine Richtung, an Küsten und Bergen abbiegen
      if(followPath(u,dt) || (u.path && !u.path.length)) exploreNext(u);
      break;
    case 'move':
      if(followPath(u,dt)){ const gl=u.goal; if(gl && Math.hypot(gl.x-u.x,gl.z-u.z)>2 && gl.tries++<40){ moveTo(u,gl.x,gl.z); } else u.state='idle'; }
      break;
    case 'hunt': {
      const r = u.target;
      if(!r||!r.alive){ u.state='idle'; break; }
      if(r.dead){ u.state='gather'; moveTo(u,r.x,r.z); break; }
      if(r.hp!=null){ // großes oder gefährliches Tier: mit dem Speer kämpfen, es wehrt sich
        if(near(u,r.x,r.z,(r.r||.5)+1.1)){ u.path=null; u.working=true; u.face=Math.atan2(r.x-u.x,r.z-u.z); u.cd=(u.cd||0)-dt; if(u.cd<=0){ u.cd=1; animalHit(r, 9*(.8+G.rand()*.4), u); } if(r.dead){ u.state='gather'; } }
        else { u.repath-=dt; if(u.repath<=0){ u.repath=.7; moveTo(u,r.x,r.z); } followPath(u,dt); }
        break; }
      r.hunted = 1.5;
      u.repath -= dt;
      if(u.repath<=0){ u.repath=.8; moveTo(u,r.x,r.z); }
      followPath(u,dt);
      if(near(u,r.x,r.z,1.5)){ sfxAt('deer',r.x,r.z); r.dead=true; r.mesh.rotation.z=Math.PI/2; r.mesh.position.y=getH(r.x,r.z)+(r.mesh.userData.deadY!=null?r.mesh.userData.deadY:.25); if(r.mesh.quad) poseAnimal(r.mesh,'idle',0); if(u.owner===0) EE.vib(20); u.state='gather'; }
      break; }
    case 'gather': {
      let r = u.target;
      if(!r || !r.alive || r.amt<=0){
        r = nextSame(u, 14);
        if(r){ cmdGather(u,r); } else { u.state = u.carry.amt>0 ? 'drop' : 'idle'; u.path=null; }
        break;
      }
      if(r.fish ? near(u,r.gx,r.gz,1.1) : reach(u,r.x,r.z,r.r+.85)){ u.stuckN=0;
        u.path=null; u.working=true; u.face=Math.atan2(r.x-u.x,r.z-u.z);
        u.hitT=(u.hitT||0)+dt; if(u.hitT>1.05){ u.hitT=0; sfxAt(r.kind==='wood'?'chop':r.kind==='stone'?'stone':r.kind==='gold'?'gold':'berry', u.x,u.z,.8); }
        const amount = Math.min(r.amt, dt*(r.kind==='wood'?1:r.kind==='food'?1.15:.8)*gatherRate*gatherMul(u.owner,r.kind));
        r.amt -= amount; u.carry.type=r.kind; u.carry.amt += amount;
        if(r.deer) r.mesh.scale.setScalar(.5+.5*r.amt/r.max);
        if(r.amt<=0) removeRes(r);
        if(u.carry.amt>=carryCap(u)){ u.state='drop'; u.path=null; }
      } else {
        if(!u.path || u.pi>=u.path.length){ u.repath-=dt; if(u.repath<=0){ u.repath=1;
          // kommt nicht ran (rundum zugestellt): nach ein paar Versuchen den nächsten gleichen Rohstoff nehmen
          if((u.stuckN=(u.stuckN||0)+1)>4){ u.stuckN=0; r.blockT=G.t; const o=nextSame(u,30); if(o && o!==r){ cmdGather(u,o); break; } u.state='idle'; break; }
          if(!moveTo(u, r.fish?r.gx:r.x, r.fish?r.gz:r.z)){ u.state='idle'; } } }
        followPath(u,dt);
      }
      break; }
    case 'drop': {
      const b = dropoffFor(u);
      if(!b){ u.state='idle'; break; }
      if(b.kind==='ox' && near(u,b.x,b.z,1.9)){
        const room=OX_CAP-oxLoad(b), put=Math.min(room,u.carry.amt); b.load[u.carry.type]+=put; u.carry.amt-=put; u.path=null; b.idleLoadT=0;
        if(u.carry.amt>.5){ break; }
        const r = (u.target && u.target.alive && u.target.amt>0) ? u.target : nextSame(u, 16);
        if(r) cmdGather(u,r); else u.state='idle';
      } else if(b.kind!=='ox' && reach(u,b.x,b.z,b.size*.5+1.1)){
        p.res[u.carry.type] += u.carry.amt; b.recv=b.recv||{}; b.recv[u.carry.type]=(b.recv[u.carry.type]||0)+u.carry.amt; u.carry.amt=0; u.path=null; if(G.selB===b) drawPanelSoon();
        if(u.owner===0) updateHUD();
        const r = (u.target && u.target.alive && u.target.amt>0) ? u.target : nextSame(u, 16);
        if(r) cmdGather(u,r); else u.state='idle';
      } else {
        if(!u.path || u.pi>=u.path.length){ moveTo(u,b.x,b.z); }
        followPath(u,dt);
      }
      break; }
    case 'build': {
      const b = u.site;
      if(!b || b.dead || (b.built>=1 && b.hp>=BUILD[b.kind].hp)){ u.state='idle'; autoJob(u); break; }
      if(reach(u,b.x,b.z,b.size*.5+1.1)){
        u.path=null; u.working=true; u.face=Math.atan2(b.x-u.x,b.z-u.z);
        u.hitT=(u.hitT||0)+dt; if(u.hitT>.9){ u.hitT=0; sfxAt('build',u.x,u.z,.8); }
        if(b.built>=1){ b.hp = Math.min(BUILD[b.kind].hp, b.hp + dt*BUILD[b.kind].hp/BUILD[b.kind].time*.5); if(G.selB===b && u.owner===0) drawPanelSoon(); break; } // reparieren
        b.built = Math.min(1, b.built + dt/BUILD[b.kind].time/(b.slow?3:1));
        b.hp = Math.max(1, BUILD[b.kind].hp*b.built);
        if(b.kind==='road') b.mesh.children[0].material.opacity=.35+.6*b.built; else b.mesh.scale.y = .25 + .75*b.built;
        if(b.built>=1) finishBuilding(b);
        if(G.selB===b && u.owner===0) drawPanelSoon();
      } else {
        if(!u.path || u.pi>=u.path.length){ moveTo(u,b.x,b.z); }
        followPath(u,dt);
      }
      break; }
  }
  // Separation
  for(const o of G.units){ if(o===u) continue; const dx=u.x-o.x, dz=u.z-o.z, d2=dx*dx+dz*dz;
    if(d2<.36 && d2>1e-5){ const d=Math.sqrt(d2), push=(.6-d)*.5; const nx=u.x+dx/d*push, nz=u.z+dz/d*push; if(freeCell(nx,nz)){ u.x=nx; u.z=nz; } } }
  // Darstellung
  const m = u.mesh; m.position.set(u.x, getH(u.x,u.z), u.z);
  let df = u.face - m.rotation.y; df = Math.atan2(Math.sin(df),Math.cos(df)); m.rotation.y += df*Math.min(1,dt*10);
  u.phase += dt*(u.moving?8.5:u.working?6:2);
  if(m.isRigged && u.kind==='worker') fishSpear(m, u.working && u.state==='gather' && u.target && u.target.fish);
  if(m.isRigged){ const shoot = u.working && UNIT[u.kind] && UNIT[u.kind].ranged; if(m.bowK) setBowSlot(m, shoot); if(!G.farView && m.visible) poseRig(m, u.moving?'walk':shoot?'shoot':u.working?'work':'idle', shoot ? 1-clamp(u.cd/UNIT[u.kind].cd,0,1) : u.phase); if(u.stoop && m.rig && m.rig.spine){ m.rig.spine.rotation.x+=u.stoop; m.rig.neck && (m.rig.neck.rotation.x-=u.stoop*.5); } }
  else {
  const sw = u.moving ? Math.sin(u.phase)*.7 : 0;
  m.legs[0].rotation.x = sw; m.legs[1].rotation.x = -sw;
  m.arms[0].rotation.x = -sw*.8;
  m.arms[1].rotation.x = u.working ? -1.4+Math.sin(u.phase)*.9 : sw*.8;
  m.club.rotation.x = u.working ? .6+Math.sin(u.phase)*.9 : .6;
  }
  m.load.visible = u.carry.amt>0.5;
  if(m.load.visible) m.load.material = mat(LOADCOL[u.carry.type]);
  u.ring.position.set(u.x, m.position.y+.06, u.z); u.ring.scale.setScalar(1);
  updateBar(u);
}
let panelT = 0; function drawPanelSoon(){ panelT = .25; }
function sfxAt(name, x, z, v){ if(!G || G.farView) return; const d=Math.hypot(x-G.camS.x, z-G.camS.z); const k=clamp(1-d/(G.camS.dist*.9+6),0,1); if(k>0) EE.sfx(name, (v||1)*k*k); }

// Bauern mit „Arbeit suchen“ verteilen sich laufend neu: fehlt z. B. Holz, gehen mehr zum Holz (von Hand geschickte bleiben bei ihrer Arbeit)
function autoBalance(){
  const p=G.players[0], W={food:1.2, wood:1, stone:.35, gold:.3}, by={food:[],wood:[],stone:[],gold:[]};
  for(const u of G.units) if(u.owner===0 && u.auto && !u.dead && !u.inside && u.state==='gather' && u.target && by[u.target.kind]) by[u.target.kind].push(u);
  const all=Object.values(by).reduce((a,l)=>a+l.length,0); if(all<2) return;
  const need=k=>W[k]/((p.res[k]||0)+200)/(by[k].length+1);
  const ks=Object.keys(W), hi=ks.slice().sort((a,b)=>need(b)-need(a))[0];
  const lo=ks.filter(k=>k!==hi && by[k].length>1).sort((a,b)=>need(a)-need(b))[0]; if(!lo) return;
  if(need(hi) < need(lo)*2.2) return;                       // nur bei deutlichem Mangel umschichten
  const u=by[lo].sort((a,b)=>a.carry.amt-b.carry.amt)[0], r=nearestRes(hi,u.x,u.z,70,0); if(r) cmdGather(u,r);
}
// „Arbeit suchen“: ausgewählte Bauern verteilen sich selbst – erst unfertige Gebäude in der Nähe, dann die Rohstoffe, die am meisten fehlen
function smartWork(ws){
  ws=ws.filter(u=>u.ageSt!=='greis'); if(!ws.length) return 0;
  const p=G.players[0], left=ws.slice(); let n=0;
  const sites=G.builds.filter(b=>b.owner===0 && !b.dead && (b.built<1 || b.hp<BUILD[b.kind].hp*.6));
  const help=new Map(); for(const u of G.units) if(u.owner===0 && u.state==='build' && u.site) help.set(u.site,(help.get(u.site)||0)+1);
  for(const b of sites){ const want=Math.min(3,(b.wallId?2:3))-(help.get(b)||0); for(let k=0;k<want && left.length;k++){
    left.sort((a,c)=>Math.hypot(a.x-b.x,a.z-b.z)-Math.hypot(c.x-b.x,c.z-b.z)); const u=left[0]; if(Math.hypot(u.x-b.x,u.z-b.z)>60) break;
    left.shift(); u.auto=true; cmdBuild(u,b); help.set(b,(help.get(b)||0)+1); n++; } }
  // Bedarf: wenig Vorrat und wenige Sammler = hoher Bedarf (Stein und Gold in der Steinzeit weniger wichtig)
  const W={food:1.2, wood:1, stone:.35, gold:.3}, cnt={food:0,wood:0,stone:0,gold:0};
  for(const u of G.units) if(u.owner===0 && u.kind==='worker' && u.state==='gather' && u.target && cnt[u.target.kind]!=null && !left.includes(u)) cnt[u.target.kind]++;
  for(const u of left){
    const kinds=Object.keys(W).sort((a,b)=>W[b]/((p.res[b]||0)+200)/(cnt[b]+1)-W[a]/((p.res[a]||0)+200)/(cnt[a]+1));
    let r=null; for(const k of kinds){ r=nearestRes(k,u.x,u.z,70,0); if(r) break; }
    if(r){ cmdGather(u,r); cnt[r.kind]++; n++; }
    u.auto=true; u.hold=false; u.post=null; if(u.pin) setPin(u,false);
  }
  return n;
}
function autoJob(u){
  if(u.owner===0){ if(u.auto) smartWork([u]); return; }   // eigene Bauern ohne Auftrag bleiben stehen (nur „Arbeit suchen“ arbeitet selbstständig)
  const r = nearestRes(u.lastType||'food', u.x,u.z, 14, u.owner) || nearestRes('wood', u.x,u.z, 20, u.owner);
  if(r) cmdGather(u,r);
}
function removeRes(r){
  r.alive=false; G.scene.remove(r.mesh);
  if(r.type==='tree' && !G.noFell) treeFelled(r);
  if(r.mesh.inst) batchHide(r.mesh.inst);
  if(!r.deer && !r.fish){ const k=cellIdx(r.x,r.z); if(k>=0) G.grid[k]=0; }
}
function finishBuilding(b){
  const d = BUILD[b.kind];
  b.built=1; b.hp=d.hp; b.mesh.scale.y=1;
  if(b.kind==='road'){ for(const k of b.roadCells) G.road[k]=1; b.mesh.traverse(o=>{ if(o.isMesh) o.material.opacity=1; }); }
  else b.mesh.traverse(o=>{ if(o.isMesh && o.material && o.material.transparent && o.material.opacity<.6){ o.material.opacity=1; o.material.transparent=false; } });
  if(d.pop) G.players[b.owner].popCap += popOf(b);
  if(b.kind==='tc'){ const p=G.players[b.owner]; if(!p.tc) p.tc=b; claimRegion(b); buildBorders(); if(b.owner===0 && G.t>5){ EE.toast('Dein Gebiet ist gewachsen!'); EE.sfx('fanfare',.7); } }
  if(b.wallId){
    for(const u of G.units) if(u.site===b){ const next=G.builds.filter(o=>o.wallId===b.wallId && o.built<1).sort((p,q)=>Math.hypot(p.x-u.x,p.z-u.z)-Math.hypot(q.x-u.x,q.z-u.z))[0];
      if(next) cmdBuild(u,next); else { u.site=null; u.state='idle'; autoJob(u); } }
    if(!G.quiet && b.owner===0 && !G.builds.some(o=>o.wallId===b.wallId && o.built<1)){ EE.toast(b.kind==='road'?'Weg fertig – hier laufen alle schneller':'Palisade fertig gebaut'); EE.vib(25); EE.sfx('done',.8); }
    return;
  }
  if(G.quiet) return;
  if(b.owner===0){ EE.toast(d.name+' fertig gebaut'); EE.vib(25); EE.sfx('done',.8); updateHUD(); }
  for(const u of G.units) if(u.site===b){ u.site=null; u.state='idle'; autoJob(u); }
}

function updateDeer(d,dt){
  if(!d.alive) return;
  const m = d.mesh;
  if(d.dead){ return; }
  if(d.hp!=null && updateBeast(d,dt)) return;
  if(d.hunted>0){ d.hunted-=dt; }
  d.wait -= dt;
  let moving=false;
  if(d.wait<=0){
    const dx=d.tx-d.x, dz=d.tz-d.z, dist=Math.hypot(dx,dz);
    if(dist<.2){ d.wait = 2+G.rand()*5; const a=G.rand()*6.28, r=2+G.rand()*4, pk=d.pack&&PACKS[d.pack], ax=pk?d.hx+(d.x-d.hx)*.3:d.x, az=pk?d.hz+(d.z-d.hz)*.3:d.z; const nx=ax+Math.cos(a)*r, nz=az+Math.sin(a)*r; if(freeCell(nx,nz) && lineFree(d.x,d.z,nx,nz)){ d.tx=nx; d.tz=nz; } }
    else { const sp=(d.speed||1.5)*(d.hunted>0?.8:1)*dt; d.x+=dx/dist*Math.min(sp,dist); d.z+=dz/dist*Math.min(sp,dist); m.rotation.y=Math.atan2(dx,dz); moving=true; }
  }
  d.phase += dt*(moving?10:1);
  m.position.set(d.x, getH(d.x,d.z), d.z);
  if(m.userData.swim){ m.userData.swim.ph += dt*(moving?4:.6); const sw=m.userData.swim; sw.bones.forEach((b,i)=>{ if(i) b.rotation.y=Math.sin(sw.ph-i*.9)*(moving?.22:.05); }); return; }
  if(!m.visible) return;
  if(Math.abs(d.x-G.camS.x)+Math.abs(d.z-G.camS.z) > G.camS.dist*2.2+30) return;   // weit weg: nicht animieren (spart viel)
  if(m.quad){ if(!moving && d.wait>0) d.graze = d.graze ?? (G.rand()<.6); if(moving) d.graze=null; if(m.visible) poseAnimal(m, moving?'move':(d.graze?'graze':'idle'), d.phase); return; }
  const s = moving?Math.sin(d.phase)*.5:0;
  m.legs[0].rotation.x=s; m.legs[3].rotation.x=s; m.legs[1].rotation.x=-s; m.legs[2].rotation.x=-s;
}

// Fortschrittsbalken über dem Gebäude: Bau (orange) oder Ausbildung (blau)
function updateBBar(b){
  let f=-1, col=0x4fb3ff;
  const hpF = b.built>=1 ? b.hp/BUILD[b.kind].hp : 1;
  if(b.built<1){ f=b.built; col=0xf2a630; }
  else if(hpF<.995){ f=hpF; col = hpF>.5?0x5fe36a : hpF>.25?0xf2c230 : 0xe23b3b; }   // Lebensanzeige im Krieg
  else if(b.queue.length && b.owner===0){ const qk=b.queue[0]; f=b.qT/(qk==='worker'?WORKER_TIME:UNIT[qk].time); }
  const small = b.kind==='wall'||b.kind==='gate'||b.kind==='road';
  // Palisaden: nur das Stück zeigen, an dem gerade gebaut wird (nicht über jedem Stück einen Balken)
  const show = f>=0 && !G.farView && (b.owner===0 || hpF<.995) && !(small && b.built<=0);
  if(!show){ if(b.bar) b.bar.visible=false; return; }
  const W = small ? .7 : clamp(b.size*.3, 1, 1.6);   // kleiner Fortschrittsbalken (V1.73)
  if(!b.bar){ const g=new T.Group();
    const bg=new T.Sprite(new T.SpriteMaterial({color:0x111111, depthTest:false, transparent:true, opacity:.85})); bg.scale.set(W+.08,.16,1);
    const fg=new T.Sprite(new T.SpriteMaterial({color:0x4fb3ff, depthTest:false})); fg.center.set(0,.5); fg.scale.set(W,.1,1); fg.position.x=-W/2;
    bg.renderOrder=8; fg.renderOrder=9; g.add(bg); g.add(fg); g.fg=fg; b.bar=g; G.scene.add(g); }
  b.bar.visible=true; b.bar.position.set(b.x, b.mesh.position.y + (b.kind==='tc'?5.2:small?2.3:b.wallT?3.9:b.size*.9+1), b.z);
  b.bar.quaternion.copy(G.cam.quaternion);
  b.bar.fg.scale.x=Math.max(.001,W*clamp(f,0,1)); b.bar.fg.material.color.setHex(col);
  if(G.selB===b){ const el=document.querySelector('#panel .bar div'); if(el) el.style.width=(clamp(f,0,1)*100).toFixed(1)+'%'; }
}
// Lager füllen sich sichtbar: Haufen aus Holzstämmen, Steinen, Goldbrocken und Beeren-/Fleischvorrat
// wachsen und schrumpfen mit dem Vorrat des Volkes
const PILE = {types:['wood','stone','gold','food'], step:{wood:40,stone:30,gold:20,food:40}, max:14};
function pileGeo(){
  if(PILE.geo) return;
  const log=new T.CylinderGeometry(.11,.11,1.1,7); log.rotateZ(Math.PI/2);
  PILE.geo={wood:log, stone:new T.DodecahedronGeometry(.2,0), gold:new T.DodecahedronGeometry(.13,0), food:new T.SphereGeometry(.16,7,5)};
  PILE.mat={wood:new T.MeshLambertMaterial({color:0x8a5a2e}), stone:new T.MeshLambertMaterial({color:0x9aa0a6, flatShading:true}), gold:new T.MeshLambertMaterial({color:0xf2c230, emissive:0x3a2a00, flatShading:true}), food:new T.MeshLambertMaterial({color:0xb5262e})};
}
function pileSlot(type, i){
  // Haufen stapeln: unten breit, nach oben enger
  const layer = i<6?0:i<10?1:i<13?2:3, k = layer===0?i:layer===1?i-6:layer===2?i-10:0, per=[6,4,3,1][layer];
  if(type==='wood') return [ (k-(per-1)/2)*.0, .11+layer*.2, (k-(per-1)/2)*.23, 0 ];
  const a=k/per*6.28+layer*.5, r=[.38,.26,.14,0][layer]; return [Math.cos(a)*r, .12+layer*.17, Math.sin(a)*r, a];
}
function updatePiles(b){
  if(b.built<1 || b.dead || !BUILD[b.kind].drop) return;
  pileGeo(); const p=G.players[b.owner];
  if(!b.piles){ b.piles={}; const off=b.size*.17;
    const spots={wood:[off,-off*.45], stone:[off,off*.45], gold:[-off,off*.45], food:[-off,-off*.45]};
    for(const t of PILE.types){ const im=new T.InstancedMesh(PILE.geo[t], PILE.mat[t], PILE.max); im.castShadow=G.gfx>0; im.receiveShadow=true; im.count=0;
      const [sx,sz]=spots[t]; im.position.set(b.x+sx, getH(b.x+sx,b.z+sz)-.02, b.z+sz); im.userData.n=-1; G.scene.add(im); b.piles[t]=im; } }
  for(const t of PILE.types){ const im=b.piles[t], n=Math.min(PILE.max, Math.floor((p.res[t]||0)/PILE.step[t]));
    if(im.userData.n===n) continue; im.userData.n=n; im.count=n;
    const m4=new T.Matrix4(), q=new T.Quaternion(), e=new T.Euler(), sc=new T.Vector3(1,1,1), ps=new T.Vector3(), R=rng(b.x*7+b.z*13+t.length);
    for(let i=0;i<n;i++){ const [x,y,z,a]=pileSlot(t,i); ps.set(x+(R()-.5)*.06,y,z+(R()-.5)*.06); e.set(t==='wood'?0:R()*3, t==='wood'?(R()-.5)*.15:R()*6, t==='wood'?0:R()*3); q.setFromEuler(e); const s=t==='wood'?1:.8+R()*.4; sc.set(s,s,s); m4.compose(ps,q,sc); im.setMatrixAt(i,m4); }
    im.instanceMatrix.needsUpdate=true; }
}
function removePiles(b){ if(b.piles){ for(const t in b.piles) G.scene.remove(b.piles[t]); b.piles=null; } }
function updateBuilding(b,dt){
  // Rohstoffe: im Stadtzentrum unsichtbar, im Lager wachsen die Vorräte sichtbar IM Gebäude (V1.59)
  if(b.kind==='store'){ b.pileT=(b.pileT||0)-dt; if(b.pileT<=0){ b.pileT=1; updatePiles(b); } }
  if(b.owner===0 || b.hp<BUILD[b.kind].hp) updateBBar(b); else if(b.bar) b.bar.visible=false;
  if(b.kind==='tower' && b.built>=1) towerAutoFire(b,dt);
  if(b.kind==='gate' && b.built>=1 && b.mesh.doors){ b.gT=(b.gT||0)-dt;
    if(b.gT<=0){ b.gT=.25; b.want = G.units.some(u=>!u.dead && !u.inside && !hostile(b.owner,u.owner) && Math.abs(u.x-b.x)<3.2 && Math.abs(u.z-b.z)<3.2) ? 1 : 0; }
    const m=b.mesh, o=m.open + Math.sign((b.want||0)-m.open)*Math.min(Math.abs((b.want||0)-m.open), dt*1.6);
    if(o!==m.open){ m.open=o; const e=o*o*(3-2*o); m.doors[0].rotation.y=-e*1.75; m.doors[1].rotation.y=e*1.75; } }
  if(b.kind==='elder') updateResearch(b,dt);
  if(b.kind==='tc' && b.mesh.fireFx && !G.farView) animateFire(b.mesh.fireFx, G.t+b.x, dt);

  if(b.built<1 || !b.queue.length) return;
  const p = G.players[b.owner];
  if(p.pop>=p.popCap){ if(b.owner===0 && !b.warned){ EE.toast('Zu wenig Platz – baue eine Hütte'); b.warned=true; } return; }
  b.warned=false;
  b.qT += dt*trainMul(b);
  const qk = b.queue[0], qtime = qk==='worker' ? WORKER_TIME : UNIT[qk].time;
  if(b.qT>=qtime){
    b.qT=0; b.queue.shift();
    const a = G.rand()*6.28, x=b.x+Math.cos(a)*4.3, z=b.z+Math.sin(a)*4.3;
    const k = cellIdx(x,z); const NX=G.NX, NZ=G.NZ;
    let sx=x, sz=z; if(k<0||G.grid[k]){ const f=nearestFree(Math.floor(x+NX/2),Math.floor(z+NZ/2)); if(f>=0){ sx=f%NX-NX/2+.5; sz=((f/NX)|0)-NZ/2+.5; } }
    const u = spawnWorker(b.owner, sx, sz, qk);
    if(b.owner===0){ updateHUD(); EE.vib(15); EE.sfx('trained',.8); }
    if(qk==='worker') autoJob(u); else if(b.rally) cmdMove(u, b.rally.x, b.rally.z);
  }
  if(G.selB===b) drawPanelSoon();
}

/* ---------- einfache Gegner-KI (Wirtschaft) ---------- */
/* ============================================================
   KI (Computer-Gegner): Wirtschaft verteilen, Lager an Rohstoffen, Häuser rechtzeitig, Land erweitern,
   Armee in Wellen sammeln und angreifen, Stadt verteidigen, zurückziehen wenn die Welle verloren ist.
   Schwierigkeit (Leicht/Mittel/Schwer) bestimmt Tempo, Armeegröße und Sammel-Bonus.
   ============================================================ */
const AI_DIFF = [ {gather:.9, army:.7, wave:1.35, first:600, workers:16}, {gather:1.1, army:1, wave:1, first:420, workers:22}, {gather:1.3, army:1.4, wave:.75, first:300, workers:30} ];
const aiD = () => AI_DIFF[clamp(EE.S.diff|0,0,2)];
function aiPlace(p, kind, cx, cz, r0, r1, workers, n){
  if(!canPay(p,BUILD[kind].cost)) return null;
  for(let t=0;t<30;t++){ const a=G.rand()*6.28, r=r0+G.rand()*(r1-r0), x=cx+Math.cos(a)*r, z=cz+Math.sin(a)*r;
    if(validPlace(kind,x,z,p.id)){ pay(p,BUILD[kind].cost); const b=addBuilding(kind,p.id,x,z,false); workers.slice(0,n||2).forEach(w=>cmdBuild(w,b)); return b; } }
  return null;
}
function updateAI(p,dt){
  aiResearch(p,dt);
  p.aiT = (p.aiT||0) - dt; if(p.aiT>0) return; p.aiT = 1.5;
  const tc = p.tc; if(!tc) return;
  const D=aiD(), mine = G.units.filter(u=>u.owner===p.id && !u.dead);
  const workers = mine.filter(u=>u.kind==='worker' && !u.inside);
  updateAIWar(p, mine, tc);
  // --- Wirtschaft: Bauern nach Bedarf verteilen (Nahrung/Holz zuerst, Stein und Gold für Kaserne, Turm, Stadtzentrum)
  const count={food:0,wood:0,stone:0,gold:0}; for(const w of workers){ const k=w.state==='gather'||w.state==='hunt'||w.state==='drop' ? (w.lastType||'') : ''; if(k in count) count[k]++; }
  const share={food:.4, wood:.35, stone:.13, gold:.12};
  if(p.res.food>600) share.food=.25; if(p.res.wood>600) share.wood=.22; if(p.res.stone<120) share.stone+=.06; if(p.res.gold<80) share.gold+=.05; if(p.res.stone>350) share.stone=.04; if(p.res.gold>300) share.gold=.04; if(p.res.food<150) share.food+=.12;
  const need = k => share[k]*workers.length - count[k];
  const pickType = () => Object.keys(share).sort((a,b)=>need(b)-need(a))[0];
  for(const w of workers){ if(w.state!=='idle') continue; let k=pickType(), r=nearestRes(k,w.x,w.z,45,p.id)||nearestRes(k,w.x,w.z,110,p.id); if(!r){ k='wood'; r=nearestRes('wood',w.x,w.z,80,p.id); } if(r){ cmdGather(w,r); count[k]++; } }
  // alle 20 s einen Bauern vom Überschuss zum größten Mangel umsetzen
  p.rebT=(p.rebT||0)-1.5; if(p.rebT<=0){ p.rebT=20; const ks=Object.keys(share).sort((a,b)=>need(b)-need(a)), lack=ks[0], over=ks[ks.length-1];
    if(need(lack)>1.2 && need(over)<-1.2){ const w=workers.find(u=>u.lastType===over && u.carry.amt<1); const r=w&&nearestRes(lack,w.x,w.z,45,p.id); if(r) cmdGather(w,r); } }
  // Bauern ausbilden bis zur Zielzahl (wächst mit dem Land)
  const regions=[...G.reg.owner.values()].filter(o=>o===p.id).length, wantW=Math.min(D.workers+regions*4, 45);
  for(const b of G.builds){ if(b.owner!==p.id || b.kind!=='tc' || b.built<1 || b.queue.length) continue;
    if(workers.length<wantW && p.res.food>=workerCost(p.id).food && p.pop<p.popCap){ p.res.food-=workerCost(p.id).food; b.queue.push('worker'); } }
  // Hütten rechtzeitig (2 Plätze Puffer)
  const building = G.builds.filter(b=>b.owner===p.id && b.built<1);
  if(p.pop>=p.popCap-2 && building.filter(b=>b.kind==='house').length<1){
    for(const b of G.builds.filter(b=>b.owner===p.id && b.kind==='tc' && b.built>=1)){ if(aiPlace(p,'house',b.x,b.z,6,12,workers.filter(u=>u.state!=='build'),1)) break; } }
  // Lager nah an weit entfernten Rohstoffen (Holz, Stein, Gold)
  p.storeT=(p.storeT||60)-1.5;
  if(p.storeT<=0 && !building.some(b=>b.kind==='store')){ p.storeT=50;
    for(const k of ['wood','stone','gold']){ const w=workers.find(u=>u.lastType===k && u.target && u.target.alive); if(!w) continue;
      const r=w.target, drop=G.builds.filter(b=>b.owner===p.id && b.built>=1 && BUILD[b.kind].drop).reduce((m,b)=>Math.min(m,Math.hypot(b.x-r.x,b.z-r.z)),1e9);
      if(drop>18 && aiPlace(p,'store',r.x,r.z,4,8,[w],1)) break; } }
}
function updateAIWar(p, mine, tc){
  const D=aiD(), d=G.dip[p.id], atWar = d && d.state==='enemy';
  const barrs = G.builds.filter(b=>b.owner===p.id && b.kind==='barracks');
  const workers = mine.filter(u=>u.kind==='worker' && !u.inside), free=workers.filter(u=>u.state!=='build');
  const building = G.builds.some(b=>b.owner===p.id && b.built<1 && b.kind!=='house');
  // Kasernen: erste ab 6 Bauern, zweite im mittleren Spiel, dritte auf Schwer
  const wantB = 1 + (G.t>900?1:0) + ((EE.S.diff|0)===2 && G.t>1500?1:0);
  if(barrs.length<wantB && workers.length>=6 && !building) aiPlace(p,'barracks',tc.x,tc.z,10,16,free,3);
  // Armee: gemischt (Axt 40 %, Speer 30 %, Bogen 30 %), Größe wächst mit der Zeit
  const soldiersAll = mine.filter(u=>isSoldier(u) && !u.inside && u.state!=='garrison');
  updateAllyHelp(p, soldiersAll, tc);
  const soldiers = soldiersAll.filter(u=>!u.help);
  const want = Math.round((atWar ? 5 + G.t/100 : 3 + G.t/300) * D.army);
  for(const b of barrs){ if(b.built<1 || b.queue.length>=2 || p.pop>=p.popCap) continue;
    if(soldiers.length + b.queue.length < want){ const r=G.rand(), k = r<.4?'club':r<.7?'spear':'bow', c=UNIT[k].cost; if(canPay(p,c)){ pay(p,c); b.queue.push(k); } } }
  // Wachtürme vor der Stadt, mit Kriegern besetzt
  const towers = G.builds.filter(b=>b.owner===p.id && b.kind==='tower');
  if(towers.length < (G.t>360?1:0) + (G.t>1200?1:0) && barrs.some(b=>b.built>=1) && !building) aiPlace(p,'tower',tc.x,tc.z,9,15,free,2);
  for(const tw of towers){ if(tw.built>=1 && typeof crew==='function' && crew(tw).length<2){ const s=soldiers.find(u=>u.state==='idle'); if(s && typeof cmdGarrison==='function') cmdGarrison(s,tw); } }
  // Land erweitern: Stadtzentrum im freien Nachbargebiet
  p.expT = (p.expT ?? (240 + G.rand()*180)/D.wave) - 1.5;
  if(p.expT<=0 && workers.length>=10 && canPay(p, BUILD.tc.cost) && !G.builds.some(b=>b.owner===p.id && b.kind==='tc' && b.built<1)){
    p.expT = (200 + G.rand()*160)*D.wave;
    const cand=[]; for(const [id,ow] of G.reg.owner) if(ow===p.id) for(const n of regNeighbors(id)) if(regOwner(n.id)<0) cand.push(n);
    for(let t=0;t<40 && cand.length;t++){ const n=cand[(G.rand()*cand.length)|0], a=G.rand()*6.28, r=G.rand()*REG_S*.3, x=n.x+Math.cos(a)*r, z=n.z+Math.sin(a)*r;
      if(rawLand(x,z)<.7) continue;
      if(validPlace('tc',x,z,p.id)){ pay(p, BUILD.tc.cost); const b=addBuilding('tc',p.id,x,z,false); free.slice(0,4).forEach(w=>cmdBuild(w,b)); break; } }
  }
  // Verteidigung: Feinde nahe irgendeinem eigenen Gebäude → alle Krieger in der Nähe hin; bei Übermacht helfen Bauern mit
  const mineB = G.builds.filter(b=>b.owner===p.id && b.kind!=='road');
  let threat=null, tn=0;
  for(const e of G.units){ if(e.dead || !hostile(p.id,e.owner) || !isSoldier(e)) continue; const b=mineB.find(b=>Math.abs(b.x-e.x)<22 && Math.abs(b.z-e.z)<22); if(b){ tn++; if(!threat) threat=e; } }
  if(threat){ for(const s of soldiers){ if(s.wave) continue; if(s.state!=='attack' || !alive(s.target)) cmdAttack(s, threat); }
    if(tn > soldiers.length*1.5 && tn>=3) for(const w of workers.slice(0,Math.min(workers.length, tn))) if(w.state!=='attack') cmdAttack(w, threat); }
  else for(const w of workers) if(w.state==='attack'){ w.state='idle'; }
  // Angriffswellen (nur im Krieg): erst sammeln, dann gemeinsam losziehen; Rückzug wenn die Welle stark geschrumpft ist
  p.waveT = (p.waveT ?? D.first + G.rand()*120) - 1.5;
  if(d && d.state==='ally' && p.id!==0 && !G.online){ allyRequests(p, soldiers, tc, threat); if(!p.joint) return; }
  else if(!atWar) return;
  const vs = p.joint ? p.joint.vs : 0;   // Gegner der Welle: du – oder bei einem gemeinsamen Angriff das andere Volk
  const wave = soldiers.filter(s=>s.wave);
  if(p.wave){
    if(wave.length < Math.max(2, p.wave.n*.3)){ for(const s of wave){ s.wave=false; cmdMove(s, tc.x+(G.rand()-.5)*8, tc.z+(G.rand()-.5)*8); } p.wave=null; p.joint=null; p.waveT=180*D.wave; return; }
    if(p.wave.phase==='gather'){
      const ready = wave.filter(s=>Math.hypot(s.x-p.wave.rx,s.z-p.wave.rz)<7).length;
      if(ready>=wave.length*.8 || G.t-p.wave.t0>40){ p.wave.phase='go'; if(vs===0){ EE.toast(CN(p)+' '+cv(p,'greift','greifen')+' an!'); EE.sfx('error',.8); EE.vib(60); G.alarmT=6; } else EE.toast(CN(p)+' '+cv(p,'zieht','ziehen')+' gegen '+cn(G.players[vs],2)+' los'); }
    }
    if(p.wave.phase==='go') for(const s of wave){ if(s.state==='attack' && alive(s.target)) continue;
      const f=nearestFoe(s, 16); if(f){ cmdAttack(s,f); continue; }
      const tg=G.builds.filter(b=>b.owner===vs && b.kind!=='road' && !b.dead).sort((a,b)=>Math.hypot(a.x-s.x,a.z-s.z)-Math.hypot(b.x-s.x,b.z-s.z))[0];
      if(tg) cmdAttack(s,tg); else { s.wave=false; } }
    if(p.joint && !wave.length){ p.joint=null; p.wave=null; }
    return;
  }
  if(p.waveT<=0 && soldiers.length>=Math.max(p.joint?3:4, p.joint?0:want*.8)){
    const tgt = G.builds.filter(b=>b.owner===vs && b.kind!=='road').sort((a,b)=>Math.hypot(a.x-tc.x,a.z-tc.z)-Math.hypot(b.x-tc.x,b.z-tc.z))[0];
    if(!tgt){ p.waveT=60; return; }
    const keep = Math.ceil(soldiers.length*.25), go = soldiers.slice(keep);   // ein Viertel bleibt zur Verteidigung
    const dx=tgt.x-tc.x, dz=tgt.z-tc.z, L=Math.hypot(dx,dz)||1, rx=tc.x+dx/L*14, rz=tc.z+dz/L*14;
    for(const s of go){ s.wave=true; cmdMove(s, rx+(G.rand()-.5)*5, rz+(G.rand()-.5)*5); }
    p.wave={n:go.length, phase:'gather', rx, rz, t0:G.t}; p.waveT = (240 + G.rand()*120)*D.wave;
  }
}

/* ============================================================
   UPDATE & RENDER
   ============================================================ */
function update(dt){
  pcUpdate(dt);
  // Wege der Reihe nach berechnen (fair, auch bei Hunderten Leuten)
  if(G.pfQ && G.pfQ.length){ let n=0; while(G.pfQ.length && (performance.now()<G.pfDeadline || G.pfLeft>0) && n<60){ const u=G.pfQ.shift(); n++; if(!u.pfWait || u.dead) continue; const w=u.pfWait; u.pfWait=null; G.pfLeft--; u.path=findPath(u.x,u.z,w.x,w.z); u.pi=0;
      if((!u.path || !u.path.length || pathStuck(u,w.x,w.z)) && Math.hypot(w.x-u.x,w.z-u.z)>1.5){ const p2=findPath(u.x,u.z,w.x,w.z,true); if(p2 && p2.length){ u.path=p2; u.pi=0; } } } }
  updateRegrow(dt);
  // Musik: bei Kämpfen „Valley of the War Horns“, 20 s nach dem letzten Treffer wieder ruhige Lieder
  { const war = G.fightT!=null && G.t-G.fightT<20; if(war!==!!G.warMusic && !G.inMenu){ G.warMusic=war; EE.music(war?'war':'calm'); } }
  if(G.mkt) for(const k in G.mkt) G.mkt[k]+=(1-G.mkt[k])*dt*.004;
  G.balT=(G.balT||0)-dt; if(G.balT<=0){ G.balT=6; autoBalance(); }
  if(!G.giftOk && G.t>2 && !G.inMenu){ G.giftOk=true; giftPending(); }
  G.t += dt;
  if((G.saveT-=dt)<=0){ G.saveT=30; saveGame(); }
  for(const u of G.units.slice()) updateWorker(u,dt);
  updatePopulation(dt);
  G.dtW=dt; updateArrows(dt); updateBlood(dt); updateDebris(dt); updateDolphins(dt); updateSharks(dt); updatePets(dt); updateFish(dt); if(G.alarmT) G.alarmT=Math.max(0,G.alarmT-dt);
  // Tiere weit weg von der Kamera nur jedes 4. Bild (mit 4-facher Zeit) – spart viel Rechenzeit
  { const cx=G.camS.x, cz=G.camS.z, R=G.camS.dist*2.5+50, f=(G.fr2=(G.fr2||0)+1);
    for(let i=0;i<G.deer.length;i++){ const d=G.deer[i]; if(!d.alive || d.dead) continue;
      if(Math.abs(d.x-cx)+Math.abs(d.z-cz)<R || d.prey || d.angry) updateDeer(d,dt); else if((f+i)%4===0) updateDeer(d,dt*4); } }
  for(const b of G.builds) updateBuilding(b,dt);
  for(let i=1;i<G.players.length;i++) updateAI(G.players[i],dt);
  if(G.waterU) G.waterU.value = G.t;
  G.chunkT=(G.chunkT||0)-dt; if(G.chunkT<=0){ G.chunkT=.25; updateChunks(); }
  G.tileT=(G.tileT||0)-dt; if(G.tileT<=0){ G.tileT=.12; updateTiles(); }
  G.cullT=(G.cullT||0)-dt; if(G.cullT<=0){ G.cullT=.2; cullFar(); }
  TERRAIN_T.value = G.t; YEAR_U.value = yearPhase(); NZ_U.value = G.NZ; if(G.follow) FADE_U.value.set(1,2.4); else FADE_U.value.set(.3,.9);   // Bäume bleiben immer sichtbar (nur direkt vor der Linse durchsichtig)
  G.ambT=(G.ambT||0)-dt; if(G.ambT<=0){ G.ambT=.5; updateAmbient(); }
  FLAG_T.value = G.t;
  updateOverview();
  if(panelT>0){ panelT-=dt; if(panelT<=0) drawPanel(); }
  G.hudT = (G.hudT||0)-dt; if(G.hudT<=0){ G.hudT=.5; updateHUD();
    // Kosten-Farben aktuell halten: neu zeichnen, wenn sich ändert, was bezahlbar ist
    const p0=G.players[0], aff=[...Object.values(BUILD),...Object.values(UNIT),{cost:WORKER_COST}].map(d=>d.cost?(canPay(p0,d.cost)?1:0):'').join('');
    if(G.sel.length===1 || aff!==G.affSig || (!G.sel.length && !G.selB && (G.t>=30)!==!!G.tipGone)){ G.affSig=aff; G.tipGone=G.t>=30; drawPanel(); } }
  G.miniT = (G.miniT||0)-dt; if(G.miniT<=0){ G.miniT=EE.S.gfx===0?.35:.2; drawMinimap(); }
  if(G.place && !G.place.line) updateGhost();
  updateDip(dt);
}
function updateAmbient(){
  const cx=G.camS.x, cz=G.camS.z, far=G.farView;
  const c = G.clim = climateAt(cx,cz), land = getH(cx,cz)>WATER_Y, wx=G.wx||{k:0,kind:'clear'};
  let water=0; for(let i=0;i<12;i++){ const a=i/12*6.28; if(getH(cx+Math.cos(a)*10, cz+Math.sin(a)*10)<WATER_Y) water++; }
  let trees=0; for(const r of G.res){ if(r.kind==='wood' && r.alive && Math.abs(r.x-cx)<14 && Math.abs(r.z-cz)<14) trees++; if(trees>25) break; }
  let fire=0; for(const p of G.players){ if(p.tc){ const d=Math.hypot(p.tc.x-cx,p.tc.z-cz); fire=Math.max(fire, clamp(1-d/14,0,1)); } }
  const zoom=clamp(G.camS.dist/80,0,1);
  const reg = 1-zoom*.5, temperate = (1-c.jg)*(1-c.cold)*(1-c.ds);
  EE.ambient({ wind:.25+zoom*.75+c.cold*.4+(wx.kind==='snow'?wx.k*.5:0), waves: far?0:water/12, birds: far?0:clamp(trees/18,0,1)*(1-zoom)*temperate*(wx.kind==='rain'?1-wx.k:1), fire: far?0:fire*(1-zoom),
    jungle: land?c.jg*reg:0, cold: c.cold*reg, desert: land?c.ds*reg:0, rain: wx.kind==='rain'?wx.k:0, storm: wx.kind==='rain' && c.jg>.4 ? wx.k : 0 });
}
/* ============================================================
   WETTER je nach Region: Sibirien/Kanada/Gebirge viel Schnee, Dschungel oft Regen und Sonne im Wechsel,
   Europa und andere milde Gegenden mal leichter Regen, Wüste fast immer trocken
   ============================================================ */
// Kleine Wetter- und Temperaturanzeige oben rechts
const WX_ICON = {
  sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="#ffd24a"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="#ffd24a" stroke-width="2" stroke-linecap="round"/></svg>',
  cloud:'<svg viewBox="0 0 24 24"><circle cx="8" cy="9" r="4" fill="#ffd24a"/><path d="M7 19h11a4 4 0 0 0 0-8 6 6 0 0 0-11 2 3 3 0 0 0 0 6z" fill="#dfe7ef"/></svg>',
  rain:'<svg viewBox="0 0 24 24"><path d="M6 14h12a4 4 0 0 0 0-8 6 6 0 0 0-11 2 3 3 0 0 0-1 6z" fill="#b9c4cf"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" stroke="#6fb4ff" stroke-width="2" stroke-linecap="round"/></svg>',
  storm:'<svg viewBox="0 0 24 24"><path d="M6 13h12a4 4 0 0 0 0-8 6 6 0 0 0-11 2 3 3 0 0 0-1 6z" fill="#8f9aa6"/><path d="M12 14l-3 5h3l-2 4 5-6h-3l2-3z" fill="#ffd24a"/></svg>',
  snow:'<svg viewBox="0 0 24 24"><path d="M6 13h12a4 4 0 0 0 0-8 6 6 0 0 0-11 2 3 3 0 0 0-1 6z" fill="#e6edf4"/><g fill="#fff"><circle cx="8" cy="17" r="1.4"/><circle cx="12" cy="20" r="1.4"/><circle cx="16" cy="17" r="1.4"/></g></svg>'};
function updateWxHUD(){
  const el=document.getElementById('wx'), c=G.clim, w=G.wx; if(!el || !c || !w) return;
  // echte Temperatur am Kamera-Ort (Breitengrad, Jahreszeit, Küste/Landesinneres, Höhe) + Wetter
  let t = tempAt(G.camS.x, G.camS.z) + Math.sin(G.t/90 + c.lon)*1.2;
  if(w.kind==='rain') t -= 2.5*w.k; if(w.kind==='snow') t = Math.min(t, .5) - 1.5*w.k;
  G.tempNow = t; const se = seasonAt(c.lat);
  const ic = w.k>.15 ? (w.kind==='snow'?'snow': w.kind==='rain' ? (c.jg>.4&&w.k>.6?'storm':'rain') : 'sun') : (w.next!=='clear'||c.cold>.5 ? 'cloud' : 'sun');
  const txt = WX_ICON[ic]+'<b>'+Math.round(t)+' °C</b><span class="sea">'+se.ic+' '+se.name+'</span>';
  if(el._t!==txt){ el._t=txt; el.innerHTML=txt; }
}
function wxPick(){
  const c=G.clim||climateAt(G.camS.x,G.camS.z), w=G.wx, R=G.rand;
  const se = seasonAt(c.lat), T = G.tempNow!=null ? G.tempNow : tempAt(G.camS.x, G.camS.z);
  const p = c.ds>.5 ? .02 : Math.abs(c.lat)<23 ? (se.name==='Regenzeit' ? (c.jg>.4?.75:.55) : .06) : c.cold>.5 ? .6 : se.name==='Herbst'||se.name==='Winter' ? .38 : .25;
  const wet = R()<p;
  w.next = wet ? (T<1 ? 'snow' : 'rain') : 'clear';
  w.amt = !wet ? 0 : c.jg>.4 ? .75+R()*.25 : c.cold>.5 ? .45+R()*.55 : .25+R()*.4;
  w.T = c.jg>.4 ? (wet?35+R()*45:40+R()*60) : (wet?60+R()*80:80+R()*100);
}
function wxParticles(){
  const w=G.wx, N=[500,1100,1600,2200][G.gfx];
  const rp=new Float32Array(N*6), sp=new Float32Array(N*3);
  const rg=new T.BufferGeometry(); rg.setAttribute('position',new T.BufferAttribute(rp,3));
  w.rain=new T.LineSegments(rg, new T.LineBasicMaterial({color:0xb8c6d6, transparent:true, opacity:.55, depthWrite:false}));
  const c=document.createElement('canvas'); c.width=c.height=32; const x=c.getContext('2d'), gr=x.createRadialGradient(16,16,1,16,16,15); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.6,'rgba(255,255,255,.7)'); gr.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=gr; x.fillRect(0,0,32,32);
  const sg=new T.BufferGeometry(); sg.setAttribute('position',new T.BufferAttribute(sp,3));
  w.snow=new T.Points(sg, new T.PointsMaterial({map:new T.CanvasTexture(c), size:.32, transparent:true, depthWrite:false, color:0xffffff}));
  for(const o of [w.rain,w.snow]){ o.frustumCulled=false; o.visible=false; o.renderOrder=5; G.scene.add(o); }
  w.N=N; w.seed=[]; for(let i=0;i<N;i++) w.seed.push([G.rand(),G.rand(),G.rand(),G.rand()*6.28]);
}
const SKY = new T.Color(0x9fd3ff), SKY_RAIN = new T.Color(0x7d8794), SKY_SNOW = new T.Color(0xc9d2dc), _sky = new T.Color();
function updateWeather(dt){
  G.wxHudT=(G.wxHudT||0)-dt; if(G.wxHudT<=0){ G.wxHudT=.5; updateWxHUD(); }
  if(!G.wx){ G.wx={kind:'clear', next:'clear', k:0, amt:0, T:0}; }
  const w=G.wx, c=G.clim; if(!c) return;
  if(!w.rain) wxParticles();
  w.T-=dt; if(w.T<=0) wxPick();
  // Kamera in andere Region gezogen: passendes Wetter
  const Tn = G.tempNow!=null ? G.tempNow : 10;   // Niederschlag passt zur Temperatur: unter 1 °C Schnee
  if(w.next==='snow' && Tn>3) w.next = c.ds>.5?'clear':'rain';
  if(w.next==='rain' && Tn<0) w.next='snow';
  if(w.next!=='clear' && c.ds>.6){ w.next='clear'; w.T=Math.min(w.T,60); }
  // Schnee bleibt liegen und taut bei Wärme wieder
  if(w.kind==='snow' && w.k>.1) G.snowAcc=Math.min(1,(G.snowAcc||0)+dt*w.k/45); else if(G.tempNow>1.5) G.snowAcc=Math.max(0,(G.snowAcc||0)-dt*G.tempNow/900);
  SNOW_U.value = G.snowAcc||0;
  const goal = w.kind===w.next ? w.amt : 0;
  w.k += clamp(goal-w.k, -dt*.12, dt*.12);
  if(w.k<.01 && w.kind!==w.next){ w.kind=w.next; }
  // Licht und Himmel
  const kr = w.kind==='rain'?w.k:0, ks = w.kind==='snow'?w.k:0;
  G.sun.intensity = 2.1*(1-.5*kr-.3*ks); G.hemi.intensity = 1.1*(1-.15*kr+.05*ks);
  _sky.copy(SKY).lerp(SKY_RAIN, kr*.85).lerp(SKY_SNOW, ks*.8);
  G.scene.background.copy(_sky); G.scene.fog.color.copy(_sky);
  if(kr+ks>0){ G.scene.fog.far *= 1-.35*(kr+ks); G.scene.fog.near *= 1-.4*(kr+ks); }
  // Teilchen um die Kamera
  const show = !G.farView && w.k>.02, n=Math.floor(w.N*w.k);
  w.rain.visible = show && w.kind==='rain'; w.snow.visible = show && w.kind==='snow';
  if(!show) return;
  const s=G.camS, B=clamp(s.dist*.9,16,42), Hh=clamp(s.dist*.8,14,40), y0=Math.max(getH(s.x,s.z),WATER_Y)-2, t=G.t;
  if(w.kind==='rain'){ const P=w.rain.geometry.attributes.position.array, sp=28, L=1.1, wind=c.jg>.4?3:5;
    for(let i=0;i<n;i++){ const q=w.seed[i]; const h=((q[1]*Hh - t*sp*(.85+q[2]*.3)) % Hh + Hh) % Hh;
      const x=s.x+(q[0]-.5)*2*B + (h/sp)*wind, z=s.z+(q[2]-.5)*2*B, y=y0+h;
      P[i*6]=x; P[i*6+1]=y; P[i*6+2]=z; P[i*6+3]=x-wind*L/sp; P[i*6+4]=y+L; P[i*6+5]=z; }
    w.rain.geometry.attributes.position.needsUpdate=true; w.rain.geometry.setDrawRange(0,n*2); }
  else { const P=w.snow.geometry.attributes.position.array;
    for(let i=0;i<n;i++){ const q=w.seed[i]; const h=((q[1]*Hh - t*(1.6+q[2]*1.2)) % Hh + Hh) % Hh;
      P[i*3]=s.x+(q[0]-.5)*2*B+Math.sin(t*.8+q[3])*.6; P[i*3+1]=y0+h; P[i*3+2]=s.z+(q[2]-.5)*2*B+Math.cos(t*.6+q[3])*.5; }
    w.snow.geometry.attributes.position.needsUpdate=true; w.snow.geometry.setDrawRange(0,n); }
}
// Grafik im laufenden Spiel umstellen
async function applyGfx(g){
  const r=G.renderer; G.gfx=g;
  r.setPixelRatio(gfxPR(g)); r.setSize(G.W, G.H, false);
  const sh = g>=1;
  if(r.shadowMap.enabled!==sh){ r.shadowMap.enabled=sh; G.scene.traverse(o=>{ if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true); } }); }
  const sz = g>=3 ? 4096 : g>=2 ? 2048 : 1024; if(G.sun.shadow.mapSize.x!==sz){ G.sun.shadow.mapSize.set(sz,sz); if(G.sun.shadow.map){ G.sun.shadow.map.dispose(); G.sun.shadow.map=null; } }
  // Gebäude-Modelle (niedrig / volle Qualität) austauschen
  const old={}; for(const k of MODEL_LOW) if(MODELS[k]) old[k]=MODELS[k];
  await loadModels(g);
  const swap={}; for(const k in old) if(MODELS[k] && MODELS[k]!==old[k]) swap[k]=[old[k],MODELS[k]];
  const w=m=>{ const bb=m.geo.boundingBox; return Math.max(bb.max.x-bb.min.x, bb.max.z-bb.min.z); };
  for(const b of G.builds) b.mesh.traverse(o=>{ if(!o.isMesh) return; for(const k in swap){ const [a,n]=swap[k]; if(o.geometry===a.geo){ o.geometry=n.geo; o.material=Array.isArray(o.material)?o.material:n.mat; if(!o.material.transparent) o.material=n.mat; o.scale.multiplyScalar(w(a)/w(n)); } } });
  EE.toast('Grafik: '+['Niedrig','Mittel','Hoch','Ultra'][g]);
}
let fpsN=0, fpsT=0, fpsLow=0, fpsHigh=0;
// Auflösung: Grundwert je Grafikstufe × automatische Anpassung × (Schulterperspektive auf Niedrig/Mittel: 80 %, dort ist viel Laub im Bild)
// Feste Auflösung je Grafikstufe (bezogen auf die Bildhöhe): Niedrig 480p, Mittel 720p, Hoch 1080p, Ultra 1440p (auf Handys bis zur vollen Bildschirmschärfe, darüber leicht hochgerechnet)
const RES_H = [480, 720, 1080, 1440];
function gfxPR(g){ const dpr=window.devicePixelRatio||1, h=Math.max(240, Math.min(G.H||innerHeight, G.W||innerWidth));
  return Math.max(.5, Math.min(g>=3 ? Math.max(dpr,1)*1.25 : Math.max(dpr,1), RES_H[g]/h)); }
function applyRes(){ if(!G || !G.renderer) return; G.renderer.setPixelRatio(gfxPR(G.gfx)); G.renderer.setSize(G.W, G.H, false); }
// Automatische Auflösung: fällt die Bildrate unter ~24, rechnet das Spiel mit weniger Bildpunkten (bis 45 %), steigt sie wieder, wird es schärfer
function dynRes(fps){ return; }   // Auflösung bleibt fest je Stufe (kein automatisches Unscharf-Rechnen mehr)
function dynResOld(fps){
  if(!G || !G.renderer || G.inMenu || document.hidden) return;
  if(fps<24){ fpsLow++; fpsHigh=0; } else if(fps>48){ fpsHigh++; fpsLow=0; } else { fpsLow=0; fpsHigh=0; }
  let sc=G.dynScale||1;
  if(fpsLow>=2 && sc>.45){ sc=Math.max(.45, sc-.15); fpsLow=0; }
  else if(fpsHigh>=6 && sc<1){ sc=Math.min(1, sc+.1); fpsHigh=0; }
  else return;
  G.dynScale=sc; applyRes();
  if(sc<.75 && G.renderer.shadowMap.enabled && G.gfx<2){ G.renderer.shadowMap.enabled=false; G.noShadowDyn=true; G.scene.traverse(o=>{ if(o.material) (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true); }); }
}
function fpsTick(now){ fpsN++; if(now-fpsT>=500){ dynRes(fpsN*1000/Math.max(1,now-fpsT)); const el=document.getElementById('fps'); if(el){ const on=!!(EE.S.fps|0); el.classList.toggle('hidden',!on); if(on) el.textContent=Math.round(fpsN*1000/(now-fpsT))+' FPS'; } fpsN=0; fpsT=now; } }
function camResetStep(dt){
  const S=G.camS, n=$('#needle');
  // Zurück zur Achse der Weltkarte: Norden oben, wie auf der Minikarte
  if(G.camReset){ const dy=Math.atan2(Math.sin(-S.yaw),Math.cos(-S.yaw)), k=Math.min(1,dt*7);
    S.yaw+=dy*k; G.camMoved=true;
    if(Math.abs(dy)<.003){ S.yaw=0; G.camReset=false; } }
  if(n){ const deg=Math.round(S.yaw*57.3); if(deg!==G.needleDeg){ G.needleDeg=deg; n.setAttribute('transform','rotate('+deg+' 12 12)'); } }
}
function render(){ camResetStep(G.dtW||.016); updateCam(); updateWeather(G.dtW||.016); updateRegionOverlay(); updateBirds(G.dtW||.016); G.fr=(G.fr||0)+1; if(G.renderer.shadowMap.enabled && (G.follow ? G.fr%4===0 : (G.fr%2===0 || G.camMoved))) G.renderer.shadowMap.needsUpdate=true; G.camMoved=false; G.renderer.render(G.scene, G.cam); }

/* ============================================================
   MINIKARTE
   ============================================================ */
function buildMinimapBase(){
  const NX=G.NX, NZ=G.NZ, st=Math.max(1,Math.ceil(NX/640)), W=Math.ceil(NX/st), H=Math.ceil(NZ/st);
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d'), img=x.createImageData(W,H);
  for(let j=0;j<H;j++) for(let i=0;i<W;i++){
    const px=i*st-NX/2+.5, pz=j*st-NZ/2+.5, h=getH(px,pz), o=(j*W+i)*4, lat=toLat(pz), lon=toLon(px);
    // Vegetationszonen wie auf einer echten Weltkarte: Regenwald, Savanne, Wüste, gemäßigt, Taiga, Tundra, Eis
    const al=Math.abs(lat), sm=(a,b2,v)=>{ const t=clamp((v-a)/(b2-a),0,1); return t*t*(3-2*t); }, mix=(A,B,t)=>[A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t];
    let c;
    if(h<WATER_Y+.05){ const dep=clamp((WATER_Y-h)/5,0,1), trop=1-sm(20,30,al);
      c=mix(mix([62,140,200],[80,205,200],trop), mix([24,72,140],[26,84,150],trop*.4), sm(0,.45,dep)); }
    else {
      const rain=[28,92,36], sav=[158,160,72], temp=[92,152,58], taiga=[50,98,66], tundra=[150,148,118], desert=[224,192,124], steppe=[178,170,98];
      c = mix(rain, sav, sm(9,15,al));                 // Äquator: Regenwald → Savanne
      c = mix(c, temp, sm(20,28,al));                  // gemäßigte Zone
      c = mix(c, taiga, sm(48,56,al));                 // Nadelwald
      c = mix(c, tundra, sm(62,68,al));                // Tundra
      const ds=desertAt(lon,lat); c = mix(c, steppe, sm(.2,.45,ds)); c = mix(c, desert, sm(.45,.6,ds));
      const hh=h-WATER_Y; c = mix(c, [150,138,118], sm(3.5,6.5,hh)); c = mix(c, [118,112,104], sm(8,14,hh));   // Gebirge
      
      const sh=clamp((getH(px-st,pz)-getH(px+st,pz))*.2,-.12,.12); c=c.map(v=>v*(1+sh)); // leichte Hangschattierung
      c = mix(c, [238,243,248], sm(.6,.66,coldAt(lat)));   // Eis: Land der Polgebiete einfach weiß, ohne Schattierung
    }
    img.data[o]=c[0]; img.data[o+1]=c[1]; img.data[o+2]=c[2]; img.data[o+3]=255;
  }
  x.putImageData(img,0,0); G.miniBase=c;
  const cv=$('#mini'); cv.width=Math.min(640,W); cv.height=Math.round(cv.width*NZ/NX);
}
// Große Weltkarte: Gelände, alle Gebiete (eigene und fremde) in Teamfarbe, Städte mit Namen, Legende
function openBigMap(){
  EE.click(); let ov=$('#bigmap');
  if(!ov){ ov=document.createElement('div'); ov.id='bigmap';
    ov.innerHTML='<div class="bm-win"><button class="bm-x" aria-label="Schließen">✕</button><div class="bm-head">Weltkarte</div><div class="bm-body"><canvas></canvas><div class="bm-leg"></div></div><small class="bm-tip">Tippe auf die Karte, um dorthin zu springen</small></div>';
    ov.addEventListener('pointerup', e=>{ if(e.target===ov){ EE.click(); ov.classList.add('hidden'); } });   // daneben tippen schließt
    document.body.appendChild(ov);
    ov.querySelector('.bm-x').onclick=()=>{ EE.click(); ov.classList.add('hidden'); };
    ov.querySelector('canvas').addEventListener('pointerup', e=>{ const c=e.currentTarget, r=c.getBoundingClientRect(); G.camS.x=(e.clientX-r.left)/r.width*G.NX-G.NX/2; G.camS.z=(e.clientY-r.top)/r.height*G.NZ-G.NZ/2; if(G.farView) G.camS.dist=Math.min(G.camS.dist,60); ov.classList.add('hidden'); });
  }
  ov.classList.remove('hidden');
  const c=ov.querySelector('canvas'), W=Math.min(1600, G.miniBase.width*2.5), H=Math.round(W*G.NZ/G.NX); c.width=W; c.height=H;
  const x=c.getContext('2d'), s=W/G.NX, px=v=>(v+G.NX/2)*s, pz=v=>(v+G.NZ/2)*s;
  x.imageSmoothingEnabled=true; x.drawImage(G.miniBase,0,0,W,H);
  if(G.reg) drawRegionsMini(x, px, pz);
  x.font='bold '+Math.round(W/90)+'px system-ui'; x.textAlign='center';
  for(const b of G.builds){ if(b.kind!=='tc' || b.built<1) continue; const col='#'+COLORS[b.owner].toString(16).padStart(6,'0');
    x.fillStyle=col; x.strokeStyle='#000'; x.lineWidth=2; x.beginPath(); x.arc(px(b.x),pz(b.z),Math.max(4,W/260),0,7); x.fill(); x.stroke();
    if(b===G.players[b.owner].tc){ x.lineWidth=3; x.strokeStyle='rgba(0,0,0,.75)'; x.strokeText(NM(G.players[b.owner]), px(b.x), pz(b.z)-W/110); x.fillStyle='#fff'; x.fillText(NM(G.players[b.owner]), px(b.x), pz(b.z)-W/110); } }
  // Sichtbereich der Kamera
  const pts=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b2])=>groundAtNDC(a,b2)).filter(Boolean);
  if(pts.length===4){ x.strokeStyle='#fff'; x.lineWidth=2; x.beginPath(); pts.forEach((p,i)=>i?x.lineTo(px(p.x),pz(p.z)):x.moveTo(px(p.x),pz(p.z))); x.closePath(); x.stroke(); }
  // Legende: jedes Volk mit Farbe und Zahl der Gebiete
  const cnt={}; if(G.reg) for(const o of G.reg.owner.values()) cnt[o]=(cnt[o]||0)+1;
  ov.querySelector('.bm-leg').innerHTML = G.players.map((p,i)=>`<span><i style="background:#${COLORS[i].toString(16).padStart(6,'0')}"></i>${NM(p)}${i===0?' (du)':''} · ${cnt[i]||0} ${(cnt[i]||0)===1?'Gebiet':'Gebiete'}</span>`).join('');
  // Fenster genau um die Karte zuschneiden: Karte so groß wie möglich, Rahmen liegt eng an
  { const leg=ov.querySelector('.bm-leg'), body=ov.querySelector('.bm-body');
    const availW=innerWidth-28-24, availH=innerHeight-28-22, fixH=ov.querySelector('.bm-head').offsetHeight+ov.querySelector('.bm-tip').offsetHeight+5*2+16;
    // Legende rechts daneben, so viele Spalten wie für die volle Höhe nötig; Karte bekommt den Rest (nie breiter als der Bildschirm)
    const n=G.players.length, sp=leg.querySelector('span'), rowH=Math.max(14,(sp&&sp.offsetHeight)||15)+2, maxW=leg.querySelectorAll('span').length?Math.max(...[...leg.querySelectorAll('span')].map(e=>e.scrollWidth)):120;
    const colW=Math.min(170, maxW+10), legH=Math.max(rowH, availH-fixH), cols=Math.max(1,Math.ceil(n*rowH/legH)), legW=cols*colW;
    let cw=Math.floor(Math.min(availW-legW-12, (availH-fixH)*W/H)), ch;
    if(cw<availW*.45){ cw=Math.floor(Math.min(availW, (availH-fixH)*W/H)); leg.style.display='none'; } else leg.style.display='';   // zu wenig Platz: nur die Karte
    ch=Math.floor(cw*H/W);
    c.style.width=cw+'px'; c.style.height=ch+'px'; leg.style.height=Math.min(legH, Math.max(ch, Math.ceil(n/cols)*rowH))+'px'; leg.style.width=legW+'px'; leg.style.columnCount=cols; }
}
function drawMinimap(){
  const cv=$('#mini'); if(!cv) return; const x=cv.getContext('2d'), W=cv.width, H=cv.height, s=W/G.NX;
  x.drawImage(G.miniBase,0,0,W,H);
  const px=v=>(v+G.NX/2)*s, pz=v=>(v+G.NZ/2)*s;
  // Rohstoff-Punkte (Gold, Metall, Öl) nur alle paar Sekunden neu in eine eigene Ebene zeichnen
  G.miniResT=(G.miniResT||0)-1;
  if(!G.miniRes || G.miniResT<=0){ G.miniResT=15; const c=G.miniRes||(G.miniRes=document.createElement('canvas')); c.width=W; c.height=H; const y=c.getContext('2d'); y.clearRect(0,0,W,H);
    for(const r of G.res){ if(!r.alive||r.deer||r.kind==='wood'||r.kind==='food'||r.kind==='stone') continue; y.fillStyle = r.kind==='gold'?'#ffd24a':r.kind==='metal'?'#c87a4a':r.kind==='oil'?'#111':'#d0d4d8'; y.fillRect(px(r.x)-1,pz(r.z)-1,2,2); } }
  x.drawImage(G.miniRes,0,0);
  if(G.reg) drawRegionsMini(x, px, pz);
  for(const b of G.builds){ x.fillStyle='#'+COLORS[b.owner].toString(16).padStart(6,'0'); const z=Math.max(3,b.size*s); x.fillRect(px(b.x)-z/2,pz(b.z)-z/2,z,z); x.strokeStyle='#000'; x.lineWidth=1; x.strokeRect(px(b.x)-z/2,pz(b.z)-z/2,z,z); }
  // Einheiten wie in Empire Earth 2: bewegen sich live, eigene größer mit dunklem Rand, Ausgewählte weiß
  const sel=new Set(G.sel||[]);
  for(const u of G.units){ if(u.dead || u.inside) continue; const own=u.owner===0, d=own?3:2.4, X=px(u.x), Z=pz(u.z);
    if(own){ x.fillStyle='#000'; x.fillRect(X-d/2-.7,Z-d/2-.7,d+1.4,d+1.4); }
    x.fillStyle = sel.has(u) ? '#ffffff' : '#'+COLORS[u.owner].toString(16).padStart(6,'0'); x.fillRect(X-d/2,Z-d/2,d,d); }
  const pts=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>groundAtNDC(a,b)).filter(Boolean);
  if(pts.length===4){ x.strokeStyle='#fff'; x.lineWidth=1.5; x.beginPath(); pts.forEach((p,i)=>i?x.lineTo(px(p.x),pz(p.z)):x.moveTo(px(p.x),pz(p.z))); x.closePath(); x.stroke(); }
}
/* ---------- Übersicht beim Herauszoomen: Fahnen über Städten, Punkte für Einheiten ---------- */
function buildOverview(){
  G.banners = [];
  G.players.forEach((p,i)=>{
    const c=document.createElement('canvas'); c.width=256; c.height=72; const x=c.getContext('2d');
    const col='#'+COLORS[i].toString(16).padStart(6,'0');
    x.fillStyle='rgba(10,15,34,.85)'; x.beginPath(); x.roundRect(2,2,252,68,14); x.fill();
    x.fillStyle=col; x.fillRect(10,12,16,48);
    x.strokeStyle=col; x.lineWidth=4; x.beginPath(); x.roundRect(2,2,252,68,14); x.stroke();
    x.fillStyle='#fff7e2'; x.font='bold 30px Georgia, serif'; x.textBaseline='middle'; x.fillText(NM(p)+(i===0?' (Du)':''),36,37);
    const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace;
    const sp=new T.Sprite(new T.SpriteMaterial({map:t, depthTest:false, transparent:true}));
    sp.renderOrder=10; sp.visible=false; G.scene.add(sp); G.banners.push({sp,p});
  });
  const n=1500, geo=new T.BufferGeometry();
  geo.setAttribute('position', new T.BufferAttribute(new Float32Array(n*3),3));
  geo.setAttribute('color', new T.BufferAttribute(new Float32Array(n*3),3));
  G.dots = new T.Points(geo, new T.PointsMaterial({size:6, sizeAttenuation:false, vertexColors:true, depthTest:false}));
  G.dots.renderOrder=9; G.dots.frustumCulled=false; G.dots.visible=false; G.scene.add(G.dots);
}
function updateOverview(){
  const far = G.farView;
  if(G.lastFar!==far){ G.lastFar=far; for(const r of G.res) if(r.mesh && !r.mesh.inst) r.mesh.visible=!far; for(const u of G.units) u.mesh.visible=!far; batchesUpdate(true); }
  for(const {sp,p} of G.banners){
    sp.visible = far && p.tc;
    if(sp.visible){ const sc=G.camS.dist*.035; sp.scale.set(sc*3.55,sc,1); sp.center.set(.5,0); sp.position.set(p.tc.x, p.tc.mesh.position.y+4, p.tc.z); }
  }
  G.dots.visible = far;
  if(far){
    const pa=G.dots.geometry.attributes.position, ca=G.dots.geometry.attributes.color, c=new T.Color();
    let i=0; for(const u of G.units){ if(i>=pa.count) break; pa.setXYZ(i,u.x,getH(u.x,u.z)+1,u.z); c.setHex(COLORS[u.owner]); ca.setXYZ(i,c.r,c.g,c.b); i++; }
    G.dots.geometry.setDrawRange(0,i); pa.needsUpdate=true; ca.needsUpdate=true;
  }
}
const _ray = new T.Raycaster(), _v2 = new T.Vector2(), _plane = new T.Plane(new T.Vector3(0,1,0),0), _v3 = new T.Vector3();
function groundAtNDC(a,b){ _v2.set(a,b); _ray.setFromCamera(_v2,G.cam); _plane.constant=-getH(G.camS.x,G.camS.z); return _ray.ray.intersectPlane(_plane,_v3) ? _v3.clone() : null; }
function groundAt(sx,sy){
  _v2.set(sx/G.W*2-1, -(sy/G.H)*2+1); _ray.setFromCamera(_v2,G.cam);
  // Strahl über das Höhenfeld laufen lassen (genau und schnell, egal ob grob oder fein gezeichnet)
  const o=_ray.ray.origin, d=_ray.ray.direction, maxT=G.cam.far;
  let t=0, prev=0;
  for(let k=0;k<600 && t<maxT;k++){
    const x=o.x+d.x*t, y=o.y+d.y*t, z=o.z+d.z*t, h=Math.max(getH(x,z), WATER_Y);
    if(y<=h){ let a=prev, b=t; for(let q=0;q<14;q++){ const m=(a+b)/2, ym=o.y+d.y*m, xm=o.x+d.x*m, zm=o.z+d.z*m; if(ym<=Math.max(getH(xm,zm),WATER_Y)) b=m; else a=m; }
      return new T.Vector3(o.x+d.x*b, o.y+d.y*b, o.z+d.z*b); }
    prev=t; t += Math.max(.25, (y-h)*.6);
  }
  return groundAtNDC(_v2.x,_v2.y);
}
function toScreen(x,y,z){ _v3.set(x,y,z).project(G.cam); return {x:(_v3.x+1)/2*G.W, y:(1-_v3.y)/2*G.H, ok:_v3.z<1}; }

/* ============================================================
   EINGABE (Touch + Maus)
   ============================================================ */
const P = new Map(); let gesture=null, lastTap={t:0,u:null}, longT=0;
function initInput(){
  const c = $('#gc');
  c.addEventListener('pointerdown', pDown); initPC(c);
  c.addEventListener('pointermove', pMove);
  c.addEventListener('pointerup', pUp);
  c.addEventListener('pointercancel', pUp);
  c.addEventListener('wheel', e=>{ e.preventDefault(); G.camS.dist *= e.deltaY>0?1.1:.9; }, {passive:false});
  c.addEventListener('contextmenu', e=>e.preventDefault());
  const mini = $('#mini');
  const miniGo = e=>{ const r=mini.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width*G.NX-G.NX/2, z=(e.clientY-r.top)/r.height*G.NZ-G.NZ/2; G.camS.x=x; G.camS.z=z; };
  let md=null;
  mini.addEventListener('pointerdown', e=>{ e.preventDefault(); mini.setPointerCapture(e.pointerId); md={x:e.clientX,y:e.clientY,drag:false}; mini.onpointermove=ev=>{ if(Math.hypot(ev.clientX-md.x,ev.clientY-md.y)>8) md.drag=true; if(md.drag) miniGo(ev); }; });
  mini.addEventListener('pointerup', e=>{ mini.onpointermove=null; if(md && !md.drag) openBigMap(); md=null; });
}
/* ============================================================
   PC-STEUERUNG wie in Empire Earth 2 (Maus + Tastatur); am Handy bleibt alles Touch
   Maus: Links = auswählen (ziehen = Rahmen, Doppelklick = alle gleichen im Bild, Umschalt = hinzufügen),
         Rechts = Befehl (laufen, angreifen, sammeln, bauen …), rechts ziehen = Karte verschieben,
         Mausrad = zoomen, Mausrad gedrückt = drehen, Bildschirmrand = Karte verschieben
   Tastatur: WASD/Pfeile Kamera, Q/E drehen, +/- zoomen, Strg+1–9 Gruppe speichern, 1–9 Gruppe wählen (2× = hinspringen),
         H Hauptgebäude, . untätiger Bauer, Leertaste zur Auswahl, M Weltkarte, Entf Auswahl aufheben, Esc abbrechen/Menü,
         Baumenü (Bauern gewählt): E Hütte, L Lager, K Kriegerhütte, T Wachturm, Z Stadtzentrum, P Palisade, R Weg
   ============================================================ */
const PC = {keys:new Set(), mx:-1, my:-1, inside:false, groups:{}, lastGrp:{n:0,t:0}, lastClick:{t:0,u:null}};
function pcCommandAt(sx,sy){
  if(G.place){ cancelPlace(); return; }
  const mine=G.sel.filter(u=>u.owner===0); if(!mine.length) return;
  const hit=pickAt(sx,sy);
  if(hit && hit.u && hit.u.owner===0){ formationMove(mine, hit.u.x, hit.u.z); marker(hit.u.x,hit.u.z,0x7cff7c); return; }
  if(hit && hit.b && hit.b.owner===0 && hit.b.built>=1 && hit.b.hp>=BUILD[hit.b.kind].hp && !BUILD[hit.b.kind].drop && hit.b.kind!=='tower'){ const g=groundAt(sx,sy); if(g){ formationMove(mine,g.x,g.z); marker(g.x,g.z,0x7cff7c); } return; }
  const keep=G.sel.slice(); lastTap={t:0,u:null}; tapAt(sx,sy); if(G.sel.length!==keep.length) select(keep,null);
}
function pcSelectAt(sx,sy,add){
  if(G.place){ tapAt(sx,sy); confirmPlace(); return; }
  const hit=pickAt(sx,sy), now=performance.now();
  if(hit && hit.u && hit.u.owner===0){
    if(now-PC.lastClick.t<350 && PC.lastClick.u && PC.lastClick.u.kind===hit.u.kind){ // Doppelklick: alle gleichen im Bild
      select(G.units.filter(u=>u.owner===0 && u.kind===hit.u.kind && !u.inside && (()=>{const s=toScreen(u.x,getH(u.x,u.z),u.z); return s.ok&&s.x>0&&s.y>0&&s.x<G.W&&s.y<G.H;})()), null);
    } else if(add){ const s=G.sel.includes(hit.u) ? G.sel.filter(u=>u!==hit.u) : [...G.sel.filter(u=>u.owner===0), hit.u]; select(s,null); }
    else select([hit.u],null);
    PC.lastClick={t:now,u:hit.u}; EE.click(); return;
  }
  PC.lastClick={t:now,u:null};
  if(hit && hit.u){ select([],null); EE.toast(UNIT[hit.u.kind].name+' aus '+cn(G.players[hit.u.owner],1)); return; }
  if(hit && hit.b){ tapBuilding(hit.b); return; }
  if(hit && hit.r){ if(!add) select([],null); EE.toast(RES_DE[hit.r.kind]+': '+Math.ceil(hit.r.amt)+' übrig'); return; }
  if(!add) select([],null);
}
function pcPanel(a){ if(a.startsWith('b-') && !G.buildMenu && !document.querySelector(`#panel [data-a="${a}"]`)){ G.buildMenu=true; drawPanel(); } const b=document.querySelector(`#panel [data-a="${a}"]`); if(b && !b.classList.contains('dim')){ b.click(); return true; } return false; }
function pcKey(e){
  if(!G || G.inMenu || e.target.closest('input,textarea,select')) return;
  const k=e.key.toLowerCase(), ctrl=e.ctrlKey||e.metaKey;
  if(G.follow){ if(k==='escape'){ if(document.pointerLockElement) document.exitPointerLock(); else stopFollow(); return; }
    if(k==='t' || k==='tab'){ e.preventDefault(); takeControl(!G.follow.manual); return; }
    if(G.follow.manual && [' ','w','a','s','d','e','shift','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){ e.preventDefault(); PC.keys.add(k); } return; }
  if(/^[1-9]$/.test(k)){ e.preventDefault();
    if(ctrl){ PC.groups[k]=G.sel.filter(u=>u.owner===0 && !u.dead); EE.toast('Gruppe '+k+' gespeichert ('+PC.groups[k].length+')'); return; }
    const g=(PC.groups[k]||[]).filter(u=>!u.dead && !u.inside); if(!g.length) return; select(g,null);
    const now=performance.now(); if(PC.lastGrp.n===k && now-PC.lastGrp.t<450){ G.camS.x=g[0].x; G.camS.z=g[0].z; } PC.lastGrp={n:k,t:now}; return; }
  if(G.selB===null && G.sel.some(u=>u.owner===0 && u.kind==='worker') && !ctrl){
    const map={e:'b-house', l:'b-store', k:'b-barracks', t:'b-tower', z:'b-tc', p:'b-wall', r:'b-road'};
    if(map[k] && pcPanel(map[k])){ e.preventDefault(); return; }
  }
  if(G.selB && G.selB.owner===0 && !ctrl){ // Gebäude gewählt: B = Bauer, 1. Truppe usw. über Q/W/E? – hier: B/A/S/D-frei halten → Ausbildung mit F, G, V
    const map={f:'worker'}; if(map[k] && pcPanel(map[k])){ e.preventDefault(); return; }
  }
  switch(k){
    case 'h': if(G.players[0].tc){ G.camS.x=G.players[0].tc.x; G.camS.z=G.players[0].tc.z; select([],G.players[0].tc); } break;
    case '.': selectIdle(); break;
    case ' ': e.preventDefault(); { const u=G.sel[0]||G.selB; if(u){ G.camS.x=u.x; G.camS.z=u.z; } } break;
    case 'm': openBigMap(); break;
    case 'delete': select([],null); break;
    case 'escape': { if(G.follow){ stopFollow(); break; } const bm=$('#bigmap'); if(bm && !bm.classList.contains('hidden')){ bm.classList.add('hidden'); break; } if(G.place){ cancelPlace(); break; } if(G.sel.length||G.selB){ select([],null); break; } toMenu(); } break;
    case '+': case '=': G.camS.dist*=.85; break;
    case '-': G.camS.dist*=1.18; break;
    default: PC.keys.add(k); return;
  }
  e.preventDefault();
}
function pcUpdate(dt){
  if(!G || G.inMenu) return;
  if(G.follow) return;   // in der Schulterperspektive steuert WASD die Figur
  const K=PC.keys, sp=G.camS.dist*1.1*dt; let dx=0, dz=0;
  if(K.has('w')||K.has('arrowup')) dz-=1; if(K.has('s')||K.has('arrowdown')) dz+=1; if(K.has('a')||K.has('arrowleft')) dx-=1; if(K.has('d')||K.has('arrowright')) dx+=1;
  // Bildschirmrand (nur Maus, nur wenn das Fenster den Mauszeiger hat)
  if(PC.inside && !P.size && document.fullscreenElement !== undefined){ const m=8; if(PC.mx<m) dx-=1; if(PC.mx>G.W-m) dx+=1; if(PC.my<m) dz-=1; if(PC.my>G.H-m) dz+=1; }
  if(K.has('q')) G.camS.yaw+=1.4*dt; if(K.has('e') && !(G.sel.some(u=>u.kind==='worker'))) G.camS.yaw-=1.4*dt;
  if(dx||dz){ const c=Math.cos(G.camS.yaw), s=Math.sin(G.camS.yaw); G.camS.x += (dx*c + dz*s)*sp; G.camS.z += (-dx*s + dz*c)*sp; }
}
function initPC(c){
  addEventListener('keydown', pcKey);
  addEventListener('keyup', e=>PC.keys.delete(e.key.toLowerCase()));
  addEventListener('blur', ()=>PC.keys.clear());
  c.addEventListener('mousemove', e=>{ PC.mx=e.clientX; PC.my=e.clientY; PC.inside=true;
    if(G && G.place && !G.place.line && !P.size){ const g=groundAt(e.clientX,e.clientY); if(g){ G.place.x=g.x; G.place.z=g.z; } } });   // Bauplatz folgt der Maus
  c.addEventListener('mouseleave', ()=>{ PC.inside=false; });
}
function pDown(e){
  e.preventDefault(); $('#gc').setPointerCapture(e.pointerId);
  if(G && G.follow){ // Third Person: Wischen = umschauen, zwei Finger = Abstand, PC: Klick = Maus fangen / Aktion
    if(e.pointerType==='mouse' && G.follow.manual){ const cv=$('#gc'); if(document.pointerLockElement!==cv){ try{ cv.requestPointerLock(); }catch(_){} } else { G.mouseAct=true; } return; }
    P.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now()}); gesture={type:'look', d0:null}; return; }
  if(e.pointerType==='mouse'){ // PC: Maus wie in Empire Earth 2
    P.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now()});
    gesture = e.button===2 ? {type:'rclick', mouse:true} : e.button===1 ? {type:'rotate', mouse:true} : {type:'tap', mouse:true, add:e.shiftKey};
    return;
  }
  P.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now()});
  if(P.size===1){
    gesture={type:'tap'};
    clearTimeout(longT);
  } else if(P.size===2){
    clearTimeout(longT); hideBox();
    const [a,b]=[...P.values()];
    gesture={type:'two', d:Math.hypot(a.x-b.x,a.y-b.y), ang:Math.atan2(b.y-a.y,b.x-a.x), mx:(a.x+b.x)/2, my:(a.y+b.y)/2};
  }
}
function pMove(e){
  const p = P.get(e.pointerId); if(!p) return;
  const px=p.x, py=p.y; p.x=e.clientX; p.y=e.clientY;
  if(!gesture) return;
  if(gesture.type==='look'){ if(P.size>=2){ const a=[...P.values()], d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y); if(gesture.d0) TP.dist=clamp(TP.dist*gesture.d0/Math.max(20,d),2,8); gesture.d0=d; return; }
    TP.yaw -= (p.x-px)*.0065; TP.pitch=clamp(TP.pitch+(p.y-py)*.004,-.15,.85); TP.lookT=1.8; return; }
  if(gesture.type==='rotate'){ G.camReset=false; G.camS.yaw -= (p.x-px)*.008; return; }
  if(gesture.type==='rclick'){ if(Math.hypot(p.x-p.sx,p.y-p.sy)>6) gesture.type='rpan'; }
  if(gesture.type==='rpan'){ panBy(p.x-px, p.y-py); return; }
  if(gesture.type==='tap' && Math.hypot(p.x-p.sx,p.y-p.sy)>10){
    clearTimeout(longT);
    if(G.place && G.place.line){ const g0=groundAt(p.sx,p.sy); if(g0){ G.place.ax=g0.x; G.place.az=g0.z; } G.place.trail = G.place.kind==='road' && g0 ? [[g0.x,g0.z]] : null; gesture={type:'wall'}; }
    else gesture = G.place ? {type:'ghost'} : {type:'box', x0:p.sx, y0:p.sy};
  }
  if(gesture.type==='pan'){ panBy(p.x-px, p.y-py); }
  else if(gesture.type==='ghost'){ const g=groundAt(p.x,p.y); if(g){ G.place.x=g.x; G.place.z=g.z; } }
  else if(gesture.type==='wall'){ const g=groundAt(p.x,p.y); if(g){ G.place.bx=g.x; G.place.bz=g.z; const T0=G.place.trail; if(T0){ const l=T0[T0.length-1]; if(Math.hypot(g.x-l[0],g.z-l[1])>1.2) T0.push([g.x,g.z]); } updateWallGhost(); } }
  else if(gesture.type==='box'){ showBox(gesture.x0,gesture.y0,p.x,p.y); }
  else if(gesture.type==='two' && P.size===2){
    const [a,b]=[...P.values()];
    const d=Math.hypot(a.x-b.x,a.y-b.y), ang=Math.atan2(b.y-a.y,b.x-a.x), mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
    G.camS.dist *= gesture.d/d;
    let da = ang-gesture.ang; da=Math.atan2(Math.sin(da),Math.cos(da)); G.camReset=false; G.camS.yaw -= da;
    panBy(mx-gesture.mx, my-gesture.my);
    gesture.d=d; gesture.ang=ang; gesture.mx=mx; gesture.my=my;
  }
}
function pUp(e){
  const p = P.get(e.pointerId); P.delete(e.pointerId);
  clearTimeout(longT);
  if(G && G.follow && e.pointerType==='mouse'){ G.mouseAct=false; }
  if(!p || !gesture) return;
  if(gesture.type==='look'){ if(P.size===0) gesture=null; return; }
  if(gesture.mouse){ if(gesture.type==='tap') pcSelectAt(p.x,p.y,gesture.add); else if(gesture.type==='rclick') pcCommandAt(p.x,p.y); else if(gesture.type==='box'){ boxSelect(gesture.x0,gesture.y0,p.x,p.y); hideBox(); } else if(gesture.type==='ghost'||gesture.type==='wall'){} gesture=null; return; }
  if(gesture.type==='tap' && P.size===0) tapAt(p.x,p.y);
  else if(gesture.type==='box' && P.size===0){ boxSelect(gesture.x0,gesture.y0,p.x,p.y); hideBox(); }
  if(P.size===0) gesture=null;
  else if(gesture && gesture.type==='two') gesture={type:'none'};
}
function panBy(dx,dy){
  const s = G.camS.dist/G.H*1.25;
  const c=Math.cos(G.camS.yaw), sn=Math.sin(G.camS.yaw);
  G.camS.x -= (dx*c + dy*sn)*s;
  G.camS.z -= (-dx*sn + dy*c)*s;
}
function showBox(x0,y0,x1,y1){ const b=$('#sel-box'); b.style.display='block'; b.style.left=Math.min(x0,x1)+'px'; b.style.top=Math.min(y0,y1)+'px'; b.style.width=Math.abs(x1-x0)+'px'; b.style.height=Math.abs(y1-y0)+'px'; }
function hideBox(){ const b=$('#sel-box'); if(b) b.style.display='none'; }

function pickAt(sx,sy){
  let best=null, bd=34;
  if(G.sel.some(u=>u.owner===0 && u.kind==='worker')){ let bb=1e9; for(const b of G.builds){ if(b.owner!==0 || b.kind==='road' || (b.built>=1 && b.hp>=BUILD[b.kind].hp)) continue; const s=toScreen(b.x, b.mesh.position.y+.5, b.z); if(!s.ok) continue; const d=Math.hypot(s.x-sx,s.y-sy); if(d<26+b.size*14 && d<bb){ bb=d; best={b}; } } if(best) return best; }
  // Sind schon eigene Einheiten ausgewählt, zählt ein Tipp neben eigene Figuren als Marschbefehl (nur genau auf eine Figur = diese auswählen)
  const selOwn = G.sel.some(u=>u.owner===0);
  for(const u of G.units){ if(u.inside) continue; const s=toScreen(u.x, getH(u.x,u.z)+.7, u.z); if(!s.ok) continue; const d=Math.hypot(s.x-sx,s.y-sy); if(d<bd && !(selOwn && u.owner===0 && (d>14 || (G.sel.length>1 && G.sel.includes(u))))){bd=d;best={u};} }
  if(best) return best;
  bd = 1e9;
  for(const b of G.builds){ if(b.kind==='road') continue; const s=toScreen(b.x, b.mesh.position.y+1, b.z); const r = 26+b.size*14; const d=Math.hypot(s.x-sx,s.y-sy); if(d<r && d<bd){bd=d;best={b};} }
  if(best) return best;
  bd = 30;
  for(const r of G.res){ if(!r.alive || r.grow<1) continue; const s=toScreen(r.x, getH(r.x,r.z)+.6, r.z); if(!s.ok) continue; const d=Math.hypot(s.x-sx,s.y-sy); if(d<bd){bd=d;best={r};} }
  // Wegstücke antippen (nur wenn keine eigenen Leute ausgewählt sind – sonst ist der Tipp ein Laufbefehl)
  if(!best && !G.sel.some(u=>u.owner===0)){ let rd=22; for(const b of G.builds){ if(b.kind!=='road' || b.owner!==0 || b.dead) continue; const s=toScreen(b.x, getH(b.x,b.z)+.05, b.z); if(!s.ok) continue; const d=Math.hypot(s.x-sx,s.y-sy); if(d<rd){ rd=d; best={b}; } } }
  return best;
}
function tapAt(sx,sy){
  if(G.place){ const g=groundAt(sx,sy); if(g){ if(G.place.line){ const pl=G.place; if(pl.kind==='road' && pl.tapped){ (pl.trail||(pl.trail=[[pl.ax,pl.az],[pl.bx,pl.bz]])).push([g.x,g.z]); } pl.tapped=true; pl.bx=g.x; pl.bz=g.z; updateWallGhost(); } else { G.place.x=g.x; G.place.z=g.z; } } return; }
  const hit = pickAt(sx,sy);
  const mine = G.sel.filter(u=>u.owner===0);
  const now = performance.now();
  if(hit && hit.u){
    if(hit.u.owner===0){
      if(now-lastTap.t<350 && lastTap.u===hit.u){ // Doppeltipp: alle sichtbaren eigenen Arbeiter
        select(G.units.filter(u=>u.owner===0 && (()=>{const s=toScreen(u.x,getH(u.x,u.z),u.z); return s.ok&&s.x>0&&s.y>0&&s.x<G.W&&s.y<G.H;})()), null);
      } else select([hit.u], null);
      lastTap={t:now,u:hit.u}; EE.click(); return;
    }
    if(mine.length){ if(hostile(0,hit.u.owner)){ mine.forEach(u=>(u.auto=u.seek=u.hold=false,u.post=null,u.pin&&setPin(u,false),0)||cmdAttack(u,hit.u)); marker(hit.u.x,hit.u.z,0xff4444); EE.vib(12); drawPanel(); }
      else EE.toast('Ihr habt keinen Krieg mit '+cn(G.players[hit.u.owner],1)+' – das geht in der Diplomatie');
      return; }
    select([], null); EE.toast(UNIT[hit.u.kind].name+' aus '+cn(G.players[hit.u.owner],1)); return;
  }
  if(mine.length){
    if(hit && hit.r && (hit.r.kind==='metal'||hit.r.kind==='oil')){ EE.toast(RES_DE[hit.r.kind]+'-Vorkommen – kann noch nicht abgebaut werden'); return; }
    if(hit && hit.r && mine.length && mine.every(u=>u.ageSt==='greis')){ EE.toast('Zu alt zum Arbeiten'); return; }
    if(hit && hit.r){ mine.filter(u=>u.ageSt!=='greis').forEach(u=>(u.auto=u.seek=u.hold=false,u.post=null,u.pin&&setPin(u,false),0)||cmdGather(u,hit.r)); marker(hit.r.x,hit.r.z,0xffd24a); if(mine.some(u=>u.kind==='worker')) iconMarker(hit.r, resIcon(hit.r)); EE.vib(10); drawPanel(); return; }
    if(hit && hit.b && hit.b.owner===0 && hit.b.kind==='tower' && hit.b.built>=1 && mine.some(isSoldier)){ const ss=mine.filter(isSoldier), free=Math.max(0,TOWER_MAX-crew(hit.b).length);
      if(!free){ EE.toast('Der Wachturm ist voll'); return; }
      ss.slice(0,free).forEach(u=>cmdGarrison(u,hit.b)); marker(hit.b.x,hit.b.z,0xffffff); EE.vib(10);
      EE.toast(Math.min(free,ss.length)+' Krieger '+(Math.min(free,ss.length)>1?'gehen':'geht')+' in den Wachturm'+(ss.length>free?' (voll)':'')); return; }
    if(hit && hit.b && hit.b.owner===0 && (hit.b.built<1 || hit.b.hp<BUILD[hit.b.kind].hp)){ const bs=mine.filter(u=>u.kind==='worker'); if(!bs.length){ EE.toast('Nur Bauern können bauen'); return; } bs.forEach(u=>cmdBuild(u,hit.b)); iconMarker(hit.b,'hammer'); if(bs.length>1) EE.toast(bs.length+' Bauern '+(hit.b.built<1?'bauen':'reparieren')+' zusammen – das geht schneller'); marker(hit.b.x,hit.b.z,0xffd24a); EE.vib(10); drawPanel(); return; }
    if(hit && hit.b && hit.b.owner===0 && BUILD[hit.b.kind].drop){ mine.forEach(u=>{ if(u.carry.amt>0){u.state='drop';u.path=null;} }); marker(hit.b.x,hit.b.z,0xffffff); return; }
    if(hit && hit.b && hit.b.owner!==0){ if(hostile(0,hit.b.owner)){ mine.forEach(u=>(u.auto=u.seek=u.hold=false,u.post=null,u.pin&&setPin(u,false),0)||cmdAttack(u,hit.b)); marker(hit.b.x,hit.b.z,0xff4444); EE.vib(12); }
      else EE.toast('Ihr habt keinen Krieg mit '+cn(G.players[hit.b.owner],1)); return; }
    if(hit && hit.b){ tapBuilding(hit.b); return; }
    // Doppeltipp auf den Boden: Auswahl aufheben
    if(now-lastTap.t<450 && lastTap.g && Math.hypot(sx-lastTap.x, sy-lastTap.y)<45){ lastTap={t:0,u:null}; select([],null); EE.click(); EE.toast('Auswahl aufgehoben'); return; }
    lastTap={t:now,u:null,g:true,x:sx,y:sy};
    const g = groundAt(sx,sy);
    if(g){ formationMove(mine, g.x, g.z); marker(g.x,g.z,0x7cff7c); EE.vib(8); drawPanel(); }
    return;
  }
  if(hit && hit.b){ tapBuilding(hit.b); return; }
  if(hit && hit.r){ EE.toast(RES_DE[hit.r.kind]+': '+Math.ceil(hit.r.amt)+' übrig'); return; }
  select([],null);
}
// Formationen wie in Empire Earth 2: Block, Linie, Keil, Kreis – Nahkämpfer vorne, Bogenschützen dahinter.
// Wer hingeschickt wird, bleibt dort (Soldaten kehren nach einem Kampf an ihren Platz zurück).
const FORMS = [['block','Block'],['linie','Linie'],['keil','Keil'],['kreis','Kreis']];
const FORM_SVG = {block:'<g fill="#e8b64a"><rect x="5" y="5" width="4" height="4"/><rect x="10" y="5" width="4" height="4"/><rect x="15" y="5" width="4" height="4"/><rect x="5" y="10" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><rect x="15" y="10" width="4" height="4"/><rect x="5" y="15" width="4" height="4"/><rect x="10" y="15" width="4" height="4"/><rect x="15" y="15" width="4" height="4"/></g>',linie:'<g fill="#e8b64a"><rect x="2" y="9" width="3.5" height="3.5"/><rect x="6.5" y="9" width="3.5" height="3.5"/><rect x="11" y="9" width="3.5" height="3.5"/><rect x="15.5" y="9" width="3.5" height="3.5"/><rect x="20" y="9" width="2" height="3.5"/><rect x="4" y="14" width="3.5" height="3.5"/><rect x="9" y="14" width="3.5" height="3.5"/><rect x="14" y="14" width="3.5" height="3.5"/></g>',keil:'<g fill="#e8b64a"><rect x="10" y="3" width="4" height="4"/><rect x="7" y="9" width="4" height="4"/><rect x="13" y="9" width="4" height="4"/><rect x="4" y="15" width="4" height="4"/><rect x="10" y="15" width="4" height="4"/><rect x="16" y="15" width="4" height="4"/></g>',kreis:'<g fill="#e8b64a"><circle cx="12" cy="4" r="2"/><circle cx="19" cy="8" r="2"/><circle cx="19" cy="16" r="2"/><circle cx="12" cy="20" r="2"/><circle cx="5" cy="16" r="2"/><circle cx="5" cy="8" r="2"/></g>'};
function formationSlots(n, form){
  const P=[], sp=1.05;
  if(form==='kreis'){ const R=Math.max(1.4, n*sp/6.283); for(let i=0;i<n;i++){ const a=i/n*6.283; P.push([Math.cos(a)*R, Math.sin(a)*R]); } return P; }
  if(form==='keil'){ let row=0, k=0; for(let i=0;i<n;i++){ const w=row+1; P.push([(k-(w-1)/2)*sp, -row*sp*.9]); if(++k>=w){ row++; k=0; } } return P; }
  const cols = form==='linie' ? Math.max(1,Math.ceil(n/2)) : Math.ceil(Math.sqrt(n)), rows=Math.ceil(n/cols);
  for(let i=0;i<n;i++){ const r=Math.floor(i/cols), inRow=Math.min(cols, n-r*cols); P.push([((i%cols)-(inRow-1)/2)*sp, -r*sp]); }
  return P;
}
function formationMove(us,x,z){
  const n=us.length; if(!n) return;
  const cx=us.reduce((a,u)=>a+u.x,0)/n, cz=us.reduce((a,u)=>a+u.z,0)/n;
  let dx=x-cx, dz=z-cz; const dl=Math.hypot(dx,dz); if(dl<.5){ dx=0; dz=1; } else { dx/=dl; dz/=dl; }
  const rx=dz, rz=-dx, soldiers=us.every(isSoldier), form = soldiers ? (G.form||'block') : 'block';
  const order = us.slice().sort((a,b)=>((UNIT[a.kind]&&UNIT[a.kind].ranged)?1:0)-((UNIT[b.kind]&&UNIT[b.kind].ranged)?1:0));
  const P = formationSlots(n, form), used=new Set();
  order.forEach((u,i)=>{ const [lat,fwd]=P[i], [tx,tz]=freeSpot(x+rx*lat+dx*fwd, z+rz*lat+dz*fwd, used);
    if(u.owner===0){ u.auto=u.seek=false; u.hold=true; u.post={x:tx,z:tz}; }
    cmdMove(u, tx, tz); });
}
function boxSelect(x0,y0,x1,y1){
  const ax=Math.min(x0,x1), bx=Math.max(x0,x1), ay=Math.min(y0,y1), by=Math.max(y0,y1);
  const us = G.units.filter(u=>{ if(u.owner!==0) return false; const s=toScreen(u.x,getH(u.x,u.z)+.5,u.z); return s.ok && s.x>=ax && s.x<=bx && s.y>=ay && s.y<=by; });
  select(us,null); if(us.length) EE.click();
}
function select(us,b){
  us = us.filter(u=>!u.inside); G.buildMenu=false;
  for(const u of G.sel) u.ring.visible=false;
  if(G.selB){ G.selB.ring.visible=false; hlRoad(G.selB,false); }
  if(G.selBs){ for(const o of G.selBs){ if(o.ring) o.ring.visible=false; hlRoad(o,false); } G.selBs=null; }
  G.sel = us; G.selB = b; if(b) hlRoad(b,true);
  for(const u of us){ u.ring.visible=true; u.ring.material.color.setHex(0xffffff); }
  if(b){ b.ring.visible=true; }
  drawPanel();
}
function selectIdle(){
  const idle = G.units.filter(u=>u.owner===0 && u.state==='idle' && u.kind!=='kid' && !u.inside);
  if(!idle.length){ EE.toast('Alle Bauern sind beschäftigt'); return; }
  G.idleI = ((G.idleI||0)+1) % idle.length;
  const u = idle[G.idleI]; select([u],null); centerCamOn(u.x,u.z-4);
}
const markers=[];
// Kleines Werkzeug-Symbol über dem Ziel, wenn man Bauern hinschickt (Axt am Baum, Spitzhacke am Stein/Gold, Hammer am Bau …)
const ICON_SVG = {
  axe:'<path d="M20 44L44 20" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/><path d="M36 10c10 0 18 8 18 18l-8 2-12-12z" fill="#cfd6dc" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>',
  pick:'<path d="M22 46L42 18" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/><path d="M14 20c10-10 30-12 42 2-12-4-26-2-34 6z" fill="#cfd6dc" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>',
  hammer:'<path d="M24 46L40 22" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/><path d="M30 12l18 12-6 9-18-12z" fill="#9aa3aa" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>',
  spear:'<path d="M14 50L44 20" stroke="#8a5a2b" stroke-width="5" stroke-linecap="round"/><path d="M40 12l12-2-2 12-8 2-4-4z" fill="#cfd6dc" stroke="#2b2b2b" stroke-width="3" stroke-linejoin="round"/>',
  sword:'<path d="M14 14l26 26M50 14L24 40" stroke="#cfd6dc" stroke-width="6" stroke-linecap="round"/><path d="M36 44l8 8M28 44l-8 8M42 38l4-4M22 38l-4-4" stroke="#c0283a" stroke-width="5" stroke-linecap="round"/>',
  pin:'<path d="M22 6h20l-3 18 9 9H16l9-9z" fill="#e23b3b" stroke="#7a1010" stroke-width="3" stroke-linejoin="round"/><path d="M32 33v25" stroke="#e8eef2" stroke-width="5" stroke-linecap="round"/>',
  basket:'<path d="M14 28h36l-5 20H19z" fill="#c8913c" stroke="#5a3a16" stroke-width="3" stroke-linejoin="round"/><path d="M20 28c0-10 24-10 24 0" fill="none" stroke="#5a3a16" stroke-width="3"/><circle cx="26" cy="25" r="4" fill="#c0283a"/><circle cx="34" cy="24" r="4" fill="#c0283a"/><circle cx="40" cy="26" r="3.5" fill="#7b1f4a"/>'
};
const iconTex = {};
function iconTexture(k){
  if(iconTex[k]) return iconTex[k];
  const c=document.createElement('canvas'); c.width=c.height=64; const tex=new T.CanvasTexture(c); iconTex[k]=tex;
  const img=new Image(); img.onload=()=>{ const g=c.getContext('2d'); g.fillStyle='rgba(11,17,48,.85)'; g.beginPath(); g.arc(32,32,30,0,7); g.fill(); g.strokeStyle='#e8b64a'; g.lineWidth=3; g.stroke(); g.drawImage(img,4,4,56,56); tex.needsUpdate=true; };
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'+ICON_SVG[k]+'</svg>');
  return tex;
}
function iconMarker(obj, k){
  if(!G || !obj || !ICON_SVG[k]) return;
  let top=getH(obj.x,obj.z)+(obj.kind==='wood'?5.5:obj.kind==='stone'||obj.kind==='gold'?2.6:2.4);
  try{ if(obj.mesh){ const bb=new T.Box3().setFromObject(obj.mesh); if(isFinite(bb.max.y)) top=Math.max(top, bb.max.y+.6); } }catch(e){}
  const sp=new T.Sprite(new T.SpriteMaterial({map:iconTexture(k), transparent:true, depthTest:false, depthWrite:false}));
  sp.renderOrder=12; sp.position.set(obj.x, top, obj.z); G.scene.add(sp);
  const sz=Math.max(1.6, Math.min(3.2, G.camS.dist*.06));
  let t=0; const step=()=>{ if(!G) return; t+=1/60;
    const pop=t<.18 ? t/.18*1.15 : t<.3 ? 1.15-(t-.18)/.12*.15 : 1;          // kurz aufploppen
    sp.scale.setScalar(sz*pop); sp.position.y=top+Math.min(t,.4)*.8; sp.material.opacity = t>1.2 ? Math.max(0,1-(t-1.2)/.5) : 1;
    if(t<1.7) requestAnimationFrame(step); else { G.scene.remove(sp); sp.material.dispose(); } }; step();
}
function resIcon(r){ return r.kind==='wood'?'axe' : (r.kind==='stone'||r.kind==='gold')?'pick' : (r.deer||r.fish)?'spear' : 'basket'; }
function marker(x,z,col){
  const m = new T.Mesh(new T.RingGeometry(.2,.4,20), new T.MeshBasicMaterial({color:col, transparent:true, depthWrite:false}));
  m.rotation.x=-Math.PI/2; m.position.set(x,getH(x,z)+.08,z); G.scene.add(m);
  let t=0; const step=()=>{ if(!G) return; t+=.03; m.scale.setScalar(1+t*3); m.material.opacity=1-t; if(t<1) requestAnimationFrame(step); else { G.scene.remove(m); m.geometry.dispose(); } }; step();
}


/* ============================================================
   PALISADE (selbst bauen: Linie ziehen, optional Tor)
   ============================================================ */
let WALL_ID = 1;
function makeWallPiece(color, gate, len){
  len = len||1;
  geos();
  const g = new T.Group();
  if(gate){
    // keine braunen Pfosten: das Tor besteht nur aus Palisade (V1.78)
    // kein Querbalken oben (V1.76)
    // Zwei Torflügel aus Holzbohlen, an den Pfosten eingehängt – öffnen sich wie bei einer Burg (V1.74)
    g.doors=[];
    for(const sd of [-1,1]){ const piv=new T.Group(); piv.position.set(sd*.5*len,0,0); g.add(piv);
      const w=len*.5-.1, wood=mat(0x6b4524), dark=mat(0x3e2612);
      if(MODELS.palisade){   // Torflügel aus derselben Palisade wie die Mauer (gleiche Textur)
        const pm=modelMesh('palisade', w*1.04), bb=MODELS.palisade.geo.boundingBox; pm.scale.y=1.95/(bb.max.y-bb.min.y); pm.scale.z*=1.2;
        pm.position.set(-sd*(.06+w/2), -bb.min.y*pm.scale.y, 0); piv.add(pm);
      } else {
      for(let i=0;i<3;i++){ const pl=mesh(GEO.box, wood, -sd*(.06+(i+.5)*w/3), .95, 0); pl.scale.set(w/3-.02,1.8,.09); piv.add(pl); }
      for(const y of [.45,1.5]){ const q=mesh(GEO.box, dark, -sd*(.06+w/2), y, .06); q.scale.set(w,.12,.04); piv.add(q); } }
      g.doors.push(piv); }
    g.open=0;
    return g;
  }
  if(MODELS.palisade){ const m=modelMesh('palisade', len*1.08); const bb=MODELS.palisade.geo.boundingBox; m.scale.y = 1.95/(bb.max.y-bb.min.y); m.scale.z*=1.6; g.add(m); }
  else { for(let i=0;i<4;i++){ const p=mesh(GEO.box, mat(0x7a4d28), (-.38+i*.25)*len, .65+((i*7)%3)*.06, 0); p.scale.set(.16,1.3,.16); g.add(p); } }
  return g;
}
function wallCells(x0,z0,x1,z1){
  const NX=G.NX; const out=[];
  let i0=Math.floor(x0+NX/2), j0=Math.floor(z0+G.NZ/2), i1=Math.floor(x1+NX/2), j1=Math.floor(z1+G.NZ/2);
  const di=Math.abs(i1-i0), dj=Math.abs(j1-j0), si=i0<i1?1:-1, sj=j0<j1?1:-1; let err=di-dj;
  for(let n=0;n<60;n++){ out.push([i0,j0]); if(i0===i1&&j0===j1) break; const e2=2*err; if(e2>-dj){err-=dj;i0+=si;} if(e2<di){err+=di;j0+=sj;} }
  return out;
}
/* ---------- Wege (Steinzeit: Trampelpfad) – darauf laufen alle 50 % schneller ---------- */
let ROAD_TEX=null, ROAD_MAT=null;
function roadMat(){
  if(ROAD_MAT) return ROAD_MAT;
  const S=512, cv=document.createElement('canvas'); cv.width=cv.height=S; const x=cv.getContext('2d'), R=rng(77);
  const img=x.createImageData(S,S), n=fbmTileHD(S,91);
  for(let j=0;j<S;j++) for(let i=0;i<S;i++){ const o=(j*S+i)*4, t=n[j*S+i], e=Math.abs(i/S-.5)*2, edge=clamp((1-e)*3.2 - (t-.5)*2.4,0,1);
    img.data[o]=118+t*60; img.data[o+1]=92+t*46; img.data[o+2]=62+t*30; img.data[o+3]=edge*235; }
  x.putImageData(img,0,0);
  for(let i=0;i<70*16;i++){ const px=S*.2+R()*S*.6, py=R()*S; x.fillStyle=`rgba(${150+R()*50|0},${145+R()*45|0},${135+R()*40|0},.9)`; x.beginPath(); x.arc(px,py,(.8+R()*1.8)*1.6,0,7); x.fill(); }
  for(let k=0;k<2;k++){ x.strokeStyle='rgba(70,50,30,.35)'; x.lineWidth=5*S/128; x.beginPath(); x.moveTo(S*(.36+k*.28),0); x.lineTo(S*(.36+k*.28),S); x.stroke(); }
  ROAD_TEX=new T.CanvasTexture(cv); ROAD_TEX.wrapT=T.RepeatWrapping; ROAD_TEX.colorSpace=T.SRGBColorSpace;
  // Gemalte Straße je Epoche (V2.20): Bild laden, Ränder weich ausblenden, ersetzt dann die erzeugte Textur
  const ROADS=['steinzeit','antike','mittelalter','neuzeit','industrie','industrie','industrie','industrie','moderne','zukunft'];
  const im=new Image(); im.onload=()=>{ try{
      x.clearRect(0,0,S,S); x.drawImage(im,0,0,S,S); const d=x.getImageData(0,0,S,S), q=d.data, nn=fbmTile(S,93);
      for(let j=0;j<S;j++) for(let i=0;i<S;i++){ const o=(j*S+i)*4, e=Math.abs(i/S-.5)*2, t=nn[j*S+i]; q[o+3]=clamp((1-e)*3.4-(t-.5)*2.2,0,1)*245; }
      x.putImageData(d,0,0); ROAD_TEX.needsUpdate=true; }catch(e){} };
  { const rn=ROADS[clamp(G.era|0,0,9)]; im.src=(window.EE_ROADS&&window.EE_ROADS[rn]) || 'ui/strasse_'+rn+'.jpg'; }
  ROAD_MAT=new T.MeshLambertMaterial({map:ROAD_TEX, transparent:true, depthWrite:false, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2});
  return ROAD_MAT;
}
function makeRoadPiece(cx,cz,len,ang){
  const ux=Math.cos(ang), uz=Math.sin(ang), W=1.5, nL=Math.max(2,Math.ceil(len/.5)), h0=getH(cx,cz);
  const P=[], U=[], I=[];
  for(let a=0;a<=nL;a++) for(let b=0;b<=2;b++){
    const t=(a/nL-.5)*(len+.35), s=(b/2-.5)*W, wx=cx+ux*t-uz*s, wz=cz+uz*t+ux*s;
    P.push(ux*t-uz*s, getH(wx,wz)-h0+.05, uz*t+ux*s); U.push(b/2, (a/nL)*(len+.35)/1.6);
  }
  for(let a=0;a<nL;a++) for(let b=0;b<2;b++){ const i=a*3+b; I.push(i,i+1,i+3, i+1,i+4,i+3); }
  const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.Float32BufferAttribute(P,3)); geo.setAttribute('uv',new T.Float32BufferAttribute(U,2)); geo.setIndex(I); geo.computeVertexNormals();
  const m=new T.Mesh(geo, roadMat().clone()); m.receiveShadow=true; m.renderOrder=1;
  const g=new T.Group(); g.add(m); g.position.set(cx,h0,cz); g.isRoad=true; return g;
}
function startWall(kind){
  kind = kind||'wall';
  const g = groundAtNDC(0,-.1) || {x:G.camS.x, z:G.camS.z};
  G.place = {kind, line:true, ax:g.x, az:g.z, bx:g.x+4, bz:g.z, gate:false, ghosts:[], cells:[], ok:false, workers:G.sel.filter(u=>u.owner===0)};
  $('#pTxt').textContent='Mit dem Finger eine Linie ziehen';
  $('#pGate').classList.toggle('hidden', kind!=='wall'); $('#pGate').classList.remove('on');
  $('#placebar').classList.remove('hidden');
  drawPanel(); updateWallGhost();
}
// Enden bestehender eigener Palisaden – neue Palisaden docken dort an, damit alles geschlossen ist
function wallEnds(road){
  const pts=[];
  for(const b of G.builds){ if(b.owner!==0 || !b.seg || b.dead) continue; if(road ? b.kind!=='road' : (b.kind!=='wall'&&b.kind!=='gate')) continue;
    const a=b.seg.ang||0, h=(b.seg.len||1)/2, cx=Math.cos(a)*h, cz=Math.sin(a)*h;
    pts.push({x:b.x+cx,z:b.z+cz,cells:b.cells}, {x:b.x-cx,z:b.z-cz,cells:b.cells}); }
  // freie Enden (nicht mit einem Nachbarstück verbunden) zuerst
  for(const p of pts) p.free = pts.filter(q=>Math.hypot(q.x-p.x,q.z-p.z)<.35).length===1;
  return pts;
}
function snapEnd(x,z,ends){
  let best=null, bd=1e9;
  for(const p of ends){ const d=Math.hypot(p.x-x,p.z-z) - (p.free?.8:0); if(d<bd){ bd=d; best=p; } }
  return best && bd<1.5 ? best : null;
}
// Weg-Ende schnappt an ein eigenes Gebäude (Tür-Seite zum Weg hin) – so verbindet man Häuser
function roadEndSnap(x,z){
  let best=null, bd=1e9;
  for(const b of G.builds){ if(b.owner!==0 || b.dead || b.seg) continue; const r=b.size*.5+4, d=Math.hypot(b.x-x,b.z-z); if(d<r && d<bd){ bd=d; best=b; } }
  if(!best) return null;
  // an den Eingang: die Tür aller Gebäude zeigt nach vorne (+z, dort wo beim Hauptgebäude das Feuer brennt)
  const r=best.size*.5+(best.kind==='tc'?2.2:.6);
  return [best.x, best.z+r];
}
function roadCurveGhost(pl, pts){
  // Chaikin-Glättung (zweimal), Ecken werden zu Kurven
  for(let it=0; it<2 && pts.length>2; it++){ const o=[pts[0]]; for(let i=0;i<pts.length-1;i++){ const [x0,z0]=pts[i],[x1,z1]=pts[i+1]; o.push([x0*.75+x1*.25,z0*.75+z1*.25],[x0*.25+x1*.75,z0*.25+z1*.75]); } o.push(pts[pts.length-1]); pts=o; }
  // gleichmäßig abtasten
  const out=[]; let acc=0; const step=1.15; let total=0;
  for(let i=1;i<pts.length;i++) total+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);
  const n=Math.max(1,Math.min(160,Math.round(total/step))), sl=total/n; let i=1, px=pts[0][0], pz=pts[0][1], need=sl/2, cx=px, cz=pz;
  const at=d=>{ let rem=d; for(let k=1;k<pts.length;k++){ const L=Math.hypot(pts[k][0]-pts[k-1][0],pts[k][1]-pts[k-1][1]); if(rem<=L||k===pts.length-1){ const t=L>0?Math.min(1,rem/L):0; return [pts[k-1][0]+(pts[k][0]-pts[k-1][0])*t, pts[k-1][1]+(pts[k][1]-pts[k-1][1])*t]; } rem-=L; } return pts[pts.length-1]; };
  pl.cells=[]; let okCount=0;
  for(let k=0;k<n;k++){ const d=(k+.5)*sl, [x,z]=at(d), [x0,z0]=at(Math.max(0,d-sl*.5)), [x1,z1]=at(Math.min(total,d+sl*.5)), ang=Math.atan2(z1-z0,x1-x0);
    const ks=new Set(), ux=Math.cos(ang), uz=Math.sin(ang); for(let t=-.45;t<=.45;t+=.15) ks.add(cellIdx(x+ux*sl*t, z+uz*sl*t));
    const arr=[...ks], ok=arr.every(q=>q>=0 && G.grid[q]!==1) && getH(x,z)>WATER_Y+.15;
    pl.cells.push({ks:arr.filter(q=>!G.grid[q]), x, z, len:sl*1.08, ang, ok}); }
  for(const c of pl.cells){ const gh=makeRoadPiece(c.x,c.z,c.len,c.ang);
    gh.traverse(o=>{ if(o.isMesh){ o.material=o.material.clone(); o.material.transparent=true; o.material.opacity=.8; o.material.color.setHex(c.ok?0x66ff77:0xff5555); o.castShadow=false; } });
    G.scene.add(gh); pl.ghosts.push(gh); if(c.ok) okCount++; }
  pl.ang=pl.cells.length?pl.cells[0].ang:0; pl.cost=0; pl.ok=okCount>0; setCost({wood:0});
  $('#pTxt').textContent = okCount ? 'Weg: '+Math.round(okCount*sl)+' m · kostenlos · Kurven: ziehen oder Punkte antippen' : 'Hier kann kein Weg entstehen';
  $('#pOk').classList.toggle('dim', !pl.ok); $('#pOk').disabled=false;
}
function updateWallGhost(){
  const pl=G.place, NX=G.NX, NZ=G.NZ;
  for(const gh of pl.ghosts) G.scene.remove(gh); pl.ghosts=[];
  const road = pl.kind==='road';
  const ends = wallEnds(road), sa = snapEnd(pl.ax,pl.az,ends), sb = snapEnd(pl.bx,pl.bz,ends);
  let AX = sa?sa.x:pl.ax, AZ = sa?sa.z:pl.az, BX = sb&&sb!==sa?sb.x:pl.bx, BZ = sb&&sb!==sa?sb.z:pl.bz;
  const own = new Set(); for(const p of [sa,sb]) if(p) for(const k of p.cells||[]) own.add(k);
  pl.snapA=!!sa; pl.snapB=!!(sb&&sb!==sa);
  if(road){ const R=roadEndSnap(BX,BZ); if(R && !pl.snapB){ BX=R[0]; BZ=R[1]; } const R0=roadEndSnap(AX,AZ); if(R0 && !pl.snapA){ AX=R0[0]; AZ=R0[1]; } }
  // Kurven: beim Ziehen gemalte Spur bzw. angetippte Punkte → weiche Kurve, alle 1,15 m ein Wegstück
  if(road && pl.trail && pl.trail.length>=2){ return roadCurveGhost(pl, [[AX,AZ], ...pl.trail.slice(1,-1), [BX,BZ]]); }
  const dx=BX-AX, dz=BZ-AZ, L=Math.min(Math.hypot(dx,dz), 150);
  const n = Math.max(1, Math.round(L/1.15)), seg = Math.max(.6, L/n);
  const ux = L>0.01?dx/Math.hypot(dx,dz):1, uz = L>0.01?dz/Math.hypot(dx,dz):0;
  const ang = Math.atan2(uz, ux), mid = Math.floor(n/2);
  pl.cells = [];
  for(let i=0;i<n;i++){
    const x = AX + ux*seg*(i+.5), z = AZ + uz*seg*(i+.5);
    const ks = new Set();
    for(let t=-.45;t<=.45;t+=.15){ const k=cellIdx(x+ux*seg*t, z+uz*seg*t); ks.add(k); }
    const arr=[...ks];
    const edge = i===0 || i===n-1;
    const ok = arr.every(k=>k>=0 && (!G.grid[k] || (edge && own.has(k)))) && getH(x,z)>WATER_Y+.15;
    pl.cells.push({ks:arr, x, z, len:seg, ok, gate: !road && pl.gate && n>=3 && (n<=30 ? i===mid : i%24===12)});
  }
  let okCount=0;
  for(const c of pl.cells){
    const gh = road ? makeRoadPiece(c.x,c.z,c.len,ang) : makeWallPiece(COLORS[0], c.gate, c.len);
    gh.traverse(o=>{ if(o.isMesh){ o.material=o.material.clone(); o.material.transparent=true; o.material.opacity=road?.8:.55; o.material.color.setHex(c.ok?0x66ff77:0xff5555); o.castShadow=false; } });
    if(!road){ gh.position.set(c.x, getH(c.x,c.z), c.z); gh.rotation.y = -ang; }
    G.scene.add(gh); pl.ghosts.push(gh); if(c.ok) okCount++;
  }
  pl.ang = ang;
  const cost = road ? 0 : pl.cells.reduce((s,c)=>s+(c.ok?(c.gate?BUILD.gate.cost.wood:BUILD.wall.cost.wood):0),0);
  pl.cost = cost; pl.ok = okCount>0;
  const pay = G.players[0].res.wood >= cost; setCost({wood:cost});
  $('#pTxt').textContent = okCount ? (road ? 'Weg: '+Math.round(okCount*seg)+' m · kostenlos' : okCount+' Stück · '+cost+' Holz'+(pay?'':' – es fehlen '+Math.ceil(cost-G.players[0].res.wood)+' Holz')) : 'Mit dem Finger eine Linie ziehen';
  $('#pOk').classList.toggle('dim', !pl.ok || !pay); $('#pOk').disabled = false;
}
function confirmWall(){
  const pl=G.place, p=G.players[0];
  if(!pl.ok){ EE.toast(pl.kind==='road'?'Hier kann kein Weg entstehen':'Hier kann keine Palisade stehen'); return; }
  if(pl.kind==='road' && !pl.workers.length){ EE.toast('Wähle zuerst Bauern aus, die den Weg anlegen'); return; }
  if(p.res.wood < pl.cost){ EE.toast('Es fehlen '+Math.ceil(pl.cost-p.res.wood)+' Holz ('+pl.cost+' nötig)'); EE.sfx('error'); EE.vib(30); return; }
  p.res.wood -= pl.cost;
  const id = WALL_ID++, ang = pl.ang||0, segs=[];
  for(const c of pl.cells){ if(!c.ok) continue; segs.push(addWall(0, c, c.ang!=null?c.ang:ang, id, pl.kind==='road')); }
  const ws = pl.workers;
  ws.forEach((u,i)=>{ const seg = segs[Math.floor(i*segs.length/Math.max(1,ws.length))]; if(seg) cmdBuild(u,seg); });
  EE.sfx('place'); EE.vib(20);
  endPlace(); updateHUD(); select(ws,null);
}
/* ===== Mauertürme (wie Empire Earth II): in die Palisade/Mauer eingebaut, ca. alle 10 m, Ecken und Enden immer.
   Sie schießen selbst (Steinzeit: Pfeile, später andere Munition). Krieger darauf kämpfen von oben mit. ===== */
const WT_COST = BUILD.tower.cost, WT_GAP = 10;   // kostet so viel wie ein einzelner Wachturm
const GATE_W = 4.1;   // Torbreite ca. 6 m (halb so breit wie vorher)
function gateParts(w){
  const a=w.seg.ang||0, ux=Math.cos(a), uz=Math.sin(a), pr=o=>(o.x-w.x)*ux+(o.z-w.z)*uz;
  const L=wallLine(w).sort((p,q)=>pr(p)-pr(q)); let i=L.indexOf(w), lo=i, hi=i, len=w.seg.len||1;
  while(len<GATE_W-.3){ const l=L[lo-1], h=L[hi+1];
    const okL=l&&l.kind==='wall'&&Math.abs(pr(L[lo])-pr(l))<(l.seg.len||1)*1.3, okH=h&&h.kind==='wall'&&Math.abs(pr(h)-pr(L[hi]))<(h.seg.len||1)*1.3;
    if(!okL && !okH) break;
    if(okH && (!okL || hi-i<=i-lo)){ hi++; len+=h.seg.len||1; } else { lo--; len+=l.seg.len||1; } }
  return L.slice(lo,hi+1);
}
function wallLine(b){ return G.builds.filter(o=>o.owner===b.owner && o.wallId===b.wallId && o.seg && !o.dead && (o.kind==='wall'||o.kind==='gate'||o.kind==='tower')); }
// Alle zusammenhängenden Palisaden (auch mehrere gezogene Linien, die aneinander andocken) bekommen Türme
// ausgewählte Wegstücke leuchten hell auf, damit man sieht, was gewählt ist
let ROAD_HL=null;
function hlRoad(b,on){ if(!b || b.kind!=='road' || !b.mesh) return;
  if(!ROAD_HL && ROAD_MAT){ ROAD_HL=ROAD_MAT.clone(); ROAD_HL.color=new T.Color(0xffe27a); ROAD_HL.emissive=new T.Color(0x6a4a00); }
  b.mesh.traverse(o=>{ if(!o.isMesh) return; if(on){ if(!o.userData.m0) o.userData.m0=o.material; if(ROAD_HL) o.material=ROAD_HL; } else if(o.userData.m0){ o.material=o.userData.m0; } });
  if(b.ring) b.ring.visible=false; }
const isWallPart = b => b && b.seg && (b.kind==='wall'||b.kind==='gate'||b.kind==='tower'||b.kind==='road');
// Tipp auf Gebäude; Doppeltipp auf ein Mauerteil wählt die ganze zusammenhängende Mauer (wie Empire Earth II)
let lastBT={t:0,b:null};
function tapBuilding(b){
  const now=performance.now();
  if(b.owner===0 && isWallPart(b) && lastBT.b && isWallPart(lastBT.b) && (lastBT.b.kind==='road')===(b.kind==='road') && now-lastBT.t<420){ lastBT={t:0,b:null}; selectWallNet(b); return; }
  lastBT={t:now,b}; select([],b); EE.click();
}
function selectWallNet(b){
  const all=wallNet(b).flat().filter(o=>!o.dead);
  select([],b); G.selBs=all; for(const o of all){ if(o.ring && o.kind!=='road') o.ring.visible=true; hlRoad(o,true); }
  EE.click(); EE.toast(all.length+(b.kind==='road'?' Wegstücke':' Mauerteile')+' ausgewählt'); drawPanel();
}
function wallNet(b){
  const rd=b.kind==='road', own=G.builds.filter(o=>o.owner===b.owner && o.seg && !o.dead && (rd ? o.kind==='road' : (o.kind==='wall'||o.kind==='gate'||o.kind==='tower')));
  const byId={}; for(const o of own) (byId[o.wallId]||(byId[o.wallId]=[])).push(o);
  const ends=o=>{ const a=o.seg.ang||0, h=(o.seg.len||1)/2; return [[o.x+Math.cos(a)*h,o.z+Math.sin(a)*h],[o.x-Math.cos(a)*h,o.z-Math.sin(a)*h]]; };
  const net=new Set([b.wallId]), todo=[b.wallId];
  while(todo.length){ const id=todo.pop(); const E=byId[id].flatMap(ends);
    for(const k in byId){ const kid=byId[k][0].wallId; if(net.has(kid)) continue;
      if(byId[k].some(o=>ends(o).some(([x,z])=>E.some(([X,Z])=>Math.hypot(X-x,Z-z)<.6)))){ net.add(kid); todo.push(kid); } } }
  return [...net].map(id=>byId[id]);
}
function wallTowerPlan(b){
  const lines=wallNet(b), towers=[], out=[];
  for(const L of lines) for(const o of L) if(o.kind==='tower') towers.push([o.x,o.z]);
  const near=(x,z)=>towers.some(([X,Z])=>Math.hypot(X-x,Z-z)<WT_GAP*.55);
  for(const L of lines){
    const r=L[0], a=r.seg.ang||0, ux=Math.cos(a), uz=Math.sin(a), pr=o=>(o.x-r.x)*ux+(o.z-r.z)*uz;
    L.sort((p,q)=>pr(p)-pr(q));
    const walls=L.filter(o=>o.kind==='wall'); if(!walls.length) continue;
    const t0=pr(L[0]), t1=pr(L[L.length-1]);
    const want=[t0]; for(let t=t0+WT_GAP; t<t1-WT_GAP*.5; t+=WT_GAP) want.push(t); if(t1-t0>1) want.push(t1);
    for(const t of want){ let best=null, bd=1e9;
      for(const w of walls){ const d=Math.abs(pr(w)-t); if(d<bd && !out.includes(w)){ bd=d; best=w; } }
      if(best && bd<WT_GAP*.5 && !near(best.x,best.z)){ out.push(best); towers.push([best.x,best.z]); } }
  }
  return out;
}
function buildWallTowers(b, one){
  if(!b || !b.seg) return; const p=G.players[0]; let plan=one?[b]:wallTowerPlan(b);
  if(!plan.length){ EE.toast('Diese Palisade hat schon genug Türme'); return; }
  // So viele Türme wie die Rohstoffe reichen – zuerst die Enden, dann die Mitte
  const all=plan.length, can=Math.min(all, ...Object.keys(WT_COST).map(r=>Math.floor(p.res[r]/WT_COST[r])));
  if(can<1){ EE.sfx('error'); EE.toast('Mauerturm: '+missingTxt(p,WT_COST)); return; }
  if(can<all){ const ends=[plan[0], plan[plan.length-1]], mid=plan.slice(1,-1); plan=[...new Set([...ends, ...mid])].slice(0,can); }
  const cost={}; for(const r in WT_COST) cost[r]=WT_COST[r]*plan.length;
  pay(p,cost);
  if(can<all) EE.toast('Rohstoffe reichen für '+can+' von '+all+' Türmen – tippe später nochmal für den Rest');
  const made=[];
  for(const w of plan){ const seg={...w.seg}, id=w.wallId; w.quietRemove=true; destroyBuilding(w); made.push(addWallTower(0, seg, id, false)); }
  const ws=G.units.filter(u=>u.owner===0 && u.kind==='worker' && !u.inside && !u.dead);
  made.forEach(t=>{ ws.sort((a,c)=>Math.hypot(a.x-t.x,a.z-t.z)-Math.hypot(c.x-t.x,c.z-t.z)); ws.slice(0,2).forEach(u=>cmdBuild(u,t)); });
  G.selB=null; if(plan.length===all) EE.toast(plan.length+' Mauertürme werden gebaut'); EE.sfx('place'); updateHUD(); drawPanel();
}
function addWallTower(owner, seg, id, done){
  const inner=makeTower(COLORS[owner], owner), S=.6; inner.scale.setScalar(S);
  const m=new T.Group(); m.add(inner); m.platY=(inner.platY||4.9)*S; m.slotX=(inner.slotX||.55)*S; m.slotZ=(inner.slotZ||.55)*S;
  m.position.set(seg.x, getH(seg.x,seg.z)-.05, seg.z); m.rotation.y=-(seg.ang||0); G.scene.add(m);
  const cells=(seg.ks||[]).filter(k=>k>=0); for(const k of cells) G.grid[k]=1;
  const ring=new T.Mesh(new T.RingGeometry(.95,1.08,28), new T.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.85, depthWrite:false}));
  ring.rotation.x=-Math.PI/2; ring.position.set(seg.x, m.position.y+.08, seg.z); ring.visible=false; G.scene.add(ring);
  const b={kind:'tower', wallT:true, owner, x:seg.x, z:seg.z, size:1.6, mesh:m, ring, cells, built:done?1:0, hp:done?BUILD.tower.hp:1, queue:[], qT:0, wallId:id, seg:{...seg, gate:false}};
  if(!done){ m.scale.y=.25; m.traverse(o=>{ if(o.material && o.isMesh){ o.material=o.material.clone(); o.material.transparent=true; o.material.opacity=.55; } }); }
  G.builds.push(b); return b;
}
function towerAutoFire(b,dt){
  b.shotT=(b.shotT||G.rand()*1.5)-dt; if(b.shotT>0) return;
  const R=b.wallT?13:15, t=nearestFoe(b,R);
  if(!alive(t)){ b.shotT=.6; return; }
  b.shotT=2.2;
  const y=b.mesh.position.y+(b.mesh.platY||4.9)*b.mesh.scale.y+.6;
  shootArrow(b, t, (t.size?3:7)*(.85+G.rand()*.3), y);
  if(b.owner===0 || (G.follow && Math.hypot(b.x-G.camS.x,b.z-G.camS.z)<30)) sfxAt('bow',b.x,b.z,.5);
}
function addWall(owner, c, ang, id, road){
  if(!road) G.wallVer=(G.wallVer||0)+1;
  const kind = road?'road':c.gate?'gate':'wall', d=BUILD[kind];
  const m = road ? makeRoadPiece(c.x,c.z,c.len,ang) : makeWallPiece(COLORS[owner], c.gate, c.len);
  if(!road){ m.position.set(c.x, getH(c.x,c.z)-.03, c.z); m.rotation.y = -ang; }
  G.scene.add(m);
  if(!c.gate && !road) for(const k of c.ks) if(k>=0) G.grid[k]=1;
  if(c.gate && !road){ G.gateAt=G.gateAt||{}; }
  const ring = new T.Mesh(new T.RingGeometry(.55,.68,20), new T.MeshBasicMaterial({color:0xffffff, transparent:true, opacity:.85, depthWrite:false}));
  ring.rotation.x=-Math.PI/2; ring.position.set(c.x, m.position.y+.08, c.z); ring.visible=false; G.scene.add(ring);
  const b = {kind, owner, x:c.x, z:c.z, size:1, mesh:m, ring, cells:(c.gate||road)?[]:c.ks.filter(k=>k>=0), roadCells:road?c.ks.filter(k=>k>=0):null, built:0, hp:1, queue:[], qT:0, wallId:id, seg:{ks:c.ks, x:c.x, z:c.z, len:c.len, gate:!!c.gate, ang}};
  if(!road) m.scale.y=.25;
  m.traverse(o=>{ if(o.material && o.isMesh){ o.material=o.material.clone(); o.material.transparent=true; o.material.opacity=road?.35:.55; } });
  if(c.gate && !road) for(const k of c.ks) if(k>=0) G.gateAt[k]=b;
  G.builds.push(b);
  return b;
}

/* ---------- Gebäude platzieren ---------- */
/* ============================================================
   GEBIETE (wie Empire Earth 2): Die Welt ist in feste Gebiete aufgeteilt (ein Land hat mehrere).
   Ein Stadtzentrum macht das ganze Gebiet zu deinem. Weitere Gebiete holt man sich mit neuen
   Stadtzentren in Nachbargebieten – fremde Gebiete erst, wenn deren Stadtzentrum zerstört ist.
   ============================================================ */
const REG_S = 70;
function initRegions(){
  const S=REG_S, gw=Math.ceil(G.NX/S), gh=Math.ceil(G.NZ/S), R=rng(G.seed^0x5bd1e995);
  G.reg={S, gw, gh, seeds:new Array(gw*gh).fill(null), owner:new Map(), poly:new Map()};
  for(let j=0;j<gh;j++) for(let i=0;i<gw;i++){
    const x=(i+.2+R()*.6)*S-G.NX/2, z=(j+.2+R()*.6)*S-G.NZ/2;
    if(rawLand(x,z)>.62) G.reg.seeds[j*gw+i]={id:j*gw+i, x, z};
  }
}
function regionAt(x,z){
  const g=G.reg; if(!g) return -1; const gi=Math.floor((x+G.NX/2)/g.S), gj=Math.floor((z+G.NZ/2)/g.S);
  let best=-1, bd=1e18;
  for(let j=gj-2;j<=gj+2;j++) for(let i=gi-2;i<=gi+2;i++){ if(i<0||j<0||i>=g.gw||j>=g.gh) continue; const s=g.seeds[j*g.gw+i]; if(!s) continue; const d=(s.x-x)**2+(s.z-z)**2; if(d<bd){ bd=d; best=s.id; } }
  return best;
}
const regOwner = id => (id>=0 && G.reg.owner.has(id)) ? G.reg.owner.get(id) : -1;
const inOwn = (owner,x,z) => regOwner(regionAt(x,z))===owner;
function regNeighbors(id){
  const g=G.reg, s=g.seeds[id], out=[]; if(!s) return out;
  const gi=id%g.gw, gj=(id/g.gw)|0;
  for(let j=gj-2;j<=gj+2;j++) for(let i=gi-2;i<=gi+2;i++){ if(i<0||j<0||i>=g.gw||j>=g.gh) continue; const n=g.seeds[j*g.gw+i]; if(n && n!==s) out.push(n); }
  return out;
}
// Umriss eines Gebiets (Voronoi-Zelle): Quadrat Schritt für Schritt an den Mittelsenkrechten abschneiden
function regPoly(id){
  const g=G.reg; if(g.poly.has(id)) return g.poly.get(id);
  const s=g.seeds[id], S=g.S*2.2; let P=[[s.x-S,s.z-S,-1],[s.x+S,s.z-S,-1],[s.x+S,s.z+S,-1],[s.x-S,s.z+S,-1]];
  for(const n of regNeighbors(id)){
    const mx=(s.x+n.x)/2, mz=(s.z+n.z)/2, dx=n.x-s.x, dz=n.z-s.z, f=p=>(p[0]-mx)*dx+(p[1]-mz)*dz, out=[];
    for(let k=0;k<P.length;k++){ const a=P[k], b=P[(k+1)%P.length], fa=f(a), fb=f(b);
      if(fa<=0) out.push(a);
      if((fa<=0)!==(fb<=0)){ const t=fa/(fa-fb); out.push([a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, n.id]); }
      // Kante ab Punkt a gehört zu dem Nachbarn, der sie erzeugt hat (3. Wert)
    }
    for(let k=0;k<out.length;k++){ const a=out[k], b=out[(k+1)%out.length]; if(f(a)>-1e-6 && f(b)>-1e-6) a[2]=n.id; }
    P=out;
  }
  g.poly.set(id,P); return P;
}
function claimRegion(b){ const id=regionAt(b.x,b.z); if(id>=0){ G.reg.owner.set(id,b.owner); b.region=id; } }
function releaseRegion(b){ const id=b.region; if(id==null||id<0) return; if(!G.builds.some(o=>o!==b && o.kind==='tc' && o.built>=1 && o.region===id && o.owner===b.owner)) G.reg.owner.delete(id); }
function terrCheck(owner, kind, x, z){
  if(kind==='road') return null;
  const id=regionAt(x,z), o=regOwner(id);
  if(kind==='tc'){
    if(id<0) return 'Hier kann man kein Gebiet gründen';
    if(o===owner) return 'Dieses Gebiet gehört dir schon – baue im Nachbargebiet';
    if(o>=0) return 'Das Gebiet gehört '+cn(G.players[o],1)+' – erst das Stadtzentrum zerstören';
    if(G.builds.some(b=>b.kind==='tc' && b.built<1 && regionAt(b.x,b.z)===id)) return 'Hier wird schon ein Stadtzentrum gebaut';
    const mine=[...G.reg.owner].filter(([k,v])=>v===owner).map(([k])=>k);
    if(!mine.length) return null;
    const near = regNeighbors(id).some(n=>regOwner(n.id)===owner && regPoly(id).some(p=>p[2]===n.id));
    return near ? null : 'Nur ein Nachbargebiet deines Landes';
  }
  if(id<0) return 'Hier kann man nicht bauen';
  if(kind==='house' && G.builds.filter(b=>b.kind==='house' && b.owner===owner && regionAt(b.x,b.z)===id).length>=HOUSE_MAX) return 'Höchstens '+HOUSE_MAX+' Hütten pro Gebiet – erweitere dein Land';
  return null;
}
// Wie in Empire Earth 2: Außerhalb des eigenen (oder verbündeten) Gebiets darf man bauen, aber es dauert dreimal so lange
const HOUSE_MAX = 6;
function friendlyLand(owner,x,z){ const o=regOwner(regionAt(x,z)); if(o<0) return false; if(o===owner) return true; const p=o===0?owner:owner===0?o:-1; return p>=0 && G.dip[p] && G.dip[p].state==='ally'; }
// Grenzen zeichnen: Außengrenze in Teamfarbe (leicht nach innen versetzt), innere Gebietsgrenzen zart,
// freie Nachbargebiete weiß gestrichelt
// Hauptfarbe der Flagge eines Volkes (erste nicht-weiße Füllfarbe im Wappen)
const flagCache={};
function flagColor(owner){
  const civ=G.players[owner].civ; if(flagCache[civ[0]]!=null) return flagCache[civ[0]];
  const fills=[...String(civ[2]).matchAll(/fill="(#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3})"/g)].map(m=>new T.Color(m[1]));
  const c = fills.find(c=>c.r+c.g+c.b<2.5) || fills[0] || new T.Color(COLORS[owner]);
  return flagCache[civ[0]] = c.getHex();
}
// Beim Platzieren eines Stadtzentrums: Umriss des Gebiets anzeigen, das man damit bekommt (grün = möglich, rot = nicht)
function regionPreview(pl, id, ok){
  const key=id+'/'+ok; if(pl.regKey===key) return; pl.regKey=key;
  if(pl.regM){ G.scene.remove(pl.regM); pl.regM.geometry.dispose(); pl.regM=null; }
  if(id<0) return;
  const P=regPoly(id), s=G.reg.seeds[id], pos=[];
  for(let k=0;k<P.length;k++){ const a=P[k], b=P[(k+1)%P.length]; let nx=s.x-(a[0]+b[0])/2, nz=s.z-(a[1]+b[1])/2; const L=Math.hypot(nx,nz)||1; nx/=L; nz/=L;
    const len=Math.hypot(b[0]-a[0],b[1]-a[1]), n=Math.max(1,Math.ceil(len/1.5));
    for(let i=0;i<n;i++){ const t0=i/n, t1=(i+1)/n, ax=a[0]+(b[0]-a[0])*t0, az=a[1]+(b[1]-a[1])*t0, bx=a[0]+(b[0]-a[0])*t1, bz=a[1]+(b[1]-a[1])*t1, w=.5;
      const y=(x,z)=>Math.max(getH(x,z),WATER_Y)+.15;
      pos.push(ax,y(ax,az),az, ax+nx*w,y(ax+nx*w,az+nz*w),az+nz*w, bx,y(bx,bz),bz, bx,y(bx,bz),bz, ax+nx*w,y(ax+nx*w,az+nz*w),az+nz*w, bx+nx*w,y(bx+nx*w,bz+nz*w),bz+nz*w); } }
  const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
  pl.regM=new T.Mesh(geo,new T.MeshBasicMaterial({color:ok?0x55ff77:0xff5544, transparent:true, opacity:.8, depthWrite:false, side:T.DoubleSide, polygonOffset:true, polygonOffsetFactor:-4}));
  pl.regM.renderOrder=3; pl.regM.frustumCulled=false; G.scene.add(pl.regM);
}
function buildBorders(){
  if(G.borderGrp){ G.scene.remove(G.borderGrp); G.borderGrp.traverse(o=>{ if(o.geometry && o.geometry!==GEO.post) o.geometry.dispose(); if(o.material) o.material.dispose(); }); }
  const grp=new T.Group(); G.borderGrp=grp; G.scene.add(grp);
  const lines=new Map(); // farbe+art -> positions
  const add=(key,col,op,w,x0,z0,x1,z1,nx,nz,inset,dash)=>{
    let L=lines.get(key); if(!L){ L={col,op,pos:[]}; lines.set(key,L); }
    const len=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.ceil(len/1.5));
    for(let k=0;k<n;k++){ if(dash && k%2) continue; const t0=k/n, t1=(k+1)/n;
      const ax=x0+(x1-x0)*t0+nx*inset, az=z0+(z1-z0)*t0+nz*inset, bx=x0+(x1-x0)*t1+nx*inset, bz=z0+(z1-z0)*t1+nz*inset;
      if(getH(ax,az)<WATER_Y+.05 && getH(bx,bz)<WATER_Y+.05) continue;
      const y=(x,z)=>Math.max(getH(x,z),WATER_Y)+.14;
      const cx=ax+nx*w, cz=az+nz*w, dx=bx+nx*w, dz=bz+nz*w;
      L.pos.push(ax,y(ax,az),az, cx,y(cx,cz),cz, bx,y(bx,bz),bz,  bx,y(bx,bz),bz, cx,y(cx,cz),cz, dx,y(dx,dz),dz); }
  };
  // Außengrenzen: kleine Holzpfosten in gleichmäßigem Abstand (ein einziges InstancedMesh)
  const P=[], POST_GAP=1.5;
  let PC=0, PH=1;
  const posts=(x0,z0,x1,z1,nx,nz)=>{ const len=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.round(len/POST_GAP));
    for(let k=0;k<n;k++){ const t=(k+.5)/n, x=x0+(x1-x0)*t+nx*.3, z=z0+(z1-z0)*t+nz*.3; if(getH(x,z)<WATER_Y+.1) continue; P.push(x,z,PC,PH); } };
  const owned=[...G.reg.owner.entries()];
  const shownFree=new Set();
  for(const [id,ow] of owned){
    const P=regPoly(id), s=G.reg.seeds[id], col=COLORS[ow]; PC=flagColor(ow); PH=1;
    for(let k=0;k<P.length;k++){
      const a=P[k], b=P[(k+1)%P.length], nb=a[2];
      const mx=(a[0]+b[0])/2, mz=(a[1]+b[1])/2; let nx=s.x-mx, nz=s.z-mz; const L=Math.hypot(nx,nz)||1; nx/=L; nz/=L;
      const other = nb>=0 ? regOwner(nb) : -1;
      if(other!==ow) posts(a[0],a[1],b[0],b[1], nx,nz);
      if(ow===0 && nb>=0 && other<0) shownFree.add(nb);
    }
  }
  // Gebiete, in denen gerade ein Stadtzentrum entsteht: niedrige Pfosten (werden erst noch eingeschlagen)
  for(const b of G.builds){ if(b.kind!=='tc' || b.built>=1 || b.dead) continue; const id=regionAt(b.x,b.z); if(id<0 || regOwner(id)>=0) continue;
    const P=regPoly(id), s=G.reg.seeds[id]; PC=flagColor(b.owner); PH=.45+.55*b.built;
    for(let k=0;k<P.length;k++){ const a=P[k], c=P[(k+1)%P.length]; if(a[2]>=0 && regOwner(a[2])===b.owner) continue;
      const mx=(a[0]+c[0])/2, mz=(a[1]+c[1])/2; let nx=s.x-mx, nz=s.z-mz; const L=Math.hypot(nx,nz)||1; posts(a[0],a[1],c[0],c[1], nx/L,nz/L); }
    shownFree.delete(id); }
  if(P.length){
    if(!GEO.post){ const I=new T.Matrix4(); GEO.post=mergeParts([[new T.CylinderGeometry(.06,.07,.5,6,1,true), new T.Matrix4().makeTranslation(0,.2,0)],[new T.ConeGeometry(.06,.12,6,1,true), new T.Matrix4().makeTranslation(0,.51,0)]]); }
    const NP=P.length/4, im=new T.InstancedMesh(GEO.post, new T.MeshLambertMaterial({color:0xffffff}), NP), m4=new T.Matrix4(), q=new T.Quaternion(), e=new T.Euler(), sc=new T.Vector3(), ps=new T.Vector3();
    const R=rng(77);
    const col=new T.Color();
    for(let i=0;i<NP;i++){ const x=P[i*4], z=P[i*4+1]; e.set((R()-.5)*.12,R()*6.28,(R()-.5)*.12); q.setFromEuler(e); const s=(.85+R()*.3)*P[i*4+3]; sc.set(1,s,1); ps.set(x,getH(x,z)-.04,z); m4.compose(ps,q,sc); im.setMatrixAt(i,m4);
      col.setHex(P[i*4+2]).multiplyScalar(1.05+R()*.3); im.setColorAt(i, col); }
    im.castShadow=G.gfx>0; im.frustumCulled=false; grp.add(im);
  }
  for(const L of lines.values()){ if(!L.pos.length) continue;
    const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.Float32BufferAttribute(L.pos,3));
    const m=new T.Mesh(geo,new T.MeshBasicMaterial({color:L.col, transparent:true, opacity:L.op, depthWrite:false, side:T.DoubleSide, polygonOffset:true, polygonOffsetFactor:-4}));
    m.renderOrder=3; m.frustumCulled=false; grp.add(m); }
  if(G.miniBase) drawMinimap();
}
// Eroberte Gebiete auf der Minikarte: durchsichtig in der Farbe des Volkes, nur auf Land, kräftige Außengrenze
function landMaskCanvas(W,H){
  if(G.landMC && G.landMC.width===W) return G.landMC;
  const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'), im=x.createImageData(W,H);
  for(let j=0;j<H;j++) for(let i=0;i<W;i++){ const wx=(i+.5)/W*G.NX-G.NX/2, wz=(j+.5)/H*G.NZ-G.NZ/2; im.data[(j*W+i)*4+3]=rawLand(wx,wz)>.5?255:0; }
  x.putImageData(im,0,0); G.landMC=c; return c;
}
function drawRegionsMini(x, px, pz){
  const W=x.canvas.width, H=x.canvas.height;
  if(!G.regMC || G.regMC.width!==W) { G.regMC=document.createElement('canvas'); G.regMC.width=W; G.regMC.height=H; }
  const sig=[...G.reg.owner].join(';');
  if(G.regMCsig!==sig){ G.regMCsig=sig; const c=G.regMC.getContext('2d'); c.clearRect(0,0,W,H);
    for(const [id,ow] of G.reg.owner){ const P=regPoly(id), col='#'+COLORS[ow].toString(16).padStart(6,'0');
      c.beginPath(); P.forEach((p,i)=>i?c.lineTo(px(p[0]),pz(p[1])):c.moveTo(px(p[0]),pz(p[1]))); c.closePath(); c.globalAlpha=.5; c.fillStyle=col; c.fill();
      c.globalAlpha=1; c.strokeStyle=col; c.lineWidth=1.6;
      for(let k=0;k<P.length;k++){ const a=P[k], b=P[(k+1)%P.length]; if(a[2]>=0 && regOwner(a[2])===ow) continue; c.beginPath(); c.moveTo(px(a[0]),pz(a[1])); c.lineTo(px(b[0]),pz(b[1])); c.stroke(); } }
    c.globalAlpha=1; c.globalCompositeOperation='destination-in'; c.drawImage(landMaskCanvas(W,H),0,0); c.globalCompositeOperation='source-over'; }
  x.drawImage(G.regMC,0,0);
}
/* ---------- Eroberte Gebiete beim Herauszoomen: durchsichtige Farbfläche und Grenzlinie (nur auf Land) ---------- */
function regOverlayMat(lines){
  if(!G.landTex){ const W=WMW||2, H=WMH||2, d=new Uint8Array(W*H); if(WMASK) for(let i=0;i<W*H;i++) d[i]=WMASK[i]>.5?255:0;
    G.landTex=new T.DataTexture(d,W,H,T.RedFormat,T.UnsignedByteType); G.landTex.magFilter=T.LinearFilter; G.landTex.minFilter=T.LinearFilter; G.landTex.needsUpdate=true; }
  return new T.ShaderMaterial({ transparent:true, depthTest:false, depthWrite:false, vertexColors:true, side:T.DoubleSide,
    uniforms:{ uMask:{value:G.landTex}, uSize:{value:new T.Vector2(G.NX,G.NZ)}, uA:{value:0} },
    vertexShader:`varying vec3 vC; varying vec2 vUv; uniform vec2 uSize; void main(){ vC=color; vUv=(position.xz+uSize*.5)/uSize; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader:`varying vec3 vC; varying vec2 vUv; uniform sampler2D uMask; uniform float uA; void main(){ if(texture2D(uMask,vUv).r<.5) discard; gl_FragColor=vec4(vC,uA*${lines?'1.0':'.42'}); }` });
}
/* ---------- Vogelschwärme: Vogel mit automatischem Skelett (Körper, Flügel, Flügelspitzen), schlägt mit den Flügeln ---------- */
function birdGeo(){
  const M=MODELS.bird; if(M.skinGeo) return M.skinGeo;
  const g=M.geo.clone(); g.computeBoundingBox(); const bb=g.boundingBox, P=g.attributes.position, n=P.count;
  const cx=(bb.min.x+bb.max.x)/2, half=(bb.max.x-bb.min.x)/2, sh=half*.13;
  const si=new Uint16Array(n*4), sw=new Float32Array(n*4);
  for(let i=0;i<n;i++){ const x=P.getX(i)-cx, ax=Math.abs(x), side=x<0?0:1, w=T.MathUtils.smoothstep(ax, sh*.6, sh*1.6), tip=T.MathUtils.smoothstep(ax, half*.45, half*.7);
    si[i*4]=0; si[i*4+1]=side?3:1; si[i*4+2]=side?4:2; si[i*4+3]=0;
    sw[i*4]=1-w; sw[i*4+1]=w*(1-tip); sw[i*4+2]=w*tip; sw[i*4+3]=0; }
  g.setAttribute('skinIndex', new T.Uint16BufferAttribute(si,4)); g.setAttribute('skinWeight', new T.Float32BufferAttribute(sw,4));
  M.skinGeo=g; M.bird={cx, half, sh, y0:(bb.min.y+bb.max.y)/2}; return g;
}
function makeBird(){
  const g=birdGeo(), B=MODELS.bird.bird;
  const root=new T.Bone(); root.position.set(B.cx,B.y0,0);
  const lw=new T.Bone(); lw.position.set(-B.sh,0,0); root.add(lw); const lt=new T.Bone(); lt.position.set(-B.half*.55+B.sh,0,0); lw.add(lt);
  const rw=new T.Bone(); rw.position.set(B.sh,0,0); root.add(rw); const rt=new T.Bone(); rt.position.set(B.half*.55-B.sh,0,0); rw.add(rt);
  const m=new T.SkinnedMesh(g, MODELS.bird.mat); m.add(root); m.bind(new T.Skeleton([root,lw,lt,rw,rt])); m.frustumCulled=false;
  const k=1.1/(B.half*2); const o=new T.Group(); o.add(m); m.scale.setScalar(k); o.wings=[lw,lt,rw,rt]; return o;
}
function updateBirds(dt){
  if(!MODELS.bird || !G.cam) return;
  if(!G.birds){ G.birds=[]; const NF=G.gfx===0?1:G.gfx>=3?4:3; for(let f=0;f<NF;f++) G.birds.push({x:0,z:0,t:0,new:true,members:[]}); }
  const s=G.camS, show=!G.farView;
  for(const F of G.birds){
    if(F.new || Math.hypot(F.x-s.x,F.z-s.z)>110){ F.new=false; const a=G.rand()*6.28, r=25+G.rand()*45; F.x=s.x+Math.cos(a)*r; F.z=s.z+Math.sin(a)*r; F.dir=G.rand()*6.28; F.turn=(G.rand()-.5)*.35; F.sp=7+G.rand()*4; F.h=7+G.rand()*4;
      if(!F.members.length){ const n=(G.gfx===0?5:8)+(G.rand()*6|0); for(let i=0;i<n;i++){ const b=makeBird(); b.off=[(G.rand()-.5)*9,(G.rand()-.5)*3,(G.rand()-.5)*9]; b.ph=G.rand()*6.28; b.rate=7+G.rand()*2; G.scene.add(b); F.members.push(b); } } }
    F.t+=dt; F.dir+=F.turn*dt+Math.sin(F.t*.4)*.12*dt; F.x+=Math.sin(F.dir)*F.sp*dt; F.z+=Math.cos(F.dir)*F.sp*dt;
    const gy=Math.max(getH(F.x,F.z),WATER_Y);
    for(const b of F.members){ b.visible=show; if(!show) continue;
      const o=b.off, wob=Math.sin(F.t*1.3+b.ph);
      b.position.set(F.x+o[0]+Math.sin(F.t*.9+b.ph)*1.2, gy+F.h+o[1]+wob*.6, F.z+o[2]+Math.cos(F.t*.8+b.ph)*1.2);
      b.rotation.y=F.dir+(G.birdFlip||0); b.rotation.z=-F.turn*1.2;
      const glide=Math.sin(F.t*.5+b.ph*.3)>.45, fl=glide? .15+Math.sin(F.t*2+b.ph)*.05 : Math.sin(F.t*b.rate+b.ph);
      const A=glide?0:.75, base=-.35;
      const [lw,lt,rw,rt]=b.wings; lw.rotation.z=-(base+fl*A); rw.rotation.z=(base+fl*A); lt.rotation.z=-(fl*A*.5); rt.rotation.z=(fl*A*.5);
    }
  }
}
function updateRegionOverlay(){
  if(!G.reg || !G.cam) return;
  const s=G.camS, a=clamp((s.dist-170)/60,0,1);   // erst deutlich weiter herausgezoomt sichtbar
  if(!G.regOv){ const f=new T.Mesh(new T.BufferGeometry(), regOverlayMat(false)), l=new T.LineSegments(new T.BufferGeometry(), regOverlayMat(true));
    f.renderOrder=7; l.renderOrder=8; f.frustumCulled=l.frustumCulled=false; G.scene.add(f); G.scene.add(l); G.regOv={f,l,sig:''}; }
  const o=G.regOv; o.f.visible=o.l.visible=a>0; if(a<=0) return;
  o.f.material.uniforms.uA.value=a; o.l.material.uniforms.uA.value=a;
  const sig=[...G.reg.owner].join(';'); if(sig===o.sig) return; o.sig=sig;
  const fp=[], fc=[], lp=[], lc=[], Y=WATER_Y+.5, c=new T.Color(), cl=new T.Color();
  for(const [id,ow] of G.reg.owner){ const P=regPoly(id), sd=G.reg.seeds[id]; c.setHex(COLORS[ow]); cl.copy(c).offsetHSL(0,.1,.12);
    for(let k=0;k<P.length;k++){ const p=P[k], q=P[(k+1)%P.length];
      fp.push(sd.x,Y,sd.z, p[0],Y,p[1], q[0],Y,q[1]); for(let t=0;t<3;t++) fc.push(c.r,c.g,c.b);
      if(p[2]>=0 && regOwner(p[2])===ow) continue;
      lp.push(p[0],Y,p[1], q[0],Y,q[1]); lc.push(cl.r,cl.g,cl.b, cl.r,cl.g,cl.b); } }
  const set=(m,P,C)=>{ m.geometry.dispose(); const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setAttribute('color',new T.Float32BufferAttribute(C,3)); m.geometry=g; };
  set(o.f,fp,fc); set(o.l,lp,lc);
}
function validPlace(kind,x,z,owner){
  if(terrCheck(owner|0, kind, x, z)) return false;
  const fp = footprint(kind,x,z);
  if(fp.cells.some(k=>k<0||G.grid[k])) return false;
  for(const u of G.units){ if(Math.abs(u.x-fp.cx)<BUILD[kind].size/2+.2 && Math.abs(u.z-fp.cz)<BUILD[kind].size/2+.2 && u.owner!==0) return false; }
  return true;
}
function startPlace(kind){
  const col = COLORS[0];
  const ghost = kind==='house'?makeHouse(col,0):kind==='barracks'?makeBarracks(col,0):kind==='tower'?makeTower(col,0):kind==='market'?makeMarket(col,0):makeStore(col,0);
  ghost.traverse(o=>{ if(o.isMesh){ o.material=o.material.clone(); o.material.transparent=true; o.material.opacity=.6; o.castShadow=false; } });
  const pad = new T.Mesh(new T.PlaneGeometry(BUILD[kind].size,BUILD[kind].size), new T.MeshBasicMaterial({color:0x44ff66, transparent:true, opacity:.4, depthWrite:false}));
  pad.rotation.x=-Math.PI/2; G.scene.add(ghost); G.scene.add(pad);
  const g = groundAtNDC(0,-.1) || {x:G.camS.x, z:G.camS.z};
  G.place = {kind, ghost, pad, x:g.x, z:g.z, ok:false, workers:G.sel.filter(u=>u.owner===0)};
  $('#placebar').classList.remove('hidden');
  drawPanel();
}
// Gebäude schnappen an einen eigenen Weg: stehen dann sauber direkt neben der Straße
function snapToRoad(pl){
  const sz=BUILD[pl.kind].size||3; let best=null, bd=1e9;
  for(const b of G.builds){ if(b.kind!=='road' || b.owner!==0 || b.dead || !b.seg) continue; const d=Math.hypot(b.x-pl.x,b.z-pl.z); if(d<bd){ bd=d; best=b; } }
  if(!best || bd>sz*.5+2.6) return;
  const a=best.seg.ang||0, nx=-Math.sin(a), nz=Math.cos(a), side=Math.sign((pl.x-best.x)*nx+(pl.z-best.z)*nz)||1;
  const along=(pl.x-best.x)*Math.cos(a)+(pl.z-best.z)*Math.sin(a), off=.75+sz*.5+.15;
  pl.x=best.x+Math.cos(a)*along+nx*side*off; pl.z=best.z+Math.sin(a)*along+nz*side*off; pl.snapRoad=true;
}
function updateGhost(){
  const pl=G.place; pl.snapRoad=false; if(pl.kind!=='tc' && !pl.line) snapToRoad(pl);
  const fp=footprint(pl.kind,pl.x,pl.z);
  const y = getH(fp.cx,fp.cz);
  pl.ghost.position.set(fp.cx,y,fp.cz); pl.pad.position.set(fp.cx,y+.1,fp.cz);
  pl.ok = validPlace(pl.kind,pl.x,pl.z,0);
  pl.why = terrCheck(0, pl.kind, fp.cx, fp.cz);
  if(pl.kind==='tc') regionPreview(pl, regionAt(fp.cx,fp.cz), pl.ok);
  const slow = pl.ok && pl.kind!=='tc' && !friendlyLand(0,fp.cx,fp.cz);
  $('#pTxt').textContent = pl.why || (BUILD[pl.kind].name + (!pl.ok ? ' – hier ist kein Platz' : slow ? ' – außerhalb deines Landes: Bau dauert 3× so lange' : ' – hier bauen?'));
  const pay = canPay(G.players[0], BUILD[pl.kind].cost); setCost(BUILD[pl.kind].cost);
  if(pl.ok && !pay) $('#pTxt').textContent = missingTxt(G.players[0], BUILD[pl.kind].cost);
  pl.pad.material.color.setHex(!pl.ok||!pay?0xff4444:slow?0xffcc33:0x44ff66);
  $('#pOk').classList.toggle('dim', !pl.ok || !pay); $('#pOk').disabled = false;
}
function confirmPlace(){
  if(G.place && G.place.line) return confirmWall();
  const pl=G.place, p=G.players[0];
  if(!pl.ok){ EE.toast(pl.why || 'Hier kann nicht gebaut werden'); EE.sfx('error'); return; }
  if(!canPay(p,BUILD[pl.kind].cost)){ EE.toast(BUILD[pl.kind].name+': '+missingTxt(p,BUILD[pl.kind].cost)); EE.sfx('error'); EE.vib(30); return; }
  if(!pl.workers.length){ const w=G.units.filter(u=>u.owner===0 && u.kind==='worker' && !u.inside && !u.dead).sort((a,b)=>Math.hypot(a.x-pl.x,a.z-pl.z)-Math.hypot(b.x-pl.x,b.z-pl.z)).slice(0,3); pl.workers=w; }
  pay(p,BUILD[pl.kind].cost);
  const b = addBuilding(pl.kind,0,pl.x,pl.z,false);
  pl.workers.forEach(u=>cmdBuild(u,b)); iconMarker(b,'hammer');
  if(pl.kind==='tc') EE.toast('Stadtzentrum wird gebaut – deine Bauern sind unterwegs');
  EE.sfx('place'); EE.vib(20);
  endPlace(); updateHUD(); select(pl.workers,null);
}
function cancelPlace(){ EE.click(); endPlace(); drawPanel(); }
function endPlace(){
  const pl=G.place; if(!pl) return;
  if(pl.ghost) G.scene.remove(pl.ghost); if(pl.pad) G.scene.remove(pl.pad);
  if(pl.ghosts) for(const gh of pl.ghosts) G.scene.remove(gh);
  if(pl.regM){ G.scene.remove(pl.regM); pl.regM.geometry.dispose(); }
  G.place=null; G.costH=null; $('#pCost').innerHTML=''; $('#placebar').classList.add('hidden'); $('#pGate').classList.add('hidden'); $('#pTxt').textContent='Gebäude mit dem Finger platzieren';
}

function startOnline(cfg, me){
  // eigenes Volk immer als Spieler 0, die anderen in der Reihenfolge der Raumplätze
  const order=[me, ...cfg.slots.map((_,i)=>i).filter(i=>i!==me)], slots=order.map(i=>cfg.slots[i]);
  EE.S.diff=cfg.diff;
  start({online:true, map:cfg.map, seed:cfg.seed, civs:slots.map(s=>s.civ), slots, me});
  setTimeout(()=>EE.toast('Online-Spiel gestartet – du spielst die '+slots[0].civ), 1500);
}
window.EEGame = { spawnU:(o,x,z,k)=>spawnWorker(o,x,z,k), fmove:(us,x,z)=>formationMove(us,x,z), blocked:(x,z)=>!freeCell(x,z), gather:(u,r)=>cmdGather(u,r), models:()=>MODELS, gift, spawnA:(k,x,z)=>spawnDeer(x,z,k), panel:()=>drawPanel(), addB:(k,o,x,z)=>{ const b=addBuilding(k,o,x,z,false); finishBuilding(b); return b; }, icon:(o,k)=>iconMarker(o,k), quit:()=>toMenu(), online:()=>!!(G&&G.online), start:()=>start(), startOnline, load:loadGame, hasSave:()=>!!readSave(), save:saveGame, stop, resume, running:()=>!!G, dbg:()=>G, dev:{fell:(r)=>removeRes(r), regrowNow:()=>{ for(const e of G.regrow||[]) e.t=0; G.rgT=0; }, finish:(b)=>finishBuilding(b), tapB:(b)=>tapBuilding(b), act:(a)=>action(a), wall:{start:(k)=>startWall(k), upd:()=>updateWallGhost(), ok:()=>confirmWall()}, dip:{open:(t)=>openDip(t), propose:(i,s)=>propose(i,s), offer:(i,s,g)=>showOffer(i,s,g)}, chunks:(n)=>{ for(let i=0;i<(n||40);i++){ G.chunkT=0; updateChunks(); } }, build:(k,o,x,z,d)=>addBuilding(k,o,x,z,d), unit:(o,x,z,k)=>spawnWorker(o,x,z,k), attack:(u,t)=>cmdAttack(u,t), tiles:()=>{ updateCam(); updateTiles(true); updateChunks(); }, tap:(x,y)=>tapAt(x,y), addRes:(t,x,z)=>addRes(t,x,z), spawnDeer:(x,z,k)=>spawnDeer(x,z,k), reg:{regionAt, regNeighbors, regOwner, terrCheck, regPoly}, kill:(b)=>destroyBuilding(b), bowT:BOW_T, sea:()=>({DOLPH,FISH,SCHOOL}), hb:(v)=>{HEADBAND_Y=v;},  place:(k,x,z)=>{ startPlace(k); G.place.x=x; G.place.z=z; updateGhost(); }}, tick:(n)=>{for(let i=0;i<n;i++){ G.pfDeadline=performance.now()+4; update(.05); }}, scr:(x,y,z)=>toScreen(x,y,z), h:(x,z)=>getH(x,z) };
})();
